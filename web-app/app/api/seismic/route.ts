import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Fetch top active events by 24h volume from Polymarket
    const gammaUrl = 'https://gamma-api.polymarket.com/events?limit=50&active=true&closed=false&order=volume24hr&ascending=false';
    
    const response = await fetch(gammaUrl, {
        headers: {
            'User-Agent': 'PredictlyAI-Monitor/1.0',
            'Accept': 'application/json'
        },
        cache: 'no-store' // Disable cache due to large response size (>2MB)
    });

    if (!response.ok) {
        throw new Error(`Polymarket API Error: ${response.status}`);
    }

    const events = await response.json();

    // Transform and Score Events
    const seismicEvents = events
        .filter((e: any) => e.markets && e.markets.length > 0)
        .map((e: any) => {
            const mainMarket = e.markets[0];
            const volume24h = Number(mainMarket.volume24hr || 0);
            const priceChange = Number(mainMarket.oneDayPriceChange || 0);
            const priceChangePercent = priceChange * 100; // Convert to percentage (e.g. 0.05 -> 5%)

            // --- INTENSITY SCORING ALGORITHM ---
            // 1. Volatility Score (0-10 based on price change)
            // 1% change = 2 points, 5% change = 5 points, 10%+ change = 8-10 points
            let volatilityScore = Math.abs(priceChangePercent) * 1.5;

            // 2. Volume Weight (Logarithmic scale)
            // $10k = 0.5x, $100k = 0.8x, $1M = 1.0x, $10M = 1.2x
            const volumeWeight = Math.min(1.5, Math.max(0.5, Math.log10(volume24h + 1) / 6));

            // 3. Final Intensity Calculation
            let intensity = volatilityScore * volumeWeight;
            
            // Boost for "Breaking" moves (High vol + High change)
            if (volume24h > 1000000 && Math.abs(priceChangePercent) > 5) {
                intensity += 2; 
            }

            // Clamp to 0.1 - 9.9 (Reserve 10 for absolute anomalies)
            intensity = Math.min(9.9, Math.max(0.1, intensity));

            // Categorize
            let type = 'OTHER';
            const tags = e.tags || [];
            const tagStr = tags.map((t: any) => t.label.toLowerCase()).join(' ');
            
            if (tagStr.includes('politic') || tagStr.includes('election')) type = 'POLITICS';
            else if (tagStr.includes('crypto') || tagStr.includes('bitcoin')) type = 'CRYPTO';
            else if (tagStr.includes('sport') || tagStr.includes('nfl')) type = 'SPORTS';
            else if (tagStr.includes('tech') || tagStr.includes('science')) type = 'TECH';
            else if (tagStr.includes('economic') || tagStr.includes('fed')) type = 'FINANCE';

            // Reason Generator (Simulated NLP)
            let reason = 'Volume Spike';
            if (Math.abs(priceChangePercent) > 10) reason = 'Major Repricing';
            else if (Math.abs(priceChangePercent) > 5) reason = 'High Volatility';
            else if (volume24h > 5000000) reason = 'Institutional Flow';
            else if (volume24h > 1000000) reason = 'Trending';

            return {
                id: e.id,
                market: e.title,
                type: type,
                intensity: Number(intensity.toFixed(1)),
                magnitude: `${priceChangePercent > 0 ? '+' : ''}${priceChangePercent.toFixed(1)}%`,
                volume: `$${(volume24h / 1000000).toFixed(1)}M`,
                rawVolume: volume24h,
                reason: reason,
                timestamp: 'Live',
                slug: e.slug
            };
        })
        // Filter out low noise events (Low intensity unless high volume)
        .filter((e: any) => e.intensity > 1.5 && e.rawVolume > 10000)
        // Sort by Intensity Descending
        .sort((a: any, b: any) => b.intensity - a.intensity)
        .slice(0, 20); // Top 20 Seismic Events

    return NextResponse.json(seismicEvents);

  } catch (error: any) {
    console.error("Seismic API Error:", error);
    return NextResponse.json({ error: 'Failed to detect seismic activity' }, { status: 500 });
  }
}
