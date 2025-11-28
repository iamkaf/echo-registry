import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse, DependencyVersion } from '@/types/dependency';
import { DependencyService } from '@/lib/services/dependencyService';
import { formatApiTimestamp } from '@/lib/utils/dateUtils';
import {
  validateMinecraftVersion,
  validateProjectsQuery,
  ValidationError
} from '@/lib/schemas/apiSchemas';

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
    const dependencies = await dependencyService.fetchAllDependencies(validatedMcVersion, customProjects);

    const response: ApiResponse<{
      mc_version: string;
      dependencies: DependencyVersion[];
    }> = {
      data: {
        mc_version: validatedMcVersion,
        dependencies,
      },
      timestamp: formatApiTimestamp(),
      cached_at: formatApiTimestamp(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error(`Error fetching dependencies for MC ${mcVersion}:`, error);

    // Enhanced error handling for validation errors
    if (error instanceof ValidationError) {
      const errorResponse: ApiResponse<null> = {
        error: `Validation error: ${error.message}`,
        timestamp: formatApiTimestamp(),
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const errorResponse: ApiResponse<null> = {
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: formatApiTimestamp(),
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

