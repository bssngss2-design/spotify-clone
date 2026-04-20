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
  type MainFilter = "all" | "music" | "podcasts" | "audiobooks";
  const [activeFilter, setActiveFilter] = useState<MainFilter>("all");

  const FILTERS: { id: MainFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "music", label: "Music" },
    { id: "podcasts", label: "Podcasts" },
    { id: "audiobooks", label: "Audiobooks" },
  ];

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
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setActiveFilter(f.id)}
            className={`px-3 py-1.5 text-sm font-semibold rounded-full cursor-pointer transition-colors ${activeFilter === f.id ? "bg-white text-black" : "bg-background-tinted text-white hover:bg-background-highlight"}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {activeFilter === "podcasts" ? (
        <FilterEmptyState
          title="You don't follow any podcasts yet"
          subtitle="Follow podcasts to keep up with new episodes."
        />
      ) : activeFilter === "audiobooks" ? (
        <FilterEmptyState
          title="You don't have any audiobooks yet"
          subtitle="Find audiobooks you love in the search."
        />
      ) : (
        <MainFeed
          quickPl={quickPl}
          discover={discover}
          likedCount={likedCount}
          playlistsEmpty={playlists.length === 0}
          currentSongId={currentSong?.id}
          isLiked={isLiked}
          toggleLike={toggleLike}
          playQueue={playQueue}
        />
      )}
    </div>
  );
}

function FilterEmptyState({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mt-16 flex flex-col items-center text-center px-6">
      <div className="w-20 h-20 rounded-full bg-background-tinted flex items-center justify-center mb-6">
        <svg className="w-10 h-10 text-foreground-subdued" fill="currentColor" viewBox="0 0 16 16">
          <path d="M8 0a8 8 0 100 16A8 8 0 008 0zM7.25 4.75a.75.75 0 011.5 0v4a.75.75 0 01-1.5 0v-4zM8 11.75A.75.75 0 108 10.25.75.75 0 008 11.75z" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
      <p className="text-sm text-foreground-subdued max-w-sm">{subtitle}</p>
    </div>
  );
}

type MainFeedProps = {
  quickPl: Playlist[];
  discover: HomeDiscover | null;
  likedCount: number;
  playlistsEmpty: boolean;
  currentSongId: string | undefined;
  isLiked: (id: string) => boolean;
  toggleLike: (id: string) => void;
  playQueue: (list: import("@/lib/api").Song[], index?: number) => void;
};

function MainFeed({ quickPl, discover, likedCount, playlistsEmpty, currentSongId, isLiked, toggleLike, playQueue }: MainFeedProps) {
  return (
    <>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-10">
        <Link
          href="/liked"
          className="flex items-center bg-background-tinted hover:bg-background-highlight rounded overflow-hidden transition-colors group"
        >
          <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-[#450af5] to-[#c4efd9] flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="currentColor" viewBox="0 0 16 16">
              <path d="M1.69 2A4.582 4.582 0 018 2.023 4.583 4.583 0 0114.31 2a4.583 4.583 0 01.003 6.208L8 15.024 1.694 8.21A4.583 4.583 0 011.69 2z" />
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
            <div className="w-12 h-12 md:w-16 md:h-16 bg-background-highlight flex items-center justify-center flex-shrink-0 overflow-hidden">
              {playlist.cover_url ? (
                <img src={playlist.cover_url} alt={playlist.name} loading="eager" className="w-full h-full object-cover" />
              ) : (
                <svg className="w-5 h-5 md:w-6 md:h-6 text-foreground-subdued" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M15 4v12.167a3.5 3.5 0 11-3.5-3.5H13V4h2zm-2 10.667h-1.5a1.5 1.5 0 100 3 1.5 1.5 0 001.5-1.5v-1.5z" />
                </svg>
              )}
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
                <div className="w-full aspect-square bg-gradient-to-br from-[#333] to-[#121212] rounded-md mb-3 flex items-center justify-center shadow-lg overflow-hidden">
                  {playlist.cover_url ? (
                    <img src={playlist.cover_url} alt={playlist.name} loading="eager" className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-12 h-12 text-foreground-subdued" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M15 4v12.167a3.5 3.5 0 11-3.5-3.5H13V4h2zm-2 10.667h-1.5a1.5 1.5 0 100 3 1.5 1.5 0 001.5-1.5v-1.5z" />
                    </svg>
                  )}
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
                <div className="w-full aspect-square bg-gradient-to-br from-[#1e3264] to-[#e8115b] rounded-md mb-3 flex items-center justify-center shadow-lg overflow-hidden">
                  {playlist.cover_url ? (
                    <img src={playlist.cover_url} alt={playlist.name} loading="eager" className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-12 h-12 text-white/80" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M15 4v12.167a3.5 3.5 0 11-3.5-3.5H13V4h2zm-2 10.667h-1.5a1.5 1.5 0 100 3 1.5 1.5 0 001.5-1.5v-1.5z" />
                    </svg>
                  )}
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
                  {playlist.cover_url ? (
                    <img src={playlist.cover_url} alt={playlist.name} loading="eager" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-black text-white/90">{playlist.name.charAt(0)}</span>
                  )}
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
                isActive={currentSongId === song.id}
                isLiked={isLiked(song.id)}
                onToggleLike={() => toggleLike(song.id)}
                onPlay={() => playQueue(discover.recently_played, index)}
              />
            ))}
          </div>
        </section>
      )}

      {playlistsEmpty && likedCount === 0 && !discover?.made_for_you.length && (
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold text-white mb-2">Welcome to Spotify</h2>
          <p className="text-foreground-subdued">Run the backend seed script, then log in as demo@demo.com</p>
        </div>
      )}
    </>
  );
}
