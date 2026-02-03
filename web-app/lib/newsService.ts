/**
 * NewsAPI Service with Smart Caching
 * 
 * - 100 requests/day limit ? 24 hour MongoDB cache
 * - DYNAMIC: Extracts keywords from market title and searches
 * - No hardcoded categories - fully dynamic search
 */

import getClientPromise from './mongodb';

const NEWS_API_KEY = process.env.NEWS_API_KEY || '5745e429e8ce469dbe2cd5fb38985bb5';
const NEWS_API_BASE = 'https://newsapi.org/v2';
const CACHE_TTL_HOURS = 24;

export interface NewsArticle {
  title: string;
  description: string;
  source: string;
  url: string;
  publishedAt: string;
  sentiment: number; // -100 to +100
}

interface CachedNews {
  searchQuery: string;
  articles: NewsArticle[];
  fetchedAt: Date;
  expiresAt: Date;
}

// Stop words to filter out from search queries
const STOP_WORDS = new Set([
  'will', 'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'it',
  'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this', 'but',
  'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or', 'an', 'my',
  'one', 'all', 'would', 'there', 'their', 'what', 'so', 'up', 'out', 'if',
  'about', 'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like',
  'time', 'no', 'just', 'him', 'know', 'take', 'people', 'into', 'year',
  'your', 'good', 'some', 'could', 'them', 'see', 'other', 'than', 'then',
  'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also', 'back',
  'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way',
  'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most',
  'us', 'before', 'between', 'does', 'being', 'under', 'during', 'each',
  'win', 'won', 'lose', 'lost', 'yes', 'no', 'happen', 'become', 'reach',
  'hit', 'above', 'below', 'next', 'last', 'end', 'start', 'begin'
]);

/**
 * Extract meaningful keywords from a market title
 */
function extractKeywords(title: string): string[] {
  // Remove special characters and split into words
  const words = title
    .toLowerCase()
    .replace(/[^a-z0-9\s$%]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2)
    .filter(word => !STOP_WORDS.has(word));
  
  // Prioritize: proper nouns (capitalized in original), numbers, $ symbols
  const originalWords = title.split(/\s+/);
  const properNouns: string[] = [];
  const numbers: string[] = [];
  const regular: string[] = [];
  
  originalWords.forEach(word => {
    const clean = word.replace(/[^a-zA-Z0-9$%]/g, '');
    if (clean.length < 2) return;
    
    // Check if it's a number or price
    if (/\$?\d+[kKmMbB]?/.test(clean)) {
      numbers.push(clean);
    }
    // Check if it starts with capital (proper noun)
    else if (/^[A-Z]/.test(word) && !STOP_WORDS.has(clean.toLowerCase())) {
      properNouns.push(clean);
    }
    // Regular word
    else if (!STOP_WORDS.has(clean.toLowerCase()) && clean.length > 2) {
      regular.push(clean.toLowerCase());
    }
  });
  
  // Combine: proper nouns first, then numbers, then regular words
  const keywords = [...new Set([...properNouns, ...numbers, ...regular])];
  
  return keywords.slice(0, 5); // Max 5 keywords
}

/**
 * Build search query from market title
 */
function buildSearchQuery(marketTitle: string): string {
  const keywords = extractKeywords(marketTitle);
  
  if (keywords.length === 0) {
    // Fallback: use first few meaningful words
    return marketTitle.split(/\s+/).slice(0, 3).join(' ');
  }
  
  // Join top keywords for search
  return keywords.slice(0, 3).join(' ');
}

/**
 * Analyze sentiment of text using keyword analysis
 */
function analyzeSentiment(text: string): number {
  const lowerText = text.toLowerCase();
  
  const positiveWords = [
    'win', 'winning', 'won', 'victory', 'success', 'surge', 'rise', 'gain',
    'lead', 'ahead', 'boost', 'rally', 'bullish', 'soar', 'jump', 'breakthrough',
    'record', 'historic', 'strong', 'confident', 'optimistic', 'approval', 'support'
  ];
  
  const negativeWords = [
    'lose', 'losing', 'lost', 'defeat', 'fail', 'failure', 'drop', 'fall',
    'behind', 'decline', 'crash', 'plunge', 'bearish', 'weak', 'struggle',
    'crisis', 'scandal', 'controversy', 'investigation', 'lawsuit', 'ban',
    'reject', 'oppose', 'criticism', 'warning', 'fear', 'concern', 'doubt'
  ];
  
  let score = 0;
  positiveWords.forEach(word => {
    if (lowerText.includes(word)) score += 15;
  });
  negativeWords.forEach(word => {
    if (lowerText.includes(word)) score -= 15;
  });
  
  return Math.max(-100, Math.min(100, score));
}

