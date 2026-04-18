"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api, Song } from "@/lib/api";
import { BROWSE_TILE_BY_KEY } from "@/lib/browseCategories";
import { getGenreSections, type GenreCard } from "@/lib/genreLanding";

export default function BrowseGenrePage() {
  const params = useParams();
  const rawKey = decodeURIComponent(params.key as string);
  const tile = BROWSE_TILE_BY_KEY[rawKey];
  const label = tile?.label ?? rawKey;
  const gradient = tile?.className ?? "bg-gradient-to-br from-[#1e3264] to-[#0d47a1]";

  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);

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

  const sections = getGenreSections(rawKey, label, songs);

  return (
    <div className="min-h-full">
      {/* Solid-color banner with the genre name (matches Spotify's genre landing) */}
      <div className={`${gradient} px-6 pt-10 pb-8`}>
        <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight leading-none">
          {label}
        </h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-foreground-subdued border-t-white rounded-full animate-spin" />
        </div>
      ) : sections.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <p className="text-foreground-subdued">No {label} content yet.</p>
        </div>
      ) : (
        <div className="px-6 pb-8 space-y-8 pt-6">
          {sections.map((section) => (
            <section key={section.title}>
              <div className="flex items-baseline justify-between mb-4">
                <h2 className="text-2xl font-bold text-white hover:underline cursor-pointer">
                  {section.title}
                </h2>
                <button className="text-sm font-semibold text-foreground-subdued hover:underline">
                  Show all
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {section.cards.map((card) => (
                  <BrowseCard key={card.href} card={card} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function BrowseCard({ card }: { card: GenreCard }) {
  const imgClass = card.shape === "circle"
    ? "w-full aspect-square object-cover rounded-full shadow-lg"
    : "w-full aspect-square object-cover rounded shadow-lg";

  return (
    <Link
      href={card.href}
      className="group p-3 md:p-4 rounded-md bg-[#181818] hover:bg-[#282828] transition-colors relative"
    >
      <div className="relative">
        <img src={card.image} alt={card.title} loading="eager" className={imgClass} />
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          className="absolute bottom-2 right-2 w-12 h-12 rounded-full bg-spotify-green flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all shadow-xl"
          aria-label={`Play ${card.title}`}
        >
          <svg className="w-5 h-5 text-black ml-0.5" fill="currentColor" viewBox="0 0 16 16">
            <path d="M3 1.713a.7.7 0 011.05-.607l10.89 6.288a.7.7 0 010 1.212L4.05 14.894A.7.7 0 013 14.288V1.713z" />
          </svg>
        </button>
      </div>
      <p className="mt-3 text-white font-semibold text-sm truncate">{card.title}</p>
      <p className="mt-1 text-xs text-foreground-subdued line-clamp-2">{card.subtitle}</p>
    </Link>
  );
}
