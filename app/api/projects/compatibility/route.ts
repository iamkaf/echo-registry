import { NextRequest, NextResponse } from 'next/server';
import { DependencyService } from '@/lib/services/dependencyService';
import { validateProjectCompatibilityQuery, ValidationError } from '@/lib/schemas/apiSchemas';
import { createErrorResponse, createCachedResponse } from '@/lib/utils/responseUtils';

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const projectsParam = searchParams.get('projects');
    const versionsParam = searchParams.get('versions');

    // Validate required parameters
    if (!projectsParam && !versionsParam) {
      const errorResponse = createErrorResponse('Both projects and versions parameters are required');
      return NextResponse.json(errorResponse, { status: 400 });
    }

    if (!projectsParam) {
      const errorResponse = createErrorResponse('Projects parameter is required');
      return NextResponse.json(errorResponse, { status: 400 });
    }

    if (!versionsParam) {
      const errorResponse = createErrorResponse('Versions parameter is required');
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Validate query parameters (this will catch empty strings)
    const { projects, versions } = validateProjectCompatibilityQuery(projectsParam, versionsParam);

    const dependencyService = new DependencyService();
    const projectCompatibility = await dependencyService.checkLoadersForProjects(projects, versions);

    const response = createCachedResponse(projectCompatibility);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error checking project compatibility:', error);

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
