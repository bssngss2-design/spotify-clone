"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api, Song } from "@/lib/api";
import { usePlayer } from "@/context/PlayerContext";
import { useLikedSongs } from "@/hooks/useLikedSongs";
import { TrackRow } from "@/components/TrackRow";
import { formatDuration } from "@/lib/audioUtils";
import { BROWSE_TILE_BY_KEY } from "@/lib/browseCategories";
import { SUB_PLAYLIST_META } from "@/lib/genreLanding";

const PICSUM = (seed: string) => `https://picsum.photos/seed/${encodeURIComponent(seed)}/400/400`;

export default function SubPlaylistPage() {
  const params = useParams();
  const rawKey = decodeURIComponent(params.key as string);
  const slug = decodeURIComponent(params.slug as string);
  const tile = BROWSE_TILE_BY_KEY[rawKey];
  const label = tile?.label ?? rawKey;
  const gradient = tile?.className ?? "bg-gradient-to-b from-[#535353] to-transparent";

  const meta = SUB_PLAYLIST_META[slug];
  const title = meta ? meta.title(label) : `${slug} — ${label}`;
  const subtitle = meta ? meta.subtitle(label) : "";
  const coverImage = PICSUM(meta ? meta.coverSeed(rawKey) : `${rawKey}-${slug}`);

  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const { playQueue, currentSong } = usePlayer();
  const { isLiked, toggleLike } = useLikedSongs();

  const fetchSongs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<Song[]>("/api/songs?genre=" + encodeURIComponent(rawKey));
      setSongs(data);
    } catch {
      setSongs([]);
    }
    setLoading(false);
  }, [rawKey]);

  useEffect(() => {
    fetchSongs();
  }, [fetchSongs]);

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
      <div className={`p-6 ${gradient}`}>
        <div className="flex items-end gap-6">
          <div className="w-52 h-52 rounded shadow-xl overflow-hidden flex-shrink-0 bg-background-tinted">
            <img src={coverImage} alt={title} loading="eager" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white mb-2">Playlist</p>
            <h1 className="text-5xl font-bold text-white mb-4 truncate">{title}</h1>
            {subtitle && <p className="text-sm text-white/80 mb-4 line-clamp-2">{subtitle}</p>}
            <div className="flex items-center gap-2 text-sm text-foreground-subdued">
              <Link href={`/browse/${encodeURIComponent(rawKey)}`} className="font-semibold text-white hover:underline">
                {label}
              </Link>
              <span>·</span>
              <span>Spotify</span>
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

      <div className="px-6 py-4">
        {songs.length > 0 && (
          <button
            onClick={() => playQueue(songs)}
            className="w-14 h-14 bg-spotify-green rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-xl mb-6"
            title={`Play ${title}`}
          >
            <svg className="w-6 h-6 text-black ml-1" fill="currentColor" viewBox="0 0 16 16">
              <path d="M3 1.713a.7.7 0 011.05-.607l10.89 6.288a.7.7 0 010 1.212L4.05 14.894A.7.7 0 013 14.288V1.713z" />
            </svg>
          </button>
        )}
      </div>

      {songs.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <p className="text-foreground-subdued">No tracks in {title} yet.</p>
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
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
