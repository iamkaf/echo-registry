import { z } from 'zod';
import { isValidMinecraftVersion } from 'minecraft-version-validator';

/**
 * Minecraft version parameter validation
 */
export const MinecraftVersionParamSchema = z.object({
    mc: z
        .string()
        .refine((val) => isValidMinecraftVersion(val), {
            message: 'Invalid Minecraft version format',
        })
        .min(1, 'Minecraft version cannot be empty'),
});

/**
 * Query parameter validation for projects filter
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
 * Query parameter validation for loaders check endpoint
 */
export const LoadersCheckQuerySchema = z.object({
    projects: z
        .string()
        .min(1, 'Projects parameter cannot be empty')
        .transform((val) =>
            val
                .split(',')
                .map((p) => p.trim())
                .filter((p) => p.length > 0),
        ),
    versions: z
        .string()
        .min(1, 'Versions parameter cannot be empty')
        .transform((val) =>
            val
                .split(',')
                .map((v) => v.trim())
                .filter((v) => v.length > 0),
        ),
});

/**
 * Validate and parse Minecraft version parameter
 */
export function validateMinecraftVersion(mcVersion: string): string {
    const result = MinecraftVersionParamSchema.safeParse({ mc: mcVersion });
    if (!result.success) {
        const errorMessage =
            result.error.issues && result.error.issues.length > 0
                ? result.error.issues[0]?.message
                : 'Invalid Minecraft version format';
        throw new ValidationError(errorMessage);
    }
    return result.data.mc;
}

/**
 * Validate projects query parameter
 */
export function validateProjectsQuery(projects?: string): string[] {
    const result = ProjectsQuerySchema.safeParse({ projects });
    return result.success ? result.data.projects : [];
}

/**
 * Validate project compatibility check query parameters
 */
export function validateProjectCompatibilityQuery(
    projects: string,
    versions: string,
): {
    projects: string[];
    versions: string[];
} {
    const result = LoadersCheckQuerySchema.safeParse({ projects, versions });
    if (!result.success) {
        const errorMessage =
            result.error.issues && result.error.issues.length > 0
                ? result.error.issues[0]?.message
                : 'Invalid query parameters';
        throw new ValidationError(errorMessage);
    }
    return result.data;
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
