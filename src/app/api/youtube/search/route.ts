import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface YouTubeResult {
  id: string;
  title: string;
  channel: string;
  duration: string;
  thumbnail: string;
  url: string;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  try {
    // Common yt-dlp options to bypass restrictions
    const ytdlpOpts = [
      '--no-check-certificates',
      '--no-cache-dir',
      '--extractor-args', '"youtube:player_client=android,ios"',
      '--force-ipv4',
      '--geo-bypass',
      '--user-agent', '"com.google.android.youtube/19.09.37 (Linux; U; Android 11) gzip"'
    ].join(' ');

    // Use yt-dlp to search YouTube and get JSON results
    const { stdout } = await execAsync(
      `yt-dlp "ytsearch10:${query.replace(/"/g, '\\"')}" --dump-json --flat-playlist --no-download ${ytdlpOpts}`,
      { maxBuffer: 10 * 1024 * 1024 }
    );

    // Parse each line as JSON (yt-dlp outputs one JSON object per line)
    const results: YouTubeResult[] = stdout
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        try {
          const data = JSON.parse(line);
          return {
            id: data.id,
            title: data.title,
            channel: data.channel || data.uploader || "Unknown",
            duration: formatDuration(data.duration),
            thumbnail: data.thumbnail || `https://i.ytimg.com/vi/${data.id}/mqdefault.jpg`,
            url: `https://www.youtube.com/watch?v=${data.id}`,
          };
        } catch {
          return null;
        }
      })
      .filter(Boolean) as YouTubeResult[];

    return NextResponse.json({ results });
  } catch (error) {
    console.error("YouTube search error:", error);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "?:??";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
