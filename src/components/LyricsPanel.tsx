"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePlayer } from "@/context/PlayerContext";

interface LyricLine {
  time: number;
  text: string;
}

function parseSyncedLyrics(synced: string): LyricLine[] {
  const lines: LyricLine[] = [];
  for (const line of synced.split("\n")) {
    const match = line.match(/^\[(\d+):(\d+\.\d+)\]\s*(.*)$/);
    if (match) {
      const mins = parseInt(match[1]);
      const secs = parseFloat(match[2]);
      lines.push({ time: mins * 60 + secs, text: match[3] });
    }
  }
  return lines;
}

interface LyricsPanelProps {
  onClose: () => void;
}

export function LyricsPanel({ onClose }: LyricsPanelProps) {
  const { currentSong, currentTime } = usePlayer();
  const [lyrics, setLyrics] = useState<LyricLine[] | null>(null);
  const [plainLyrics, setPlainLyrics] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLParagraphElement>(null);

  const fetchLyrics = useCallback(async () => {
    if (!currentSong) return;
    setLoading(true);
    setError(false);
    setLyrics(null);
    setPlainLyrics(null);

    try {
      const params = new URLSearchParams({
        track: currentSong.title,
        artist: currentSong.artist || "",
      });
      if (currentSong.album) params.set("album", currentSong.album);
      if (currentSong.duration) params.set("duration", String(currentSong.duration));

      const res = await fetch(`/api/lyrics?${params.toString()}`);
      const data = await res.json();

      if (data.syncedLyrics) {
        setLyrics(parseSyncedLyrics(data.syncedLyrics));
      } else if (data.plainLyrics) {
        setPlainLyrics(data.plainLyrics);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    }
    setLoading(false);
  }, [currentSong]);

  useEffect(() => {
    fetchLyrics();
  }, [fetchLyrics]);

  useEffect(() => {
    if (activeRef.current && containerRef.current) {
      activeRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [currentTime, lyrics]);

  const activeLine = lyrics
    ? lyrics.reduce((acc, line, i) => (currentTime >= line.time ? i : acc), 0)
    : -1;

  if (!currentSong) return null;

  return (
    <aside className="w-[320px] h-full bg-background-elevated rounded-lg m-2 ml-0 flex flex-col overflow-hidden flex-shrink-0">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <span className="text-base font-bold text-white">Lyrics</span>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-foreground-subdued hover:text-white transition-colors" title="Close">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16"><path d="M4.646 4.646a.5.5 0 01.708 0L8 7.293l2.646-2.647a.5.5 0 01.708.708L8.707 8l2.647 2.646a.5.5 0 01-.708.708L8 8.707l-2.646 2.647a.5.5 0 01-.708-.708L7.293 8 4.646 5.354a.5.5 0 010-.708z" /></svg>
        </button>
      </div>

      <div ref={containerRef} className="flex-1 overflow-y-auto min-h-0 px-4 pb-4">
        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-foreground-subdued border-t-white rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <p className="text-foreground-subdued text-sm">No lyrics available for this song.</p>
          </div>
        )}

        {/* Synced lyrics */}
        {lyrics && lyrics.length > 0 && (
          <div className="space-y-4 py-4">
            {lyrics.map((line, i) => (
              <p
                key={i}
                ref={i === activeLine ? activeRef : null}
                className={`text-2xl font-bold leading-snug transition-colors duration-300 cursor-pointer ${
                  i === activeLine
                    ? "text-white"
                    : i < activeLine
                      ? "text-foreground-muted"
                      : "text-foreground-subdued"
                }`}
              >
                {line.text || "♪"}
              </p>
            ))}
          </div>
        )}

        {/* Plain lyrics (no timestamps) */}
        {plainLyrics && (
          <div className="py-4">
            {plainLyrics.split("\n").map((line, i) => (
              <p key={i} className="text-lg font-semibold text-foreground-subdued leading-relaxed mb-2">
                {line || " "}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border">
        <p className="text-[10px] text-foreground-muted">Lyrics provided by LRCLIB</p>
      </div>
    </aside>
  );
}
