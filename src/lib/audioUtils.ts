import * as musicMetadata from "music-metadata-browser";

function parseFilenameMetadata(filename: string): { title: string; artist: string | null } {
  const name = filename.replace(/\.[^/.]+$/, "").trim();

  // "Artist - Title" or "Artist — Title"
  const dashMatch = name.match(/^(.+?)\s*[-–—]\s*(.+)$/);
  if (dashMatch) {
    return { artist: dashMatch[1].trim(), title: dashMatch[2].trim() };
  }

  // "Artist_Title" (underscores as separators, at least 2 parts)
  const parts = name.split("_").filter(Boolean);
  if (parts.length >= 2) {
    return { artist: parts[0].trim(), title: parts.slice(1).join(" ").trim() };
  }

  return { title: name, artist: null };
}

export interface AudioMetadata {
  title: string;
  artist: string | null;
  album: string | null;
  duration: number; // in seconds
  coverUrl: string | null;
}

/**
 * Extract metadata from an audio file
 */
export async function extractAudioMetadata(
  file: File
): Promise<AudioMetadata> {
  try {
    const metadata = await musicMetadata.parseBlob(file);
    
    let coverUrl: string | null = null;
    
    // Extract cover art if available
    if (metadata.common.picture && metadata.common.picture.length > 0) {
      const picture = metadata.common.picture[0];
      // Convert Buffer to Uint8Array for Blob compatibility
      const uint8Array = new Uint8Array(picture.data);
      const blob = new Blob([uint8Array], { type: picture.format });
      coverUrl = URL.createObjectURL(blob);
    }
    
    const filenameParsed = parseFilenameMetadata(file.name);
    const title = metadata.common.title || filenameParsed.title;

    return {
      title,
      artist: metadata.common.artist || filenameParsed.artist,
      album: metadata.common.album || null,
      duration: Math.round(metadata.format.duration || 0),
      coverUrl,
    };
  } catch (error) {
    console.error("Error extracting metadata:", error);
    const filenameParsed = parseFilenameMetadata(file.name);
    return {
      title: filenameParsed.title,
      artist: filenameParsed.artist,
      album: null,
      duration: 0,
      coverUrl: null,
    };
  }
}

/**
 * Format seconds to MM:SS or HH:MM:SS
 */
export function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "0:00";
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }
  
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Get supported audio file extensions
 */
export function getSupportedAudioFormats(): string[] {
  return [
    ".mp3",
    ".wav",
    ".ogg",
    ".flac",
    ".m4a",
    ".aac",
    ".webm",
    ".opus",
  ];
}

/**
 * Check if a file is a supported audio format
 */
export function isAudioFile(file: File): boolean {
  const extension = "." + file.name.split(".").pop()?.toLowerCase();
  return getSupportedAudioFormats().includes(extension);
}
