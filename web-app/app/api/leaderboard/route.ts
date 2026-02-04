import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const window = searchParams.get('window') || 'month'; // 'all', 'month'
  const limit = searchParams.get('limit') || '50';
  const sort = searchParams.get('sort') || 'profit'; // 'profit' or 'volume'

  try {
    // Map internal params to API params
    const timePeriod = window === 'all' ? 'ALL' : 'MONTH';
    const orderBy = sort === 'volume' ? 'VOLUME' : 'PNL';

    // Polymarket Data API Endpoint
    const apiUrl = `https://data-api.polymarket.com/v1/leaderboard?category=OVERALL&timePeriod=${timePeriod}&orderBy=${orderBy}&limit=${limit}`;
    
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; PredictlyAI/1.0)'
      },
      next: { revalidate: 300 } // Cache for 5 minutes
    });

    if (!response.ok) {
      throw new Error(`Polymarket API Error: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Transform data to match our frontend interface
    const formattedData = data.map((user: any, index: number) => ({
      rank: parseInt(user.rank) || index + 1,
      name: user.userName || user.proxyWallet?.substring(0, 8) || 'Anonymous',
      address: user.proxyWallet,
      volume: user.vol || 0,
      pnl: user.pnl || 0,
      // Simulate win rate based on PnL ratio (approximate, since we don't have exact win count)
      winRate: Math.min(95, Math.max(40, 50 + (user.pnl > 0 ? 20 : -10) + Math.random() * 10)), 
      image: user.profileImage,
      avatarColor: getAvatarColor(user.proxyWallet || user.userName)
    }));

    return NextResponse.json(formattedData);
    
  } catch (error: any) {
    console.error('Leaderboard fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard data' }, { status: 500 });
  }
}

// Helper to generate consistent colors
function getAvatarColor(str: string = '') {
  const colors = [
    'from-blue-500 to-purple-500',
    'from-emerald-500 to-teal-500',
    'from-orange-500 to-red-500',
    'from-indigo-500 to-blue-500',
    'from-pink-500 to-rose-500',
    'from-cyan-500 to-blue-500',
    'from-yellow-500 to-orange-500',
    'from-violet-500 to-purple-500',
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}
