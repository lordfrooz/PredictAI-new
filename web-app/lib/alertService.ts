/**
 * Smart Alert Service
 * 
 * Detects trading opportunities based on:
 * 1. Price Gap - AI estimate vs Market price
 * 2. Confidence Level - How sure is the AI?
 * 3. Signal Agreement - Do News, Social, Momentum agree?
 * 4. Market Efficiency - Low volume = bigger opportunity
 */

export type AlertLevel = 'none' | 'watch' | 'opportunity' | 'hot';

export interface SmartAlert {
  level: AlertLevel;
  score: number;           // 0-100 opportunity score
  message: string;
  signals: {
    priceGap: number;      // AI - Market difference
    direction: 'buy' | 'sell' | 'hold';
    confidence: 'low' | 'medium' | 'high';
    signalAgreement: number; // -3 to +3 (how many signals agree)
    marketEfficiency: 'low' | 'medium' | 'high';
  };
  reasoning: string[];
}

interface AlertInput {
  optionName: string;
  marketProbability: number;
  aiProbability: number;
  confidence: 'low' | 'medium' | 'high';
  vectorScores: {
    news: number;      // -100 to +100
    social: number;    // -100 to +100
    momentum: number;  // -100 to +100
  };
  totalVolume: number;
  timeToResolutionHours: number;
}

/**
 * Calculate Smart Alert for an option
 */
export function calculateAlert(input: AlertInput): SmartAlert {
  const {
    optionName,
    marketProbability,
    aiProbability,
    confidence,
    vectorScores,
    totalVolume,
    timeToResolutionHours
  } = input;

  const reasoning: string[] = [];
  
  // 1. Price Gap Analysis (0-40 points)
  const priceGap = aiProbability - marketProbability;
  const absGap = Math.abs(priceGap);
  let priceGapScore = 0;
  
  if (absGap >= 15) {
    priceGapScore = 40;
    reasoning.push(`Large price gap: AI sees ${absGap}pt difference`);
  } else if (absGap >= 10) {
    priceGapScore = 30;
    reasoning.push(`Significant gap: ${absGap}pt difference from market`);
  } else if (absGap >= 5) {
    priceGapScore = 20;
    reasoning.push(`Moderate gap: ${absGap}pt difference`);
  } else if (absGap >= 3) {
    priceGapScore = 10;
  }

  // 2. Confidence Multiplier (0.5x to 1.5x)
  let confidenceMultiplier = 1.0;
  if (confidence === 'high') {
    confidenceMultiplier = 1.5;
    reasoning.push('High confidence in analysis');
  } else if (confidence === 'low') {
    confidenceMultiplier = 0.5;
  }

  // 3. Signal Agreement (-3 to +3, then 0-25 points)
  const newsDirection = Math.sign(vectorScores.news);
  const socialDirection = Math.sign(vectorScores.social);
  const momentumDirection = Math.sign(vectorScores.momentum);
  const aiDirection = Math.sign(priceGap);
  
  // Count how many signals agree with AI direction
  let signalAgreement = 0;
  if (newsDirection === aiDirection && newsDirection !== 0) signalAgreement++;
  if (socialDirection === aiDirection && socialDirection !== 0) signalAgreement++;
  if (momentumDirection === aiDirection && momentumDirection !== 0) signalAgreement++;
  
  let signalScore = 0;
  if (signalAgreement === 3) {
    signalScore = 25;
    reasoning.push('All signals align: News, Social, and Momentum agree');
  } else if (signalAgreement === 2) {
    signalScore = 15;
    reasoning.push('Strong alignment: 2 of 3 signals agree');
  } else if (signalAgreement === 1) {
    signalScore = 5;
  }

  // 4. Market Efficiency (low volume = more opportunity)
  let efficiencyScore = 0;
  let marketEfficiency: 'low' | 'medium' | 'high' = 'medium';
  
  if (totalVolume < 500000) {
    efficiencyScore = 10;
    marketEfficiency = 'low';
    reasoning.push('Low volume market - potential inefficiency');
  } else if (totalVolume < 2000000) {
    efficiencyScore = 5;
    marketEfficiency = 'medium';
  } else {
    marketEfficiency = 'high';
    // High volume = efficient, reduce score slightly
    efficiencyScore = -5;
  }

  // 5. Time Factor (imminent = more urgent)
  let timeBonus = 0;
  if (timeToResolutionHours <= 24 && absGap >= 5) {
    timeBonus = 5;
    reasoning.push('Resolution imminent - act fast if taking position');
  } else if (timeToResolutionHours <= 72 && absGap >= 5) {
    timeBonus = 3;
  }

  // Calculate final score
  const rawScore = (priceGapScore + signalScore + efficiencyScore + timeBonus) * confidenceMultiplier;
  const finalScore = Math.min(100, Math.max(0, Math.round(rawScore)));

  // Determine alert level
  let level: AlertLevel = 'none';
  let message = '';
  
  if (finalScore >= 70) {
    level = 'hot';
    message = `?? HOT: ${optionName} looks ${priceGap > 0 ? 'underpriced' : 'overpriced'} by ${absGap}pts`;
  } else if (finalScore >= 50) {
    level = 'opportunity';
    message = `? Opportunity: ${optionName} may be ${priceGap > 0 ? 'undervalued' : 'overvalued'}`;
  } else if (finalScore >= 30) {
    level = 'watch';
    message = `?? Watch: ${optionName} has potential edge`;
  } else {
    message = `No significant opportunity detected`;
  }

  // Determine direction
  let direction: 'buy' | 'sell' | 'hold' = 'hold';
  if (priceGap > 3) {
    direction = 'buy';
  } else if (priceGap < -3) {
    direction = 'sell';
  }

  return {
    level,
    score: finalScore,
    message,
    signals: {
      priceGap,
      direction,
      confidence,
      signalAgreement,
      marketEfficiency
    },
    reasoning
  };
}

