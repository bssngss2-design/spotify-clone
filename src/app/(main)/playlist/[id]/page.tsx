"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient, Song, Playlist, PlaylistSong } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { usePlayer } from "@/context/PlayerContext";
import { useLikedSongs } from "@/hooks/useLikedSongs";
import { formatDuration } from "@/lib/audioUtils";
import { TrackRow } from "@/components/TrackRow";

export default function PlaylistPage() {
  const params = useParams();
  const router = useRouter();
  const playlistId = params.id as string;

  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [allSongs, setAllSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [showAddSongs, setShowAddSongs] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { user } = useAuth();
  const { playQueue, currentSong, isPlaying, toggleShuffle } = usePlayer();
  const { isLiked, toggleLike } = useLikedSongs();
  const supabase = createClient();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchPlaylist = useCallback(async () => {
    if (!user || !playlistId) return;
    setLoading(true);

    const { data: playlistData } = await supabase.from("playlists").select("*").eq("id", playlistId).single();
    if (!playlistData) { router.push("/"); return; }

    setPlaylist(playlistData);
    setEditName(playlistData.name);

    const { data: playlistSongs } = await supabase
      .from("playlist_songs")
      .select("*, song:songs(*)")
      .eq("playlist_id", playlistId)
      .order("position", { ascending: true });

    if (playlistSongs) {
      setSongs(playlistSongs.map((ps: PlaylistSong & { song: Song }) => ps.song).filter(Boolean));
    }

    const { data: allSongsData } = await supabase.from("songs").select("*").order("title", { ascending: true });
    if (allSongsData) setAllSongs(allSongsData);

    setLoading(false);
  }, [user, playlistId, router, supabase]);

  useEffect(() => { fetchPlaylist(); }, [fetchPlaylist]);

  const handleUpdateName = async () => {
    if (!playlist || !editName.trim()) return;
    const { error } = await supabase.from("playlists").update({ name: editName.trim() }).eq("id", playlist.id);
    if (!error) setPlaylist({ ...playlist, name: editName.trim() });
    setIsEditing(false);
  };

  const handleDeletePlaylist = async () => {
    if (!playlist) return;
    if (!confirm(`Delete "${playlist.name}"?`)) return;
    const { error } = await supabase.from("playlists").delete().eq("id", playlist.id);
    if (!error) router.push("/");
  };

  const handleAddSong = async (songId: string) => {
    if (!playlist || songs.some((s) => s.id === songId)) return;
    const { error } = await supabase.from("playlist_songs").insert({ playlist_id: playlist.id, song_id: songId, position: songs.length });
    if (!error) {
      const newSong = allSongs.find((s) => s.id === songId);
      if (newSong) setSongs((prev) => [...prev, newSong]);
    }
  };

  const handleRemoveSong = async (songId: string) => {
    if (!playlist) return;
    const { error } = await supabase.from("playlist_songs").delete().eq("playlist_id", playlist.id).eq("song_id", songId);
    if (!error) setSongs((prev) => prev.filter((s) => s.id !== songId));
  };

  const totalDuration = songs.reduce((acc, song) => acc + song.duration, 0);
  const availableSongs = allSongs.filter((song) => !songs.some((s) => s.id === song.id));

  if (loading) {
    return <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-2 border-foreground-subdued border-t-white rounded-full animate-spin" /></div>;
  }

  if (!playlist) {
    return <div className="flex items-center justify-center h-full"><p className="text-foreground-subdued">Playlist not found</p></div>;
  }

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="p-6 bg-gradient-to-b from-[#535353] to-transparent">
        <div className="flex items-end gap-6">
          <div className="w-52 h-52 bg-background-tinted rounded shadow-xl flex items-center justify-center flex-shrink-0">
            {songs.length > 0 && songs[0].cover_url ? (
              <img src={songs[0].cover_url} alt={playlist.name} className="w-full h-full object-cover rounded" />
            ) : (
              <svg className="w-16 h-16 text-foreground-subdued" fill="currentColor" viewBox="0 0 24 24">
                <path d="M15 4v12.167a3.5 3.5 0 11-3.5-3.5H13V4h2zm-2 10.667h-1.5a1.5 1.5 0 100 3 1.5 1.5 0 001.5-1.5v-1.5z" />
              </svg>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white mb-2">Playlist</p>
            {isEditing ? (
              <div className="flex items-center gap-2 mb-4">
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleUpdateName(); if (e.key === "Escape") setIsEditing(false); }}
                  className="text-5xl font-bold bg-transparent border-b-2 border-white outline-none text-white" autoFocus />
                <button onClick={handleUpdateName} className="px-4 py-2 bg-white text-black rounded-full text-sm font-semibold">Save</button>
              </div>
            ) : (
              <h1 onClick={() => setIsEditing(true)} className="text-5xl font-bold text-white mb-4 cursor-pointer hover:underline">{playlist.name}</h1>
            )}
            <div className="flex items-center gap-2 text-sm text-foreground-subdued">
              <span className="font-semibold text-white">B</span>
              <span>·</span>
              <span>{songs.length} {songs.length === 1 ? "song" : "songs"}</span>
              {songs.length > 0 && (<><span>·</span><span>{formatDuration(totalDuration)}</span></>)}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 py-4 flex items-center gap-4">
        {songs.length > 0 && (
          <button onClick={() => playQueue(songs)} className="w-14 h-14 bg-spotify-green rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-xl">
            <svg className="w-6 h-6 text-black ml-1" fill="currentColor" viewBox="0 0 16 16">
              <path d="M3 1.713a.7.7 0 011.05-.607l10.89 6.288a.7.7 0 010 1.212L4.05 14.894A.7.7 0 013 14.288V1.713z" />
            </svg>
          </button>
        )}

        {/* Shuffle */}
        {songs.length > 0 && (
          <button onClick={() => { playQueue(songs); toggleShuffle(); }} className="w-10 h-10 flex items-center justify-center text-foreground-subdued hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 16 16">
              <path d="M13.151.922a.75.75 0 10-1.06 1.06L13.109 3H11.16a3.75 3.75 0 00-2.873 1.34l-6.173 7.356A2.25 2.25 0 01.39 12.5H0V14h.391a3.75 3.75 0 002.873-1.34l6.173-7.356a2.25 2.25 0 011.724-.804h1.947l-1.017 1.018a.75.75 0 001.06 1.06l2.306-2.306a.75.75 0 000-1.06L13.15.922zM.391 3.5H0V2h.391c1.109 0 2.16.49 2.873 1.34L4.89 5.277l-.979 1.167-1.796-2.14A2.25 2.25 0 00.39 3.5z" />
              <path d="M7.5 10.723l.98-1.167.957 1.14a2.25 2.25 0 001.724.804h1.947l-1.017-1.018a.75.75 0 111.06-1.06l2.306 2.306a.75.75 0 010 1.06l-2.306 2.306a.75.75 0 11-1.06-1.06L13.109 13H11.16a3.75 3.75 0 01-2.873-1.34l-.787-.938z" />
            </svg>
          </button>
        )}

        {/* Three dots menu */}
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-10 h-10 flex items-center justify-center text-foreground-subdued hover:text-white transition-colors"
            title="More options"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 16 16">
              <path d="M3 8a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm6.5 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM16 8a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
            </svg>
          </button>
          {menuOpen && (
            <div className="absolute left-0 top-full mt-1 w-52 bg-[#282828] rounded-md shadow-xl py-1 z-50">
              <button
                onClick={() => { setMenuOpen(false); setShowAddSongs(true); }}
                className="w-full text-left px-3 py-2.5 text-sm text-foreground-subdued hover:text-white hover:bg-background-tinted transition-colors"
              >
                Add songs
              </button>
              <button
                onClick={() => { setMenuOpen(false); setIsEditing(true); }}
                className="w-full text-left px-3 py-2.5 text-sm text-foreground-subdued hover:text-white hover:bg-background-tinted transition-colors"
              >
                Edit details
              </button>
              <div className="border-t border-border my-1" />
              <button
                onClick={() => { setMenuOpen(false); handleDeletePlaylist(); }}
                className="w-full text-left px-3 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-background-tinted transition-colors"
              >
                Delete playlist
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Songs list */}
      {songs.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <p className="text-foreground-subdued mb-4">This playlist is empty. Add some songs!</p>
          <button onClick={() => setShowAddSongs(true)} className="px-6 py-2 bg-white text-black font-semibold rounded-full hover:scale-105 transition-transform">Add songs</button>
        </div>
      ) : (
        <div className="px-6">
          <div className="hidden md:grid grid-cols-[16px_4fr_minmax(120px,1fr)_40px] gap-4 px-4 py-2 border-b border-border text-foreground-subdued text-xs uppercase tracking-wider">
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
                onDelete={() => handleRemoveSong(song.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Add songs modal */}
      {showAddSongs && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowAddSongs(false)}>
          <div className="bg-background-elevated rounded-lg w-full max-w-lg max-h-[70vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Add to playlist</h2>
              <button onClick={() => setShowAddSongs(false)} className="w-8 h-8 flex items-center justify-center text-foreground-subdued hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M4.646 4.646a.5.5 0 01.708 0L8 7.293l2.646-2.647a.5.5 0 01.708.708L8.707 8l2.647 2.646a.5.5 0 01-.708.708L8 8.707l-2.646 2.647a.5.5 0 01-.708-.708L7.293 8 4.646 5.354a.5.5 0 010-.708z" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(70vh-60px)]">
              {availableSongs.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-foreground-subdued">{allSongs.length === 0 ? "No songs in your library yet." : "All songs are already in this playlist!"}</p>
                </div>
              ) : (
                <div className="p-2">
                  {availableSongs.map((song) => (
                    <button key={song.id} onClick={() => handleAddSong(song.id)} className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-background-tinted transition-colors text-left">
                      <div className="w-10 h-10 bg-background-tinted rounded flex-shrink-0 flex items-center justify-center overflow-hidden">
                        {song.cover_url ? <img src={song.cover_url} alt={song.title} className="w-full h-full object-cover rounded" /> : (
                          <svg className="w-4 h-4 text-foreground-subdued" fill="currentColor" viewBox="0 0 24 24"><path d="M15 4v12.167a3.5 3.5 0 11-3.5-3.5H13V4h2zm-2 10.667h-1.5a1.5 1.5 0 100 3 1.5 1.5 0 001.5-1.5v-1.5z" /></svg>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-white font-medium truncate">{song.title}</p>
                        <p className="text-sm text-foreground-subdued truncate">{song.artist || "Unknown artist"}</p>
                      </div>
                      <svg className="w-4 h-4 text-foreground-subdued flex-shrink-0" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M15.25 8a.75.75 0 01-.75.75H8.75v5.75a.75.75 0 01-1.5 0V8.75H1.5a.75.75 0 010-1.5h5.75V1.5a.75.75 0 011.5 0v5.75h5.75a.75.75 0 01.75.75z" />
                      </svg>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
