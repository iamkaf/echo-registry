import { Hono } from "hono";
import { Env } from "../types";
import { MinecraftService } from "../services/minecraftService";
import { createErrorResponse, createCachedResponse } from "../utils/responseUtils";

const versions = new Hono<{ Bindings: Env }>();

versions.get("/minecraft", async (c) => {
  try {
    const minecraftService = new MinecraftService(c.env.CACHE);
    const versionList = await minecraftService.fetchMinecraftVersions();

    const ttl = parseInt(c.env.CACHE_TTL_MINECRAFT || "3600");
    const response = createCachedResponse({ versions: versionList });
    c.header("Cache-Control", `public, max-age=${ttl}, stale-while-revalidate=${ttl * 2}`);
    return c.json(response);
  } catch (error) {
    console.error("Error fetching Minecraft versions:", error);

    const errorResponse = createErrorResponse(
      error instanceof Error ? error.message : "Unknown error occurred",
    );
    return c.json(errorResponse, 500);
  }
});

export default versions;
