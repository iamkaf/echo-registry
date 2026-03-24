import { RESPONSE_CACHE_VERSION } from "../utils/constants";

const CACHE_BASE_URL = "https://echo-registry-cache.invalid";

function getDefaultCache(): Cache {
  const cache = (globalThis as typeof globalThis & { caches?: CacheStorage & { default?: Cache } })
    .caches?.default;

  if (!cache) {
    throw new Error("Cloudflare response cache is unavailable");
  }

  return cache;
}

export class ResponseCacheService {
  private cache: Cache;

  constructor(cache: Cache = getDefaultCache()) {
    this.cache = cache;
  }

  async match(key: string): Promise<Response | null> {
    return (await this.cache.match(this.createRequest(key))) ?? null;
  }

  async put(key: string, response: Response, ttlSeconds: number): Promise<void> {
    if (!response.ok) {
      return;
    }

    const cacheableResponse = this.toCacheableResponse(response, ttlSeconds);
    await this.cache.put(this.createRequest(key), cacheableResponse);
  }

  private createRequest(key: string): Request {
    return new Request(`${CACHE_BASE_URL}/${RESPONSE_CACHE_VERSION}/${key}`, {
      method: "GET",
    });
  }

  private toCacheableResponse(response: Response, ttlSeconds: number): Response {
    const headers = new Headers(response.headers);
    headers.set(
      "Cache-Control",
      `public, max-age=${ttlSeconds}, stale-while-revalidate=${ttlSeconds}`,
    );

    return new Response(response.clone().body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }
}
