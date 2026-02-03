import { NextResponse } from 'next/server';
import { XMLParser } from 'fast-xml-parser';

// Extract important words from a topic (remove common words)
function extractKeywords(topic: string): string[] {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
    'by', 'from', 'as', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has',
    'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
    'this', 'that', 'these', 'those', 'it', 'its', 'they', 'them', 'their', 'we', 'our',
    'you', 'your', 'who', 'what', 'when', 'where', 'why', 'how', 'which', 'if', 'then',
    'than', 'so', 'just', 'only', 'also', 'very', 'can', 'all', 'any', 'some', 'no',
    'not', 'more', 'most', 'other', 'into', 'over', 'after', 'before', 'between',
    'under', 'again', 'further', 'once', 'here', 'there', 'each', 'few', 'both',
    'same', 'own', 'such', 'too', 'about', 'up', 'down', 'out', 'off', 'above', 'below'
  ]);
  
  return topic
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length >= 2 && !stopWords.has(word));
}

// Calculate how relevant a news item is to the topic
function calculateRelevance(title: string, description: string, keywords: string[]): number {
  const titleLower = title.toLowerCase();
  const descLower = (description || '').toLowerCase();
  
  let score = 0;
  let titleMatches = 0;
  let descMatches = 0;
  
  for (const keyword of keywords) {
    // Exact word match is better than partial
    const titleHasExact = new RegExp(`\\b${keyword}\\b`, 'i').test(titleLower);
    const titleHasPartial = titleLower.includes(keyword);
    const descHasExact = new RegExp(`\\b${keyword}\\b`, 'i').test(descLower);
    const descHasPartial = descLower.includes(keyword);
    
    if (titleHasExact) {
      score += 15;
      titleMatches++;
    } else if (titleHasPartial) {
      score += 8;
      titleMatches++;
    }
    
    if (descHasExact) {
      score += 5;
      descMatches++;
    } else if (descHasPartial) {
      score += 2;
      descMatches++;
    }
  }
  
  // Bonus for multiple keyword matches
  if (titleMatches >= 2) score += 20;
  if (titleMatches >= 3) score += 30;
  
  // Penalty for no title matches at all
  if (titleMatches === 0) score -= 30;
  
  return score;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const topic = searchParams.get('topic');

  if (!topic) {
    return NextResponse.json({ error: 'Topic parameter is required' }, { status: 400 });
  }

  try {
    // Extract keywords from the topic
    const keywords = extractKeywords(topic);
    
    // Build search query - use the original topic directly for best results
    // Only exclude betting/odds sites
    const searchQuery = `${topic} -betting -odds -polymarket -gambling`;
    
    // Trusted sources
    const TRUSTED_SOURCES = [
      'Bloomberg', 'Reuters', 'CNBC', 'Financial Times', 'Wall Street Journal', 
      'CoinDesk', 'The Block', 'Fortune', 'Forbes', 'MarketWatch', 
      'Yahoo Finance', 'TechCrunch', 'Wired', 'The Economist',
      'Business Insider', 'Benzinga',
      'BBC', 'The New York Times', 'The Washington Post', 'The Guardian', 
      'CNN', 'USA Today', 'Associated Press', 'NPR', 'Los Angeles Times',
      'Fox Business', 'Fox News', 'The Hill', 'Politico', 'ABC News', 'CBS News', 'NBC News',
      'MSNBC', 'AP News', 'The Verge', 'Ars Technica', 'Engadget', 'VentureBeat',
      'ESPN', 'Sports Illustrated', 'Bleacher Report', 'The Athletic',
      'TMZ', 'Variety', 'Hollywood Reporter', 'Entertainment Weekly',
      'Space.com', 'NASA', 'Scientific American'
    ];

    // Fetch from Google News RSS
    const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(searchQuery)}&hl=en-US&gl=US&ceid=US:en`;
    
    const response = await fetch(rssUrl, { cache: 'no-store' });
    const xmlData = await response.text();

    const parser = new XMLParser();
    const jsonObj = parser.parse(xmlData);
    
    let items = jsonObj.rss?.channel?.item || [];
    
    if (!Array.isArray(items)) {
      items = [items];
    }

    // Process all items and calculate relevance
    const processedItems = items.map((item: any) => {
      const title = item.title || '';
      const description = (item.description || '').replace(/<[^>]*>?/gm, '');
      const sourceName = item.source || 'News';
      
      const relevanceScore = calculateRelevance(title, description, keywords);
      const isTrusted = TRUSTED_SOURCES.some(src => 
        sourceName.toLowerCase().includes(src.toLowerCase())
      );
      
      return {
        ...item,
        title,
        description,
        sourceName,
        relevanceScore,
        isTrusted,
        finalScore: relevanceScore + (isTrusted ? 10 : 0)
      };
    });
    
    // Filter: Must have positive relevance and not be betting/polymarket
    const relevantItems = processedItems
      .filter((item: any) => {
        // Must have some relevance
        if (item.relevanceScore <= 0) return false;
        
        // Exclude betting sites
        const t = item.title.toLowerCase();
        const s = item.sourceName.toLowerCase();
        if (t.includes('polymarket') || s.includes('polymarket')) return false;
        if (t.includes('betting odds') || t.includes('prediction market')) return false;
        if (s.includes('betting') || s.includes('odds')) return false;
        
        return true;
      })
      .sort((a: any, b: any) => b.finalScore - a.finalScore)
      .slice(0, 12);

    // Transform to news format
    const newsItems = relevantItems.map((item: any, index: number) => {
      const title = item.title;
      const summaryText = item.description || title;
      
      // Simple Sentiment Analysis
      const bullishKeywords = [
        'surge', 'soar', 'record', 'high', 'jump', 'gain', 'profit', 'rally', 
        'growth', 'positive', 'win', 'success', 'beat', 'strong', 'up',
        'approval', 'launch', 'partnership', 'expansion', 'deal', 'agreement',
        'leads', 'leading', 'ahead', 'support', 'boost', 'rise', 'increase'
      ];
      
      const bearishKeywords = [
        'drop', 'fall', 'loss', 'crash', 'down', 'risk', 'warning', 'decline', 
        'negative', 'fail', 'miss', 'weak', 'sell', 'reject', 'ban', 
        'lawsuit', 'fear', 'concern', 'crisis', 'slump', 'delay',
        'behind', 'trailing', 'loses', 'defeat', 'cancel', 'cut', 'reduce'
      ];

      const titleLower = title.toLowerCase();
      const isBullish = bullishKeywords.some(k => titleLower.includes(k));
      const isBearish = bearishKeywords.some(k => titleLower.includes(k));
      
      let sentiment = "Neutral";
      if (isBullish && !isBearish) sentiment = "Bullish";
      else if (isBearish && !isBullish) sentiment = "Bearish";
      else if (isBullish && isBearish) sentiment = "Mixed";

      // Impact based on relevance score
      const isHighImpact = item.finalScore >= 30 || item.isTrusted;

      // Format Date
      const pubDate = new Date(item.pubDate);
      const timeStr = pubDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const dateStr = pubDate.toLocaleDateString([], { month: 'short', day: 'numeric' });

      return {
        id: item.guid || `news-${index}`,
        source: item.sourceName,
        handle: '@News', 
        headline: title,
        summary: summaryText, 
        time: `${dateStr}, ${timeStr}`, 
        timestamp: item.pubDate,
        impact: isHighImpact ? "High" : "Medium",
        sentiment: sentiment,
        link: item.link,
        category: "News",
        isTrusted: item.isTrusted,
        relevanceScore: item.finalScore
      };
    });

    // Deduplication - remove similar headlines
    const seenTitles = new Set();
    const uniqueNewsItems = newsItems.filter((item: any) => {
      // Create a simplified key from important words only
      const key = item.headline
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter((w: string) => w.length > 3)
        .slice(0, 5)
        .sort()
        .join('');
      
      if (seenTitles.has(key)) return false;
      seenTitles.add(key);
      return true;
    }).slice(0, 6);

    return NextResponse.json({ news: uniqueNewsItems });

  } catch (error: any) {
    console.error("News API Error:", error);
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
  }
}
