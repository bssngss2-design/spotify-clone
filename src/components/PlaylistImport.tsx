"use client";

import { useEffect, useRef, useSyncExternalStore, ChangeEvent } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Song } from "@/lib/supabase";
import { parsePlaylistCsv } from "@/lib/parsePlaylistCsv";
import {
  getImportState,
  subscribeImport,
  onImportSongAdded,
  loadImportTracks,
  setImportPlaylistName,
  setImportError,
  startImport,
  stopImport,
  resetImportUi,
  type RowStatus,
} from "@/lib/playlistImportRunner";

interface PlaylistImportProps {
  onSongAdded: (song: Song) => void;
}

export function PlaylistImport({ onSongAdded }: PlaylistImportProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const onSongAddedRef = useRef(onSongAdded);
  onSongAddedRef.current = onSongAdded;

  const state = useSyncExternalStore(
    subscribeImport,
    getImportState,
    getImportState
  );

  useEffect(() => {
    return onImportSongAdded((song) => {
      onSongAddedRef.current(song);
    });
  }, []);

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || state.running) return;

    try {
      const text = await file.text();
      const tracks = parsePlaylistCsv(text);
      const base = file.name.replace(/\.csv$/i, "").trim();
      const suggested = base
        ? base.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
        : undefined;
      loadImportTracks(tracks, suggested);
    } catch (err) {
      setImportError(
        err instanceof Error ? err.message : "Failed to parse CSV"
      );
    }
  };

  const {
    rows,
    running,
    progress,
    playlistId,
    playlistName,
    error,
    phase,
    phaseMessage,
    prep,
  } = state;

  const pendingCount = rows.filter(
    (r) => r.status === "pending" || r.status === "error" || r.status === "skipped"
  ).length;

  return (
    <div
      className="mb-6 p-4 bg-background-tinted rounded-lg border border-border"
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Import Spotify CSV</h2>
          <p className="text-sm text-foreground-subdued">
            Reuses a playlist with the same name, skips songs already in it, then
            downloads only what&apos;s missing.
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={handleFile}
          disabled={running}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={running}
          className="px-4 py-2 bg-white text-black text-sm font-semibold rounded-full hover:scale-105 disabled:opacity-50 transition-all"
        >
          Choose CSV
        </button>
      </div>

      {/* Only while actively preparing/importing — hides when done */}
      {running && (phase === "preparing" || phase === "importing") && (
        <div className="mb-3 p-3 rounded-lg border text-sm bg-spotify-green/10 border-spotify-green/40">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-spotify-green border-t-transparent rounded-full animate-spin flex-shrink-0" />
            <p className="font-medium text-white">
              {phase === "preparing"
                ? "Preparing import (not stuck)…"
                : "Downloading missing songs…"}
            </p>
          </div>
          {phaseMessage && (
            <p className="mt-1 text-foreground-subdued">{phaseMessage}</p>
          )}
          {prep && (
            <p className="mt-2 text-xs text-foreground-subdued">
              {prep.reusedPlaylist ? "Using existing playlist" : "New playlist"}
              {" · "}
              {prep.alreadyInPlaylist} already in playlist
              {" · "}
              {prep.linkedFromLibrary} linked from library
              {" · "}
              {prep.toDownload} to download
            </p>
          )}
        </div>
      )}

      {rows.length > 0 && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex-1 min-w-[180px]">
              <span className="block text-xs text-foreground-subdued mb-1">
                Playlist name (matches an existing one if present)
              </span>
              <input
                type="text"
                value={playlistName}
                onChange={(e) => setImportPlaylistName(e.target.value)}
                disabled={running}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-white text-sm focus:outline-none focus:border-foreground-subdued disabled:opacity-60"
              />
            </label>
            {!running ? (
              <button
                type="button"
                onClick={() => {
                  if (!user) {
                    setImportError("Log in first, then click Import.");
                    return;
                  }
                  void startImport(user.id);
                }}
                className="px-5 py-2 bg-spotify-green text-black text-sm font-semibold rounded-full hover:bg-spotify-green-hover transition-colors"
              >
                Import {rows.length} tracks
                {pendingCount < rows.length
                  ? ` (${pendingCount} left)`
                  : ""}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => stopImport()}
                className="px-5 py-2 bg-red-500/20 text-red-400 text-sm font-semibold rounded-full border border-red-500/40"
              >
                Stop
              </button>
            )}
            {!running && (
              <button
                type="button"
                onClick={() => resetImportUi()}
                className="px-3 py-2 text-sm text-foreground-subdued hover:text-white transition-colors"
              >
                Clear
              </button>
            )}
          </div>
          {!user && (
            <p className="text-xs text-yellow-400">
              You&apos;re not logged in — Import won&apos;t start until you sign in.
            </p>
          )}

          <div className="flex items-center justify-between text-sm text-foreground-subdued">
            <span>
              {progress.done}/{progress.total} processed
              {progress.already
                ? ` · ${progress.already} already`
                : ""}
              {progress.linked ? ` · ${progress.linked} linked` : ""}
              {progress.ok ? ` · ${progress.ok} downloaded` : ""}
              {progress.failed ? ` · ${progress.failed} failed` : ""}
            </span>
            {playlistId && (
              <a
                href={`/playlist/${playlistId}`}
                className="text-spotify-green hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                Open playlist
              </a>
            )}
          </div>

          <div className="h-1.5 bg-background rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                phase === "preparing" ? "bg-yellow-400 animate-pulse" : "bg-spotify-green"
              }`}
              style={{
                width: `${
                  phase === "preparing"
                    ? 35
                    : progress.total
                      ? Math.round((progress.done / progress.total) * 100)
                      : 0
                }%`,
              }}
            />
          </div>

          <div className="max-h-48 overflow-y-auto space-y-1 text-sm">
            {rows.map((row, i) => (
              <div
                key={`${row.track.title}-${i}`}
                className="flex items-center gap-2 px-2 py-1 rounded hover:bg-card-hover"
                onDoubleClick={(e) => e.stopPropagation()}
              >
                <StatusDot status={row.status} />
                <span className="text-white truncate flex-1">
                  {row.track.artist
                    ? `${row.track.artist} — ${row.track.title}`
                    : row.track.title}
                </span>
                {row.message && (
                  <span className="text-foreground-muted truncate max-w-[40%]">
                    {row.message}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="mt-3 p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}

function StatusDot({ status }: { status: RowStatus }) {
  const color =
    status === "done" || status === "linked"
      ? "bg-spotify-green"
      : status === "already"
        ? "bg-blue-400"
        : status === "error"
          ? "bg-red-400"
          : status === "skipped"
            ? "bg-orange-400"
            : status === "pending"
              ? "bg-foreground-muted"
              : "bg-yellow-400 animate-pulse";

  return <span className={`w-2 h-2 rounded-full flex-shrink-0 ${color}`} />;
}
