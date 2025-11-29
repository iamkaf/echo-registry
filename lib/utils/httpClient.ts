import axios, { AxiosResponse, AxiosError } from 'axios';
import { HTTP_TIMEOUT, USER_AGENT } from './constants';

// Create a centralized Axios instance
export const httpClient = axios.create({
  timeout: HTTP_TIMEOUT,
  headers: {
    'User-Agent': USER_AGENT,
    'Content-Type': 'application/json',
  },
});

// Custom error class for HTTP errors
export class HttpClientError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: unknown,
  ) {
    super(message);
    this.name = 'HttpClientError';
  }
}

// Unified fetch method to replace existing fetchWithTimeout
// This maintains the same interface as the original fetchWithTimeout
export async function fetchWithTimeout(url: string, options?: RequestInit): Promise<Response> {
  try {
    // Convert fetch options to axios-compatible format
    const axiosOptions: Record<string, unknown> = {
      method: options?.method || 'GET',
      headers: {
        ...httpClient.defaults.headers,
        ...options?.headers,
      },
      responseType: 'text', // Get raw text for Response compatibility
    };

    // Handle request body
    if (options?.body) {
      axiosOptions.data = options.body;
    }

    const response: AxiosResponse = await httpClient.request({
      url,
      ...axiosOptions,
    });

    // Convert axios response back to fetch Response format
    // Check if the response data is already a string or needs to be converted
    let responseData: string;
    if (typeof response.data === 'string') {
      responseData = response.data;
    } else if (response.data instanceof Buffer) {
      responseData = response.data.toString();
    } else {
      // For JSON objects, stringify once
      responseData = JSON.stringify(response.data);
    }

    return new Response(responseData, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
  } catch (error) {
    if (error instanceof AxiosError) {
      // Convert axios errors to our custom error type
      const httpError = new HttpClientError(
        error.message,
        error.response?.status,
        error.response?.data,
      );

      // Return a Response object with error information
      return new Response(
        JSON.stringify({
          error: httpError.message,
          status: httpError.status,
        }),
        {
          status: httpError.status || 500,
          statusText: 'HTTP Error',
        },
      );
    }

    // Re-throw non-axios errors
    throw error;
  }
}

// These convenience methods are kept for potential future use
// but properly typed to avoid any type issues
export async function get<T = unknown>(url: string): Promise<T> {
  const response = await httpClient.get<T>(url);
  return response.data;
}

export async function post<T = unknown>(url: string, data?: unknown): Promise<T> {
  const response = await httpClient.post<T>(url, data);
  return response.data;
}

// Export the axios instance for advanced usage
export default httpClient;
