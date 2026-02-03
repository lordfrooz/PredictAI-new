/**
 * Prediction Accuracy Tracking System
 * 
 * Tracks predictions and their outcomes to:
 * 1. Calibrate AI confidence levels
 * 2. Measure system accuracy over time
 * 3. Identify which market types we're best at
 * 4. Build user trust with transparent track record
 */

import { MongoClient, Db, Collection } from 'mongodb';

// ============================================================================
// TYPES
// ============================================================================

export interface PredictionRecord {
  _id?: string;
  
  // Market identification
  marketId: string;
  marketTitle: string;
  optionName: string;
  eventType: 'sports' | 'politics' | 'crypto' | 'pop' | 'other';
  
  // Prediction details
  predictionDate: Date;
  marketProbability: number;      // What market said
  aiProbability: number;          // What we said
  confidence: 'low' | 'medium' | 'high';
  action: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
  opportunityScore: number;
  
  // Resolution
  resolved: boolean;
  resolutionDate?: Date;
  actualOutcome?: 'yes' | 'no';   // Did this option win?
  
  // Performance metrics (calculated after resolution)
  wasCorrect?: boolean;           // Did we beat the market?
  brierScore?: number;            // Calibration metric
  profitLoss?: number;            // Theoretical P/L if bet at AI price
}

export interface AccuracyStats {
  totalPredictions: number;
  resolvedPredictions: number;
  
  // Overall accuracy
  correctPredictions: number;
  overallAccuracy: number;        // % correct
  
  // By confidence level
  accuracyByConfidence: {
    low: { total: number; correct: number; accuracy: number };
    medium: { total: number; correct: number; accuracy: number };
    high: { total: number; correct: number; accuracy: number };
  };
  
  // By event type
  accuracyByEventType: Record<string, { total: number; correct: number; accuracy: number }>;
  
  // Calibration
  avgBrierScore: number;          // Lower is better (0 = perfect)
  
  // Profitability
  theoreticalROI: number;         // % return if followed all signals
}

// ============================================================================
// MONGODB CONNECTION (lazy initialization)
// ============================================================================

const MONGODB_URI = process.env.MONGODB_URI || '';
let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

async function getDatabase(): Promise<Db> {
  if (cachedDb) return cachedDb;
  
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI not configured');
  }
  
  if (!cachedClient) {
    cachedClient = new MongoClient(MONGODB_URI);
    await cachedClient.connect();
  }
  
  cachedDb = cachedClient.db('predictly');
  return cachedDb;
}

async function getPredictionsCollection(): Promise<Collection<PredictionRecord>> {
  const db = await getDatabase();
  return db.collection<PredictionRecord>('predictions');
}

// ============================================================================
// RECORD PREDICTIONS
// ============================================================================

/**
 * Record a new prediction for tracking
 */
export async function recordPrediction(
  marketId: string,
  marketTitle: string,
  optionName: string,
  eventType: 'sports' | 'politics' | 'crypto' | 'pop' | 'other',
  marketProbability: number,
  aiProbability: number,
  confidence: 'low' | 'medium' | 'high',
  action: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell',
  opportunityScore: number
): Promise<void> {
  try {
    const collection = await getPredictionsCollection();
    
    // Check if we already have a prediction for this market/option
    const existing = await collection.findOne({ marketId, optionName });
    
    if (existing) {
      // Update existing prediction (in case market moved)
      await collection.updateOne(
        { marketId, optionName },
        {
          $set: {
            marketProbability,
            aiProbability,
            confidence,
            action,
            opportunityScore,
            predictionDate: new Date()
          }
        }
      );
    } else {
      // Insert new prediction
      await collection.insertOne({
        marketId,
        marketTitle,
        optionName,
        eventType,
        predictionDate: new Date(),
        marketProbability,
        aiProbability,
        confidence,
        action,
        opportunityScore,
        resolved: false
      });
    }
    
    console.log(`Recorded prediction: ${optionName} @ ${aiProbability}% (market: ${marketProbability}%)`);
  } catch (error) {
    console.error('Error recording prediction:', error);
    // Don't throw - this is a tracking feature, shouldn't break main flow
  }
}

