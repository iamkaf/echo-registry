import { z } from 'zod';
import { DependencyVersion } from '@/types/dependency';

/**
 * Minecraft version parameter validation
 * Accepts versions like "1.21.1", "1.20", "1.20.4", etc.
 */
export const MinecraftVersionParamSchema = z.object({
  mc: z
    .string()
    .regex(/^\d+\.\d+(\.\d+)?$/, 'Invalid Minecraft version format. Expected format: x.y or x.y.z')
    .min(1, 'Minecraft version cannot be empty'),
});

/**
 * Query parameter validation for projects filter
 * Accepts comma-separated project names
 */
export const ProjectsQuerySchema = z.object({
  projects: z
    .string()
    .optional()
    .transform((val) =>
      val
        ? val
            .split(',')
            .map((p) => p.trim())
            .filter((p) => p.length > 0)
        : [],
    ),
});

/**
 * Dependency version validation
 * Used to validate individual dependency responses
 */
export const DependencyVersionSchema = z.object({
  name: z.string().min(1, 'Dependency name cannot be empty'),
  loader: z.enum(['forge', 'neoforge', 'fabric', 'universal']),
  version: z.string().nullable(),
  mc_version: z.string().min(1, 'Minecraft version cannot be empty'),
  source_url: z.string().url('Invalid source URL format'),
  download_urls: z
    .object({
      forge: z.string().url().nullable().optional(),
      neoforge: z.string().url().nullable().optional(),
      fabric: z.string().url().nullable().optional(),
    })
    .optional(),
  coordinates: z.string().nullable().optional(),
  notes: z.string().optional(),
  fallback_used: z.boolean().optional(),
  cached_at: z.string().optional(),
}) satisfies z.ZodType<DependencyVersion>;

/**
 * Minecraft version validation
 * Used to validate Minecraft version responses
 */
export const MinecraftVersionSchema = z.object({
  id: z.string().min(1, 'Version ID cannot be empty'),
  version_type: z.enum(['release', 'snapshot', 'old_beta', 'old_alpha']),
  release_time: z.string().datetime('Invalid release time format'),
});

/**
 * Health check response validation
 */
export const HealthResponseSchema = z.object({
  status: z.enum(['ok', 'degraded', 'down']),
  timestamp: z.string().datetime('Invalid timestamp format'),
  cache_status: z.enum(['connected', 'disconnected', 'error']),
  external_apis: z.record(z.string(), z.enum(['ok', 'error'])),
});

/**
 * Generic API response wrapper validation
 * This validates the structure of all API responses
 */
export const ApiResponseSchema = <T>(dataSchema: z.ZodType<T>) =>
  z.object({
    data: dataSchema.optional(),
    error: z.string().optional(),
    cached_at: z.string().optional(),
    timestamp: z.string().datetime('Invalid timestamp format'),
  });

/**
 * Success response schema for dependencies endpoint
 */
export const DependenciesResponseSchema = ApiResponseSchema(
  z.record(z.string(), DependencyVersionSchema),
);

/**
 * Success response schema for Minecraft versions endpoint
 */
export const MinecraftVersionsResponseSchema = ApiResponseSchema(
  z.object({
    versions: z.array(MinecraftVersionSchema),
  }),
);

/**
 * Error response schema
 * Used to validate error responses from API endpoints
 */
export const ErrorResponseSchema = z.object({
  error: z.string().min(1, 'Error message cannot be empty'),
  timestamp: z.string().datetime('Invalid timestamp format'),
});

/**
 * Validation helpers for common scenarios
 */

/**
 * Validate and parse Minecraft version parameter
 * Throws ValidationError if invalid
 */
export function validateMinecraftVersion(mcVersion: string): string {
  const result = MinecraftVersionParamSchema.safeParse({ mc: mcVersion });
  if (!result.success) {
    const errorMessage =
      result.error.issues && result.error.issues.length > 0
        ? result.error.issues[0]?.message
        : 'Invalid Minecraft version format. Expected format: x.y or x.y.z';
    throw new ValidationError(errorMessage);
  }
  return result.data.mc;
}

/**
 * Validate projects query parameter
 * Returns array of project names (empty array if not provided)
 */
export function validateProjectsQuery(projects?: string): string[] {
  const result = ProjectsQuerySchema.safeParse({ projects });
  return result.success ? result.data.projects : [];
}

/**
 * Custom validation error class
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
