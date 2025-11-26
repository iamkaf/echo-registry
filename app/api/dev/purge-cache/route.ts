import { NextResponse } from 'next/server';

export async function POST() {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development mode' },
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
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error purging cache:', error);
    return NextResponse.json(
      {
        error: 'Failed to purge cache',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
