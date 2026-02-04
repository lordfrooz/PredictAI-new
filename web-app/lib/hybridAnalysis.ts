/**
 * Alpha-Seeker Hybrid Analysis System (Balanced Edition)
 * 
 * DESIGN PHILOSOPHY: "Dynamic Confidence Blending"
 * 
 * 1. Calculate a "Model Price" based purely on AI, News, and Momentum.
 * 2. Calculate a "Confidence Score" based on signal alignment.
 * 3. Blend the Model Price with Market Price based on Confidence.
 * 
 * RESULT:
 * - High Confidence (Signals Agree) -> Ignore Market (Chase Alpha).
 * - Low Confidence (Mixed Signals) -> Respect Market (Safety).
 */

export type EventType = 'sports' | 'politics' | 'crypto' | 'pop' | 'other';

// Component Weights for the "Model Price" Calculation
export const COMPONENT_WEIGHTS: Record<EventType, { core: number; news: number; momentum: number }> = {
  politics: { core: 0.70, news: 0.25, momentum: 0.05 },
  crypto:   { core: 0.30, news: 0.40, momentum: 0.30 }, // Reduced News slightly for stability
  sports:   { core: 0.60, news: 0.35, momentum: 0.05 },
  pop:      { core: 0.30, news: 0.70, momentum: 0.00 },
  other:    { core: 0.50, news: 0.30, momentum: 0.20 }
};

export interface VectorScores {
  newsScore: number;      // -100 to +100
  momentumScore: number;  // -100 to +100
  coreAiScore: number;    // 0 to 100
}

export interface HybridResult {
  finalProbability: number;
  marketDivergence: number;
  vectors: {
    news: { score: number; weight: number; contribution: number };
    momentum: { score: number; weight: number; contribution: number };
    core: { score: number; weight: number; contribution: number };
  };
  confidence: 'low' | 'medium' | 'high';
  signalStrength: 'Strong Buy' | 'Buy' | 'Neutral' | 'Sell' | 'Strong Sell';
}

/**
 * Calculate News Score (-100 to +100)
 */
export function calculateNewsScore(
  optionName: string,
  newsArticles: Array<{ title: string; description?: string; sentiment?: number }>
): number {
  if (!newsArticles || newsArticles.length === 0) return 0;

  const optionLower = optionName.toLowerCase();
  let totalScore = 0;
  let relevantCount = 0;

  for (const article of newsArticles) {
    const text = `${article.title} ${article.description || ''}`.toLowerCase();
    
    // Relevance Check (lenient)
    const isRelevant = text.includes(optionLower) || 
                       optionLower.split(' ').some(word => word.length > 3 && text.includes(word));
    
    if (!isRelevant) continue;
    relevantCount++;

    let sentiment = article.sentiment ?? 0;
    
    // Fallback Keyword Analysis
    if (sentiment === 0) {
      const positiveWords = ['win', 'lead', 'record', 'surge', 'bullish', 'breakthrough', 'approval', 'gain', 'ahead'];
      const negativeWords = ['lose', 'trail', 'injury', 'crash', 'bearish', 'scandal', 'ban', 'decline', 'behind'];
      
      const posCount = positiveWords.filter(w => text.includes(w)).length;
      const negCount = negativeWords.filter(w => text.includes(w)).length;
      
      // Conservative scaling for stability
      sentiment = (posCount - negCount) * 15; 
    }
    
    totalScore += Math.max(-100, Math.min(100, sentiment));
  }

  return relevantCount > 0 ? Math.round(totalScore / relevantCount) : 0;
}

/**
 * Calculate Momentum Score (-100 to +100)
 */
export function calculateMomentumScore(
  priceChange24h: number,
  volumeShare: number,
  totalVolume: number,
  whaleData?: { buyWall: number; sellWall: number; largeTrades: number }
): number {
  let score = 0;

  // 1. Price Velocity (Damped)
  score += Math.max(-40, Math.min(40, priceChange24h * 3));

  // 2. Volume Conviction
  if (volumeShare > 50) score += 30;
  else if (volumeShare > 25) score += 15;
  else if (volumeShare < 5) score -= 10;

  // 3. WHALE FACTOR (New)
  if (whaleData) {
    if (whaleData.buyWall > 0) score += 25; // Big players want to buy
    if (whaleData.sellWall > 0) score -= 25; // Big players want to sell
  }

  return Math.max(-100, Math.min(100, Math.round(score)));
}

/**
 * MASTER CALCULATION: Dynamic Confidence Blending
 */
