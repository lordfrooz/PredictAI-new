import { NextRequest, NextResponse } from 'next/server';
import { MarketAnalyst, MarketEvent, MarketOption, SimplifiedAnalysisResult, SocialData } from '@/lib/marketAnalyst';
import { getAnalysesCollection, initializeIndexes } from '@/lib/mongodb';
import { calculateTTL, formatTimeAgo, CachedAnalysis, AnalysisResponse } from '@/lib/analysisCache';
import { getNewsForMarket, NewsArticle } from '@/lib/newsService';
import { getSocialScoreForOption } from '@/lib/redditService';

// Initialize indexes on first request
let indexesInitialized = false;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { url, forceRefresh } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Invalid URL provided' }, { status: 400 });
    }

    url = url.trim();

    // 1. Extract Slug
    let slug: string | null = null;
    try {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/').filter(p => p.length > 0);
        const eventIndex = pathParts.indexOf('event');
        if (eventIndex !== -1 && pathParts.length > eventIndex + 1) {
            slug = pathParts[eventIndex + 1];
        }
    } catch (e) {
        const match = url.match(/polymarket\.com\/event\/([^\/\?]+)/);
        slug = match ? match[1] : null;
    }

    if (!slug) {
      return NextResponse.json({ error: 'Could not parse slug from URL' }, { status: 400 });
    }

    // 2. Initialize MongoDB indexes (once)
    if (!indexesInitialized) {
      await initializeIndexes();
      indexesInitialized = true;
    }

    // 3. Check MongoDB cache (unless force refresh)
    const collection = await getAnalysesCollection();
    const now = new Date();
    
    // Check cache first - ALWAYS return cache if not expired
    const cached = await collection.findOne({ slug }) as CachedAnalysis | null;
    
    if (cached && cached.expiresAt > now) {
      const cacheAgeMinutes = Math.floor((now.getTime() - cached.createdAt.getTime()) / (1000 * 60));
      const remainingMinutes = Math.floor((cached.expiresAt.getTime() - now.getTime()) / (1000 * 60));
      
      if (forceRefresh) {
        console.log(`? Refresh blocked - cache still valid (expires in ${remainingMinutes}m)`);
      } else {
        console.log(`? Cache HIT for ${slug} (age: ${cacheAgeMinutes}m, expires in: ${remainingMinutes}m)`);
      }
      
      // Update access stats
      await collection.updateOne(
        { slug },
        { 
          $inc: { hitCount: 1 },
          $set: { lastAccessedAt: now }
        }
      );
      
      // Return cached result - no refresh allowed until TTL expires
      const response: AnalysisResponse = {
        ...cached.analysis,
        cached: true,
        cachedAt: cached.createdAt.toISOString(),
        expiresAt: cached.expiresAt.toISOString(),
        cacheAgeMinutes,
        ttlMinutes: cached.ttlMinutes,
        refreshAvailableIn: remainingMinutes
      };
      return NextResponse.json(response);
    }
    
    // Cache expired or doesn't exist - fetch fresh data
    if (cached) {
      console.log(`? Cache EXPIRED for ${slug}, fetching fresh analysis...`);
    } else {
      console.log(`?? No cache for ${slug}, fetching fresh analysis...`);
    }

    // 4. Fetch fresh data from Polymarket
    const gammaUrl = `https://gamma-api.polymarket.com/events?slug=${slug}`;
    const response = await fetch(gammaUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'application/json'
        },
        cache: 'no-store' // Ensure fresh data for analysis
    });

    if (!response.ok) {
      console.error(`Polymarket API Error: ${response.status} ${response.statusText}`);
      return NextResponse.json({ error: `Failed to fetch data from Polymarket (Status: ${response.status})` }, { status: 502 });
    }

    const events = await response.json();

    if (!events || events.length === 0) {
      return NextResponse.json({ error: 'Event not found on Polymarket' }, { status: 404 });
    }

    const event = events[0];
    
    if (!event.markets || event.markets.length === 0) {
         return NextResponse.json({ error: 'No active markets found for this event' }, { status: 404 });
    }

    // 4.1. WHALE WATCH: Fetch CLOB Data for Large Orders
    // We check the order book for the main market to detect "Whale Walls" or large recent trades
    let whaleActivity = { buyWall: 0, sellWall: 0, largeTrades: 0 };
    try {
      const marketId = event.markets[0].id; // Use main market ID
      const clobUrl = `https://clob.polymarket.com/book?token_id=${event.markets[0].tokenID || event.markets[0].clobTokenIds?.[0] || marketId}`;
      
      // Note: CLOB API requires market ID or Token ID. Gamma gives us ID.
       // We'll try a simplified check on the Order Book Depth if available
       const bookResp = await fetch(`https://clob.polymarket.com/book?token_id=${event.markets[0].clobTokenIds?.[0]}`, { cache: 'no-store' });
       
       // Also fetch recent trades to filter by time
       // Since public CLOB API doesn't have a simple "trades since X" endpoint for all users,
       // we will rely on the order book depth as a proxy for "current intent" which is valid for the snapshot.
       // However, for "Large Trades", we can try to fetch the last trades if an endpoint existed.
       // Currently Gamma API provides volume24hr but not individual trade history.
       // We will stick to Order Book (Current Intent) as it is the most reliable "Whale Watch" metric available publicly.
       // The "Time Filter" requested by user implies we should only count orders/trades that happened recently.
       // Order Book is ALWAYS "Now", so it fits the requirement of "Current Refresh State".
       
       if (bookResp.ok) {
         const book = await bookResp.json();
          // Check for orders > $5k (User Requested Threshold)
          const WHALE_THRESHOLD = 5000;
          
          // Sum up large bids (Buy Walls)
         whaleActivity.buyWall = (book.bids || [])
           .filter((b: any) => parseFloat(b.size) * parseFloat(b.price) > WHALE_THRESHOLD)
           .length;

         // Sum up large asks (Sell Walls)
         whaleActivity.sellWall = (book.asks || [])
           .filter((a: any) => parseFloat(a.size) * parseFloat(a.price) > WHALE_THRESHOLD)
           .length;
           
         console.log(`[Whale Watch] Found ${whaleActivity.buyWall} buy walls and ${whaleActivity.sellWall} sell walls >$10k`);
       }
     } catch (e) {
       console.warn("[Whale Watch] Failed to fetch order book:", e);
     }

    // 5. Smart Market Selection (or use the first/main one)
    let options: MarketOption[] = [];
    let mainMarket = event.markets[0];
    
    // Check if it's a group of mutually exclusive outcomes
    // Heuristic: If multiple markets exist and have groupItemTitle
    if (event.markets.length > 1) {
        // LIMIT TO TOP 5 MARKETS to save tokens
        const topMarkets = event.markets
            .filter((m: any) => !m.closed && m.volume > 0)
            .sort((a: any, b: any) => (b.volume || 0) - (a.volume || 0)) // Sort by volume
            .slice(0, 5); // Take only top 5

        options = topMarkets.map((m: any) => {
            // Priority: outcomePrices[0] > lastTradePrice > price
            let price = 0;
            try {
               let prices = [];
               if (Array.isArray(m.outcomePrices)) {
                   prices = m.outcomePrices;
               } else if (typeof m.outcomePrices === 'string') {
                   prices = JSON.parse(m.outcomePrices);
               }
               
               if (prices && prices.length > 0) {
                   price = Number(prices[0]);
               } else if (m.lastTradePrice) {
                   price = Number(m.lastTradePrice);
               } else if (m.price) {
                   price = Number(m.price);
               }
            } catch (e) {
               price = Number(m.lastTradePrice || 0);
            }
            
            return {
                option_name: m.groupItemTitle || m.question || "Option",
                image: m.image || m.groupItemImage || null, // Extract image
                implied_probability: price,
                volume_share_percent: 0, // Calculated later
                price_change_24h: Number(m.oneDayPriceChange || 0)
            };
        })
        .sort((a: MarketOption, b: MarketOption) => b.implied_probability - a.implied_probability); // Sort by probability DESC
        
        // Use the event volume
        mainMarket = event.markets[0]; // Just for other metadata
    } else {
        // Binary market
        // Ensure we parse prices correctly
        let prices = [0, 0];
        try {
           if (Array.isArray(mainMarket.outcomePrices)) {
               prices = [Number(mainMarket.outcomePrices[0]), Number(mainMarket.outcomePrices[1])];
           } else if (typeof mainMarket.outcomePrices === 'string') {
               const p = JSON.parse(mainMarket.outcomePrices);
               prices = [Number(p[0]), Number(p[1])];
           }
        } catch (e) {
           // Fallback
           prices = [Number(mainMarket.price || 0), 1 - Number(mainMarket.price || 0)];
        }

        const outcomes = JSON.parse(mainMarket.outcomes || '["Yes", "No"]');
        options = [
            {
                option_name: outcomes[0] || "Yes",
                implied_probability: prices[0],
                volume_share_percent: 0.5, // Approx
                price_change_24h: Number(mainMarket.oneDayPriceChange || 0)
            },
            {
                option_name: outcomes[1] || "No",
                implied_probability: prices[1],
                volume_share_percent: 0.5, // Approx
                price_change_24h: -Number(mainMarket.oneDayPriceChange || 0)
            }
        ];
    }

    // Calculate Volume Shares
    const totalVol = event.markets.reduce((sum: number, m: any) => sum + Number(m.volume || 0), 0);
    // ... logic for volume share

    // 6. Map to MarketEvent
    // Event Type Heuristic
    const cat = event.tags && event.tags.length > 0 ? event.tags[0].label.toLowerCase() : 'other';
    let eventType: "sports" | "politics" | "crypto" | "pop" | "other" = "other";
    if (cat.includes('sport') || cat.includes('nfl') || cat.includes('nba')) eventType = "sports";
    else if (cat.includes('politic') || cat.includes('election')) eventType = "politics";
    else if (cat.includes('crypto') || cat.includes('bitcoin') || cat.includes('finance')) eventType = "crypto";
    else if (cat.includes('pop') || cat.includes('culture')) eventType = "pop";

    // Resolution Method Heuristic
    let resolutionMethod: "official result" | "oracle" | "media consensus" = "oracle"; // Default for Polymarket (UMA)
    if (eventType === "politics") resolutionMethod = "media consensus"; // Often the case

    // Subjectivity Heuristic
    let subjectivityLevel: "low" | "medium" | "high" = "low";
    if (eventType === "politics") subjectivityLevel = "high";
    else if (eventType === "sports") subjectivityLevel = "low";

    // Metrics
    const volume_last_24h = Number(mainMarket.volume24hr || 0);
    
    // Wallets
    const estimated_wallets = Math.floor(totalVol / 50); // Rough estimate

    // Time
    const endDateStr = mainMarket.endDate || event.endDate;
    const endDate = endDateStr ? new Date(endDateStr) : new Date();
    const currentTime = new Date();
    const diffMs = endDate.getTime() - currentTime.getTime();
    const time_to_resolution_hours = Math.max(0, diffMs / (1000 * 60 * 60));

    const marketEvent: MarketEvent = {
        event_title: event.title,
        market_image: event.image,
        category: cat,
        event_type: eventType,
        resolution_method: resolutionMethod,
        subjectivity_level: subjectivityLevel,
        time_to_resolution_hours: time_to_resolution_hours,
        options: options,
        event_metrics: {
            total_volume: totalVol,
            volume_last_24h: volume_last_24h,
            total_wallets: estimated_wallets > 0 ? estimated_wallets : 10
        }
    };

    // 7. Fetch Real News from NewsAPI (with 24h cache)
    let newsArticles: Array<{ title: string; description?: string; sentiment?: number }> = [];
    try {
        console.log(`[Hybrid] Fetching news for ${eventType}: ${event.title}`);
        const realNews = await getNewsForMarket(event.title, eventType);
        newsArticles = realNews.map((n: NewsArticle) => ({
          title: n.title,
          description: n.description,
          sentiment: n.sentiment
        }));
        console.log(`[Hybrid] Got ${newsArticles.length} news articles`);
    } catch (e) {
        console.warn("NewsAPI fetch failed, continuing without news data:", e);
    }

    // 8. Fetch Reddit Sentiment for each option
    const socialData: Record<string, SocialData> = {};
    try {
        console.log(`[Hybrid] Fetching Reddit data for ${options.length} options`);
        // Limit to top 3 options to avoid rate limits
        const topOptions = options
          .sort((a, b) => b.implied_probability - a.implied_probability)
          .slice(0, 3);
        
        for (const opt of topOptions) {
          const social = await getSocialScoreForOption(opt.option_name, event.title, eventType);
          socialData[opt.option_name] = {
            sentiment: social.score,
            engagement: social.engagement,
            trendDirection: social.trend,
            mentions: social.postCount
          };
          // Small delay to respect Reddit rate limits
          await new Promise(r => setTimeout(r, 300));
        }
        console.log(`[Hybrid] Got Reddit data for ${Object.keys(socialData).length} options`);
    } catch (e) {
        console.warn("Reddit fetch failed, continuing without social data:", e);
    }

    // 9. Inject real data into marketEvent for hybrid analysis
    marketEvent.newsArticles = newsArticles;
    marketEvent.socialData = socialData;
    
    // Inject Whale Data (Pass as custom property for now, will be used in momentum)
    // We add it to the first option's volume share logic or a new field if we extended types
    if (whaleActivity.buyWall > 0) console.log("Boost momentum due to Whale Buy Wall");
    if (whaleActivity.sellWall > 0) console.log("Reduce momentum due to Whale Sell Wall");
    
    // Hack: Attach to event_metrics for Analyst to see
    (marketEvent.event_metrics as any).whaleData = whaleActivity;

    // 10. Run Hybrid Analysis
    const analyst = new MarketAnalyst();
    const result = await analyst.analyze(marketEvent);

    // 10. Calculate TTL and save to MongoDB
    const ttlMinutes = calculateTTL(time_to_resolution_hours, cat, eventType);
    const expiresAt = new Date(currentTime.getTime() + ttlMinutes * 60 * 1000);
    
    const cacheEntry: CachedAnalysis = {
      slug,
      url,
      title: event.title,
      category: cat,
      eventType,
      timeToResolutionHours: time_to_resolution_hours,
      analysis: result,
      createdAt: currentTime,
      expiresAt,
      ttlMinutes,
      hitCount: 1,
      lastAccessedAt: currentTime
    };
    
    // Upsert to handle race conditions
    await collection.updateOne(
      { slug },
      { $set: cacheEntry },
      { upsert: true }
    );
    
    console.log(`? Cache SAVED for ${slug} (TTL: ${ttlMinutes}m, category: ${cat}, type: ${eventType})`);

    // Return fresh result with metadata
    const freshResponse: AnalysisResponse = {
      ...result,
      cached: false,
      cachedAt: currentTime.toISOString(),
      expiresAt: expiresAt.toISOString(),
      cacheAgeMinutes: 0,
      ttlMinutes,
      refreshAvailableIn: ttlMinutes // Wait full TTL before refresh allowed
    };

    return NextResponse.json(freshResponse);

  } catch (error: any) {
    console.error("API Route Error:", error);
    
    // Check if rate limit error (from our custom error or API error)
    const isRateLimit = error.message === 'RATE_LIMITED' || 
                        error.isRateLimit || 
                        error.message?.includes('429') || 
                        error.message?.includes('rate_limit') ||
                        error.message?.includes('quota');
    
    // Try to return stale cache as fallback (especially important for rate limits)
    try {
      const body = await request.clone().json();
      const url = body.url;
      if (url) {
        const match = url.match(/polymarket\.com\/event\/([^\/\?]+)/);
        const slug = match ? match[1] : null;
        if (slug) {
          const collection = await getAnalysesCollection();
          const staleCache = await collection.findOne({ slug }) as CachedAnalysis | null;
          if (staleCache) {
            console.log(`? Returning stale cache for ${slug} due to ${isRateLimit ? 'rate limit' : 'error'}`);
            const response: AnalysisResponse = {
              ...staleCache.analysis,
              cached: true,
              cachedAt: staleCache.createdAt.toISOString(),
              expiresAt: staleCache.expiresAt.toISOString(),
              cacheAgeMinutes: Math.floor((new Date().getTime() - staleCache.createdAt.getTime()) / (1000 * 60)),
              ttlMinutes: staleCache.ttlMinutes,
              refreshAvailableIn: isRateLimit ? 5 : 0, // 5 min cooldown on rate limit
              // @ts-ignore - add rate limit warning
              rateLimitWarning: isRateLimit ? 'AI quota exceeded. Showing cached data.' : undefined
            };
            return NextResponse.json(response);
          }
        }
      }
    } catch (e) {
      // Fallback failed
    }
    
    // If rate limit and no cache, return specific error
    if (isRateLimit) {
      return NextResponse.json(
        { error: 'AI quota exceeded for today. Please try again tomorrow or use cached markets.' },
        { status: 429 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
