import { Hono } from "hono";
import { Env } from "../types";
import { DependencyService } from "../services/dependencyService";
import { ResponseCacheService } from "../services/responseCacheService";
import {
  validateMinecraftVersion,
  validateProjectsQuery,
  ValidationError,
} from "../schemas/apiSchemas";
import { DEFAULT_CACHE_TTL_DEPENDENCIES } from "../utils/constants";
import {
  createDependencyCacheKey,
  normalizeDependencyProjects,
} from "../utils/requestNormalization";
import { createErrorResponse, createCachedResponse } from "../utils/responseUtils";

const dependencies = new Hono<{ Bindings: Env }>();

dependencies.get("/:mc", async (c) => {
  let mcVersion: string = "unknown";

  try {
    mcVersion = c.req.param("mc");

    // Validate Minecraft version parameter
    const validatedMcVersion = validateMinecraftVersion(mcVersion);

    // Get custom projects from query parameters
    const projectsParam = c.req.query("projects");
    const customProjects = validateProjectsQuery(projectsParam || undefined);
    const { requestProjects, cacheProjects } = normalizeDependencyProjects(customProjects);
    const dependencyService = new DependencyService();
    const cacheService = new ResponseCacheService();
    const cacheKey = createDependencyCacheKey(validatedMcVersion, cacheProjects);
    const shouldBypassCache = c.req.header("X-Echo-Refresh") === "1";

    if (!shouldBypassCache) {
      const cached = await cacheService.match(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const deps = await dependencyService.fetchAllDependencies(validatedMcVersion, requestProjects);

    const ttl = parseInt(c.env.CACHE_TTL_DEPENDENCIES || `${DEFAULT_CACHE_TTL_DEPENDENCIES}`, 10);
    const payload = createCachedResponse({
      mc_version: validatedMcVersion,
      dependencies: deps,
    });
    const response = c.json(payload);
    response.headers.set("Cache-Control", `public, max-age=${ttl}, stale-while-revalidate=${ttl}`);

    c.executionCtx.waitUntil(cacheService.put(cacheKey, response.clone(), ttl));
    return response;
  } catch (error) {
    console.error(`Error fetching dependencies for MC ${mcVersion}:`, error);

    if (error instanceof ValidationError) {
      const errorResponse = createErrorResponse(`Validation error: ${error.message}`);
      return c.json(errorResponse, 400);
    }

    const errorResponse = createErrorResponse(
      error instanceof Error ? error.message : "Unknown error occurred",
    );
    return c.json(errorResponse, 500);
  }
});

export default dependencies;
