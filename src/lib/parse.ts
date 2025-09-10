/**
 * Extracts a Spotify playlist ID from various URL and URI formats.
 * 
 * Supported formats:
 * - https://open.spotify.com/playlist/<id>
 * - https://open.spotify.com/playlist/<id>?si=...
 * - spotify:playlist:<id>
 * 
 * @param raw - The raw input string to parse
 * @returns The playlist ID if valid, null otherwise
 */
export function extractPlaylistId(raw: string): string | null {
  if (!raw || typeof raw !== 'string') {
    return null;
  }

  const trimmed = raw.trim();
  
  // Handle Spotify URI format: spotify:playlist:<id>
  if (trimmed.startsWith('spotify:playlist:')) {
    const uriId = trimmed.replace('spotify:playlist:', '');
    return isValidSpotifyId(uriId) ? uriId : null;
  }

  // Handle HTTPS URL format: https://open.spotify.com/playlist/<id>
  try {
    const url = new URL(trimmed);
    
    // Must be a Spotify domain
    if (url.hostname !== 'open.spotify.com') {
      return null;
    }

    // Must be a playlist path
    const pathParts = url.pathname.split('/').filter(Boolean);
    if (pathParts.length !== 2 || pathParts[0] !== 'playlist') {
      return null;
    }

    const urlId = pathParts[1];
    return isValidSpotifyId(urlId) ? urlId : null;
  } catch {
    // Invalid URL format
    return null;
  }
}

/**
 * Validates that a string looks like a valid Spotify ID
 * (alphanumeric, roughly 22 characters)
 */
function isValidSpotifyId(id: string): boolean {
  if (!id || typeof id !== 'string') {
    return false;
  }
  
  // Spotify IDs are typically 22 characters, alphanumeric + some special chars
  return /^[a-zA-Z0-9]{20,25}$/.test(id);
}
