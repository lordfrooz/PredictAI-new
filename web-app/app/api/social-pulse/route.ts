import { NextResponse } from 'next/server';

const STOPWORDS = new Set([
  'the','a','an','and','or','but','if','then','else','of','to','in','on','for','with','by','from','at','as','is','are','was','were','be','been','being','this','that','these','those','it','its','their','they','them','you','your','we','our','us','about','over','under','into','out','up','down','vs','v','per','will','may','might','could','should','not','no'
]);

const POSITIVE_WORDS = [
  'surge','soar','record','high','jump','gain','profit','bull','rally','growth','positive','win','success','beat','outperform','strong','buy','upgrade','approval','adoption','launch','partnership','expansion','favorable','support','peace','agreement','deal','ceasefire','stimulus','cut'
];

const NEGATIVE_WORDS = [
  'drop','fall','loss','crash','bear','down','risk','warning','decline','negative','fail','miss','weak','sell','downgrade','rejection','ban','lawsuit','scam','hack','fear','panic','concern','crisis','correction','slump','war','attack','conflict','strike','escalation','sanction','tension'
];

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .replace(/<[^>]*>?/gm, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const tokenize = (value: string) =>
  normalizeText(value)
    .split(' ')
    .filter(token => token.length >= 3 && !STOPWORDS.has(token));

const getSentiment = (text: string) => {
  const normalized = normalizeText(text);
  let score = 0;
  POSITIVE_WORDS.forEach(word => {
    if (normalized.includes(word)) score += 1;
  });
  NEGATIVE_WORDS.forEach(word => {
    if (normalized.includes(word)) score -= 1;
  });
  if (score > 0) return 'positive' as const;
  if (score < 0) return 'negative' as const;
  return 'neutral' as const;
};

const timeAgo = (date: Date) => {
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const topic = searchParams.get('topic');

  if (!topic) {
    return NextResponse.json({ error: 'Topic parameter is required' }, { status: 400 });
  }

  try {
    const topicTerms = tokenize(topic);
      const minTermMatches = topicTerms.length >= 4 ? 2 : 1;
      const topicText = normalizeText(topic);
      const isNBA = topicText.includes('nba') || topicText.includes('basketball') || topicText.includes('champion');
      const isPolitics = topicText.includes('election') || topicText.includes('nominate') || topicText.includes('fed') || topicText.includes('chair') || topicText.includes('trump') || topicText.includes('biden');
      const isCrypto = topicText.includes('bitcoin') || topicText.includes('crypto') || topicText.includes('ethereum') || topicText.includes('btc') || topicText.includes('eth');

      const REDDIT_ALLOWLIST = isNBA
        ? ['nba', 'nbadiscussion', 'sportsbook', 'sports', 'basketball']
        : isPolitics
        ? ['politics', 'geopolitics', 'economics', 'politicaldiscussion', 'news', 'worldnews']
        : isCrypto
        ? ['cryptocurrency', 'bitcoin', 'ethtrader', 'cryptomarkets', 'defi', 'stocks']
        : ['news', 'worldnews', 'economics', 'stocks', 'technology'];

      const REDDIT_BLOCKLIST = [
        'airdrop', 'giveaway', 'referral', 'bonus', 'promo', 'promotion', 'free', 'earn', 'deal', 'coupon', 'signal', 'vip'
      ];

    const gdeltQuery = encodeURIComponent(`${topic} lang:english`);
    const gdeltUrl = `https://api.gdeltproject.org/api/v2/doc/doc?query=${gdeltQuery}&mode=artlist&maxrecords=25&format=json&sort=HybridRel`;

    const redditQuery = encodeURIComponent(topic);
      const redditUrl = `https://www.reddit.com/search.json?q=${redditQuery}&sort=relevance&limit=50&restrict_sr=0`;

    const results = await Promise.allSettled([
      fetch(gdeltUrl, { next: { revalidate: 120 } }),
      fetch(redditUrl, {
        headers: { 'User-Agent': 'PredictlyAI/1.0 (social-pulse)' },
        next: { revalidate: 120 }
      })
    ]);

    const safeJson = async (res: Response | null, fallback: any) => {
      if (!res || !res.ok) return fallback;
      try {
        const text = await res.text();
        return text ? JSON.parse(text) : fallback;
      } catch {
        return fallback;
      }
    };

    const gdeltRes = results[0].status === 'fulfilled' ? results[0].value : null;
    const redditRes = results[1].status === 'fulfilled' ? results[1].value : null;

    const gdeltData = await safeJson(gdeltRes, { articles: [] });
    const redditData = await safeJson(redditRes, { data: { children: [] } });

    const gdeltItems = (gdeltData.articles || []).map((item: any, index: number) => {
      const title = item.title || 'Untitled';
      const summary = item.seendate ? `${title}` : title;
      const published = item.seendate ? new Date(item.seendate) : new Date();
      return {
        id: item.url || `gdelt-${index}`,
        user: item.sourceCommonName || 'News Source',
        handle: '@news',
        text: summary,
        time: timeAgo(published),
        timestamp: published.toISOString(),
        sentiment: getSentiment(title),
        likes: 0,
        retweets: 0,
        replies: 0,
        link: item.url,
        category: 'News',
        source: 'GDELT'
      };
    });

    const redditAll = (redditData.data?.children || [])
      .map((child: any) => child.data)
      .filter((post: any) => !post.over_18 && !post.stickied)
      .filter((post: any) => {
        const title = normalizeText(post.title || '');
        if (!title) return false;
        if (REDDIT_BLOCKLIST.some(term => title.includes(term))) return false;
        return true;
      });

    const redditStrict = redditAll
      .filter((post: any) => REDDIT_ALLOWLIST.includes(String(post.subreddit || '').toLowerCase()))
      .filter((post: any) => {
        if (topicTerms.length === 0) return true;
        const title = normalizeText(post.title || '');
        let matches = 0;
        topicTerms.forEach(term => {
          if (title.includes(term)) matches += 1;
        });
        return matches >= minTermMatches;
      });

    const redditRaw = (redditStrict.length > 0 ? redditStrict : redditAll)
      .map((post: any) => {
        const created = new Date(post.created_utc * 1000);
          const text = post.title || '';
        return {
          id: post.id,
          user: post.author || 'Reddit User',
          handle: `r/${post.subreddit || 'reddit'}`,
          text: text,
          time: timeAgo(created),
          timestamp: created.toISOString(),
          sentiment: getSentiment(text),
          likes: Number(post.score || 0),
          retweets: 0,
          replies: Number(post.num_comments || 0),
          link: `https://www.reddit.com${post.permalink}`,
          category: '#Reddit',
          source: 'Reddit'
        };
      });

    const redditItems = redditRaw.filter((post: any) => Number(post.likes || post.score || 0) >= 3 && Number(post.replies || post.num_comments || 0) >= 0);

    const combinedRaw = [...gdeltItems, ...redditItems];

    const filtered = combinedRaw.filter((item: { text: string; timestamp: string }) => {
      if (topicTerms.length === 0) return true;
      const normalized = normalizeText(item.text);
      let matches = 0;
      topicTerms.forEach(term => {
        if (normalized.includes(term)) matches += 1;
      });
      return matches >= minTermMatches;
    });

    const redditRelaxed = redditRaw.filter((item: { text: string; timestamp: string }) => {
      if (topicTerms.length === 0) return true;
      const normalized = normalizeText(item.text);
      let matches = 0;
      topicTerms.forEach(term => {
        if (normalized.includes(term)) matches += 1;
      });
      return matches >= 1;
    });

    const combined = (filtered.length > 0 ? filtered : [...gdeltItems, ...redditRelaxed])
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 20);

    const total = combined.length || 1;
    const positive = combined.filter(item => item.sentiment === 'positive').length;
    const neutral = combined.filter(item => item.sentiment === 'neutral').length;
    const negative = combined.filter(item => item.sentiment === 'negative').length;

    const totalEngagement = combined.reduce((sum, item) => sum + item.likes + item.replies + item.retweets, 0);

    const stats = {
      positive: Math.round((positive / total) * 100),
      neutral: Math.round((neutral / total) * 100),
      negative: Math.round((negative / total) * 100),
      engagementRate: totalEngagement > 0 ? `${(totalEngagement / total).toFixed(1)}` : '0.0',
      reach: `${(combined.length * 1.5).toFixed(0)}K`,
      shares: `${Math.max(1, Math.round(totalEngagement / 10))}`
    };

    return NextResponse.json({ items: combined, stats });
  } catch (error) {
    console.error('Social pulse error:', error);
    return NextResponse.json({ items: [], stats: { positive: 0, neutral: 0, negative: 0, engagementRate: '0.0', reach: '0K', shares: '0' } }, { status: 500 });
  }
}
