import PlaylistForm from "@/components/PlaylistForm";

export default function Page() {
  return (
    <section>
      <h1>Spotify Playlist Analyzer</h1>
      <p>Paste a public Spotify playlist URL to see tracks sorted by energy, tempo, and valence.</p>
      <PlaylistForm />
    </section>
  );
}