// ============================================================================
// RESOLVE PREDICTIONS
// ============================================================================

/**
 * Resolve a market and calculate performance metrics
 */
export async function resolvePrediction(
  marketId: string,
  winningOption: string
): Promise<void> {
  try {
    const collection = await getPredictionsCollection();
    
    // Get all predictions for this market
    const predictions = await collection.find({ marketId }).toArray();
    
    for (const pred of predictions) {
      const actualOutcome: 'yes' | 'no' = pred.optionName === winningOption ? 'yes' : 'no';
      const actualProb = actualOutcome === 'yes' ? 100 : 0;
      
      // Calculate Brier Score (lower is better)
      // Brier = (forecast - outcome)^2
      const forecast = pred.aiProbability / 100;
      const outcome = actualOutcome === 'yes' ? 1 : 0;
      const brierScore = Math.pow(forecast - outcome, 2);
      
      // Was our prediction better than market?
      const marketBrier = Math.pow((pred.marketProbability / 100) - outcome, 2);
      const wasCorrect = brierScore < marketBrier;
      
      // Calculate theoretical P/L
      // If we said "buy" (underpriced) and it won, we profit
      // If we said "sell" (overpriced) and it lost, we profit
      let profitLoss = 0;
      if (actualOutcome === 'yes') {
        // Option won
        if (pred.aiProbability > pred.marketProbability) {
          // We said underpriced, we were right!
          profitLoss = (100 - pred.marketProbability) / pred.marketProbability * 100;
        } else {
          // We said overpriced, we were wrong
          profitLoss = -100;
        }
      } else {
        // Option lost
        if (pred.aiProbability < pred.marketProbability) {
          // We said overpriced, we were right!
          profitLoss = 100;
        } else {
          // We said underpriced, we were wrong
          profitLoss = -100;
        }
      }
      
      await collection.updateOne(
        { _id: pred._id },
        {
          $set: {
            resolved: true,
            resolutionDate: new Date(),
            actualOutcome,
            wasCorrect,
            brierScore,
            profitLoss
          }
        }
      );
    }
    
    console.log(`Resolved market ${marketId}: Winner = ${winningOption}`);
  } catch (error) {
    console.error('Error resolving prediction:', error);
  }
}

// ============================================================================
// ACCURACY STATISTICS
// ============================================================================

/**
 * Calculate overall accuracy statistics
 */
