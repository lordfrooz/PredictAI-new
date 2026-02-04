import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'trending'; // 'trending' | 'new'

    let url = '';
    
    if (filter === 'new') {
        // Fetch newly created markets (sort by startDate or createdAt - Gamma uses startDate usually for 'new')
        // Using startDate descending to get the newest
        url = 'https://gamma-api.polymarket.com/events?limit=12&active=true&closed=false&order=startDate&ascending=false';
    } else {
        // Default: Trending (High Volume)
        url = 'https://gamma-api.polymarket.com/events?limit=12&active=true&closed=false&order=volume&ascending=false';
    }
    
    const response = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'application/json'
        },
        cache: 'no-store' // Disable cache due to large response size
    });

    if (!response.ok) {
        throw new Error('Failed to fetch trending markets');
    }

    let events = await response.json();

    // Limit back to 12 if we fetched more for filtering
    events = events.slice(0, 12);

    const trending = events.map((event: any) => {
        // Find top market in event (usually the one with most volume)
        // Gamma API usually returns markets array. We want to extract top 2 outcomes.
        
        // Polymarket structure varies, but often markets[0] is the main market if it's a binary event.
        // If it's a group market, markets array contains multiple outcomes.
        // We need to parse outcomes correctly.
        
        let topOutcomes: { name: string, prob: number, change?: number }[] = [];
        let mainMarket = event.markets?.[0];
        
        // Check if markets exist
        if (event.markets && event.markets.length > 0) {
             // Find the market with the highest volume to represent the event
             // This ensures we show the most relevant option's price change
             mainMarket = event.markets.reduce((prev: any, current: any) => 
                (Number(current.volume || 0) > Number(prev.volume || 0)) ? current : prev
             , event.markets[0]);

             if (mainMarket.groupItemTitle) {
                 // Group Market (Multiple Outcomes as separate markets)
                 // We need to find the top 2 by price
                 // outcomePrices is a JSON string in Gamma API, e.g. "[\"0.5\", \"0.5\"]"
                 // We need to parse it to get the price.
                 
                 const getPrice = (m: any) => {
                     try {
                         if (m.price) return Number(m.price);
                         if (m.outcomePrices) {
                             const prices = typeof m.outcomePrices === 'string' ? JSON.parse(m.outcomePrices) : m.outcomePrices;
                             return Number(prices[0] || 0);
                         }
                         return 0;
                     } catch (e) {
                         return 0;
                     }
                 };

                 const sortedMarkets = [...event.markets].sort((a, b) => getPrice(b) - getPrice(a));
                 
                 topOutcomes = sortedMarkets.slice(0, 2).map(m => ({
                     name: m.groupItemTitle || "Option",
                     prob: Math.round(getPrice(m) * 100),
                     change: m.oneDayPriceChange ? Number((Number(m.oneDayPriceChange) * 100).toFixed(1)) : 0
                 }));
             } else {
                 // Binary Market (Outcomes in outcomePrices array: [Yes, No])
                 // Assuming mainMarket.outcomePrices[0] is "Yes" and [1] is "No"
                 // And outcomes array is ["Yes", "No"]
                 const outcomePrices = JSON.parse(mainMarket.outcomePrices || "[]");
                 const clobTokenIds = JSON.parse(mainMarket.clobTokenIds || "[]");
                 
                 // Fallback if outcomePrices is not a string array but already parsed or different structure
                 const yesPrice = Number(outcomePrices[0] || mainMarket.price || 0);
                 const noPrice = Number(outcomePrices[1] || (1 - yesPrice));
                 
                 // Change is usually for the 'Yes' side in binary markets
                 const yesChange = mainMarket.oneDayPriceChange ? Number((Number(mainMarket.oneDayPriceChange) * 100).toFixed(1)) : 0;
                 
                 topOutcomes = [
                     { name: "Yes", prob: Math.round(yesPrice * 100), change: yesChange },
                     { name: "No", prob: Math.round(noPrice * 100), change: -yesChange } // Approximate inverse change
                 ];
             }
        }

        const market = mainMarket || event.markets?.[0];

        return {
            title: event.title,
            slug: event.slug,
            volume: market ? `$${(Number(market.volume) / 1000000).toFixed(1)}M` : 'N/A',
            change: market?.oneDayPriceChange ? (Number(market.oneDayPriceChange) * 100).toFixed(1) : 0,
            image: event.image || market?.image,
            topOutcomes
        };
    });

    return NextResponse.json(trending);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch trending' }, { status: 500 });
  }
}
