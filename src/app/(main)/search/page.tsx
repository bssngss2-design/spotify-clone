"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { api, Song } from "@/lib/api";
import { usePlayer } from "@/context/PlayerContext";
import { TrackRow } from "@/components/TrackRow";
import { useLikedSongs } from "@/hooks/useLikedSongs";
import { MUSIC_STYLES, BROWSE_CATEGORIES, type BrowseTile } from "@/lib/browseCategories";

function BrowseTileCard({ tile }: { tile: BrowseTile }) {
  return (
    <Link
      href={`/browse/${encodeURIComponent(tile.key)}`}
      className={`relative overflow-hidden rounded-lg min-h-[88px] md:min-h-[100px] p-3 md:p-4 flex flex-col justify-between ${tile.className} hover:scale-[1.02] transition-transform shadow-lg`}
    >
      <span className="text-white font-bold text-sm md:text-base leading-tight z-10 drop-shadow-md">
        {tile.label}
      </span>
      <img
        src={tile.image}
        alt=""
        aria-hidden
        loading="eager"
        className="absolute bottom-2 right-[-8px] w-16 h-16 md:w-20 md:h-20 rounded-md object-cover rotate-[25deg] shadow-lg translate-x-1"
      />
    </Link>
  );
}

function SearchResults() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") || "";
  const genre = searchParams.get("genre") || "";
  const [results, setResults] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const { playQueue, currentSong } = usePlayer();
  const { isLiked, toggleLike } = useLikedSongs();

  const search = useCallback(async () => {
    if (!q.trim() && !genre.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (genre.trim()) params.set("genre", genre.trim());
      const data = await api.get<Song[]>(`/api/songs?${params.toString()}`);
      setResults(data);
    } catch {
      setResults([]);
    }
    setLoading(false);
  }, [q, genre]);

  useEffect(() => {
    search();
  }, [search]);

  const showBrowse = !q.trim() && !genre.trim();

  return (
    <div className="p-6">
      {showBrowse && (
        <>
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-6">Browse all</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
              {MUSIC_STYLES.map((tile) => (
                <BrowseTileCard key={tile.key} tile={tile} />
              ))}
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-6">For you</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
              {BROWSE_CATEGORIES.map((tile) => (
                <BrowseTileCard key={tile.key} tile={tile} />
              ))}
            </div>
          </section>
        </>
      )}

      {!showBrowse && loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-foreground-subdued border-t-white rounded-full animate-spin" />
        </div>
      ) : !showBrowse && results.length === 0 ? (
        <div className="text-center py-20">
          <h2 className="text-xl font-bold text-white mb-2">
            No results{q ? ` for “${q}”` : ""}
            {genre ? ` in ${genre}` : ""}
          </h2>
          <p className="text-foreground-subdued">Check your spelling or try another genre.</p>
        </div>
      ) : !showBrowse ? (
        <>
          <h2 className="text-2xl font-bold text-white mb-4">
            {genre && !q ? `Genre: ${genre}` : q ? `Results for “${q}”` : "Results"}
          </h2>
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
          <div className="mt-2">
            {results.map((song, index) => (
              <TrackRow
                key={song.id}
                song={song}
                index={index}
                isActive={currentSong?.id === song.id}
                isLiked={isLiked(song.id)}
                onToggleLike={() => toggleLike(song.id)}
                onPlay={() => playQueue(results, index)}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-foreground-subdued border-t-white rounded-full animate-spin" />
        </div>
      }
    >
      <SearchResults />
    </Suspense>
  );
}
