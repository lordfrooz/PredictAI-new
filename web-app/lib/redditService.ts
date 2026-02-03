/**
 * Reddit API Service - FULLY DYNAMIC
 * 
 * Free Reddit API - No API key needed for public data
 * Rate limited to ~60 requests/minute
 * Uses MongoDB cache to minimize requests
 * 
 * DYNAMIC: Searches Reddit based on market title keywords, not fixed categories
 */

import getClientPromise from './mongodb';

const REDDIT_BASE = 'https://www.reddit.com';
const CACHE_TTL_HOURS = 6; // Reddit data more volatile, refresh more often

export interface RedditPost {
  title: string;
  score: number;
  numComments: number;
  subreddit: string;
  createdUtc: number;
  url: string;
  sentiment: number;
}

export interface SubredditSentiment {
  subreddit: string;
  posts: RedditPost[];
  avgSentiment: number;
  totalEngagement: number;
  trendDirection: 'up' | 'down' | 'stable';
}

interface CachedReddit {
  query: string;
  data: RedditPost[];
  avgSentiment: number;
  totalEngagement: number;
  fetchedAt: Date;
  expiresAt: Date;
}

// Stop words to filter out
const STOP_WORDS = new Set([
  'will', 'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'it',
  'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this', 'but',
  'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or', 'an', 'my',
  'one', 'all', 'would', 'there', 'their', 'what', 'so', 'up', 'out', 'if',
  'about', 'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like',
  'time', 'no', 'just', 'him', 'know', 'take', 'into', 'year', 'your', 'good',
  'win', 'won', 'lose', 'lost', 'yes', 'happen', 'reach', 'hit', 'above', 'below'
]);

/**
 * Extract search keywords from text
 */
function extractSearchTerms(text: string): string {
  const words = text.split(/\s+/)
    .map(w => w.replace(/[^a-zA-Z0-9$%]/g, ''))
    .filter(w => w.length > 2)
    .filter(w => !STOP_WORDS.has(w.toLowerCase()));
  
  // Prioritize capitalized words (proper nouns) and numbers
  const important = words.filter(w => /^[A-Z]/.test(w) || /\d/.test(w));
  const regular = words.filter(w => !/^[A-Z]/.test(w) && !/\d/.test(w));
  
  const combined = [...new Set([...important, ...regular])];
  return combined.slice(0, 3).join(' ');
}

/**
 * Analyze sentiment from Reddit post title
 */
function analyzeRedditSentiment(title: string, score: number): number {
  const lowerTitle = title.toLowerCase();
  
  const positiveWords = [
    'bullish', 'moon', 'pump', 'win', 'winning', 'victory', 'surge',
    'amazing', 'great', 'love', 'best', 'breaking', 'huge', 'confirmed',
    'ath', 'all time high', 'rally', 'soar', 'explode', '??', '??', '??'
  ];
  
  const negativeWords = [
    'bearish', 'crash', 'dump', 'lose', 'losing', 'defeat', 'fail',
    'scam', 'fraud', 'warning', 'concern', 'fear', 'sell', 'rip',
    'dead', 'rekt', 'bust', 'collapse', 'scandal', '??', '??'
  ];
  
  let sentiment = 0;
  positiveWords.forEach(word => {
    if (lowerTitle.includes(word)) sentiment += 20;
  });
  negativeWords.forEach(word => {
    if (lowerTitle.includes(word)) sentiment -= 20;
  });
  
  // Adjust by post score (high upvotes = community agrees)
  if (score > 1000) sentiment *= 1.5;
  else if (score > 500) sentiment *= 1.2;
  else if (score < 0) sentiment *= -0.5; // Downvoted post = community disagrees
  
  return Math.max(-100, Math.min(100, Math.round(sentiment)));
}

/**
 * Fetch posts from Reddit search
 */
async function fetchRedditSearch(query: string, subreddit?: string): Promise<RedditPost[]> {
  try {
    const searchUrl = subreddit 
      ? `${REDDIT_BASE}/r/${subreddit}/search.json?q=${encodeURIComponent(query)}&sort=relevance&t=week&limit=10`
      : `${REDDIT_BASE}/search.json?q=${encodeURIComponent(query)}&sort=relevance&t=week&limit=15`;
    
    // Use a public Reddit JSON proxy or direct fetch with appropriate headers
    // Vercel sometimes blocks direct requests to reddit.com due to IP reputation
    // Adding no-cache and specific User-Agent helps
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!response.ok) {
      console.error('Reddit API error:', response.status);
      return [];
    }
    
    const data = await response.json();
    
    if (!data.data?.children) return [];
    
    return data.data.children.map((child: any) => {
      const post = child.data;
      return {
        title: post.title,
        score: post.score,
        numComments: post.num_comments,
        subreddit: post.subreddit,
        createdUtc: post.created_utc,
        url: `https://reddit.com${post.permalink}`,
        sentiment: analyzeRedditSentiment(post.title, post.score)
      };
    });
  } catch (error) {
    console.error('Reddit fetch error:', error);
    return [];
  }
}

