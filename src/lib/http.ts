/**
 * HTTP utility functions and error handling for API requests
 */

/**
 * Custom error class for HTTP request failures
 * Extends Error with HTTP status code information
 */
export class HttpError extends Error {
  public readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

/**
 * Wrapper around fetch that handles JSON responses and HTTP errors
 * 
 * @param url - The URL to fetch
 * @param init - Optional fetch request init options
 * @returns Promise that resolves to parsed JSON response
 * @throws HttpError if the response is not ok
 */
export async function jsonFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);

  if (!response.ok) {
    // Best effort to read error response text
    let errorText: string;
    try {
      errorText = await response.text();
    } catch {
      errorText = `HTTP ${response.status}`;
    }

    throw new HttpError(response.status, errorText || `HTTP ${response.status}`);
  }

  return response.json() as T;
}
