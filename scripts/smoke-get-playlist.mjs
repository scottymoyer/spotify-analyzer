/**
 * Usage: node scripts/smoke-get-playlist.mjs <PLAYLIST_ID>
 * Example: node scripts/smoke-get-playlist.mjs 37i9dQZF1DXcBWIGoYBM5M
 */
const ID = process.argv[2];
if (!ID) {
  console.error("Missing PLAYLIST_ID argument.");
  process.exit(1);
}

const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } = process.env;
if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
  console.error("Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in your environment or .env.");
  process.exit(1);
}

async function getToken() {
  const basic = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64");
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({ grant_type: "client_credentials" })
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Token error ${res.status}: ${text}`);
  }
  const json = await res.json();
  return json.access_token;
}

async function main() {
  const token = await getToken();
  const res = await fetch(`https://api.spotify.com/v1/playlists/${encodeURIComponent(ID)}`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Playlist error ${res.status}: ${text}`);
  }
  const json = await res.json();
  console.log(JSON.stringify({ id: json.id, name: json.name }, null, 2));
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
