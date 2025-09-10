/**
 * Minimal TypeScript types for Spotify Web API responses
 * Only includes the properties we actually use in the application
 */

/**
 * Simplified track representation for our use case
 */
export type TrackLite = {
  id: string;
  name: string;
  artists: string;
  url: string;
};

/**
 * Simplified audio features representation
 */
export type AudioFeaturesLite = {
  id: string;
  energy: number;
  tempo: number;
  valence: number;
};

/**
 * Spotify playlist metadata response
 */
export type SpotifyPlaylistResponse = {
  id: string;
  name: string;
  external_urls?: {
    spotify?: string;
  };
};

/**
 * Spotify playlist tracks response with pagination
 */
export type SpotifyPlaylistTracksResponse = {
  items: Array<{
    track: {
      id: string | null;
      name?: string;
      artists?: Array<{ name: string }>;
      external_urls?: {
        spotify?: string;
      };
    } | null;
  }>;
  total: number;
};

/**
 * Spotify audio features batch response
 */
export type SpotifyAudioFeaturesResponse = {
  audio_features: Array<{
    id: string | null;
    energy?: number | null;
    tempo?: number | null;
    valence?: number | null;
  } | null>;
};

/**
 * Spotify token response for Client Credentials flow
 */
export type SpotifyTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
};
