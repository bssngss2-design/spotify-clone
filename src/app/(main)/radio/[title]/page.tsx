"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { createClient, Song } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { usePlayer } from "@/context/PlayerContext";
import { useLikedSongs } from "@/hooks/useLikedSongs";
import { useToast } from "@/hooks/useToast";
import { formatDuration } from "@/lib/audioUtils";
import { TrackRow } from "@/components/TrackRow";

function seededRandom(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export default function RadioPage() {
  const params = useParams();
  const songTitle = decodeURIComponent(params.title as string);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { playQueue, currentSong, toggleShuffle } = usePlayer();
  const { isLiked, toggleLike } = useLikedSongs();
  const { toast } = useToast();
  const supabase = createClient();

  const fetchSongs = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("songs")
      .select("*")
      .order("title");
    if (data) setSongs(data);
    setLoading(false);
  }, [user, supabase]);

  useEffect(() => { fetchSongs(); }, [fetchSongs]);

  const seed = seededRandom(songTitle);
  const saves = (seed % 40000) + 10000;
  const totalDuration = songs.reduce((acc, s) => acc + s.duration, 0);
  const hours = Math.floor(totalDuration / 3600);
  const mins = Math.floor((totalDuration % 3600) / 60);
  const durationStr = hours > 0 ? `about ${hours} hr ${mins} min` : `about ${mins} min`;

  const artists = [...new Set(songs.map(s => s.artist).filter(Boolean))];
  const artistStr = artists.length > 3
    ? `With ${artists[0]}, ${artists[1]}, ${artists[2]} and more`
    : artists.length > 0
    ? `With ${artists.join(", ")}`
    : "";

  const coverSong = songs.find(s => s.title.toLowerCase().includes(songTitle.toLowerCase().split(" ")[0]));
  const coverUrl = coverSong?.cover_url || songs[0]?.cover_url;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-[#b3b3b3] border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="p-6 bg-gradient-to-b from-[#1a6b4a] via-[#125e3f] to-transparent">
        <div className="flex items-end gap-6">
          {/* Cover art with RADIO badge */}
          <div className="w-52 h-52 rounded shadow-xl flex-shrink-0 relative overflow-hidden bg-gradient-to-br from-[#1db954] to-[#0a3d22]">
            {coverUrl ? (
              <img src={coverUrl} alt={songTitle} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg className="w-20 h-20 text-white/40" fill="currentColor" viewBox="0 0 24 24"><path d="M15 4v12.167a3.5 3.5 0 11-3.5-3.5H13V4h2zm-2 10.667h-1.5a1.5 1.5 0 100 3 1.5 1.5 0 001.5-1.5v-1.5z" /></svg>
              </div>
            )}
            {/* Spotify logo */}
            <div className="absolute top-2 left-2">
              <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" /></svg>
            </div>
            {/* RADIO badge */}
            <div className="absolute top-2 right-2 bg-black/60 px-2 py-0.5 rounded text-[10px] font-bold text-white tracking-wider">
              RADIO
            </div>
            {/* Song title overlay at bottom */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
              <p className="text-white font-bold text-sm truncate">{songTitle}</p>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white/80 mb-2">Public Playlist</p>
            <h1 className="text-5xl font-bold text-white mb-4">{songTitle} Radio</h1>
            {artistStr && <p className="text-sm text-white/70 mb-1">{artistStr}</p>}
            <div className="flex items-center gap-1 text-sm text-white/70">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-[#1db954]"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" /></svg>
              <span className="font-bold text-white">Spotify</span>
              <span>·</span>
              <span>{saves.toLocaleString()} saves</span>
              <span>·</span>
              <span>{songs.length} songs, {durationStr}</span>
            </div>
            <p className="text-xs text-white/50 mt-1">About recommendations and the impact of promotion</p>
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div className="px-6 py-4 flex items-center gap-4">
        {songs.length > 0 && (
          <button onClick={() => playQueue(songs)} className="w-14 h-14 bg-spotify-green rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-xl">
            <svg className="w-6 h-6 text-black ml-1" fill="currentColor" viewBox="0 0 16 16"><path d="M3 1.713a.7.7 0 011.05-.607l10.89 6.288a.7.7 0 010 1.212L4.05 14.894A.7.7 0 013 14.288V1.713z" /></svg>
          </button>
        )}
        {songs.length > 0 && coverUrl && (
          <div className="w-12 h-12 rounded border-2 border-[#3e3e3e] overflow-hidden flex-shrink-0">
            <img src={coverUrl} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        {songs.length > 0 && (
          <button onClick={() => { playQueue(songs); toggleShuffle(); }} className="relative w-10 h-10 flex items-center justify-center text-spotify-green hover:text-spotify-green-hover transition-colors">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 16 16"><path d="M13.151.922a.75.75 0 10-1.06 1.06L13.109 3H11.16a3.75 3.75 0 00-2.873 1.34l-6.173 7.356A2.25 2.25 0 01.39 12.5H0V14h.391a3.75 3.75 0 002.873-1.34l6.173-7.356a2.25 2.25 0 011.724-.804h1.947l-1.017 1.018a.75.75 0 001.06 1.06l2.306-2.306a.75.75 0 000-1.06L13.15.922zM.391 3.5H0V2h.391c1.109 0 2.16.49 2.873 1.34L4.89 5.277l-.979 1.167-1.796-2.14A2.25 2.25 0 00.39 3.5z" /><path d="M7.5 10.723l.98-1.167.957 1.14a2.25 2.25 0 001.724.804h1.947l-1.017-1.018a.75.75 0 111.06-1.06l2.306 2.306a.75.75 0 010 1.06l-2.306 2.306a.75.75 0 11-1.06-1.06L13.109 13H11.16a3.75 3.75 0 01-2.873-1.34l-.787-.938z" /></svg>
            <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-spotify-green" />
          </button>
        )}
        <button onClick={() => toast("Add to library is not available yet")} className="w-8 h-8 flex items-center justify-center text-[#b3b3b3] hover:text-white transition-colors" title="Add to Your Library">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 16 16"><path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8z" /><path d="M11.75 8a.75.75 0 01-.75.75H8.75v2.25a.75.75 0 01-1.5 0V8.75H5a.75.75 0 010-1.5h2.25V5a.75.75 0 011.5 0v2.25H11a.75.75 0 01.75.75z" /></svg>
        </button>
        <button onClick={() => toast("Download is not available yet")} className="w-8 h-8 flex items-center justify-center text-[#b3b3b3] hover:text-white transition-colors" title="Download">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 16 16"><path d="M4.995 8.745a.75.75 0 011.06 0L7.25 9.939V4a.75.75 0 011.5 0v5.94l1.195-1.195a.75.75 0 011.06 1.06L8 12.811l-3.005-3.006a.75.75 0 010-1.06z" /><path d="M0 8a8 8 0 1116 0A8 8 0 010 8zm8-6.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13z" /></svg>
        </button>
        <button onClick={() => toast("More options")} className="w-8 h-8 flex items-center justify-center text-[#b3b3b3] hover:text-white transition-colors" title="More options">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 16 16"><path d="M3 8a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm6.5 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM16 8a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" /></svg>
        </button>

        <div className="flex-1" />
        <span className="text-sm text-[#b3b3b3]">List</span>
        <svg className="w-4 h-4 text-[#b3b3b3]" fill="currentColor" viewBox="0 0 16 16"><path d="M15 14.5H5V13h10v1.5zm0-5.75H5v-1.5h10v1.5zM15 3H5V1.5h10V3zM3 3H1V1.5h2V3zm0 5.75H1v-1.5h2v1.5zM3 14.5H1V13h2v1.5z" /></svg>
      </div>

      {/* Column headers */}
      {songs.length > 0 && (
        <div className="px-6">
          <div className="hidden md:grid grid-cols-[16px_4fr_minmax(120px,1fr)_minmax(120px,1fr)_minmax(80px,auto)] gap-4 px-4 py-2 border-b border-[#282828] text-[#b3b3b3] text-xs uppercase tracking-wider">
            <div className="flex items-center justify-center">#</div>
            <div>Title</div>
            <div>Album</div>
            <div>Date added</div>
            <div className="flex justify-end">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16"><path d="M8 3.5a.5.5 0 00-1 0V9a.5.5 0 00.252.434l3.5 2a.5.5 0 00.496-.868L8 8.71V3.5z" /><path d="M8 16A8 8 0 108 0a8 8 0 000 16zm7-8A7 7 0 111 8a7 7 0 0114 0z" /></svg>
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

      {songs.length === 0 && (
        <div className="px-6 py-12 text-center">
          <p className="text-[#b3b3b3]">No songs in your library to generate a radio.</p>
        </div>
      )}
    </div>
  );
}
