/**
 * Spotify Web API client using Client Credentials flow
 * Handles authentication, token caching, pagination, and batching
 */

import { jsonFetch } from './http';
import type {
  SpotifyPlaylistResponse,
  SpotifyPlaylistTracksResponse,
  SpotifyAudioFeaturesResponse,
  SpotifyTokenResponse,
  TrackLite,
  AudioFeaturesLite,
} from '../types/spotify';

// Spotify API endpoints
const TOKEN_URL = 'https://accounts.spotify.com/api/token';
const API_BASE = 'https://api.spotify.com/v1';

// In-memory token cache to avoid unnecessary auth requests
let cachedToken: { access_token: string; expires_at: number } | null = null;

/**
 * Clears the cached token (useful for testing)
 */
export function clearTokenCache(): void {
  cachedToken = null;
}

/**
 * Gets an application access token using Client Credentials flow
 * Implements in-memory caching to reduce token requests
 * 
 * @returns Promise resolving to access token string
 * @throws Error if credentials are missing or token request fails
 */
async function getAppToken(): Promise<string> {
  // Return cached token if still valid (with 10s buffer)
  if (cachedToken && cachedToken.expires_at > Date.now() + 10_000) {
    return cachedToken.access_token;
  }

  // Validate required environment variables
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET environment variables are required');
  }

  // Request new token using Client Credentials flow
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  
  const tokenResponse = await jsonFetch<SpotifyTokenResponse>(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  // Cache token with expiration time
  cachedToken = {
    access_token: tokenResponse.access_token,
    expires_at: Date.now() + (tokenResponse.expires_in * 1000),
  };

  return tokenResponse.access_token;
}

/**
 * Authenticated fetch wrapper for Spotify API requests
 * Automatically handles token retrieval and authorization headers
 * 
 * @param path - API path (without base URL)
 * @returns Promise resolving to parsed JSON response
 */
async function authFetch<T>(path: string): Promise<T> {
  const token = await getAppToken();
  
  return jsonFetch<T>(`${API_BASE}${path}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
}

/**
 * Fetches playlist metadata by ID
 * 
 * @param id - Spotify playlist ID
 * @returns Promise resolving to playlist metadata
 */
export async function getPlaylist(id: string): Promise<SpotifyPlaylistResponse> {
  return authFetch<SpotifyPlaylistResponse>(`/playlists/${id}`);
}

/**
 * Fetches all tracks from a playlist with automatic pagination
 * Handles large playlists by making multiple API calls as needed
 * 
 * @param id - Spotify playlist ID
 * @returns Promise resolving to array of simplified track objects
 */
export async function getAllPlaylistTracks(id: string): Promise<TrackLite[]> {
  const tracks: TrackLite[] = [];
  let offset = 0;
  const limit = 100; // Maximum allowed by Spotify API

  // Fetch tracks in batches until we have them all
  while (true) {
    const response = await authFetch<SpotifyPlaylistTracksResponse>(
      `/playlists/${id}/tracks?limit=${limit}&offset=${offset}`
    );

    // Process tracks from current batch
    for (const item of response.items) {
      // Skip items without valid track data
      if (!item.track || !item.track.id) {
        continue;
      }

      const track = item.track;
      
      tracks.push({
        id: track.id,
        name: track.name || 'Unknown Track',
        artists: track.artists?.map(artist => artist.name).join(', ') || 'Unknown Artist',
        url: track.external_urls?.spotify || '#',
      });
    }

    // Continue pagination if more tracks remain
    if (tracks.length < response.total && response.items.length === limit) {
      offset += limit;
    } else {
      break;
    }
  }

  return tracks;
}

/**
 * Fetches audio features for multiple tracks with automatic batching
 * Spotify API allows max 100 IDs per request, so larger arrays are split
 * 
 * @param ids - Array of Spotify track IDs
 * @returns Promise resolving to Map of track ID to audio features
 */
export async function getAudioFeatures(ids: string[]): Promise<Map<string, AudioFeaturesLite>> {
  const results = new Map<string, AudioFeaturesLite>();
  
  // Process IDs in batches of 100 (Spotify API limit)
  for (let i = 0; i < ids.length; i += 100) {
    const batchIds = ids.slice(i, i + 100);
    const idsParam = batchIds.join(',');
    
    const response = await authFetch<SpotifyAudioFeaturesResponse>(
      `/audio-features?ids=${idsParam}`
    );

    // Process features from current batch
    for (const features of response.audio_features) {
      if (features && features.id) {
        results.set(features.id, {
          id: features.id,
          energy: features.energy ?? 0,
          tempo: features.tempo ?? 0,
          valence: features.valence ?? 0,
        });
      }
    }
  }

  return results;
}
