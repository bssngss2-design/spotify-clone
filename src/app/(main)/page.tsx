"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { api, Playlist } from "@/lib/api";
import { useLikedSongs } from "@/hooks/useLikedSongs";

export default function HomePage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const { likedCount } = useLikedSongs();
  const [activeFilter, setActiveFilter] = useState("all");

  const fetchPlaylists = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<Playlist[]>("/api/playlists");
      setPlaylists(data);
    } catch { /* handled by api wrapper */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchPlaylists(); }, [fetchPlaylists]);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-foreground-subdued border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Filter chips */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setActiveFilter("all")} className={`px-3 py-1.5 text-sm font-semibold rounded-full cursor-pointer transition-colors ${activeFilter === "all" ? "bg-white text-black" : "bg-background-tinted text-white hover:bg-background-highlight"}`}>All</button>
        <button onClick={() => setActiveFilter("music")} className={`px-3 py-1.5 text-sm font-semibold rounded-full cursor-pointer transition-colors ${activeFilter === "music" ? "bg-white text-black" : "bg-background-tinted text-white hover:bg-background-highlight"}`}>Music</button>
        <button onClick={() => setActiveFilter("podcasts")} className={`px-3 py-1.5 text-sm font-semibold rounded-full cursor-pointer transition-colors ${activeFilter === "podcasts" ? "bg-white text-black" : "bg-background-tinted text-white hover:bg-background-highlight"}`}>Podcasts</button>
      </div>

      {/* Quick-access grid (like Spotify's top bento) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-8">
        {/* Liked Songs card */}
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

        {/* Playlist cards */}
        {playlists.slice(0, 7).map((playlist) => (
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

      {/* Made For You section */}
      {playlists.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">{getGreeting()}</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {playlists.map((playlist) => (
              <Link
                key={playlist.id}
                href={`/playlist/${playlist.id}`}
                className="bg-background-tinted p-4 rounded-md hover:bg-background-highlight transition-colors group"
              >
                <div className="w-full aspect-square bg-background-highlight rounded-md mb-4 flex items-center justify-center shadow-lg">
                  <svg className="w-12 h-12 text-foreground-subdued" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M15 4v12.167a3.5 3.5 0 11-3.5-3.5H13V4h2zm-2 10.667h-1.5a1.5 1.5 0 100 3 1.5 1.5 0 001.5-1.5v-1.5z" />
                  </svg>
                </div>
                <p className="text-white font-semibold truncate mb-1">{playlist.name}</p>
                <p className="text-sm text-foreground-subdued truncate">Playlist · B</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {playlists.length === 0 && likedCount === 0 && (
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold text-white mb-2">Welcome to Spotify</h2>
          <p className="text-foreground-subdued">Create playlists and like songs to see them here.</p>
        </div>
      )}
    </div>
  );
}
