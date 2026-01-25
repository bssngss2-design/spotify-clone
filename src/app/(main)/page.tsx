"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient, Song } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { SongList } from "@/components/SongList";
import { UploadZone } from "@/components/UploadZone";
import { YouTubeSearch } from "@/components/YouTubeSearch";

export default function HomePage() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, signOut } = useAuth();
  const supabase = createClient();

  // Fetch songs
  const fetchSongs = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from("songs")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setSongs(data);
    }
    setLoading(false);
  }, [user, supabase]);

  useEffect(() => {
    fetchSongs();
  }, [fetchSongs]);

  // Handle song upload complete
  const handleUploadComplete = (newSong: Song) => {
    setSongs((prev) => [newSong, ...prev]);
  };

  // Handle song delete
  const handleDeleteSong = async (songId: string) => {
    const song = songs.find((s) => s.id === songId);
    if (!song || !user) return;

    // Delete from database
    const { error } = await supabase.from("songs").delete().eq("id", songId);

    if (!error) {
      // Delete from storage
      const filePath = song.file_url.split("/").slice(-2).join("/");
      await supabase.storage.from("audio").remove([filePath]);

      // Update local state
      setSongs((prev) => prev.filter((s) => s.id !== songId));
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Your Library</h1>
          <p className="text-foreground-subdued">
            {songs.length} {songs.length === 1 ? "song" : "songs"}
          </p>
        </div>
        <button
          onClick={signOut}
          className="px-4 py-2 text-sm text-foreground-subdued hover:text-white transition-colors"
        >
          Sign out
        </button>
      </div>

      {/* YouTube Search */}
      <YouTubeSearch onSongAdded={handleUploadComplete} />

      {/* Upload zone */}
      <UploadZone onUploadComplete={handleUploadComplete} />

      {/* Songs list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-foreground-subdued border-t-white rounded-full animate-spin" />
        </div>
      ) : songs.length === 0 ? (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-background-tinted rounded-full mb-4">
            <svg
              className="w-8 h-8 text-foreground-subdued"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M15 4v12.167a3.5 3.5 0 11-3.5-3.5H13V4h2zm-2 10.667h-1.5a1.5 1.5 0 100 3 1.5 1.5 0 001.5-1.5v-1.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">
            No songs yet
          </h2>
          <p className="text-foreground-subdued">
            Drag and drop some audio files above to get started
          </p>
        </div>
      ) : (
        <SongList songs={songs} onDeleteSong={handleDeleteSong} />
      )}
    </div>
  );
}
