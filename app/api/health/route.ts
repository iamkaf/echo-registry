import { NextResponse } from 'next/server';
import { HealthResponse } from '@/types/dependency';
import { CacheService } from '@/lib/services/cacheService';

export async function GET() {
  // const startTime = Date.now(); // Commented out since logging is not implemented
  const healthResponse: HealthResponse = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    cache_status: 'connected',
    external_apis: {},
  };

  try {
    const cacheService = new CacheService();

    // Check cache health
    const cacheHealth = await cacheService.checkHealth();
    healthResponse.cache_status = cacheHealth;

    // Check external API health with simple requests
    const checks = [
      { name: 'forge', url: 'https://files.minecraftforge.net' },
      { name: 'neoforge', url: 'https://maven.neoforged.net' },
      { name: 'fabric', url: 'https://meta.fabricmc.net' },
      { name: 'minecraft', url: 'https://piston-meta.mojang.com' },
      { name: 'modrinth', url: 'https://api.modrinth.com' },
    ];

    await Promise.allSettled(
      checks.map(async ({ name, url }) => {
        try {
          const response = await fetch(url, {
            method: 'HEAD',
            signal: AbortSignal.timeout(5000), // 5 second timeout
          });
          healthResponse.external_apis[name] = response.ok ? 'ok' : 'error';
        } catch {
          healthResponse.external_apis[name] = 'error';
        }
      }),
    );

    // Determine overall health status
    const errorCount = Object.values(healthResponse.external_apis).filter((status) => status === 'error').length;

    if (errorCount > 3) {
      healthResponse.status = 'degraded';
    }
    if (cacheHealth === 'disconnected' || cacheHealth === 'error') {
      healthResponse.status = 'degraded';
    }

    // Log API usage (commented out since logging is not implemented)
    // const responseTime = Date.now() - startTime;
    // const userAgent = request.headers.get('user-agent');
    // const forwarded = request.headers.get('x-forwarded-for');
    // const ip = forwarded ? forwarded.split(',')[0] : 'unknown';

    return NextResponse.json(healthResponse);
  } catch {
    const errorResponse = { ...healthResponse, status: 'down' };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
