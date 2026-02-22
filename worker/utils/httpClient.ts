import { HTTP_TIMEOUT, USER_AGENT } from './constants';

/**
 * Fetch with timeout using native AbortSignal.timeout().
 * Replaces the axios-based fetchWithTimeout from the Next.js version.
 */
export async function fetchWithTimeout(url: string, options?: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), HTTP_TIMEOUT);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
            headers: {
                'User-Agent': USER_AGENT,
                ...options?.headers,
            },
        });
        return response;
    } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
            // Return a synthetic timeout response
            return new Response(
                JSON.stringify({ error: 'Request timed out' }),
                { status: 408, statusText: 'Request Timeout' },
            );
        }
        throw error;
    } finally {
        clearTimeout(timeoutId);
    }
}
