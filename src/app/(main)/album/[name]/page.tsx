"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { api, Song } from "@/lib/api";
import { usePlayer } from "@/context/PlayerContext";
import { useLikedSongs } from "@/hooks/useLikedSongs";
import { TrackRow } from "@/components/TrackRow";

export default function AlbumPage() {
  const params = useParams();
  const albumName = decodeURIComponent(params.name as string);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const { playQueue, currentSong } = usePlayer();
  const { isLiked, toggleLike } = useLikedSongs();

  const fetchSongs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<Song[]>("/api/songs?album=" + encodeURIComponent(albumName));
      setSongs(data);
    } catch { /* handled by api wrapper */ }
    setLoading(false);
  }, [albumName]);

  useEffect(() => { fetchSongs(); }, [fetchSongs]);

  const artistName = songs.length > 0 ? songs[0].artist : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-[#b3b3b3] border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-full">
      <div className="p-6 bg-gradient-to-b from-[#4a3a2a] via-[#2a2018] to-transparent">
        <div className="flex items-end gap-6">
          <div className="w-52 h-52 rounded shadow-xl bg-[#282828] flex items-center justify-center flex-shrink-0">
            <svg className="w-20 h-20 text-[#b3b3b3]" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8z" />
              <path d="M8 6.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white mb-2">Album</p>
            <h1 className="text-5xl font-bold text-white mb-6">{albumName}</h1>
            <div className="flex items-center gap-2 text-sm text-[#b3b3b3]">
              {artistName && <span className="font-semibold text-white">{artistName}</span>}
              {artistName && <span>·</span>}
              <span>{songs.length} {songs.length === 1 ? "song" : "songs"}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-4">
        {songs.length > 0 && (
          <button
            onClick={() => playQueue(songs)}
            className="w-14 h-14 bg-spotify-green rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-xl mb-6"
          >
            <svg className="w-6 h-6 text-black ml-1" fill="currentColor" viewBox="0 0 16 16">
              <path d="M3 1.713a.7.7 0 011.05-.607l10.89 6.288a.7.7 0 010 1.212L4.05 14.894A.7.7 0 013 14.288V1.713z" />
            </svg>
          </button>
        )}
      </div>

      {songs.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <p className="text-[#b3b3b3]">No songs from this album in your library.</p>
        </div>
      ) : (
        <div className="px-6">
          <div className="hidden md:grid grid-cols-[16px_4fr_minmax(120px,1fr)_minmax(80px,auto)] gap-4 px-4 py-2 border-b border-[#282828] text-[#b3b3b3] text-xs uppercase tracking-wider">
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
