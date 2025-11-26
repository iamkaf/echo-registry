import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse, BulkRequest, DependencyVersion } from '@/types/dependency';
import { DependencyService } from '@/lib/services/dependencyService';

export async function GET(request: NextRequest, { params }: { params: Promise<{ mc: string }> }) {
  const { mc: mcVersion } = await params;

  try {
    // Get custom projects from query parameters
    const { searchParams } = new URL(request.url);
    const projectsParam = searchParams.get('projects');
    const customProjects = projectsParam ? projectsParam.split(',').map((p) => p.trim()) : [];

    const dependencyService = new DependencyService();
    const dependencies = await dependencyService.fetchAllDependencies(mcVersion, customProjects);

    const response: ApiResponse<{
      mc_version: string;
      dependencies: DependencyVersion[];
    }> = {
      data: {
        mc_version: mcVersion,
        dependencies,
      },
      timestamp: new Date().toISOString(),
      cached_at: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error(`Error fetching dependencies for MC ${mcVersion}:`, error);

    const errorResponse: ApiResponse<null> = {
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ mc: string }> }) {
  const { mc: mcVersion } = await params;

  try {
    const body: BulkRequest = await request.json();

    // Validate request body
    if (!body.mc_version || body.mc_version !== mcVersion) {
      return NextResponse.json(
        {
          error: 'MC version mismatch between URL and request body',
          timestamp: new Date().toISOString(),
        },
        { status: 400 },
      );
    }

    const dependencyService = new DependencyService();
    const dependencies = await dependencyService.fetchAllDependencies(
      body.mc_version,
      body.dependencies || [],
    );

    const response: ApiResponse<{
      mc_version: string;
      dependencies: DependencyVersion[];
    }> = {
      data: {
        mc_version: body.mc_version,
        dependencies,
      },
      timestamp: new Date().toISOString(),
      cached_at: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error(`Error in bulk fetch for MC ${mcVersion}:`, error);

    const errorResponse: ApiResponse<null> = {
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