export async function getAccuracyStats(): Promise<AccuracyStats> {
  try {
    const collection = await getPredictionsCollection();
    
    const allPredictions = await collection.find({}).toArray();
    const resolved = allPredictions.filter(p => p.resolved);
    
    // Overall accuracy
    const correct = resolved.filter(p => p.wasCorrect).length;
    const overallAccuracy = resolved.length > 0 ? (correct / resolved.length) * 100 : 0;
    
    // By confidence level
    const byConfidence = {
      low: resolved.filter(p => p.confidence === 'low'),
      medium: resolved.filter(p => p.confidence === 'medium'),
      high: resolved.filter(p => p.confidence === 'high')
    };
    
    const accuracyByConfidence = {
      low: {
        total: byConfidence.low.length,
        correct: byConfidence.low.filter(p => p.wasCorrect).length,
        accuracy: byConfidence.low.length > 0 
          ? (byConfidence.low.filter(p => p.wasCorrect).length / byConfidence.low.length) * 100 
          : 0
      },
      medium: {
        total: byConfidence.medium.length,
        correct: byConfidence.medium.filter(p => p.wasCorrect).length,
        accuracy: byConfidence.medium.length > 0 
          ? (byConfidence.medium.filter(p => p.wasCorrect).length / byConfidence.medium.length) * 100 
          : 0
      },
      high: {
        total: byConfidence.high.length,
        correct: byConfidence.high.filter(p => p.wasCorrect).length,
        accuracy: byConfidence.high.length > 0 
          ? (byConfidence.high.filter(p => p.wasCorrect).length / byConfidence.high.length) * 100 
          : 0
      }
    };
    
    // By event type
    const eventTypes = ['sports', 'politics', 'crypto', 'pop', 'other'];
    const accuracyByEventType: Record<string, { total: number; correct: number; accuracy: number }> = {};
    
    for (const type of eventTypes) {
      const typeResolved = resolved.filter(p => p.eventType === type);
      const typeCorrect = typeResolved.filter(p => p.wasCorrect).length;
      accuracyByEventType[type] = {
        total: typeResolved.length,
        correct: typeCorrect,
        accuracy: typeResolved.length > 0 ? (typeCorrect / typeResolved.length) * 100 : 0
      };
    }
    
    // Average Brier Score
    const brierScores = resolved.filter(p => p.brierScore !== undefined).map(p => p.brierScore!);
    const avgBrierScore = brierScores.length > 0 
      ? brierScores.reduce((a, b) => a + b, 0) / brierScores.length 
      : 0;
    
    // Theoretical ROI
    const profitLosses = resolved.filter(p => p.profitLoss !== undefined).map(p => p.profitLoss!);
    const theoreticalROI = profitLosses.length > 0 
      ? profitLosses.reduce((a, b) => a + b, 0) / profitLosses.length 
      : 0;
    
    return {
      totalPredictions: allPredictions.length,
      resolvedPredictions: resolved.length,
      correctPredictions: correct,
      overallAccuracy,
      accuracyByConfidence,
      accuracyByEventType,
      avgBrierScore,
      theoreticalROI
    };
  } catch (error) {
    console.error('Error getting accuracy stats:', error);
    return {
      totalPredictions: 0,
      resolvedPredictions: 0,
      correctPredictions: 0,
      overallAccuracy: 0,
      accuracyByConfidence: {
        low: { total: 0, correct: 0, accuracy: 0 },
        medium: { total: 0, correct: 0, accuracy: 0 },
        high: { total: 0, correct: 0, accuracy: 0 }
      },
      accuracyByEventType: {},
      avgBrierScore: 0,
      theoreticalROI: 0
    };
  }
}

// ============================================================================
// RECENT PREDICTIONS
// ============================================================================

/**
 * Get recent predictions with their current status
 */
export async function getRecentPredictions(limit: number = 20): Promise<PredictionRecord[]> {
  try {
    const collection = await getPredictionsCollection();
    
    return await collection
      .find({})
      .sort({ predictionDate: -1 })
      .limit(limit)
      .toArray();
  } catch (error) {
    console.error('Error getting recent predictions:', error);
    return [];
  }
}

/**
 * Get predictions for a specific market
 */
export async function getPredictionsForMarket(marketId: string): Promise<PredictionRecord[]> {
  try {
    const collection = await getPredictionsCollection();
    return await collection.find({ marketId }).toArray();
  } catch (error) {
    console.error('Error getting predictions for market:', error);
    return [];
  }
}

// ============================================================================
// CONFIDENCE CALIBRATION
// ============================================================================

/**
 * Check if our confidence levels are well-calibrated
 * A well-calibrated system should:
 * - High confidence predictions should be correct more often
 * - The accuracy should roughly match the stated confidence
 */
export async function getCalibrationAnalysis(): Promise<{
  isWellCalibrated: boolean;
  highConfidenceAccuracy: number;
  mediumConfidenceAccuracy: number;
  lowConfidenceAccuracy: number;
  recommendation: string;
}> {
  const stats = await getAccuracyStats();
  
  const highAcc = stats.accuracyByConfidence.high.accuracy;
  const medAcc = stats.accuracyByConfidence.medium.accuracy;
  const lowAcc = stats.accuracyByConfidence.low.accuracy;
  
  // Good calibration: high > medium > low
  const isWellCalibrated = highAcc >= medAcc && medAcc >= lowAcc;
  
  let recommendation = '';
  if (!isWellCalibrated) {
    if (highAcc < medAcc) {
      recommendation = 'System is overconfident - reduce confidence thresholds';
    } else if (lowAcc > medAcc) {
      recommendation = 'System is underconfident at low levels - trust more';
    }
  } else {
    recommendation = 'Calibration looks good! Keep monitoring.';
  }
  
  return {
    isWellCalibrated,
    highConfidenceAccuracy: highAcc,
    mediumConfidenceAccuracy: medAcc,
    lowConfidenceAccuracy: lowAcc,
    recommendation
  };
}
