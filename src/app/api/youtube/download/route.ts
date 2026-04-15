import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import fs from "fs";
import path from "path";
import os from "os";
import { v4 as uuidv4 } from "uuid";

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  const { url, title, artist } = await request.json();

  if (!url) {
    return NextResponse.json({ error: "URL required" }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const tmpDir = os.tmpdir();
  const fileId = uuidv4();
  const tmpFile = path.join(tmpDir, `${fileId}.mp3`);

  try {
    await execAsync(
      `yt-dlp -x --audio-format mp3 --audio-quality 0 -o "${tmpFile}" "${url}"`,
      { timeout: 120000 }
    );

    const fileBuffer = fs.readFileSync(tmpFile);
    const storagePath = `${user.id}/${fileId}.mp3`;

    const { error: uploadError } = await supabase.storage
      .from("audio")
      .upload(storagePath, fileBuffer, {
        contentType: "audio/mpeg",
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    const { data: urlData } = supabase.storage.from("audio").getPublicUrl(storagePath);

    let duration = 0;
    try {
      const { stdout: durationStr } = await execAsync(
        `yt-dlp --get-duration "${url}"`,
        { timeout: 10000 }
      );
      const parts = durationStr.trim().split(":").map(Number);
      if (parts.length === 3) duration = parts[0] * 3600 + parts[1] * 60 + parts[2];
      else if (parts.length === 2) duration = parts[0] * 60 + parts[1];
      else if (parts.length === 1) duration = parts[0];
    } catch {}

    let thumbnail: string | null = null;
    try {
      const { stdout: thumbUrl } = await execAsync(
        `yt-dlp --get-thumbnail "${url}"`,
        { timeout: 10000 }
      );
      thumbnail = thumbUrl.trim() || null;
    } catch {}

    const { data: song, error: dbError } = await supabase
      .from("songs")
      .insert({
        user_id: user.id,
        title: title || "Unknown",
        artist: artist || "Unknown",
        album: null,
        duration: duration,
        file_url: urlData.publicUrl,
        cover_url: thumbnail,
      })
      .select()
      .single();

    if (dbError) {
      throw new Error(`DB insert failed: ${dbError.message}`);
    }

    return NextResponse.json({ song });
  } catch (error) {
    console.error("Download failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Download failed" },
      { status: 500 }
    );
  } finally {
    try { fs.unlinkSync(tmpFile); } catch {}
  }
}
