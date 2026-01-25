import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { createClient } from "@supabase/supabase-js";
import { readFile, unlink, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const execAsync = promisify(exec);

// Create admin client lazily to avoid build-time errors
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  const supabase = getSupabaseAdmin();
  try {
    const { videoId, title, userId } = await request.json();

    if (!videoId || !userId) {
      return NextResponse.json(
        { error: "Missing videoId or userId" },
        { status: 400 }
      );
    }

    const songId = uuidv4();
    const tempDir = "/tmp/yt-downloads";
    const outputPath = path.join(tempDir, `${songId}.mp3`);
    const thumbnailPath = path.join(tempDir, `${songId}.jpg`);

    // Ensure temp directory exists
    if (!existsSync(tempDir)) {
      await mkdir(tempDir, { recursive: true });
    }

    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    // Download audio as MP3 and thumbnail
    console.log(`Downloading: ${videoUrl}`);
    
    const { stdout: infoJson } = await execAsync(
      `yt-dlp "${videoUrl}" --dump-json --no-download`,
      { maxBuffer: 10 * 1024 * 1024 }
    );
    
    const videoInfo = JSON.parse(infoJson);
    const duration = Math.round(videoInfo.duration || 0);
    const artist = videoInfo.artist || videoInfo.uploader || videoInfo.channel || null;
    const album = videoInfo.album || null;
    const songTitle = title || videoInfo.title || "Unknown";

    // Download the audio
    await execAsync(
      `yt-dlp "${videoUrl}" -x --audio-format mp3 --audio-quality 0 -o "${outputPath}" --no-playlist`,
      { maxBuffer: 10 * 1024 * 1024, timeout: 120000 }
    );

    // Download thumbnail
    let coverUrl: string | null = null;
    try {
      await execAsync(
        `yt-dlp "${videoUrl}" --write-thumbnail --skip-download -o "${tempDir}/${songId}" --no-playlist`,
        { maxBuffer: 10 * 1024 * 1024 }
      );
      
      // Find the thumbnail file (could be .jpg, .webp, etc.)
      const { stdout: findResult } = await execAsync(`ls ${tempDir}/${songId}.* 2>/dev/null | grep -v mp3 | head -1`);
      const thumbFile = findResult.trim();
      
      if (thumbFile && existsSync(thumbFile)) {
        const thumbData = await readFile(thumbFile);
        const thumbPath = `${userId}/${songId}-cover.jpg`;
        
        const { error: thumbError } = await supabase.storage
          .from("covers")
          .upload(thumbPath, thumbData, {
            contentType: "image/jpeg",
            upsert: true,
          });

        if (!thumbError) {
          const { data: thumbUrlData } = supabase.storage
            .from("covers")
            .getPublicUrl(thumbPath);
          coverUrl = thumbUrlData.publicUrl;
        }
        
        await unlink(thumbFile).catch(() => {});
      }
    } catch (e) {
      console.log("Thumbnail download failed, continuing without it:", e);
    }

    // Read the audio file
    const audioData = await readFile(outputPath);
    const audioPath = `${userId}/${songId}.mp3`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("audio")
      .upload(audioPath, audioData, {
        contentType: "audio/mpeg",
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Get signed URL for the audio
    const { data: signedUrlData } = await supabase.storage
      .from("audio")
      .createSignedUrl(audioPath, 60 * 60 * 24 * 365);

    const fileUrl = signedUrlData?.signedUrl;

    if (!fileUrl) {
      throw new Error("Failed to get signed URL");
    }

    // Create song record in database
    const { data: songData, error: dbError } = await supabase
      .from("songs")
      .insert({
        id: songId,
        user_id: userId,
        title: songTitle,
        artist,
        album,
        duration,
        file_url: fileUrl,
        cover_url: coverUrl,
      })
      .select()
      .single();

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`);
    }

    // Clean up temp file
    await unlink(outputPath).catch(() => {});

    return NextResponse.json({ song: songData });
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Download failed" },
      { status: 500 }
    );
  }
}
