import { Hono } from "hono";
import { Env } from "../types";
import { MinecraftService } from "../services/minecraftService";
import { ResponseCacheService } from "../services/responseCacheService";
import { DEFAULT_CACHE_TTL_MINECRAFT } from "../utils/constants";
import { createErrorResponse, createCachedResponse } from "../utils/responseUtils";

const versions = new Hono<{ Bindings: Env }>();

versions.get("/minecraft", async (c) => {
  try {
    const cacheService = new ResponseCacheService();
    const cacheKey = "versions/minecraft";
    const cached = await cacheService.match(cacheKey);
    if (cached) {
      return cached;
    }

    const minecraftService = new MinecraftService();
    const versionList = await minecraftService.fetchMinecraftVersions();

    const ttl = parseInt(c.env.CACHE_TTL_MINECRAFT || `${DEFAULT_CACHE_TTL_MINECRAFT}`, 10);
    const payload = createCachedResponse({ versions: versionList });
    const response = c.json(payload);
    response.headers.set("Cache-Control", `public, max-age=${ttl}, stale-while-revalidate=${ttl}`);

    c.executionCtx.waitUntil(cacheService.put(cacheKey, response.clone(), ttl));
    return response;
  } catch (error) {
    console.error("Error fetching Minecraft versions:", error);

    const errorResponse = createErrorResponse(
      error instanceof Error ? error.message : "Unknown error occurred",
    );
    return c.json(errorResponse, 500);
  }
});

export default versions;
