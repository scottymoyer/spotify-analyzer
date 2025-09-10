import { getAllPlaylistTracks, getAudioFeatures /*, getPlaylist */ } from "./spotify";
import type { AnalysisResult, AnalyzedTrack } from "../types/spotify";

/**
 * Analyze a public playlist by ID and return three arrays sorted by energy, tempo, and valence (descending).
 * - Missing audio features default to 0
 * - Sorting is deterministic (ties broken by track name)
 */
export async function analyzePlaylist(id: string): Promise<AnalysisResult> {
  // Optional: fetch metadata if you want to display playlist name later
  // const meta = await getPlaylist(id);

  const tracks = await getAllPlaylistTracks(id); // TrackLite[]
  const features = await getAudioFeatures(tracks.map(t => t.id)); // Map<string, AudioFeaturesLite>

  const merged: AnalyzedTrack[] = tracks.map(t => {
    const f = features.get(t.id);
    return {
      id: t.id,
      name: t.name,
      artists: t.artists,
      url: t.url,
      energy: f?.energy ?? 0,
      tempo: f?.tempo ?? 0,
      valence: f?.valence ?? 0,
    };
  });

  // Deterministic sort helpers (desc, then name asc as tiebreaker)
  const by = <K extends keyof AnalyzedTrack>(k: K) => (a: AnalyzedTrack, b: AnalyzedTrack) =>
    (b[k] as number) - (a[k] as number) || a.name.localeCompare(b.name);

  const energySorted  = [...merged].sort(by("energy"));
  const tempoSorted   = [...merged].sort(by("tempo"));
  const valenceSorted = [...merged].sort(by("valence"));

  return { energySorted, tempoSorted, valenceSorted };
}
