import { ApiResponse } from '../types';
import { formatApiTimestamp } from './dateUtils';

/**
 * Create a success API response with optional cache timestamp
 */
export function createSuccessResponse<T>(data: T, cachedAt?: string): ApiResponse<T> {
    return {
        data,
        success: true,
        timestamp: formatApiTimestamp(),
        ...(cachedAt && { cached_at: cachedAt }),
    };
}

/**
 * Create an error API response
 */
export function createErrorResponse(message: string): ApiResponse<null> {
    return {
        error: message,
        success: false,
        timestamp: formatApiTimestamp(),
    };
}

/**
 * Create a success response with current cache timestamp
 */
export function createCachedResponse<T>(data: T): ApiResponse<T> {
    const now = formatApiTimestamp();
    return createSuccessResponse(data, now);
}
