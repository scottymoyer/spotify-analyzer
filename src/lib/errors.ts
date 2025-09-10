import { HttpError } from './http';

/**
 * Maps error objects to user-friendly error messages
 * Provides specific messages for common HTTP error scenarios
 * 
 * @param err - The error object to map to a user message
 * @returns User-friendly error message string
 */
export function userMessageFromError(err: unknown): string {
  if (err instanceof HttpError) {
    switch (err.status) {
      case 401:
      case 403:
        return 'Spotify authorization failed. Check your client credentials.';
      case 404:
        return 'Playlist not found or not public.';
      case 429:
        return 'Rate limited by Spotify. Try again shortly.';
      default:
        return `Spotify error: ${err.status}`;
    }
  }

  if (err instanceof Error) {
    return err.message;
  }

  return 'Unknown error';
}
