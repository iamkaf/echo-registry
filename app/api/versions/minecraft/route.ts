import { NextResponse } from 'next/server';
import { MinecraftService } from '@/lib/services/minecraftService';
import { createErrorResponse, createCachedResponse } from '@/lib/utils/responseUtils';

export async function GET() {
  // const startTime = Date.now(); // Commented out since logging is not implemented

  try {
    const minecraftService = new MinecraftService();
    const versions = await minecraftService.fetchMinecraftVersions();

    const response = createCachedResponse({ versions });

    // Log API usage (optional - commented out since logging is not implemented)
    // const responseTime = Date.now() - startTime;
    // const userAgent = request.headers.get('user-agent');
    // const forwarded = request.headers.get('x-forwarded-for');
    // const ip = forwarded ? forwarded.split(',')[0] : 'unknown';

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching Minecraft versions:', error);

    const errorResponse = createErrorResponse(
      error instanceof Error ? error.message : 'Unknown error occurred',
    );

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
