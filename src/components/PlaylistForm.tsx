"use client";

import { useState } from "react";

export default function PlaylistForm() {
  const [url, setUrl] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Placeholder until /analyze is implemented
    alert("Placeholder submit: " + url);
  }

  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', gap: 8, marginTop: 16 }}>
      <input
        type="url"
        placeholder="https://open.spotify.com/playlist/..."
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        required
        style={{ flex: 1, padding: 8 }}
      />
      <button type="submit" style={{ padding: '8px 12px' }}>
        Analyze
      </button>
    </form>
  );
}
