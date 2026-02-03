import { SimplifiedAnalysisResult } from './marketAnalyst';

export interface CachedAnalysis {
  slug: string;
  url: string;
  title: string;
  category: string;
  eventType: string;
  timeToResolutionHours: number;
  analysis: SimplifiedAnalysisResult;
  createdAt: Date;
  expiresAt: Date;
  ttlMinutes: number;
  hitCount: number;
  lastAccessedAt: Date;
}

export interface AnalysisResponse extends SimplifiedAnalysisResult {
  cached: boolean;
  cachedAt?: string;
  expiresAt?: string;
  cacheAgeMinutes?: number;
  ttlMinutes?: number;
  refreshAvailableIn?: number; // minutes until next refresh allowed
}

/**
 * Calculate TTL based on event characteristics
 * 
 * Logic:
 * 1. Closer to resolution = shorter TTL (more frequent updates)
 * 2. Volatile categories (crypto, sports) = shorter TTL
 * 3. Stable categories (politics) = longer TTL
 */
export function calculateTTL(
  timeToResolutionHours: number,
  category: string,
  eventType: string
): number {
  // Base TTL based on time to resolution (in milliseconds)
  let baseTTLMinutes: number;
  
  if (timeToResolutionHours < 1) {
    // Less than 1 hour - very short cache
    baseTTLMinutes = 10;
  } else if (timeToResolutionHours < 3) {
    // 1-3 hours
    baseTTLMinutes = 20;
  } else if (timeToResolutionHours < 6) {
    // 3-6 hours
    baseTTLMinutes = 30;
  } else if (timeToResolutionHours < 24) {
    // 6-24 hours (same day)
    baseTTLMinutes = 60;
  } else if (timeToResolutionHours < 72) {
    // 1-3 days
    baseTTLMinutes = 90;
  } else if (timeToResolutionHours < 168) {
    // 3-7 days
    baseTTLMinutes = 120;
  } else if (timeToResolutionHours < 720) {
    // 1-4 weeks
    baseTTLMinutes = 180;
  } else {
    // More than a month
    baseTTLMinutes = 240;
  }
  
  // Category multiplier
  let multiplier = 1.0;
  const cat = category.toLowerCase();
  const type = eventType.toLowerCase();
  
  if (cat.includes('crypto') || cat.includes('bitcoin') || cat.includes('ethereum')) {
    // Crypto is volatile
    multiplier = 0.5;
  } else if (cat.includes('sport') || type === 'sports') {
    // Sports can change quickly (injuries, lineups)
    multiplier = 0.7;
  } else if (cat.includes('politic') || cat.includes('election') || type === 'politics') {
    // Politics is slow-moving
    multiplier = 1.5;
  } else if (cat.includes('entertainment') || cat.includes('pop') || type === 'pop') {
    // Pop culture is medium
    multiplier = 1.0;
  }
  
  // Calculate final TTL
  const finalTTLMinutes = Math.round(baseTTLMinutes * multiplier);
  
  // Clamp between 10 minutes and 6 hours
  return Math.max(10, Math.min(360, finalTTLMinutes));
}

/**
 * Format time ago string
 */
export function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  
  if (diffMinutes < 1) {
    return 'just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} min ago`;
  } else {
    const hours = Math.floor(diffMinutes / 60);
    const mins = diffMinutes % 60;
    if (mins === 0) {
      return `${hours}h ago`;
    }
    return `${hours}h ${mins}m ago`;
  }
}

/**
 * Check if cache needs refresh based on freshness ratio
 */
export function shouldBackgroundRefresh(createdAt: Date, expiresAt: Date): boolean {
  const now = new Date();
  const totalDuration = expiresAt.getTime() - createdAt.getTime();
  const elapsed = now.getTime() - createdAt.getTime();
  const freshnessRatio = elapsed / totalDuration;
  
  // Refresh in background when 80% of TTL has passed
  return freshnessRatio > 0.8;
}
