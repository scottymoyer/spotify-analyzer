import { describe, it, expect, vi, beforeEach, type MockedFunction } from "vitest";

// Mock spotify.ts before importing analyzePlaylist
vi.mock("../../src/lib/spotify", () => {
  return {
    getAllPlaylistTracks: vi.fn(),
    getAudioFeatures: vi.fn(),
  };
});

import { analyzePlaylist } from "../../src/lib/features";
import { getAllPlaylistTracks, getAudioFeatures } from "../../src/lib/spotify";

const asMock = (fn: unknown) => fn as MockedFunction<any>;

describe("analyzePlaylist", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("joins tracks with features and sorts by energy/tempo/valence desc", async () => {
    asMock(getAllPlaylistTracks).mockResolvedValue([
      { id: "a", name: "Alpha", artists: "A1", url: "#" },
      { id: "b", name: "Beta",  artists: "B1", url: "#" },
      { id: "c", name: "Gamma", artists: "C1", url: "#" },
    ]);
    const feat = new Map([
      ["a", { id: "a", energy: 0.7, tempo: 120, valence: 0.2 }],
      ["b", { id: "b", energy: 0.9, tempo: 110, valence: 0.8 }],
      ["c", { id: "c", energy: 0.4, tempo: 140, valence: 0.5 }],
    ]);
    asMock(getAudioFeatures).mockResolvedValue(feat);

    const res = await analyzePlaylist("playlist123");
    expect(res.energySorted.map(t => t.id)).toEqual(["b", "a", "c"]);  // 0.9, 0.7, 0.4
    expect(res.tempoSorted.map(t => t.id)).toEqual(["c", "a", "b"]);   // 140, 120, 110
    expect(res.valenceSorted.map(t => t.id)).toEqual(["b", "c", "a"]); // 0.8, 0.5, 0.2
  });

  it("defaults missing features to 0 and keeps deterministic order by name on ties", async () => {
    asMock(getAllPlaylistTracks).mockResolvedValue([
      { id: "x", name: "AAA", artists: "X", url: "#" },
      { id: "y", name: "BBB", artists: "Y", url: "#" },
    ]);
    const feat = new Map([
      ["x", { id: "x", energy: 0, tempo: 0, valence: 0 }], // explicit zeros
      // no entry for "y" -> should default to 0s
    ]);
    asMock(getAudioFeatures).mockResolvedValue(feat);

    const res = await analyzePlaylist("p");
    // With all zeros, tie-breaker is by name asc (AAA before BBB)
    expect(res.energySorted.map(t => t.name)).toEqual(["AAA", "BBB"]);
    expect(res.tempoSorted.map(t => t.name)).toEqual(["AAA", "BBB"]);
    expect(res.valenceSorted.map(t => t.name)).toEqual(["AAA", "BBB"]);
  });
});