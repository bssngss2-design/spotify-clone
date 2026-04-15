import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");
  if (!query) {
    return NextResponse.json({ results: [] });
  }

  try {
    const { stdout } = await execAsync(
      `yt-dlp "ytsearch10:${query.replace(/"/g, '\\"')}" --dump-json --flat-playlist --no-warnings`,
      { timeout: 15000, maxBuffer: 5 * 1024 * 1024 }
    );

    const results = stdout
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        try {
          const data = JSON.parse(line);
          return {
            id: data.id,
            title: data.title || "Unknown",
            artist: data.uploader || data.channel || "Unknown",
            duration: data.duration || 0,
            thumbnail: data.thumbnail || data.thumbnails?.[0]?.url || null,
            url: `https://www.youtube.com/watch?v=${data.id}`,
          };
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    return NextResponse.json({ results });
  } catch (error) {
    console.error("YouTube search failed:", error);
    return NextResponse.json({ results: [] });
  }
}
