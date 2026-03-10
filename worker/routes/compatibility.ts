import { Hono } from "hono";
import { Env } from "../types";
import { DependencyService } from "../services/dependencyService";
import { ResponseCacheService } from "../services/responseCacheService";
import { validateProjectCompatibilityQuery, ValidationError } from "../schemas/apiSchemas";
import { DEFAULT_CACHE_TTL_COMPATIBILITY } from "../utils/constants";
import {
  createCompatibilityCacheKey,
  normalizeCompatibilityInputs,
} from "../utils/requestNormalization";
import { createErrorResponse, createCachedResponse } from "../utils/responseUtils";

const compatibility = new Hono<{ Bindings: Env }>();

compatibility.get("/", async (c) => {
  try {
    const projectsParam = c.req.query("projects");
    const versionsParam = c.req.query("versions");

    // Validate required parameters
    if (!projectsParam && !versionsParam) {
      const errorResponse = createErrorResponse(
        "Both projects and versions parameters are required",
      );
      return c.json(errorResponse, 400);
    }

    if (!projectsParam) {
      const errorResponse = createErrorResponse("Projects parameter is required");
      return c.json(errorResponse, 400);
    }

    if (!versionsParam) {
      const errorResponse = createErrorResponse("Versions parameter is required");
      return c.json(errorResponse, 400);
    }

    const { projects, versions } = validateProjectCompatibilityQuery(projectsParam, versionsParam);
    const { requestProjects, requestVersions, cacheProjects, cacheVersions } =
      normalizeCompatibilityInputs(projects, versions);
    const cacheService = new ResponseCacheService();
    const cacheKey = createCompatibilityCacheKey(cacheProjects, cacheVersions);
    const cached = await cacheService.match(cacheKey);
    if (cached) {
      return cached;
    }

    const dependencyService = new DependencyService();
    const projectCompatibility = await dependencyService.checkLoadersForProjects(
      requestProjects,
      requestVersions,
    );

    const ttl = parseInt(c.env.CACHE_TTL_COMPATIBILITY || `${DEFAULT_CACHE_TTL_COMPATIBILITY}`, 10);
    const payload = createCachedResponse(projectCompatibility);
    const response = c.json(payload);
    response.headers.set("Cache-Control", `public, max-age=${ttl}, stale-while-revalidate=${ttl}`);

    c.executionCtx.waitUntil(cacheService.put(cacheKey, response.clone(), ttl));
    return response;
  } catch (error) {
    console.error("Error checking project compatibility:", error);

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

export default compatibility;
