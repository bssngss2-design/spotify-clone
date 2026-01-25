"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient, Song, Playlist, PlaylistSong } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { usePlayer } from "@/context/PlayerContext";
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

  const { user } = useAuth();
  const { playQueue, currentSong, isPlaying } = usePlayer();
  const supabase = createClient();

  // Fetch playlist and songs
  const fetchPlaylist = useCallback(async () => {
    if (!user || !playlistId) return;

    setLoading(true);

    // Fetch playlist
    const { data: playlistData } = await supabase
      .from("playlists")
      .select("*")
      .eq("id", playlistId)
      .single();

    if (!playlistData) {
      router.push("/");
      return;
    }

    setPlaylist(playlistData);
    setEditName(playlistData.name);

    // Fetch playlist songs with joined song data
    const { data: playlistSongs } = await supabase
      .from("playlist_songs")
      .select("*, song:songs(*)")
      .eq("playlist_id", playlistId)
      .order("position", { ascending: true });

    if (playlistSongs) {
      const songsData = playlistSongs
        .map((ps: PlaylistSong & { song: Song }) => ps.song)
        .filter(Boolean);
      setSongs(songsData);
    }

    // Fetch all user songs for "add songs" feature
    const { data: allSongsData } = await supabase
      .from("songs")
      .select("*")
      .order("title", { ascending: true });

    if (allSongsData) {
      setAllSongs(allSongsData);
    }

    setLoading(false);
  }, [user, playlistId, router, supabase]);

  useEffect(() => {
    fetchPlaylist();
  }, [fetchPlaylist]);

  // Update playlist name
  const handleUpdateName = async () => {
    if (!playlist || !editName.trim()) return;

    const { error } = await supabase
      .from("playlists")
      .update({ name: editName.trim() })
      .eq("id", playlist.id);

    if (!error) {
      setPlaylist({ ...playlist, name: editName.trim() });
    }
    setIsEditing(false);
  };

  // Delete playlist
  const handleDeletePlaylist = async () => {
    if (!playlist) return;

    const confirmed = confirm(
      `Are you sure you want to delete "${playlist.name}"?`
    );
    if (!confirmed) return;

    const { error } = await supabase
      .from("playlists")
      .delete()
      .eq("id", playlist.id);

    if (!error) {
      router.push("/");
    }
  };

  // Add song to playlist
  const handleAddSong = async (songId: string) => {
    if (!playlist) return;

    // Check if already in playlist
    const alreadyExists = songs.some((s) => s.id === songId);
    if (alreadyExists) return;

    const position = songs.length;

    const { error } = await supabase.from("playlist_songs").insert({
      playlist_id: playlist.id,
      song_id: songId,
      position,
    });

    if (!error) {
      const newSong = allSongs.find((s) => s.id === songId);
      if (newSong) {
        setSongs((prev) => [...prev, newSong]);
      }
    }
  };

  // Remove song from playlist
  const handleRemoveSong = async (songId: string) => {
    if (!playlist) return;

    const { error } = await supabase
      .from("playlist_songs")
      .delete()
      .eq("playlist_id", playlist.id)
      .eq("song_id", songId);

    if (!error) {
      setSongs((prev) => prev.filter((s) => s.id !== songId));
    }
  };

  // Calculate total duration
  const totalDuration = songs.reduce((acc, song) => acc + song.duration, 0);

  // Get songs not in playlist for "add songs" modal
  const availableSongs = allSongs.filter(
    (song) => !songs.some((s) => s.id === song.id)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-foreground-subdued border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-foreground-subdued">Playlist not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="p-6 bg-gradient-to-b from-[#535353] to-transparent">
        <div className="flex items-end gap-6">
          {/* Playlist cover */}
          <div className="w-52 h-52 bg-background-tinted rounded shadow-xl flex items-center justify-center flex-shrink-0">
            {songs.length > 0 && songs[0].cover_url ? (
              <img
                src={songs[0].cover_url}
                alt={playlist.name}
                className="w-full h-full object-cover rounded"
              />
            ) : (
              <svg
                className="w-16 h-16 text-foreground-subdued"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M15 4v12.167a3.5 3.5 0 11-3.5-3.5H13V4h2zm-2 10.667h-1.5a1.5 1.5 0 100 3 1.5 1.5 0 001.5-1.5v-1.5z" />
              </svg>
            )}
          </div>

          {/* Playlist info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white mb-2">Playlist</p>

            {isEditing ? (
              <div className="flex items-center gap-2 mb-4">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleUpdateName();
                    if (e.key === "Escape") setIsEditing(false);
                  }}
                  className="text-5xl font-bold bg-transparent border-b-2 border-white outline-none text-white"
                  autoFocus
                />
                <button
                  onClick={handleUpdateName}
                  className="px-4 py-2 bg-white text-black rounded-full text-sm font-semibold"
                >
                  Save
                </button>
              </div>
            ) : (
              <h1
                onClick={() => setIsEditing(true)}
                className="text-5xl font-bold text-white mb-4 cursor-pointer hover:underline"
              >
                {playlist.name}
              </h1>
            )}

            <div className="flex items-center gap-2 text-sm text-foreground-subdued">
              <span>
                {songs.length} {songs.length === 1 ? "song" : "songs"}
              </span>
              {songs.length > 0 && (
                <>
                  <span>•</span>
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
            <svg
              className="w-6 h-6 text-black ml-1"
              fill="currentColor"
              viewBox="0 0 16 16"
            >
              <path d="M3 1.713a.7.7 0 011.05-.607l10.89 6.288a.7.7 0 010 1.212L4.05 14.894A.7.7 0 013 14.288V1.713z" />
            </svg>
          </button>
        )}

        <button
          onClick={() => setShowAddSongs(true)}
          className="w-10 h-10 flex items-center justify-center text-foreground-subdued hover:text-white transition-colors"
          title="Add songs"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 16 16">
            <path d="M15.25 8a.75.75 0 01-.75.75H8.75v5.75a.75.75 0 01-1.5 0V8.75H1.5a.75.75 0 010-1.5h5.75V1.5a.75.75 0 011.5 0v5.75h5.75a.75.75 0 01.75.75z" />
          </svg>
        </button>

        <button
          onClick={handleDeletePlaylist}
          className="w-10 h-10 flex items-center justify-center text-foreground-subdued hover:text-red-500 transition-colors"
          title="Delete playlist"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 16 16">
            <path d="M5.5 5.5A.5.5 0 016 6v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm2.5 0a.5.5 0 01.5.5v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm3 .5a.5.5 0 00-1 0v6a.5.5 0 001 0V6z" />
            <path
              fillRule="evenodd"
              d="M14.5 3a1 1 0 01-1 1H13v9a2 2 0 01-2 2H5a2 2 0 01-2-2V4h-.5a1 1 0 01-1-1V2a1 1 0 011-1H6a1 1 0 011-1h2a1 1 0 011 1h3.5a1 1 0 011 1v1zM4.118 4L4 4.059V13a1 1 0 001 1h6a1 1 0 001-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"
            />
          </svg>
        </button>
      </div>

      {/* Songs list */}
      {songs.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <p className="text-foreground-subdued mb-4">
            This playlist is empty. Add some songs!
          </p>
          <button
            onClick={() => setShowAddSongs(true)}
            className="px-6 py-2 bg-white text-black font-semibold rounded-full hover:scale-105 transition-transform"
          >
            Add songs
          </button>
        </div>
      ) : (
        <div className="px-6">
          {/* Header */}
          <div className="grid grid-cols-[16px_4fr_minmax(120px,1fr)_40px] gap-4 px-4 py-2 border-b border-border text-foreground-subdued text-xs uppercase tracking-wider">
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
                onPlay={() => playQueue(songs, index)}
                onDelete={() => handleRemoveSong(song.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Add songs modal */}
      {showAddSongs && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          onClick={() => setShowAddSongs(false)}
        >
          <div
            className="bg-background-elevated rounded-lg w-full max-w-lg max-h-[70vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Add to playlist</h2>
              <button
                onClick={() => setShowAddSongs(false)}
                className="w-8 h-8 flex items-center justify-center text-foreground-subdued hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M4.646 4.646a.5.5 0 01.708 0L8 7.293l2.646-2.647a.5.5 0 01.708.708L8.707 8l2.647 2.646a.5.5 0 01-.708.708L8 8.707l-2.646 2.647a.5.5 0 01-.708-.708L7.293 8 4.646 5.354a.5.5 0 010-.708z" />
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto max-h-[calc(70vh-60px)]">
              {availableSongs.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-foreground-subdued">
                    {allSongs.length === 0
                      ? "No songs in your library yet. Upload some songs first!"
                      : "All your songs are already in this playlist!"}
                  </p>
                </div>
              ) : (
                <div className="p-2">
                  {availableSongs.map((song) => (
                    <button
                      key={song.id}
                      onClick={() => handleAddSong(song.id)}
                      className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-background-tinted transition-colors text-left"
                    >
                      <div className="w-10 h-10 bg-background-tinted rounded flex-shrink-0 flex items-center justify-center">
                        {song.cover_url ? (
                          <img
                            src={song.cover_url}
                            alt={song.title}
                            className="w-full h-full object-cover rounded"
                          />
                        ) : (
                          <svg
                            className="w-4 h-4 text-foreground-subdued"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M15 4v12.167a3.5 3.5 0 11-3.5-3.5H13V4h2zm-2 10.667h-1.5a1.5 1.5 0 100 3 1.5 1.5 0 001.5-1.5v-1.5z" />
                          </svg>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-white font-medium truncate">
                          {song.title}
                        </p>
                        <p className="text-sm text-foreground-subdued truncate">
                          {song.artist || "Unknown artist"}
                        </p>
                      </div>
                      <div className="w-8 h-8 flex items-center justify-center text-foreground-subdued">
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 16 16"
                        >
                          <path d="M15.25 8a.75.75 0 01-.75.75H8.75v5.75a.75.75 0 01-1.5 0V8.75H1.5a.75.75 0 010-1.5h5.75V1.5a.75.75 0 011.5 0v5.75h5.75a.75.75 0 01.75.75z" />
                        </svg>
                      </div>
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