/**
 * Get top opportunities from a list of analyses
 */
export function getTopOpportunities(
  analyses: Array<{
    option: string;
    marketProbability: number;
    aiScore: number;
    confidence?: 'low' | 'medium' | 'high';
    vectorBreakdown?: {
      news: { score: number };
      social: { score: number };
      momentum: { score: number };
    };
  }>,
  totalVolume: number,
  timeToResolutionHours: number
): Array<{ option: string; alert: SmartAlert }> {
  const opportunities = analyses.map(analysis => {
    const alert = calculateAlert({
      optionName: analysis.option,
      marketProbability: analysis.marketProbability,
      aiProbability: analysis.aiScore,
      confidence: analysis.confidence || 'medium',
      vectorScores: {
        news: analysis.vectorBreakdown?.news.score || 0,
        social: analysis.vectorBreakdown?.social.score || 0,
        momentum: analysis.vectorBreakdown?.momentum.score || 0
      },
      totalVolume,
      timeToResolutionHours
    });

    return { option: analysis.option, alert };
  });

  // Sort by alert score (highest first)
  return opportunities
    .filter(o => o.alert.level !== 'none')
    .sort((a, b) => b.alert.score - a.alert.score);
}

/**
 * Generate summary of all alerts
 */
export function generateAlertSummary(
  opportunities: Array<{ option: string; alert: SmartAlert }>
): string {
  const hot = opportunities.filter(o => o.alert.level === 'hot');
  const opps = opportunities.filter(o => o.alert.level === 'opportunity');
  const watch = opportunities.filter(o => o.alert.level === 'watch');

  const parts: string[] = [];

  if (hot.length > 0) {
    parts.push(`?? ${hot.length} HOT opportunity${hot.length > 1 ? 's' : ''}`);
  }
  if (opps.length > 0) {
    parts.push(`? ${opps.length} potential edge${opps.length > 1 ? 's' : ''}`);
  }
  if (watch.length > 0) {
    parts.push(`?? ${watch.length} to watch`);
  }

  if (parts.length === 0) {
    return 'No significant opportunities detected in this market.';
  }

  return parts.join(' | ');
}