/**
 * Get Reddit sentiment for a topic (with caching)
 */
export async function getRedditSentiment(
  query: string,
  eventType: 'politics' | 'crypto' | 'sports' | 'pop' | 'other' = 'other'
): Promise<{ posts: RedditPost[]; avgSentiment: number; totalEngagement: number; trendDirection: 'up' | 'down' | 'stable' }> {
  const cacheKey = `${eventType}:${query.toLowerCase().trim()}`;
  
  try {
    const clientPromise = getClientPromise();
    const client = await clientPromise;
    const db = client.db('predictlyai');
    const collection = db.collection<CachedReddit>('reddit_cache');
    
    // Check cache
    const cached = await collection.findOne({
      query: cacheKey,
      expiresAt: { $gt: new Date() }
    });
    
    if (cached) {
      console.log(`[RedditService] Cache hit for ${cacheKey}`);
      return {
        posts: cached.data,
        avgSentiment: cached.avgSentiment,
        totalEngagement: cached.totalEngagement,
        trendDirection: determineTrend(cached.data)
      };
    }
    
    // Fetch fresh data - DYNAMIC search using extracted keywords
    console.log(`[RedditService] Cache miss, fetching for "${cacheKey}"...`);
    
    // Dynamic search - just search Reddit globally with the query
    const allPosts: RedditPost[] = [];
    
    // General Reddit search with the dynamic query
    const generalPosts = await fetchRedditSearch(query);
    allPosts.push(...generalPosts);
    
    // Deduplicate
    const uniquePosts = allPosts.filter((post, index, self) =>
      index === self.findIndex(p => p.title === post.title)
    );
    
    // Calculate metrics
    const avgSentiment = uniquePosts.length > 0
      ? Math.round(uniquePosts.reduce((sum, p) => sum + p.sentiment, 0) / uniquePosts.length)
      : 0;
    
    const totalEngagement = uniquePosts.reduce((sum, p) => sum + p.score + p.numComments, 0);
    
    // Cache results
    const now = new Date();
    await collection.updateOne(
      { query: cacheKey },
      {
        $set: {
          query: cacheKey,
          data: uniquePosts,
          avgSentiment,
          totalEngagement,
          fetchedAt: now,
          expiresAt: new Date(now.getTime() + CACHE_TTL_HOURS * 60 * 60 * 1000)
        }
      },
      { upsert: true }
    );
    
    console.log(`[RedditService] Cached ${uniquePosts.length} posts, sentiment: ${avgSentiment}`);
    
    return {
      posts: uniquePosts,
      avgSentiment,
      totalEngagement,
      trendDirection: determineTrend(uniquePosts)
    };
    
  } catch (error) {
    console.error('RedditService error:', error);
    return { posts: [], avgSentiment: 0, totalEngagement: 0, trendDirection: 'stable' };
  }
}

/**
 * Determine trend direction based on recent vs older posts
 */
function determineTrend(posts: RedditPost[]): 'up' | 'down' | 'stable' {
  if (posts.length < 4) return 'stable';
  
  const now = Date.now() / 1000;
  const recentPosts = posts.filter(p => now - p.createdUtc < 86400); // Last 24h
  const olderPosts = posts.filter(p => now - p.createdUtc >= 86400);
  
  if (recentPosts.length < 2 || olderPosts.length < 2) return 'stable';
  
  const recentAvg = recentPosts.reduce((s, p) => s + p.sentiment, 0) / recentPosts.length;
  const olderAvg = olderPosts.reduce((s, p) => s + p.sentiment, 0) / olderPosts.length;
  
  const diff = recentAvg - olderAvg;
  
  if (diff > 15) return 'up';
  if (diff < -15) return 'down';
  return 'stable';
}

/**
 * Get aggregated social score for an option - DYNAMIC
 * Extracts keywords from option name and market title for search
 */
export async function getSocialScoreForOption(
  optionName: string,
  marketTitle: string,
  eventType: 'politics' | 'crypto' | 'sports' | 'pop' | 'other'
): Promise<{ score: number; engagement: number; trend: 'up' | 'down' | 'stable'; postCount: number }> {
  // Build dynamic search query from option and market
  const combinedText = `${optionName} ${marketTitle}`;
  const searchQuery = extractSearchTerms(combinedText);
  
  console.log(`[RedditService] Dynamic search for option: "${optionName}" ? Query: "${searchQuery}"`);
  
  const result = await getRedditSentiment(searchQuery, eventType);
  
  return {
    score: result.avgSentiment,
    engagement: result.totalEngagement,
    trend: result.trendDirection,
    postCount: result.posts.length
  };
}
