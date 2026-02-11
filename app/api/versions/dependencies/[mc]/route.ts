import { NextRequest, NextResponse } from 'next/server';
import { DependencyService } from '@/lib/services/dependencyService';
import {
  validateMinecraftVersion,
  validateProjectsQuery,
  ValidationError,
} from '@/lib/schemas/apiSchemas';
import { createErrorResponse, createCachedResponse } from '@/lib/utils/responseUtils';

export async function GET(request: NextRequest, { params }: { params: Promise<{ mc: string }> }) {
  // Declare outside try block for error logging
  let mcVersion: string = 'unknown';
  let url: URL = new URL(request.url);

  try {
    // Start promises early, await late (eliminate waterfall)
    const mcVersionPromise = params.then(p => p.mc);
    const urlPromise = Promise.resolve(new URL(request.url));

    // Await in parallel where possible
    [mcVersion, url] = await Promise.all([mcVersionPromise, urlPromise]);

    // Validate Minecraft version parameter
    const validatedMcVersion = validateMinecraftVersion(mcVersion);

    // Get custom projects from query parameters
    const projectsParam = url.searchParams.get('projects');
    const customProjects = validateProjectsQuery(projectsParam || undefined);
    const dependencyService = new DependencyService();

    if (customProjects.length > 0) {
      const invalidProjects = await dependencyService.findInvalidModrinthProjects(
        customProjects,
        validatedMcVersion,
      );
      if (invalidProjects.length > 0) {
        const errorResponse = createErrorResponse(
          `Invalid projects parameter. These are not valid Modrinth projects: ${invalidProjects.join(', ')}. The ?projects query only accepts Modrinth project slugs (for example: fabric-api, modmenu, sodium).`,
        );
        return NextResponse.json(errorResponse, { status: 400 });
      }
    }

    // Always include fabric-api in the projects list
    const allProjects = customProjects.includes('fabric-api')
      ? customProjects
      : [...customProjects, 'fabric-api'];

    const dependencies = await dependencyService.fetchAllDependencies(
      validatedMcVersion,
      allProjects,
    );

    const response = createCachedResponse({
      mc_version: validatedMcVersion,
      dependencies,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error(`Error fetching dependencies for MC ${mcVersion}:`, error);

    // Enhanced error handling for validation errors
    if (error instanceof ValidationError) {
      const errorResponse = createErrorResponse(`Validation error: ${error.message}`);
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const errorResponse = createErrorResponse(
      error instanceof Error ? error.message : 'Unknown error occurred',
    );

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
