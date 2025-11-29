import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse } from '@/types/dependency';
import { DependencyService } from '@/lib/services/dependencyService';
import { formatApiTimestamp } from '@/lib/utils/dateUtils';
import { validateProjectCompatibilityQuery, ValidationError } from '@/lib/schemas/apiSchemas';

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const projectsParam = searchParams.get('projects');
    const versionsParam = searchParams.get('versions');

    // Validate required parameters
    if (!projectsParam && !versionsParam) {
      const errorResponse: ApiResponse<null> = {
        error: 'Both projects and versions parameters are required',
        timestamp: formatApiTimestamp(),
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    if (!projectsParam) {
      const errorResponse: ApiResponse<null> = {
        error: 'Projects parameter is required',
        timestamp: formatApiTimestamp(),
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    if (!versionsParam) {
      const errorResponse: ApiResponse<null> = {
        error: 'Versions parameter is required',
        timestamp: formatApiTimestamp(),
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Validate query parameters (this will catch empty strings)
    const { projects, versions } = validateProjectCompatibilityQuery(projectsParam, versionsParam);

    const dependencyService = new DependencyService();
    const projectCompatibility = await dependencyService.checkLoadersForProjects(projects, versions);

    const response: ApiResponse<Record<string, Record<string, string[]>>> = {
      data: projectCompatibility,
      timestamp: formatApiTimestamp(),
      cached_at: formatApiTimestamp(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error checking project compatibility:', error);

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