export function calculateHybridProbability(
  marketProbability: number,
  eventType: EventType,
  vectors: VectorScores
): HybridResult {
  const weights = COMPONENT_WEIGHTS[eventType];

  // --- STEP 1: Calculate Pure Model Price (The "Alpha" View) ---
  // Start with Core AI
  let modelPrice = vectors.coreAiScore;

  // Apply Additive Impacts (Scaled by weights)
  // News Weight 0.25 means max impact is +/- 25%
  const newsImpact = (vectors.newsScore / 100) * (weights.news * 100);
  const momentumImpact = (vectors.momentumScore / 100) * (weights.momentum * 100);

  modelPrice += newsImpact + momentumImpact;
  
  // Clamp Model Price (1-99)
  modelPrice = Math.max(1, Math.min(99, modelPrice));


  // --- STEP 2: Calculate Confidence (Alignment Check) ---
  // Do the signals agree with each other?
  
  const marketDir = Math.sign(marketProbability - 50);
  const modelDir = Math.sign(modelPrice - 50);
  const newsDir = Math.sign(vectors.newsScore);
  const aiDir = Math.sign(vectors.coreAiScore - 50);

  let alignmentScore = 0;
  
  // 1. Does AI agree with News? (Most important)
  if (aiDir === newsDir && aiDir !== 0) alignmentScore += 2;
  
  // 2. Is the signal strong?
  if (Math.abs(vectors.newsScore) > 50) alignmentScore += 1;
  if (Math.abs(vectors.coreAiScore - 50) > 20) alignmentScore += 1;

  // 3. Contrarian Check: Are we betting AGAINST the market?
  const isContrarian = (modelDir !== marketDir);

  // Confidence Factor (0.0 to 1.0)
  // How much of our Model Price do we use?
  // Default base confidence: 50%
  let confidenceFactor = 0.50;

  if (alignmentScore >= 3) {
    confidenceFactor = 0.90; // High Conviction -> Ignore Market
  } else if (alignmentScore >= 2) {
    confidenceFactor = 0.70; // Good Setup -> Mostly Model
  } else if (isContrarian && alignmentScore < 2) {
    confidenceFactor = 0.30; // Contrarian but weak signals -> Stick to Market (Safety)
  }

  // --- SAFETY CHECK: Extreme Market Anchor ---
  // If market is >90% or <10% (almost certain), force AI to be humble unless signals are PERFECT.
  const isExtremeMarket = marketProbability > 90 || marketProbability < 10;
  if (isExtremeMarket && isContrarian) {
      // If we are trying to bet against a 95% odds, we better be damn sure.
      // If signals are not perfect (alignment < 3), drop confidence to near zero.
      if (alignmentScore < 3) {
          confidenceFactor = 0.10; // Trust the market almost entirely
      }
  }

  // --- STEP 3: Dynamic Blending ---
  // Final = (Model * Confidence) + (Market * (1 - Confidence))
  
  let finalProbability = (modelPrice * confidenceFactor) + (marketProbability * (1 - confidenceFactor));
  
  // Final Rounding
  finalProbability = Math.round(finalProbability);


  // --- Metrics & Reporting ---
  const divergence = finalProbability - marketProbability;
  
  let confidenceLevel: 'low' | 'medium' | 'high' = 'low';
  if (confidenceFactor >= 0.8) confidenceLevel = 'high';
  else if (confidenceFactor >= 0.5) confidenceLevel = 'medium';

  let signalStrength: 'Strong Buy' | 'Buy' | 'Neutral' | 'Sell' | 'Strong Sell' = 'Neutral';
  if (divergence > 15) signalStrength = 'Strong Buy';
  else if (divergence > 5) signalStrength = 'Buy';
  else if (divergence < -15) signalStrength = 'Strong Sell';
  else if (divergence < -5) signalStrength = 'Sell';

  return {
    finalProbability,
    marketDivergence: divergence,
    vectors: {
      news: { score: vectors.newsScore, weight: weights.news, contribution: newsImpact },
      momentum: { score: vectors.momentumScore, weight: weights.momentum, contribution: momentumImpact },
      core: { score: vectors.coreAiScore, weight: weights.core, contribution: (vectors.coreAiScore - 50) }
    },
    confidence: confidenceLevel,
    signalStrength
  };
}

/**
 * Generate Explanation
 */
export function generateHybridExplanation(
  optionName: string,
  marketProb: number,
  result: HybridResult
): string {
  const { finalProbability, signalStrength, confidence } = result;
  
  let text = `AI Fair Value: ${finalProbability}% (Market: ${marketProb}%). `;
  
  if (confidence === 'high') {
    text += `High conviction based on aligned signals. `;
  } else if (confidence === 'low') {
    text += `Low conviction - staying close to market consensus. `;
  }

  if (signalStrength.includes('Buy')) {
    text += `Opportunity detected (Undervalued). `;
  } else if (signalStrength.includes('Sell')) {
    text += `Caution advised (Overvalued). `;
  }

  return text;
}
