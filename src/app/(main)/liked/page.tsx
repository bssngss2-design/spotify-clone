"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient, Song } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { usePlayer } from "@/context/PlayerContext";
import { useLikedSongs } from "@/hooks/useLikedSongs";
import { formatDuration } from "@/lib/audioUtils";
import { TrackRow } from "@/components/TrackRow";

export default function LikedSongsPage() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { playQueue, currentSong } = usePlayer();
  const { isLiked, toggleLike } = useLikedSongs();
  const supabase = createClient();
  const [viewMode, setViewMode] = useState<"list" | "compact">("list");
  const [viewMenuOpen, setViewMenuOpen] = useState(false);
  const viewMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (viewMenuRef.current && !viewMenuRef.current.contains(e.target as Node)) setViewMenuOpen(false);
    }
    if (viewMenuOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [viewMenuOpen]);

  const fetchLikedSongs = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("liked_songs")
      .select("song_id, songs(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (data) {
      const songsData = data
        .map((r: { song_id: string; songs: Song }) => r.songs)
        .filter(Boolean);
      setSongs(songsData);
    }
    setLoading(false);
  }, [user, supabase]);

  useEffect(() => {
    fetchLikedSongs();
  }, [fetchLikedSongs]);

  const totalDuration = songs.reduce((acc, s) => acc + s.duration, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-foreground-subdued border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-full">
      {/* Header with purple gradient */}
      <div className="p-6 bg-gradient-to-b from-[#5038a0] via-[#3d2d7c] to-transparent">
        <div className="flex items-end gap-6">
          <div className="w-52 h-52 rounded shadow-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-[#450af5] to-[#c4efd9]">
            <svg className="w-20 h-20 text-white" fill="currentColor" viewBox="0 0 16 16">
              <path d="M15.724 4.22A4.313 4.313 0 0012.192.814a4.269 4.269 0 00-3.622 1.13.837.837 0 01-1.14 0 4.272 4.272 0 00-6.38 5.57l5.593 7.434a1.12 1.12 0 001.733-.074l.033-.044 5.315-7.315z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white mb-2">Playlist</p>
            <h1 className="text-5xl font-bold text-white mb-6">Liked Songs</h1>
            <div className="flex items-center gap-2 text-sm text-foreground-subdued">
              <span className="font-semibold text-white">B</span>
              <span>·</span>
              <span>{songs.length} {songs.length === 1 ? "song" : "songs"}</span>
              {songs.length > 0 && (
                <>
                  <span>·</span>
                  <span>{formatDuration(totalDuration)}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 py-4 flex items-center gap-4">
        {songs.length > 0 && (
          <button
            onClick={() => playQueue(songs)}
            className="w-14 h-14 bg-spotify-green rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-xl"
          >
            <svg className="w-6 h-6 text-black ml-1" fill="currentColor" viewBox="0 0 16 16">
              <path d="M3 1.713a.7.7 0 011.05-.607l10.89 6.288a.7.7 0 010 1.212L4.05 14.894A.7.7 0 013 14.288V1.713z" />
            </svg>
          </button>
        )}
        {songs.length > 0 && (
          <button className="w-10 h-10 flex items-center justify-center text-[#b3b3b3] hover:text-white transition-colors" title="Shuffle">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 16 16">
              <path d="M13.151.922a.75.75 0 10-1.06 1.06L13.109 3H11.16a3.75 3.75 0 00-2.873 1.34l-6.173 7.356A2.25 2.25 0 01.39 12.5H0V14h.391a3.75 3.75 0 002.873-1.34l6.173-7.356a2.25 2.25 0 011.724-.804h1.947l-1.017 1.018a.75.75 0 001.06 1.06l2.306-2.306a.75.75 0 000-1.06L13.15.922zM.391 3.5H0V2h.391c1.109 0 2.16.49 2.873 1.34L4.89 5.277l-.979 1.167-1.796-2.14A2.25 2.25 0 00.39 3.5z" />
              <path d="M7.5 10.723l.98-1.167.957 1.14a2.25 2.25 0 001.724.804h1.947l-1.017-1.018a.75.75 0 111.06-1.06l2.306 2.306a.75.75 0 010 1.06l-2.306 2.306a.75.75 0 11-1.06-1.06L13.109 13H11.16a3.75 3.75 0 01-2.873-1.34l-.787-.938z" />
            </svg>
          </button>
        )}
        {/* Download */}
        {songs.length > 0 && (
          <button className="w-8 h-8 flex items-center justify-center text-[#b3b3b3] hover:text-white transition-colors" title="Download">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v5m0 0l-2.5-2.5M12 13l2.5-2.5M8 16h8" />
            </svg>
          </button>
        )}
      </div>

      {/* Songs list */}
      {songs.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <p className="text-foreground-subdued">Songs you like will appear here.</p>
        </div>
      ) : (
        <div className="px-6">
          {/* View toggle */}
          <div className="flex justify-end mb-2">
            <div ref={viewMenuRef} className="relative">
              <button onClick={() => setViewMenuOpen(!viewMenuOpen)} className="flex items-center gap-2 text-sm text-[#b3b3b3] hover:text-white transition-colors">
                <span>{viewMode === "list" ? "List" : "Compact"}</span>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16"><path d="M15 14.5H5V13h10v1.5zm0-5.75H5v-1.5h10v1.5zM15 3H5V1.5h10V3zM3 3H1V1.5h2V3zm0 5.75H1v-1.5h2v1.5zM3 14.5H1V13h2v1.5z" /></svg>
              </button>
              {viewMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-40 bg-[#282828] rounded-md shadow-2xl py-1 z-50">
                  <p className="px-3 py-2 text-xs font-bold text-[#b3b3b3]">View as</p>
                  <button onClick={() => { setViewMode("compact"); setViewMenuOpen(false); }}
                    className="w-full text-left px-3 py-2 text-sm text-white hover:bg-[#3e3e3e] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-[#b3b3b3]" fill="currentColor" viewBox="0 0 16 16"><path d="M15 14.5H1V13h14v1.5zm0-4H1V9h14v1.5zm0-4H1V5h14v1.5zm0-4H1V1h14v1.5z" /></svg>
                      Compact
                    </div>
                    {viewMode === "compact" && <svg className="w-4 h-4 text-spotify-green" fill="currentColor" viewBox="0 0 16 16"><path d="M13.985 2.383L5.127 12.754 1.388 8.375l-.658.77 4.397 5.149 9.523-11.15z" /></svg>}
                  </button>
                  <button onClick={() => { setViewMode("list"); setViewMenuOpen(false); }}
                    className="w-full text-left px-3 py-2 text-sm text-white hover:bg-[#3e3e3e] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-[#b3b3b3]" fill="currentColor" viewBox="0 0 16 16"><path d="M15 14.5H5V13h10v1.5zm0-5.75H5v-1.5h10v1.5zM15 3H5V1.5h10V3zM3 3H1V1.5h2V3zm0 5.75H1v-1.5h2v1.5zM3 14.5H1V13h2v1.5z" /></svg>
                      List
                    </div>
                    {viewMode === "list" && <svg className="w-4 h-4 text-spotify-green" fill="currentColor" viewBox="0 0 16 16"><path d="M13.985 2.383L5.127 12.754 1.388 8.375l-.658.77 4.397 5.149 9.523-11.15z" /></svg>}
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="hidden md:grid grid-cols-[16px_4fr_minmax(120px,1fr)_40px] gap-4 px-4 py-2 border-b border-[#282828] text-[#b3b3b3] text-xs uppercase tracking-wider">
            <div className="flex items-center justify-center">#</div>
            <div>Title</div>
            <div>Album</div>
            <div className="flex justify-end">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 3.5a.5.5 0 00-1 0V9a.5.5 0 00.252.434l3.5 2a.5.5 0 00.496-.868L8 8.71V3.5z" />
                <path d="M8 16A8 8 0 108 0a8 8 0 000 16zm7-8A7 7 0 111 8a7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-2 pb-6">
            {songs.map((song, index) => (
              <TrackRow
                key={song.id}
                song={song}
                index={index}
                isActive={currentSong?.id === song.id}
                isLiked={isLiked(song.id)}
                onToggleLike={() => toggleLike(song.id)}
                onPlay={() => playQueue(songs, index)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
