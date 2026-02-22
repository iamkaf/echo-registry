import { Hono } from "hono";
import { Env } from "../types";
import { DependencyService } from "../services/dependencyService";
import {
  validateMinecraftVersion,
  validateProjectsQuery,
  ValidationError,
} from "../schemas/apiSchemas";
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
    const dependencyService = new DependencyService(c.env.CACHE);

    if (customProjects.length > 0) {
      const invalidProjects = await dependencyService.findInvalidModrinthProjects(
        customProjects,
        validatedMcVersion,
      );
      if (invalidProjects.length > 0) {
        const errorResponse = createErrorResponse(
          `Invalid projects parameter. These are not valid Modrinth projects: ${invalidProjects.join(", ")}. The ?projects query only accepts Modrinth project slugs (for example: fabric-api, modmenu, sodium).`,
        );
        return c.json(errorResponse, 400);
      }
    }

    // Always include fabric-api in the projects list
    const allProjects = customProjects.includes("fabric-api")
      ? customProjects
      : [...customProjects, "fabric-api"];

    const deps = await dependencyService.fetchAllDependencies(validatedMcVersion, allProjects);

    const ttl = parseInt(c.env.CACHE_TTL_DEPENDENCIES || "300");
    const response = createCachedResponse({
      mc_version: validatedMcVersion,
      dependencies: deps,
    });
    c.header("Cache-Control", `public, max-age=${ttl}, stale-while-revalidate=${ttl * 2}`);
    return c.json(response);
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
