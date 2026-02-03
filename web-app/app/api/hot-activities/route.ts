import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Fetch top events by volume to get "hot" activities
    // Increased limit to 50 to find the highest movers among active markets
    const response = await fetch('https://gamma-api.polymarket.com/events?limit=50&active=true&closed=false&order=volume&ascending=false', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json'
      },
      cache: 'no-store' // Disable cache due to large response size (>2MB)
    });

    if (!response.ok) {
      throw new Error('Failed to fetch from Polymarket API');
    }

    const events = await response.json();
    const now = new Date();

    const activities = events
      .filter((event: any) => {
          // Filter out events that have physically ended (even if market is still open for settlement)
          if (event.endDate) {
              const endDate = new Date(event.endDate);
              // Add a small buffer (e.g., 2 hours) to allow for immediate post-game reaction, 
              // but generally filter out old stuff.
              // Actually, user wants "finished matches" gone. 
              // If it's sports, strict check is better.
              if (endDate < now) return false;
          }
          return true;
      })
      .map((event: any) => {
      // Logic to extract the most relevant market/option data
      
      let price = 0;
      let change = 0;
      let changePct = 0;
      let option = "Yes"; // Default for binary
      
        if (event.markets && event.markets.length > 0) {
        const validMarkets = event.markets.filter((m: any) => {
          const isClosed = m.closed === true || m.status === 'closed';
          const isResolved = m.resolved === true || m.isResolved === true || m.result !== undefined;
          const isActive = m.active !== false;
          return isActive && !isClosed && !isResolved;
        });

        const marketsToScan = validMarkets.length > 0 ? validMarkets : event.markets;

        // Find the market with the HIGHEST 24H CHANGE (positive movers prioritized)
        let bestMarket = marketsToScan[0];
        let maxChange = -Infinity;

        marketsToScan.forEach((m: any) => {
          try {
            const raw = m.oneDayPriceChange ? Number(m.oneDayPriceChange) : 0;
            const pct = Math.abs(raw) > 1 ? raw : raw * 100;
            if (pct > maxChange) {
              maxChange = pct;
              bestMarket = m;
            }
          } catch (e) {
            // ignore errors
          }
        });

        // Use the best market found (highest mover)
        const mainMarket = bestMarket;
        change = mainMarket.oneDayPriceChange ? Number(mainMarket.oneDayPriceChange) : 0;
        changePct = Math.abs(change) > 1 ? change : change * 100;
        
        // Get price for this specific market
        try {
            const outcomePrices = typeof mainMarket.outcomePrices === 'string' 
                ? JSON.parse(mainMarket.outcomePrices) 
                : mainMarket.outcomePrices;
            price = Number(outcomePrices?.[0] || mainMarket.price || 0);
        } catch(e) {
            price = Number(mainMarket.price || 0);
        }
        
        // Handle Group Markets vs Binary Markets
        if (mainMarket.groupItemTitle) {
           option = mainMarket.groupItemTitle;
        } else {
           option = "Yes";
        }
      }

      return {
        id: event.id,
        market: event.title,
        option: option,
        price: price,
        change: changePct,
        timestamp: event.updatedAt || new Date().toISOString(),
        url: `https://polymarket.com/event/${event.slug}`
      };
    });

    // Sort by Highest Positive Change Descending
    activities.sort((a: any, b: any) => b.change - a.change);

    // Return top 20
    return NextResponse.json({ activities: activities.slice(0, 20) });
  } catch (error) {
    console.error('Error fetching hot activities:', error);
    // Fallback to empty array or some error state, but let's return empty for now
    // or maybe the previous mock data as fallback? 
    // The user requested dynamic, so returning empty/error is more honest if it fails.
    return NextResponse.json({ activities: [] }, { status: 500 });
  }
}
