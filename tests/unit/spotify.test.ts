import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getPlaylist, getAllPlaylistTracks, getAudioFeatures, clearTokenCache } from '../../src/lib/spotify';
import { HttpError } from '../../src/lib/http';
import { userMessageFromError } from '../../src/lib/errors';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Spotify API Client', () => {
  beforeEach(() => {
    // Reset environment variables
    process.env.SPOTIFY_CLIENT_ID = 'test-client-id';
    process.env.SPOTIFY_CLIENT_SECRET = 'test-client-secret';
    
    // Clear token cache to ensure test isolation
    clearTokenCache();
    
    // Clear fetch mock
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
    clearTokenCache();
  });

  describe('Token caching', () => {
    it('should cache tokens and reuse within expiry window', async () => {
      // Mock token response
      const tokenResponse = {
        access_token: 'test-token',
        expires_in: 3600,
        token_type: 'Bearer',
      };

      // Mock playlist response
      const playlistResponse = {
        id: 'test-playlist',
        name: 'Test Playlist',
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(tokenResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(playlistResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(playlistResponse),
        });

      // First call should fetch token
      await getPlaylist('test-playlist');
      
      // Second call should reuse cached token
      await getPlaylist('test-playlist');

      // Verify token endpoint was called only once
      expect(mockFetch).toHaveBeenCalledTimes(3); // 1 token + 2 playlist calls
      expect(mockFetch).toHaveBeenNthCalledWith(1, 'https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Authorization': 'Basic dGVzdC1jbGllbnQtaWQ6dGVzdC1jbGllbnQtc2VjcmV0',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
      });
    });

    it('should throw error when credentials are missing', async () => {
      // Clear environment variables for this test
      const originalClientId = process.env.SPOTIFY_CLIENT_ID;
      const originalClientSecret = process.env.SPOTIFY_CLIENT_SECRET;
      
      delete process.env.SPOTIFY_CLIENT_ID;
      delete process.env.SPOTIFY_CLIENT_SECRET;

      await expect(getPlaylist('test-playlist')).rejects.toThrow(
        'SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET environment variables are required'
      );

      // Restore environment variables
      process.env.SPOTIFY_CLIENT_ID = originalClientId;
      process.env.SPOTIFY_CLIENT_SECRET = originalClientSecret;
    });
  });

  describe('Pagination', () => {
    it('should handle playlist with more than 100 tracks', async () => {
      const tokenResponse = {
        access_token: 'test-token',
        expires_in: 3600,
        token_type: 'Bearer',
      };

      // Mock first page of tracks (100 items)
      const firstPage = {
        items: Array.from({ length: 100 }, (_, i) => ({
          track: {
            id: `track-${i}`,
            name: `Track ${i}`,
            artists: [{ name: `Artist ${i}` }],
            external_urls: { spotify: `https://open.spotify.com/track/track-${i}` },
          },
        })),
        total: 250, // Total tracks in playlist
      };

      // Mock second page of tracks (100 items)
      const secondPage = {
        items: Array.from({ length: 100 }, (_, i) => ({
          track: {
            id: `track-${i + 100}`,
            name: `Track ${i + 100}`,
            artists: [{ name: `Artist ${i + 100}` }],
            external_urls: { spotify: `https://open.spotify.com/track/track-${i + 100}` },
          },
        })),
        total: 250,
      };

      // Mock third page of tracks (50 items)
      const thirdPage = {
        items: Array.from({ length: 50 }, (_, i) => ({
          track: {
            id: `track-${i + 200}`,
            name: `Track ${i + 200}`,
            artists: [{ name: `Artist ${i + 200}` }],
            external_urls: { spotify: `https://open.spotify.com/track/track-${i + 200}` },
          },
        })),
        total: 250,
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(tokenResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(firstPage),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(secondPage),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(thirdPage),
        });

      const tracks = await getAllPlaylistTracks('test-playlist');

      // Should make 3 requests to tracks endpoint (pagination)
      expect(mockFetch).toHaveBeenCalledTimes(4); // 1 token + 3 tracks calls
      expect(tracks).toHaveLength(250);
      expect(tracks[0]).toEqual({
        id: 'track-0',
        name: 'Track 0',
        artists: 'Artist 0',
        url: 'https://open.spotify.com/track/track-0',
      });
      expect(tracks[249]).toEqual({
        id: 'track-249',
        name: 'Track 249',
        artists: 'Artist 249',
        url: 'https://open.spotify.com/track/track-249',
      });
    });

    it('should skip tracks with null or missing data', async () => {
      const tokenResponse = {
        access_token: 'test-token-2',
        expires_in: 3600,
        token_type: 'Bearer',
      };

      const tracksResponse = {
        items: [
          {
            track: {
              id: 'valid-track',
              name: 'Valid Track',
              artists: [{ name: 'Artist' }],
              external_urls: { spotify: 'https://open.spotify.com/track/valid-track' },
            },
          },
          {
            track: null, // Null track
          },
          {
            track: {
              id: null, // Track with null ID
              name: 'Invalid Track',
            },
          },
        ],
        total: 3,
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(tokenResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(tracksResponse),
        });

      const tracks = await getAllPlaylistTracks('test-playlist');

      expect(tracks).toHaveLength(1);
      expect(tracks[0].id).toBe('valid-track');
    });
  });

  describe('Batching', () => {
    it('should batch audio features requests for more than 100 IDs', async () => {
      const tokenResponse = {
        access_token: 'test-token',
        expires_in: 3600,
        token_type: 'Bearer',
      };

      // Generate 250 track IDs
      const trackIds = Array.from({ length: 250 }, (_, i) => `track-${i}`);

      // Mock responses for 3 batches (100 + 100 + 50)
      const batch1Response = {
        audio_features: Array.from({ length: 100 }, (_, i) => ({
          id: `track-${i}`,
          energy: 0.5 + (i * 0.001),
          tempo: 120 + i,
          valence: 0.6 + (i * 0.001),
        })),
      };

      const batch2Response = {
        audio_features: Array.from({ length: 100 }, (_, i) => ({
          id: `track-${i + 100}`,
          energy: 0.7 + (i * 0.001),
          tempo: 140 + i,
          valence: 0.8 + (i * 0.001),
        })),
      };

      const batch3Response = {
        audio_features: Array.from({ length: 50 }, (_, i) => ({
          id: `track-${i + 200}`,
          energy: 0.3 + (i * 0.001),
          tempo: 100 + i,
          valence: 0.4 + (i * 0.001),
        })),
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(tokenResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(batch1Response),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(batch2Response),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(batch3Response),
        });

      const featuresMap = await getAudioFeatures(trackIds);

      // Should make 3 requests to audio-features endpoint
      expect(mockFetch).toHaveBeenCalledTimes(4); // 1 token + 3 features calls
      expect(featuresMap.size).toBe(250);
      
      // Check first and last entries
      expect(featuresMap.get('track-0')).toEqual({
        id: 'track-0',
        energy: 0.5,
        tempo: 120,
        valence: 0.6,
      });
      expect(featuresMap.get('track-249')).toEqual({
        id: 'track-249',
        energy: 0.349,
        tempo: 149,
        valence: 0.449,
      });
    });

    it('should handle null audio features gracefully', async () => {
      const tokenResponse = {
        access_token: 'test-token',
        expires_in: 3600,
        token_type: 'Bearer',
      };

      const featuresResponse = {
        audio_features: [
          {
            id: 'track-1',
            energy: 0.8,
            tempo: 120,
            valence: 0.9,
          },
          null, // Null feature
          {
            id: 'track-3',
            energy: null, // Null energy
            tempo: 140,
            valence: 0.5,
          },
        ],
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(tokenResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(featuresResponse),
        });

      const featuresMap = await getAudioFeatures(['track-1', 'track-2', 'track-3']);

      expect(featuresMap.size).toBe(2);
      expect(featuresMap.get('track-1')).toEqual({
        id: 'track-1',
        energy: 0.8,
        tempo: 120,
        valence: 0.9,
      });
      expect(featuresMap.get('track-3')).toEqual({
        id: 'track-3',
        energy: 0, // Default value for null
        tempo: 140,
        valence: 0.5,
      });
    });
  });

  describe('Error handling', () => {
    it('should map HTTP 404 error to user-friendly message', async () => {
      const tokenResponse = {
        access_token: 'test-token',
        expires_in: 3600,
        token_type: 'Bearer',
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(tokenResponse),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
          text: () => Promise.resolve('Not Found'),
        });

      try {
        await getPlaylist('nonexistent-playlist');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(HttpError);
        expect((error as HttpError).status).toBe(404);
        
        const userMessage = userMessageFromError(error);
        expect(userMessage).toBe('Playlist not found or not public.');
      }
    });

    it('should map HTTP 401 error to user-friendly message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: () => Promise.resolve('Unauthorized'),
      });

      try {
        await getPlaylist('test-playlist');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(HttpError);
        expect((error as HttpError).status).toBe(401);
        
        const userMessage = userMessageFromError(error);
        expect(userMessage).toBe('Spotify authorization failed. Check your client credentials.');
      }
    });

    it('should map HTTP 429 error to user-friendly message', async () => {
      const tokenResponse = {
        access_token: 'test-token',
        expires_in: 3600,
        token_type: 'Bearer',
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(tokenResponse),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          text: () => Promise.resolve('Too Many Requests'),
        });

      try {
        await getPlaylist('test-playlist');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(HttpError);
        expect((error as HttpError).status).toBe(429);
        
        const userMessage = userMessageFromError(error);
        expect(userMessage).toBe('Rate limited by Spotify. Try again shortly.');
      }
    });
  });
});
