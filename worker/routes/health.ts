import { Hono } from "hono";
import { Env, HealthResponse } from "../types";
import { CacheService } from "../services/cacheService";
import { API_CONSTANTS } from "../utils/constants";
import { formatApiTimestamp } from "../utils/dateUtils";

const health = new Hono<{ Bindings: Env }>();

health.get("/", async (c) => {
  const healthResponse: HealthResponse = {
    status: "ok",
    timestamp: formatApiTimestamp(),
    cache_status: "connected",
    external_apis: {},
    success: true,
  };

  try {
    const cacheService = new CacheService(c.env.CACHE);

    // Check cache health
    const cacheHealth = await cacheService.checkHealth();
    healthResponse.cache_status = cacheHealth;

    // Check external API health with simple requests
    const checks = [
      { name: "forge", url: "https://files.minecraftforge.net" },
      { name: "neoforge", url: "https://maven.neoforged.net" },
      { name: "fabric", url: "https://meta.fabricmc.net" },
      { name: "minecraft", url: "https://piston-meta.mojang.com" },
      { name: "modrinth", url: "https://api.modrinth.com" },
    ];

    await Promise.allSettled(
      checks.map(async ({ name, url }) => {
        try {
          const response = await fetch(url, {
            method: "HEAD",
            signal: AbortSignal.timeout(API_CONSTANTS.HEALTH_CHECK_TIMEOUT),
          });
          healthResponse.external_apis[name] = response.ok ? "ok" : "error";
        } catch {
          healthResponse.external_apis[name] = "error";
        }
      }),
    );

    // Determine overall health status
    const errorCount = Object.values(healthResponse.external_apis).filter(
      (status) => status === "error",
    ).length;

    if (errorCount > API_CONSTANTS.ERROR_THRESHOLD_COUNT) {
      healthResponse.status = "degraded";
    }
    if (cacheHealth === "disconnected" || cacheHealth === "error") {
      healthResponse.status = "degraded";
    }

    return c.json(healthResponse);
  } catch {
    const errorResponse = { ...healthResponse, status: "down" as const, success: false };
    return c.json(errorResponse, 500);
  }
});

export default health;
