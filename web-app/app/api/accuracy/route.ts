import { NextRequest, NextResponse } from 'next/server';
import { 
  getAccuracyStats, 
  getRecentPredictions, 
  getCalibrationAnalysis 
} from '@/lib/accuracyTracker';

/**
 * GET /api/accuracy
 * Returns prediction accuracy statistics
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'stats';
    const limit = parseInt(searchParams.get('limit') || '20');

    switch (type) {
      case 'stats':
        const stats = await getAccuracyStats();
        return NextResponse.json({
          success: true,
          data: stats,
          timestamp: new Date().toISOString()
        });

      case 'recent':
        const predictions = await getRecentPredictions(limit);
        return NextResponse.json({
          success: true,
          data: predictions,
          count: predictions.length,
          timestamp: new Date().toISOString()
        });

      case 'calibration':
        const calibration = await getCalibrationAnalysis();
        return NextResponse.json({
          success: true,
          data: calibration,
          timestamp: new Date().toISOString()
        });

      case 'full':
        const [fullStats, recentPreds, calibrationData] = await Promise.all([
          getAccuracyStats(),
          getRecentPredictions(10),
          getCalibrationAnalysis()
        ]);
        return NextResponse.json({
          success: true,
          data: {
            stats: fullStats,
            recentPredictions: recentPreds,
            calibration: calibrationData
          },
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid type parameter. Use: stats, recent, calibration, or full'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Accuracy API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch accuracy data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
