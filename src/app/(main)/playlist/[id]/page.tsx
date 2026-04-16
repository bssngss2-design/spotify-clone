"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient, Song, Playlist, PlaylistSong } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { usePlayer } from "@/context/PlayerContext";
import { useLikedSongs } from "@/hooks/useLikedSongs";
import { formatDuration } from "@/lib/audioUtils";
import { TrackRow } from "@/components/TrackRow";
import { useToast } from "@/hooks/useToast";
import { EditPlaylistModal } from "@/components/EditPlaylistModal";

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
  const [showEditModal, setShowEditModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { user } = useAuth();
  const { playQueue, currentSong, isPlaying, toggleShuffle, addToQueue } = usePlayer();
  const { isLiked, toggleLike } = useLikedSongs();
  const { toast } = useToast();
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
          <div onClick={() => setShowEditModal(true)} className="w-52 h-52 bg-background-tinted rounded shadow-xl flex items-center justify-center flex-shrink-0 cursor-pointer group relative">
            {songs.length > 0 && songs[0].cover_url ? (
              <img src={songs[0].cover_url} alt={playlist.name} className="w-full h-full object-cover rounded" />
            ) : (
              <svg className="w-16 h-16 text-foreground-subdued" fill="currentColor" viewBox="0 0 24 24">
                <path d="M15 4v12.167a3.5 3.5 0 11-3.5-3.5H13V4h2zm-2 10.667h-1.5a1.5 1.5 0 100 3 1.5 1.5 0 001.5-1.5v-1.5z" />
              </svg>
            )}
            <div className="absolute inset-0 bg-black/50 rounded flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M17.318 2.768a2.276 2.276 0 013.182 0 2.276 2.276 0 010 3.182L9.182 17.268a1 1 0 01-.464.263l-4 1a1 1 0 01-1.213-1.213l1-4a1 1 0 01.263-.464L16.086 1.536zM16.5 4.5L5.5 15.5l-.5 2 2-.5L18 6l-1.5-1.5z" /></svg>
              <span className="text-white text-sm font-semibold mt-1">Choose photo</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white mb-2">Playlist</p>
            <h1 onClick={() => setShowEditModal(true)} className="text-5xl font-bold text-white mb-4 cursor-pointer hover:underline">{playlist.name}</h1>
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

        {/* Album art thumbnail */}
        {songs.length > 0 && songs[0].cover_url && (
          <div className="w-12 h-12 rounded border-2 border-[#3e3e3e] overflow-hidden flex-shrink-0">
            <img src={songs[0].cover_url} alt="" className="w-full h-full object-cover" />
          </div>
        )}

        {/* Shuffle */}
        {songs.length > 0 && (
          <button onClick={() => { playQueue(songs); toggleShuffle(); }} className="relative w-10 h-10 flex items-center justify-center text-spotify-green hover:text-spotify-green-hover transition-colors">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 16 16">
              <path d="M13.151.922a.75.75 0 10-1.06 1.06L13.109 3H11.16a3.75 3.75 0 00-2.873 1.34l-6.173 7.356A2.25 2.25 0 01.39 12.5H0V14h.391a3.75 3.75 0 002.873-1.34l6.173-7.356a2.25 2.25 0 011.724-.804h1.947l-1.017 1.018a.75.75 0 001.06 1.06l2.306-2.306a.75.75 0 000-1.06L13.15.922zM.391 3.5H0V2h.391c1.109 0 2.16.49 2.873 1.34L4.89 5.277l-.979 1.167-1.796-2.14A2.25 2.25 0 00.39 3.5z" />
              <path d="M7.5 10.723l.98-1.167.957 1.14a2.25 2.25 0 001.724.804h1.947l-1.017-1.018a.75.75 0 111.06-1.06l2.306 2.306a.75.75 0 010 1.06l-2.306 2.306a.75.75 0 11-1.06-1.06L13.109 13H11.16a3.75 3.75 0 01-2.873-1.34l-.787-.938z" />
            </svg>
            <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-spotify-green" />
          </button>
        )}

        {/* Download */}
        {songs.length > 0 && (
          <button onClick={() => toast("Download is not available yet")} className="w-8 h-8 flex items-center justify-center text-[#b3b3b3] hover:text-white transition-colors" title="Download">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 16 16"><path d="M4.995 8.745a.75.75 0 011.06 0L7.25 9.939V4a.75.75 0 011.5 0v5.94l1.195-1.195a.75.75 0 011.06 1.06L8 12.811l-3.005-3.006a.75.75 0 010-1.06z" /><path d="M0 8a8 8 0 1116 0A8 8 0 010 8zm8-6.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13z" /></svg>
          </button>
        )}

        {/* Add collaborator */}
        <button onClick={() => toast("Collaboration is not available yet")} className="w-8 h-8 flex items-center justify-center text-[#b3b3b3] hover:text-white transition-colors" title="Invite collaborators">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 16 16"><path d="M11.757 2.987A4 4 0 118.243 9.013a4 4 0 013.514-6.026zM10 5a2 2 0 10-4 0 2 2 0 004 0zM2.5 12.5a5.5 5.5 0 0111 0V14h-11v-1.5z" /><path d="M14 2v1.5h1.5a.75.75 0 010 1.5H14V6.5a.75.75 0 01-1.5 0V5H11a.75.75 0 010-1.5h1.5V2a.75.75 0 011.5 0z" /></svg>
        </button>

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
            <div className="absolute left-0 top-full mt-1 w-64 bg-[#282828] rounded-md shadow-xl py-1 z-50">
              <button onClick={async () => { setMenuOpen(false); for (const s of songs) addToQueue(s); toast("Added to queue"); }} className="w-full text-left px-3 py-2.5 text-sm text-[#eaeaea] hover:text-white hover:bg-[#3e3e3e] flex items-center gap-3 transition-colors">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 16 16"><path d="M15 15H1v-1.5h14V15zm0-4.5H1V9h14v1.5zm-14-5V4h11.5V1.5h1.5V7H1V5.5z" /></svg>
                Add to queue
              </button>
              <button onClick={() => { setMenuOpen(false); setShowEditModal(true); }} className="w-full text-left px-3 py-2.5 text-sm text-[#eaeaea] hover:text-white hover:bg-[#3e3e3e] flex items-center gap-3 transition-colors">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 16 16"><path d="M13.426 2.574a2.831 2.831 0 00-4.797 1.55l3.247 3.247a2.831 2.831 0 001.55-4.797zM10.5 8.118l-2.619-2.62A63.088 63.088 0 011.348 9.65.5.5 0 001 10.104v3.396a.5.5 0 00.5.5h3.396a.5.5 0 00.454-.348 63.088 63.088 0 014.15-5.534z" /></svg>
                Edit details
              </button>
              <button onClick={() => { setMenuOpen(false); handleDeletePlaylist(); }} className="w-full text-left px-3 py-2.5 text-sm text-[#eaeaea] hover:text-white hover:bg-[#3e3e3e] flex items-center gap-3 transition-colors">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 16 16"><path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8z" /><path d="M11.25 8a.75.75 0 01-.75.75h-5a.75.75 0 010-1.5h5a.75.75 0 01.75.75z" /></svg>
                Delete
              </button>
              <div className="border-t border-[#3e3e3e] my-1" />
              <button onClick={() => { setMenuOpen(false); toast("Public playlists are not available yet"); }} className="w-full text-left px-3 py-2.5 text-sm text-[#eaeaea] hover:text-white hover:bg-[#3e3e3e] flex items-center gap-3 transition-colors">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 16 16"><path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8z" /></svg>
                Make public
              </button>
              <button onClick={() => { setMenuOpen(false); toast("Collaboration is not available yet"); }} className="w-full text-left px-3 py-2.5 text-sm text-[#eaeaea] hover:text-white hover:bg-[#3e3e3e] flex items-center gap-3 transition-colors">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 16 16"><path d="M11.757 2.987A4 4 0 118.243 9.013a4 4 0 013.514-6.026zM10 5a2 2 0 10-4 0 2 2 0 004 0zM2.5 12.5a5.5 5.5 0 0111 0V14h-11v-1.5z" /><path d="M14 2v1.5h1.5a.75.75 0 010 1.5H14V6.5a.75.75 0 01-1.5 0V5H11a.75.75 0 010-1.5h1.5V2a.75.75 0 011.5 0z" /></svg>
                Invite collaborators
              </button>
              <button onClick={() => { setMenuOpen(false); toast("Taste profile is not available yet"); }} className="w-full text-left px-3 py-2.5 text-sm text-[#eaeaea] hover:text-white hover:bg-[#3e3e3e] flex items-center gap-3 transition-colors">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 16 16"><path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8z" /><path d="M4.646 4.646a.5.5 0 01.708 0L8 7.293l2.646-2.647a.5.5 0 01.708.708L8.707 8l2.647 2.646a.5.5 0 01-.708.708L8 8.707l-2.646 2.647a.5.5 0 01-.708-.708L7.293 8 4.646 5.354a.5.5 0 010-.708z" /></svg>
                Exclude from your taste profile
              </button>
              <div className="border-t border-[#3e3e3e] my-1" />
              <button onClick={() => { setMenuOpen(false); toast("Folders are not available yet"); }} className="w-full text-left px-3 py-2.5 text-sm text-[#eaeaea] hover:text-white hover:bg-[#3e3e3e] flex items-center gap-3 justify-between transition-colors">
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 16 16"><path d="M1 3.5A1.5 1.5 0 012.5 2h3A1.5 1.5 0 017 3.5V4h5.5A1.5 1.5 0 0114 5.5v7a1.5 1.5 0 01-1.5 1.5h-9A1.5 1.5 0 012 12.5v-9zm1.5 0V4H5V3.5H2.5zm0 2v7h9v-7h-9z" /></svg>
                  Move to folder
                </div>
                <svg className="w-3 h-3 text-[#b3b3b3]" fill="currentColor" viewBox="0 0 16 16"><path d="M4.646 3.646a.5.5 0 01.708 0l4 4a.5.5 0 010 .708l-4 4a.5.5 0 01-.708-.708L8.293 8 4.646 4.354a.5.5 0 010-.708z" /></svg>
              </button>
              <button onClick={() => { setMenuOpen(false); navigator.clipboard.writeText(window.location.href); toast("Link copied to clipboard"); }} className="w-full text-left px-3 py-2.5 text-sm text-[#eaeaea] hover:text-white hover:bg-[#3e3e3e] flex items-center gap-3 justify-between transition-colors">
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 16 16"><path d="M1 5.75A.75.75 0 011.75 5H7v1.5H2.5v8h11V7H9V5.5h4.25a.75.75 0 01.75.75v9.5a.75.75 0 01-.75.75H1.75a.75.75 0 01-.75-.75v-9.5z" /><path d="M8 1.293l2.854 2.853-1.061 1.061L8.5 3.914V10h-1V3.914L6.207 5.207 5.146 4.146 8 1.293z" /></svg>
                  Share
                </div>
                <svg className="w-3 h-3 text-[#b3b3b3]" fill="currentColor" viewBox="0 0 16 16"><path d="M4.646 3.646a.5.5 0 01.708 0l4 4a.5.5 0 010 .708l-4 4a.5.5 0 01-.708-.708L8.293 8 4.646 4.354a.5.5 0 010-.708z" /></svg>
              </button>
              <div className="border-t border-[#3e3e3e] my-1" />
              <button onClick={() => { setMenuOpen(false); toast("Desktop app is not available"); }} className="w-full text-left px-3 py-2.5 text-sm text-[#eaeaea] hover:text-white hover:bg-[#3e3e3e] flex items-center gap-3 transition-colors">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 16 16"><path d="M8 0a8 8 0 100 16A8 8 0 008 0zm3.669 11.538c-.147.224-.43.308-.655.16-1.793-1.095-4.05-1.342-6.71-.735a.47.47 0 01-.563-.34.47.47 0 01.34-.564c2.91-.665 5.406-.378 7.427.855.224.147.308.43.16.654zm.978-2.178c-.184.28-.568.4-.85.2-2.05-1.26-5.18-1.625-7.607-1.055a.607.607 0 11-.28-1.18c2.77-.645 6.21-.333 8.534 1.185.28.184.367.568.2.85z" /></svg>
                Open in Desktop app
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
      {showEditModal && playlist && (
        <EditPlaylistModal
          playlist={playlist}
          coverUrl={songs[0]?.cover_url}
          onClose={() => setShowEditModal(false)}
          onSave={({ name }) => {
            setPlaylist((prev) => prev ? { ...prev, name } : prev);
            setShowEditModal(false);
          }}
        />
      )}
    </div>
  );
}
