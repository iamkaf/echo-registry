import { NextResponse } from 'next/server';
import { formatApiTimestamp } from '@/lib/utils/dateUtils';

export async function POST() {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      {
        error: 'This endpoint is only available in development mode',
        timestamp: formatApiTimestamp(),
        success: false,
      },
      { status: 403 },
    );
  }

  try {
    // Import cache service to purge cache
    const { CacheService } = await import('@/lib/services/cacheService');
    const cacheService = new CacheService();

    console.log('Purging cache...');

    // Clean up expired cache entries
    const deletedEntries = await cacheService.cleanupExpired();

    console.log(`Cache cleanup completed. Deleted ${deletedEntries} expired entries.`);

    return NextResponse.json({
      message: 'Cache purged successfully',
      deleted_entries: deletedEntries,
      timestamp: formatApiTimestamp(),
      success: true,
    });
  } catch (error) {
    console.error('Error purging cache:', error);
    return NextResponse.json(
      {
        error: 'Failed to purge cache',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: formatApiTimestamp(),
        success: false,
      },
      { status: 500 },
    );
  }
}
