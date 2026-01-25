import * as musicMetadata from "music-metadata-browser";

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
      const blob = new Blob([picture.data], { type: picture.format });
      coverUrl = URL.createObjectURL(blob);
    }
    
    // Use filename as title fallback
    const title = metadata.common.title || file.name.replace(/\.[^/.]+$/, "");
    
    return {
      title,
      artist: metadata.common.artist || null,
      album: metadata.common.album || null,
      duration: Math.round(metadata.format.duration || 0),
      coverUrl,
    };
  } catch (error) {
    console.error("Error extracting metadata:", error);
    // Return basic info from filename
    return {
      title: file.name.replace(/\.[^/.]+$/, ""),
      artist: null,
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
