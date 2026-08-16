import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { createClient } from "@supabase/supabase-js";
import { readFile, unlink, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const execAsync = promisify(exec);

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

async function uploadWithRetry(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  bucket: string,
  pathName: string,
  data: Buffer,
  contentType: string,
  attempts = 4
) {
  let lastError: { message: string } | null = null;
  for (let i = 0; i < attempts; i++) {
    const { error } = await supabase.storage.from(bucket).upload(pathName, data, {
      contentType,
      upsert: true,
    });
    if (!error) return;
    lastError = error;
    const transient =
      /fetch failed|network|timeout|ECONNRESET|ETIMEDOUT|503|502|504/i.test(
        error.message
      );
    console.warn(
      `Upload to ${bucket}/${pathName} failed (attempt ${i + 1}/${attempts}):`,
      error.message
    );
    if (!transient || i === attempts - 1) break;
    await sleep(1000 * (i + 1));
  }
  throw new Error(`Upload failed: ${lastError?.message || "unknown error"}`);
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

    // Ensure temp directory exists
    if (!existsSync(tempDir)) {
      await mkdir(tempDir, { recursive: true });
    }

    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    // Try multiple player clients - tv_embedded and web_creator tend to bypass bot detection better
    const playerClients = ['tv_embedded', 'web_creator', 'mweb', 'android_vr'];
    
    // Common yt-dlp options to bypass restrictions
    const getYtdlpOpts = (client: string) => [
      '--no-check-certificates',
      '--no-cache-dir', 
      '--extractor-args', `"youtube:player_client=${client}"`,
      '--force-ipv4',
      '--geo-bypass',
      '--no-warnings',
      '--prefer-free-formats',
    ].join(' ');

    // Download audio as MP3 and thumbnail
    console.log(`Downloading: ${videoUrl}`);
    
    // Try each player client until one works
    let infoJson = '';
    let workingClient = '';
    
    for (const client of playerClients) {
      try {
        console.log(`Trying player client: ${client}`);
        const opts = getYtdlpOpts(client);
        const result = await execAsync(
          `yt-dlp "${videoUrl}" --dump-json --no-download ${opts}`,
          { maxBuffer: 10 * 1024 * 1024, timeout: 30000 }
        );
        infoJson = result.stdout;
        workingClient = client;
        console.log(`Success with player client: ${client}`);
        break;
      } catch (e) {
        console.log(`Player client ${client} failed, trying next...`);
        if (client === playerClients[playerClients.length - 1]) {
          throw e; // Re-throw if all clients failed
        }
      }
    }
    
    const ytdlpOpts = getYtdlpOpts(workingClient);
    
    const videoInfo = JSON.parse(infoJson);
    const duration = Math.round(videoInfo.duration || 0);
    const artist = videoInfo.artist || videoInfo.uploader || videoInfo.channel || null;
    const album = videoInfo.album || null;
    const songTitle = title || videoInfo.title || "Unknown";

    // Download the audio
    await execAsync(
      `yt-dlp "${videoUrl}" -x --audio-format mp3 --audio-quality 0 -o "${outputPath}" --no-playlist ${ytdlpOpts}`,
      { maxBuffer: 10 * 1024 * 1024, timeout: 180000 }
    );

    // Download thumbnail
    let coverUrl: string | null = null;
    try {
      await execAsync(
        `yt-dlp "${videoUrl}" --write-thumbnail --skip-download -o "${tempDir}/${songId}" --no-playlist ${ytdlpOpts}`,
        { maxBuffer: 10 * 1024 * 1024 }
      );
      
      // Find the thumbnail file (could be .jpg, .webp, etc.)
      const { stdout: findResult } = await execAsync(`ls ${tempDir}/${songId}.* 2>/dev/null | grep -v mp3 | head -1`);
      const thumbFile = findResult.trim();
      
      if (thumbFile && existsSync(thumbFile)) {
        const thumbData = await readFile(thumbFile);
        const thumbPath = `${userId}/${songId}-cover.jpg`;

        try {
          await uploadWithRetry(
            supabase,
            "covers",
            thumbPath,
            thumbData,
            "image/jpeg"
          );
          const { data: thumbUrlData } = supabase.storage
            .from("covers")
            .getPublicUrl(thumbPath);
          coverUrl = thumbUrlData.publicUrl;
        } catch (e) {
          console.log("Cover upload failed, continuing without it:", e);
        }

        await unlink(thumbFile).catch(() => {});
      }
    } catch (e) {
      console.log("Thumbnail download failed, continuing without it:", e);
    }

    // Read the audio file
    const audioData = await readFile(outputPath);
    const audioPath = `${userId}/${songId}.mp3`;

    // Upload to Supabase Storage (retry on transient network errors)
    await uploadWithRetry(
      supabase,
      "audio",
      audioPath,
      audioData,
      "audio/mpeg"
    );

    // Get signed URL for the audio
    let fileUrl: string | null = null;
    for (let i = 0; i < 3; i++) {
      const { data: signedUrlData, error: signErr } = await supabase.storage
        .from("audio")
        .createSignedUrl(audioPath, 60 * 60 * 24 * 365);
      if (signedUrlData?.signedUrl) {
        fileUrl = signedUrlData.signedUrl;
        break;
      }
      console.warn("Signed URL failed:", signErr?.message);
      await sleep(500 * (i + 1));
    }

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
