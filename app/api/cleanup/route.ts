import { NextRequest, NextResponse } from 'next/server';
import { CacheService } from '@/lib/services/cacheService';
import { formatApiTimestamp } from '@/lib/utils/dateUtils';

// This endpoint is for cron jobs to clean up expired cache entries
export async function POST(request: NextRequest) {
  try {
    // Verify this is a cron job request (optional, for security)
    const authHeader = request.headers.get('authorization');

    // For Vercel cron jobs, you might want to verify a secret token
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          timestamp: formatApiTimestamp(),
          success: false,
        },
        { status: 401 },
      );
    }

    const cacheService = new CacheService();
    await cacheService.cleanupExpired();

    const stats = await cacheService.getCacheStats();

    return NextResponse.json({
      message: 'Cache cleanup completed successfully',
      timestamp: formatApiTimestamp(),
      stats,
      success: true,
    });
  } catch (error) {
    console.error('Error during cache cleanup:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: formatApiTimestamp(),
        success: false,
      },
      { status: 500 },
    );
  }
}
