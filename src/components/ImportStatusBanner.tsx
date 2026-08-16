"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import {
  getImportState,
  subscribeImport,
  stopImport,
  dismissImportBanner,
} from "@/lib/playlistImportRunner";

/**
 * Global import progress — only while a job is actively running.
 * Disappears when import finishes; Stop + Dismiss available while active/paused.
 */
export function ImportStatusBanner() {
  const state = useSyncExternalStore(
    subscribeImport,
    getImportState,
    getImportState
  );

  const {
    running,
    progress,
    playlistId,
    playlistName,
    rows,
    phase,
    phaseMessage,
    bannerDismissed,
  } = state;

  // Only while actively importing/preparing (auto-hides when done)
  const visible =
    !bannerDismissed &&
    running &&
    rows.length > 0 &&
    (phase === "preparing" || phase === "importing");

  if (!visible) return null;

  const pct =
    phase === "preparing"
      ? 30
      : progress.total
        ? Math.round((progress.done / progress.total) * 100)
        : 0;

  const title =
    phase === "preparing"
      ? `Preparing “${playlistName}”…`
      : `Importing “${playlistName}”…`;

  return (
    <div className="flex-shrink-0 border-t border-border bg-background-tinted px-4 py-2 z-30">
      <div className="flex items-center gap-3 max-w-5xl mx-auto">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 rounded-full bg-spotify-green animate-pulse flex-shrink-0" />
            <span className="text-white font-medium truncate">{title}</span>
            <span className="text-foreground-subdued whitespace-nowrap text-xs sm:text-sm">
              {phase === "preparing"
                ? "checking playlist…"
                : `${progress.done}/${progress.total}`}
              {progress.already ? ` · ${progress.already} already` : ""}
              {progress.linked ? ` · ${progress.linked} linked` : ""}
              {progress.ok ? ` · ${progress.ok} new` : ""}
              {progress.failed ? ` · ${progress.failed} failed` : ""}
            </span>
          </div>
          {phaseMessage && (
            <p className="text-xs text-foreground-muted truncate mt-0.5">
              {phaseMessage}
            </p>
          )}
          <div className="mt-1.5 h-1 bg-background rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                phase === "preparing" ? "bg-yellow-400" : "bg-spotify-green"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {playlistId && (
          <Link
            href={`/playlist/${playlistId}`}
            className="text-sm text-spotify-green hover:underline whitespace-nowrap"
          >
            Open playlist
          </Link>
        )}
        <button
          type="button"
          onClick={() => stopImport()}
          className="px-3 py-1.5 text-sm font-semibold rounded-full bg-red-500/20 text-red-400 border border-red-500/40 whitespace-nowrap"
        >
          Stop
        </button>
        <button
          type="button"
          onClick={() => {
            stopImport();
            dismissImportBanner();
          }}
          className="w-8 h-8 flex items-center justify-center text-foreground-subdued hover:text-white rounded-full hover:bg-background transition-colors"
          title="Hide"
          aria-label="Hide import status"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