/**
 * Fetch news from NewsAPI
 */
async function fetchFromNewsAPI(query: string, pageSize: number = 10): Promise<NewsArticle[]> {
  try {
    const url = `${NEWS_API_BASE}/everything?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&pageSize=${pageSize}&apiKey=${NEWS_API_KEY}`;
    
    const response = await fetch(url, {
      headers: { 'User-Agent': 'PredictlyAI/1.0' }
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error('NewsAPI error:', error);
      return [];
    }
    
    const data = await response.json();
    
    if (!data.articles) return [];
    
    return data.articles.map((article: any) => ({
      title: article.title || '',
      description: article.description || '',
      source: article.source?.name || 'Unknown',
      url: article.url || '',
      publishedAt: article.publishedAt || new Date().toISOString(),
      sentiment: analyzeSentiment(`${article.title} ${article.description}`)
    }));
  } catch (error) {
    console.error('NewsAPI fetch error:', error);
    return [];
  }
}

/**
 * DYNAMIC: Get news for a specific market by extracting keywords from title
 * Caches results by normalized search query
 */
export async function getNewsForMarket(
  marketTitle: string,
  eventType: 'politics' | 'crypto' | 'sports' | 'pop' | 'other'
): Promise<NewsArticle[]> {
  // Build dynamic search query from market title
  const searchQuery = buildSearchQuery(marketTitle);
  const cacheKey = searchQuery.toLowerCase().trim();
  
  console.log(`[NewsService] Dynamic search for: "${marketTitle}" ? Query: "${searchQuery}"`);
  
  try {
    const clientPromise = getClientPromise();
    const client = await clientPromise;
    const db = client.db('predictlyai');
    const collection = db.collection<CachedNews>('news_cache');
    
    // Check cache by search query
    const cached = await collection.findOne({
      searchQuery: cacheKey,
      expiresAt: { $gt: new Date() }
    });
    
    if (cached) {
      console.log(`[NewsService] Cache HIT for "${cacheKey}" (${cached.articles.length} articles)`);
      return cached.articles;
    }
    
    // Fetch fresh news with dynamic query
    console.log(`[NewsService] Cache MISS for "${cacheKey}", fetching from NewsAPI...`);
    
    const articles = await fetchFromNewsAPI(searchQuery, 10);
    
    // If no results, try with fewer keywords
    if (articles.length === 0) {
      const keywords = extractKeywords(marketTitle);
      if (keywords.length > 1) {
        const fallbackQuery = keywords[0]; // Just the main keyword
        console.log(`[NewsService] No results, trying fallback: "${fallbackQuery}"`);
        const fallbackArticles = await fetchFromNewsAPI(fallbackQuery, 10);
        articles.push(...fallbackArticles);
      }
    }
    
    // Deduplicate
    const uniqueArticles = articles.filter((article, index, self) =>
      index === self.findIndex(a => a.title === article.title)
    );
    
    // Cache the results
    const now = new Date();
    await collection.updateOne(
      { searchQuery: cacheKey },
      {
        $set: {
          searchQuery: cacheKey,
          articles: uniqueArticles,
          fetchedAt: now,
          expiresAt: new Date(now.getTime() + CACHE_TTL_HOURS * 60 * 60 * 1000)
        }
      },
      { upsert: true }
    );
    
    console.log(`[NewsService] Cached ${uniqueArticles.length} articles for "${cacheKey}"`);
    return uniqueArticles;
    
  } catch (error) {
    console.error('NewsService error:', error);
    return [];
  }
}

/**
 * Get cache status (for debugging/monitoring)
 */
export async function getCacheStatus(): Promise<{ query: string; articleCount: number; expiresIn: string }[]> {
  try {
    const clientPromise = getClientPromise();
    const client = await clientPromise;
    const db = client.db('predictlyai');
    const collection = db.collection<CachedNews>('news_cache');
    
    const caches = await collection.find({}).toArray();
    
    return caches.map((cache: CachedNews) => ({
      query: cache.searchQuery,
      articleCount: cache.articles.length,
      expiresIn: cache.expiresAt > new Date() 
        ? `${Math.round((cache.expiresAt.getTime() - Date.now()) / 1000 / 60 / 60)}h`
        : 'expired'
    }));
  } catch {
    return [];
  }
}
