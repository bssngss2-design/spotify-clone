"use client";

import { Song } from "@/lib/supabase";
import { formatDuration } from "@/lib/audioUtils";
import { usePlayer } from "@/context/PlayerContext";

interface TrackRowProps {
  song: Song;
  index: number;
  isActive?: boolean;
  onPlay: () => void;
  onDelete?: () => void;
}

export function TrackRow({ song, index, isActive, onPlay, onDelete }: TrackRowProps) {
  const { isPlaying } = usePlayer();

  return (
    <div
      className={`group grid grid-cols-[16px_4fr_minmax(120px,1fr)_40px] gap-4 px-4 py-2 rounded-md hover:bg-background-tinted transition-colors ${
        isActive ? "bg-background-tinted" : ""
      }`}
    >
      {/* Track number / Play button */}
      <div className="flex items-center justify-center w-4">
        <span
          className={`text-foreground-subdued text-sm ${
            isActive && isPlaying ? "hidden" : "group-hover:hidden"
          }`}
        >
          {isActive && isPlaying ? (
            <svg className="w-4 h-4 text-spotify-green" fill="currentColor" viewBox="0 0 16 16">
              <path d="M10.016 10.794a.5.5 0 00.984 0V5.206a.5.5 0 00-.984 0v5.588zm-5.032 1.803a.5.5 0 00.984 0V3.403a.5.5 0 00-.984 0v9.194z" />
            </svg>
          ) : (
            index + 1
          )}
        </span>
        <button
          onClick={onPlay}
          className={`hidden group-hover:block ${isActive && isPlaying ? "!block" : ""}`}
        >
          {isActive && isPlaying ? (
            <svg className="w-4 h-4 text-spotify-green" fill="currentColor" viewBox="0 0 16 16">
              <path d="M2.7 1a.7.7 0 00-.7.7v12.6a.7.7 0 00.7.7h2.6a.7.7 0 00.7-.7V1.7a.7.7 0 00-.7-.7H2.7zm8 0a.7.7 0 00-.7.7v12.6a.7.7 0 00.7.7h2.6a.7.7 0 00.7-.7V1.7a.7.7 0 00-.7-.7h-2.6z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 16 16">
              <path d="M3 1.713a.7.7 0 011.05-.607l10.89 6.288a.7.7 0 010 1.212L4.05 14.894A.7.7 0 013 14.288V1.713z" />
            </svg>
          )}
        </button>
      </div>

      {/* Song info */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Album art */}
        <div className="w-10 h-10 bg-background-tinted rounded flex-shrink-0 flex items-center justify-center">
          {song.cover_url ? (
            <img
              src={song.cover_url}
              alt={song.title}
              className="w-full h-full object-cover rounded"
            />
          ) : (
            <svg
              className="w-4 h-4 text-foreground-subdued"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M15 4v12.167a3.5 3.5 0 11-3.5-3.5H13V4h2zm-2 10.667h-1.5a1.5 1.5 0 100 3 1.5 1.5 0 001.5-1.5v-1.5z" />
            </svg>
          )}
        </div>
        <div className="min-w-0">
          <p
            className={`font-medium truncate ${
              isActive ? "text-spotify-green" : "text-white"
            }`}
          >
            {song.title}
          </p>
          <p className="text-sm text-foreground-subdued truncate">
            {song.artist || "Unknown artist"}
          </p>
        </div>
      </div>

      {/* Album */}
      <div className="flex items-center min-w-0">
        <span className="text-sm text-foreground-subdued truncate">
          {song.album || "—"}
        </span>
      </div>

      {/* Duration & actions */}
      <div className="flex items-center justify-end gap-2">
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="w-8 h-8 hidden group-hover:flex items-center justify-center text-foreground-subdued hover:text-white transition-colors"
            title="Delete"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
              <path d="M5.5 5.5A.5.5 0 016 6v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm2.5 0a.5.5 0 01.5.5v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm3 .5a.5.5 0 00-1 0v6a.5.5 0 001 0V6z" />
              <path
                fillRule="evenodd"
                d="M14.5 3a1 1 0 01-1 1H13v9a2 2 0 01-2 2H5a2 2 0 01-2-2V4h-.5a1 1 0 01-1-1V2a1 1 0 011-1H6a1 1 0 011-1h2a1 1 0 011 1h3.5a1 1 0 011 1v1zM4.118 4L4 4.059V13a1 1 0 001 1h6a1 1 0 001-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"
              />
            </svg>
          </button>
        )}
        <span className="text-sm text-foreground-subdued">
          {formatDuration(song.duration)}
        </span>
      </div>
    </div>
  );
}
