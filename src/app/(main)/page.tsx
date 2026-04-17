"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { api, Playlist, HomeDiscover } from "@/lib/api";
import { useLikedSongs } from "@/hooks/useLikedSongs";
import { usePlayer } from "@/context/PlayerContext";
import { TrackRow } from "@/components/TrackRow";

export default function HomePage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [discover, setDiscover] = useState<HomeDiscover | null>(null);
  const [loading, setLoading] = useState(true);
  const { likedCount, isLiked, toggleLike } = useLikedSongs();
  const { playQueue, currentSong } = usePlayer();
  const [activeFilter, setActiveFilter] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [plData, disc] = await Promise.all([
        api.get<Playlist[]>("/api/playlists"),
        api.get<HomeDiscover>("/api/discover/home"),
      ]);
      setPlaylists(plData);
      setDiscover(disc);
    } catch {
      /* api wrapper */
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-foreground-subdued border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  const quickPl = playlists.slice(0, 7);

  return (
    <div className="p-6">
      <div className="flex gap-2 mb-6">
        <button
          type="button"
          onClick={() => setActiveFilter("all")}
          className={`px-3 py-1.5 text-sm font-semibold rounded-full cursor-pointer transition-colors ${activeFilter === "all" ? "bg-white text-black" : "bg-background-tinted text-white hover:bg-background-highlight"}`}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter("music")}
          className={`px-3 py-1.5 text-sm font-semibold rounded-full cursor-pointer transition-colors ${activeFilter === "music" ? "bg-white text-black" : "bg-background-tinted text-white hover:bg-background-highlight"}`}
        >
          Music
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter("podcasts")}
          className={`px-3 py-1.5 text-sm font-semibold rounded-full cursor-pointer transition-colors ${activeFilter === "podcasts" ? "bg-white text-black" : "bg-background-tinted text-white hover:bg-background-highlight"}`}
        >
          Podcasts
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-10">
        <Link
          href="/liked"
          className="flex items-center bg-background-tinted hover:bg-background-highlight rounded overflow-hidden transition-colors group"
        >
          <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-[#450af5] to-[#c4efd9] flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="currentColor" viewBox="0 0 16 16">
              <path d="M15.724 4.22A4.313 4.313 0 0012.192.814a4.269 4.269 0 00-3.622 1.13.837.837 0 01-1.14 0 4.272 4.272 0 00-6.38 5.57l5.593 7.434a1.12 1.12 0 001.733-.074l.033-.044 5.315-7.315z" />
            </svg>
          </div>
          <span className="px-3 text-sm font-bold text-white truncate">Liked Songs</span>
        </Link>

        {quickPl.map((playlist) => (
          <Link
            key={playlist.id}
            href={`/playlist/${playlist.id}`}
            className="flex items-center bg-background-tinted hover:bg-background-highlight rounded overflow-hidden transition-colors group"
          >
            <div className="w-12 h-12 md:w-16 md:h-16 bg-background-highlight flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 md:w-6 md:h-6 text-foreground-subdued" fill="currentColor" viewBox="0 0 24 24">
                <path d="M15 4v12.167a3.5 3.5 0 11-3.5-3.5H13V4h2zm-2 10.667h-1.5a1.5 1.5 0 100 3 1.5 1.5 0 001.5-1.5v-1.5z" />
              </svg>
            </div>
            <span className="px-3 text-sm font-bold text-white truncate">{playlist.name}</span>
          </Link>
        ))}
      </div>

      {discover && discover.made_for_you.length > 0 && (
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">Made for you</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {discover.made_for_you.map((playlist) => (
              <Link
                key={playlist.id}
                href={`/playlist/${playlist.id}`}
                className="bg-background-tinted p-4 rounded-md hover:bg-background-highlight transition-colors group min-w-0"
              >
                <div className="w-full aspect-square bg-gradient-to-br from-[#333] to-[#121212] rounded-md mb-3 flex items-center justify-center shadow-lg">
                  <svg className="w-12 h-12 text-foreground-subdued" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M15 4v12.167a3.5 3.5 0 11-3.5-3.5H13V4h2zm-2 10.667h-1.5a1.5 1.5 0 100 3 1.5 1.5 0 001.5-1.5v-1.5z" />
                  </svg>
                </div>
                <p className="text-white font-semibold truncate text-sm">{playlist.name}</p>
                <p className="text-xs text-foreground-subdued truncate">Playlist</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {discover && discover.new_releases.length > 0 && (
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">New releases</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {discover.new_releases.map((playlist) => (
              <Link
                key={playlist.id}
                href={`/playlist/${playlist.id}`}
                className="bg-background-tinted p-4 rounded-md hover:bg-background-highlight transition-colors group min-w-0"
              >
                <div className="w-full aspect-square bg-gradient-to-br from-[#1e3264] to-[#e8115b] rounded-md mb-3 flex items-center justify-center shadow-lg">
                  <svg className="w-12 h-12 text-white/80" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M15 4v12.167a3.5 3.5 0 11-3.5-3.5H13V4h2zm-2 10.667h-1.5a1.5 1.5 0 100 3 1.5 1.5 0 001.5-1.5v-1.5z" />
                  </svg>
                </div>
                <p className="text-white font-semibold truncate text-sm">{playlist.name}</p>
                <p className="text-xs text-foreground-subdued truncate">Playlist</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {discover && discover.popular_artists.length > 0 && (
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">Popular artists</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {discover.popular_artists.map((playlist) => (
              <Link
                key={playlist.id}
                href={`/playlist/${playlist.id}`}
                className="bg-background-tinted p-4 rounded-md hover:bg-background-highlight transition-colors group min-w-0 text-center"
              >
                <div className="w-full aspect-square max-w-[160px] mx-auto rounded-full bg-gradient-to-br from-[#450af5] to-[#e8115b] mb-3 flex items-center justify-center shadow-lg overflow-hidden">
                  <span className="text-2xl font-black text-white/90">{playlist.name.charAt(0)}</span>
                </div>
                <p className="text-white font-semibold truncate text-sm">{playlist.name}</p>
                <p className="text-xs text-foreground-subdued truncate">Artist</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {discover && discover.recently_played.length > 0 && (
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">Recently played</h2>
          <div className="hidden md:grid grid-cols-[16px_4fr_minmax(120px,1fr)_40px] gap-4 px-4 py-2 border-b border-border text-foreground-subdued text-xs uppercase tracking-wider">
            <div className="flex items-center justify-center">#</div>
            <div>Title</div>
            <div>Album</div>
            <div />
          </div>
          <div className="mt-2">
            {discover.recently_played.map((song, index) => (
              <TrackRow
                key={song.id}
                song={song}
                index={index}
                isActive={currentSong?.id === song.id}
                isLiked={isLiked(song.id)}
                onToggleLike={() => toggleLike(song.id)}
                onPlay={() => playQueue(discover.recently_played, index)}
              />
            ))}
          </div>
        </section>
      )}

      {playlists.length === 0 && likedCount === 0 && !discover?.made_for_you.length && (
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold text-white mb-2">Welcome to Spotify</h2>
          <p className="text-foreground-subdued">Run the backend seed script, then log in as demo@demo.com</p>
        </div>
      )}
    </div>
  );
}
