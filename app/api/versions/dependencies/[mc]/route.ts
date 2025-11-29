import { NextRequest, NextResponse } from 'next/server';
import { DependencyService } from '@/lib/services/dependencyService';
import {
  validateMinecraftVersion,
  validateProjectsQuery,
  ValidationError,
} from '@/lib/schemas/apiSchemas';
import { createErrorResponse, createCachedResponse } from '@/lib/utils/responseUtils';

export async function GET(request: NextRequest, { params }: { params: Promise<{ mc: string }> }) {
  const { mc: mcVersion } = await params;

  try {
    // Validate Minecraft version parameter
    const validatedMcVersion = validateMinecraftVersion(mcVersion);

    // Get custom projects from query parameters
    const { searchParams } = new URL(request.url);
    const projectsParam = searchParams.get('projects');
    const customProjects = validateProjectsQuery(projectsParam || undefined);

    const dependencyService = new DependencyService();
    const dependencies = await dependencyService.fetchAllDependencies(
      validatedMcVersion,
      customProjects,
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
