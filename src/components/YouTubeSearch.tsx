"use client";

import { useState, FormEvent, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Song } from "@/lib/supabase";

interface YouTubeResult {
  id: string;
  title: string;
  channel: string;
  duration: string;
  thumbnail: string;
  url: string;
}

interface YouTubeSearchProps {
  onSongAdded: (song: Song) => void;
}

export function YouTubeSearch({ onSongAdded }: YouTubeSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<YouTubeResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Clear results when search is emptied
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setError(null);
    }
  }, [query]);

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setSearching(true);
    setError(null);
    setResults([]);

    try {
      const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Search failed");
      }

      setResults(data.results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setSearching(false);
    }
  };

  const handleDownload = async (video: YouTubeResult) => {
    if (!user || downloading) return;

    setDownloading(video.id);
    setError(null);

    try {
      const res = await fetch("/api/youtube/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId: video.id,
          title: video.title,
          userId: user.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Download failed");
      }

      if (data.song) {
        onSongAdded(data.song);
        // Remove from results after successful download
        setResults((prev) => prev.filter((r) => r.id !== video.id));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed");
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="mb-6">
      {/* Search form */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <div className="flex-1 relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search YouTube for songs..."
            className="w-full px-4 py-3 pl-10 bg-background-tinted border border-border rounded-full text-white placeholder-foreground-muted focus:outline-none focus:border-foreground-subdued transition-colors"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-muted"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <button
          type="submit"
          disabled={searching || !query.trim()}
          className="px-6 py-3 bg-spotify-green text-black font-semibold rounded-full hover:bg-spotify-green-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {searching ? "Searching..." : "Search"}
        </button>
      </form>

      {/* Error */}
      {error && (
        <div className="p-3 mb-4 bg-red-500/10 border border-red-500/50 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-foreground-subdued mb-3">
            {results.length} results from YouTube
          </p>
          {results.map((video) => (
            <div
              key={video.id}
              className="flex items-center gap-3 p-3 bg-background-tinted rounded-lg hover:bg-card-hover transition-colors"
            >
              {/* Thumbnail */}
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-16 h-12 object-cover rounded flex-shrink-0"
              />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{video.title}</p>
                <p className="text-sm text-foreground-subdued truncate">
                  {video.channel} • {video.duration}
                </p>
              </div>

              {/* Download button */}
              <button
                onClick={() => handleDownload(video)}
                disabled={downloading !== null}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
                  downloading === video.id
                    ? "bg-foreground-muted text-black"
                    : "bg-white text-black hover:scale-105"
                }`}
              >
                {downloading === video.id ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M.5 9.9a.5.5 0 01.5.5v2.5a1 1 0 001 1h12a1 1 0 001-1v-2.5a.5.5 0 011 0v2.5a2 2 0 01-2 2H2a2 2 0 01-2-2v-2.5a.5.5 0 01.5-.5z" />
                      <path d="M7.646 11.854a.5.5 0 00.708 0l3-3a.5.5 0 00-.708-.708L8.5 10.293V1.5a.5.5 0 00-1 0v8.793L5.354 8.146a.5.5 0 10-.708.708l3 3z" />
                    </svg>
                    Add
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Empty state after search */}
      {!searching && results.length === 0 && query && (
        <p className="text-center text-foreground-subdued py-4">
          No results found. Try a different search.
        </p>
      )}
    </div>
  );
}
