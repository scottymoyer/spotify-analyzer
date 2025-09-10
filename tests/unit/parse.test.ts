import { describe, it, expect } from 'vitest';
import { extractPlaylistId } from '../../src/lib/parse';

describe('extractPlaylistId', () => {
  describe('valid playlist URLs', () => {
    it('should extract ID from basic HTTPS playlist URL', () => {
      const url = 'https://open.spotify.com/playlist/37i9dQZF1DX0XUsuxWHRQd';
      const result = extractPlaylistId(url);
      expect(result).toBe('37i9dQZF1DX0XUsuxWHRQd');
    });

    it('should extract ID from HTTPS playlist URL with query parameters', () => {
      const url = 'https://open.spotify.com/playlist/37i9dQZF1DX0XUsuxWHRQd?si=abc123&utm_source=copy-link';
      const result = extractPlaylistId(url);
      expect(result).toBe('37i9dQZF1DX0XUsuxWHRQd');
    });

    it('should extract ID from Spotify URI format', () => {
      const uri = 'spotify:playlist:37i9dQZF1DX0XUsuxWHRQd';
      const result = extractPlaylistId(uri);
      expect(result).toBe('37i9dQZF1DX0XUsuxWHRQd');
    });

    it('should handle URLs with whitespace', () => {
      const url = '  https://open.spotify.com/playlist/37i9dQZF1DX0XUsuxWHRQd  ';
      const result = extractPlaylistId(url);
      expect(result).toBe('37i9dQZF1DX0XUsuxWHRQd');
    });
  });

  describe('invalid inputs', () => {
    it('should return null for album URLs', () => {
      const url = 'https://open.spotify.com/album/4aawyAB9vmqN3uQ7FjRGTy';
      const result = extractPlaylistId(url);
      expect(result).toBe(null);
    });

    it('should return null for track URLs', () => {
      const url = 'https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh';
      const result = extractPlaylistId(url);
      expect(result).toBe(null);
    });

    it('should return null for artist URLs', () => {
      const url = 'https://open.spotify.com/artist/1uNFoZAHBGtllmzznpCI3s';
      const result = extractPlaylistId(url);
      expect(result).toBe(null);
    });

    it('should return null for non-Spotify domains', () => {
      const url = 'https://apple.music.com/playlist/37i9dQZF1DX0XUsuxWHRQd';
      const result = extractPlaylistId(url);
      expect(result).toBe(null);
    });

    it('should return null for malformed URLs', () => {
      const url = 'not-a-valid-url';
      const result = extractPlaylistId(url);
      expect(result).toBe(null);
    });

    it('should return null for empty/null/undefined inputs', () => {
      expect(extractPlaylistId('')).toBe(null);
      expect(extractPlaylistId(null as any)).toBe(null);
      expect(extractPlaylistId(undefined as any)).toBe(null);
    });

    it('should return null for invalid Spotify URI format', () => {
      const uri = 'spotify:album:37i9dQZF1DX0XUsuxWHRQd';
      const result = extractPlaylistId(uri);
      expect(result).toBe(null);
    });

    it('should return null for invalid ID format', () => {
      const url = 'https://open.spotify.com/playlist/invalid-id-123';
      const result = extractPlaylistId(url);
      expect(result).toBe(null);
    });

    it('should return null for URLs with extra path segments', () => {
      const url = 'https://open.spotify.com/playlist/37i9dQZF1DX0XUsuxWHRQd/extra';
      const result = extractPlaylistId(url);
      expect(result).toBe(null);
    });
  });
});
