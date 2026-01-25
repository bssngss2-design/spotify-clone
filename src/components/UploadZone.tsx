"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { createClient, Song } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { extractAudioMetadata, isAudioFile, getSupportedAudioFormats } from "@/lib/audioUtils";
import { v4 as uuidv4 } from "uuid";

interface UploadZoneProps {
  onUploadComplete: (song: Song) => void;
}

interface UploadProgress {
  fileName: string;
  progress: number;
  status: "uploading" | "processing" | "done" | "error";
  error?: string;
}

export function UploadZone({ onUploadComplete }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const supabase = createClient();

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      processFiles(files);
      // Reset input
      e.target.value = "";
    }
  };

  const processFiles = async (files: File[]) => {
    if (!user) return;

    // Filter audio files
    const audioFiles = files.filter(isAudioFile);

    if (audioFiles.length === 0) {
      alert("Please select audio files only");
      return;
    }

    // Upload each file
    for (const file of audioFiles) {
      await uploadFile(file);
    }
  };

  const uploadFile = async (file: File) => {
    if (!user) return;

    const uploadId = uuidv4();
    const fileName = file.name;

    // Add to upload progress
    setUploads((prev) => [
      ...prev,
      { fileName, progress: 0, status: "processing" },
    ]);

    try {
      // Extract metadata
      const metadata = await extractAudioMetadata(file);

      // Update status
      setUploads((prev) =>
        prev.map((u) =>
          u.fileName === fileName ? { ...u, status: "uploading", progress: 10 } : u
        )
      );

      // Generate unique file path
      const fileExtension = file.name.split(".").pop();
      const filePath = `${user.id}/${uploadId}.${fileExtension}`;

      // Upload audio file
      const { error: uploadError } = await supabase.storage
        .from("audio")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      setUploads((prev) =>
        prev.map((u) =>
          u.fileName === fileName ? { ...u, progress: 60 } : u
        )
      );

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("audio")
        .getPublicUrl(filePath);

      // For private buckets, we need signed URLs
      const { data: signedUrlData } = await supabase.storage
        .from("audio")
        .createSignedUrl(filePath, 60 * 60 * 24 * 365); // 1 year

      const fileUrl = signedUrlData?.signedUrl || urlData.publicUrl;

      // Upload cover image if available
      let coverUrl: string | null = null;
      if (metadata.coverUrl) {
        // Convert blob URL to file and upload
        try {
          const coverResponse = await fetch(metadata.coverUrl);
          const coverBlob = await coverResponse.blob();
          const coverPath = `${user.id}/${uploadId}-cover.jpg`;

          const { error: coverError } = await supabase.storage
            .from("covers")
            .upload(coverPath, coverBlob, {
              cacheControl: "3600",
              upsert: false,
            });

          if (!coverError) {
            const { data: coverUrlData } = supabase.storage
              .from("covers")
              .getPublicUrl(coverPath);
            coverUrl = coverUrlData.publicUrl;
          }

          // Clean up blob URL
          URL.revokeObjectURL(metadata.coverUrl);
        } catch {
          console.error("Failed to upload cover image");
        }
      }

      setUploads((prev) =>
        prev.map((u) =>
          u.fileName === fileName ? { ...u, progress: 80 } : u
        )
      );

      // Create song record in database
      const { data: songData, error: dbError } = await supabase
        .from("songs")
        .insert({
          id: uploadId,
          user_id: user.id,
          title: metadata.title,
          artist: metadata.artist,
          album: metadata.album,
          duration: metadata.duration,
          file_url: fileUrl,
          cover_url: coverUrl,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Mark as done
      setUploads((prev) =>
        prev.map((u) =>
          u.fileName === fileName ? { ...u, progress: 100, status: "done" } : u
        )
      );

      // Notify parent
      if (songData) {
        onUploadComplete(songData);
      }

      // Remove from list after delay
      setTimeout(() => {
        setUploads((prev) => prev.filter((u) => u.fileName !== fileName));
      }, 2000);
    } catch (error) {
      console.error("Upload error:", error);
      setUploads((prev) =>
        prev.map((u) =>
          u.fileName === fileName
            ? { ...u, status: "error", error: "Upload failed" }
            : u
        )
      );

      // Remove error after delay
      setTimeout(() => {
        setUploads((prev) => prev.filter((u) => u.fileName !== fileName));
      }, 5000);
    }
  };

  return (
    <div className="mb-6">
      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragging
            ? "border-spotify-green bg-spotify-green/10"
            : "border-border hover:border-foreground-subdued"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={getSupportedAudioFormats().join(",")}
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="flex flex-col items-center">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
              isDragging ? "bg-spotify-green" : "bg-background-tinted"
            }`}
          >
            <svg
              className={`w-6 h-6 ${
                isDragging ? "text-black" : "text-foreground-subdued"
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
          <p className="text-white font-medium mb-1">
            {isDragging ? "Drop files here" : "Drag and drop audio files"}
          </p>
          <p className="text-sm text-foreground-subdued">
            or click to browse • MP3, WAV, FLAC, M4A, OGG supported
          </p>
        </div>
      </div>

      {/* Upload progress */}
      {uploads.length > 0 && (
        <div className="mt-4 space-y-2">
          {uploads.map((upload) => (
            <div
              key={upload.fileName}
              className="flex items-center gap-3 p-3 bg-background-tinted rounded-lg"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{upload.fileName}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1 bg-progress-bar rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        upload.status === "error"
                          ? "bg-red-500"
                          : "bg-spotify-green"
                      }`}
                      style={{ width: `${upload.progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-foreground-subdued">
                    {upload.status === "processing" && "Processing..."}
                    {upload.status === "uploading" && `${upload.progress}%`}
                    {upload.status === "done" && "Done!"}
                    {upload.status === "error" && upload.error}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
