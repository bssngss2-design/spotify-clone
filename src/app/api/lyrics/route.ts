import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const track = searchParams.get("track");
  const artist = searchParams.get("artist");
  const album = searchParams.get("album");
  const duration = searchParams.get("duration");

  if (!track || !artist) {
    return NextResponse.json({ error: "track and artist required" }, { status: 400 });
  }

  try {
    const params = new URLSearchParams({ track_name: track, artist_name: artist });
    if (album) params.set("album_name", album);
    if (duration) params.set("duration", duration);

    const res = await fetch(`https://lrclib.net/api/get?${params.toString()}`, {
      headers: { "User-Agent": "SpotifyClone/1.0" },
    });

    if (!res.ok) {
      const searchRes = await fetch(
        `https://lrclib.net/api/search?track_name=${encodeURIComponent(track)}&artist_name=${encodeURIComponent(artist)}`,
        { headers: { "User-Agent": "SpotifyClone/1.0" } }
      );
      if (searchRes.ok) {
        const results = await searchRes.json();
        if (results.length > 0) {
          return NextResponse.json({
            syncedLyrics: results[0].syncedLyrics || null,
            plainLyrics: results[0].plainLyrics || null,
          });
        }
      }
      return NextResponse.json({ syncedLyrics: null, plainLyrics: null });
    }

    const data = await res.json();
    return NextResponse.json({
      syncedLyrics: data.syncedLyrics || null,
      plainLyrics: data.plainLyrics || null,
    });
  } catch {
    return NextResponse.json({ syncedLyrics: null, plainLyrics: null });
  }
}
