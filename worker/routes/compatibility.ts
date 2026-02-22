import { Hono } from "hono";
import { Env } from "../types";
import { DependencyService } from "../services/dependencyService";
import { validateProjectCompatibilityQuery, ValidationError } from "../schemas/apiSchemas";
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

    const dependencyService = new DependencyService(c.env.CACHE);
    const projectCompatibility = await dependencyService.checkLoadersForProjects(
      projects,
      versions,
    );

    const response = createCachedResponse(projectCompatibility);
    return c.json(response);
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
