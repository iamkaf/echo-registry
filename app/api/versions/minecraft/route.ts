import { NextResponse } from 'next/server';
import { ApiResponse, MinecraftVersion } from '@/types/dependency';
import { MinecraftService } from '@/lib/services/minecraftService';

export async function GET() {
  // const startTime = Date.now(); // Commented out since logging is not implemented

  try {
    const minecraftService = new MinecraftService();
    const versions = await minecraftService.fetchMinecraftVersions();

    const response: ApiResponse<{ versions: MinecraftVersion[] }> = {
      data: { versions },
      timestamp: new Date().toISOString(),
      cached_at: new Date().toISOString(),
    };

    // Log API usage (optional - commented out since logging is not implemented)
    // const responseTime = Date.now() - startTime;
    // const userAgent = request.headers.get('user-agent');
    // const forwarded = request.headers.get('x-forwarded-for');
    // const ip = forwarded ? forwarded.split(',')[0] : 'unknown';

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching Minecraft versions:', error);

    const errorResponse: ApiResponse<null> = {
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
