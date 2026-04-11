"use client";

import { Song } from "@/lib/supabase";
import { formatDuration } from "@/lib/audioUtils";
import { usePlayer } from "@/context/PlayerContext";

interface TrackRowProps {
  song: Song;
  index: number;
  isActive?: boolean;
  isLiked?: boolean;
  onToggleLike?: () => void;
  onPlay: () => void;
  onDelete?: () => void;
}

export function TrackRow({ song, index, isActive, isLiked, onToggleLike, onPlay, onDelete }: TrackRowProps) {
  const { isPlaying, addToQueue, currentSong } = usePlayer();

  return (
    <>
      {/* Mobile Layout */}
      <div
        onClick={onPlay}
        className={`md:hidden flex items-center gap-3 px-3 py-2 active:bg-background-tinted cursor-pointer ${
          isActive ? "bg-background-tinted" : ""
        }`}
      >
        <div className="w-12 h-12 bg-background-tinted rounded flex-shrink-0 flex items-center justify-center overflow-hidden">
          {song.cover_url ? (
            <img src={song.cover_url} alt={song.title} className="w-full h-full object-cover" />
          ) : (
            <svg className="w-5 h-5 text-foreground-subdued" fill="currentColor" viewBox="0 0 24 24">
              <path d="M15 4v12.167a3.5 3.5 0 11-3.5-3.5H13V4h2zm-2 10.667h-1.5a1.5 1.5 0 100 3 1.5 1.5 0 001.5-1.5v-1.5z" />
            </svg>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-base font-medium truncate ${isActive ? "text-spotify-green" : "text-white"}`}>
            {song.title}
          </p>
          <p className="text-sm text-foreground-subdued truncate">{song.artist || "Unknown artist"}</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {onToggleLike && (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleLike(); }}
              className={`w-8 h-8 flex items-center justify-center transition-colors ${isLiked ? "text-spotify-green" : "text-foreground-subdued"}`}
            >
              {isLiked ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M15.724 4.22A4.313 4.313 0 0012.192.814a4.269 4.269 0 00-3.622 1.13.837.837 0 01-1.14 0 4.272 4.272 0 00-6.38 5.57l5.593 7.434a1.12 1.12 0 001.733-.074l.033-.044 5.315-7.315z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M1.69 2A4.582 4.582 0 018 2.023 4.583 4.583 0 0114.31 2a4.583 4.583 0 01.003 6.208L8 15.024 1.694 8.21A4.583 4.583 0 011.69 2zm2.876.297A3.073 3.073 0 002.5 5.59a3.073 3.073 0 00.002 3.395L8 14.085l5.498-5.1A3.073 3.073 0 0013.5 5.59a3.073 3.073 0 00-5.066-2.294L8 3.723l-.434-.427A3.073 3.073 0 004.566 2.297z" />
                </svg>
              )}
            </button>
          )}
          {isActive && isPlaying ? (
            <svg className="w-5 h-5 text-spotify-green" fill="currentColor" viewBox="0 0 16 16">
              <path d="M10.016 10.794a.5.5 0 00.984 0V5.206a.5.5 0 00-.984 0v5.588zm-5.032 1.803a.5.5 0 00.984 0V3.403a.5.5 0 00-.984 0v9.194z" />
            </svg>
          ) : (
            <span className="text-sm text-foreground-subdued">{formatDuration(song.duration)}</span>
          )}
        </div>
      </div>

      {/* Desktop Layout */}
      <div
        className={`hidden md:grid group grid-cols-[16px_4fr_minmax(120px,1fr)_40px] gap-4 px-4 py-2 rounded-md hover:bg-background-tinted transition-colors cursor-pointer ${
          isActive ? "bg-background-tinted" : ""
        }`}
        onClick={onPlay}
      >
        {/* Track number / Play */}
        <div className="flex items-center justify-center w-4">
          <span className={`text-foreground-subdued text-sm ${isActive && isPlaying ? "hidden" : "group-hover:hidden"}`}>
            {isActive && isPlaying ? (
              <svg className="w-4 h-4 text-spotify-green" fill="currentColor" viewBox="0 0 16 16">
                <path d="M10.016 10.794a.5.5 0 00.984 0V5.206a.5.5 0 00-.984 0v5.588zm-5.032 1.803a.5.5 0 00.984 0V3.403a.5.5 0 00-.984 0v9.194z" />
              </svg>
            ) : (
              index + 1
            )}
          </span>
          <span className={`hidden group-hover:block ${isActive && isPlaying ? "!block" : ""}`}>
            {isActive && isPlaying ? (
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 16 16">
                <path d="M2.7 1a.7.7 0 00-.7.7v12.6a.7.7 0 00.7.7h2.6a.7.7 0 00.7-.7V1.7a.7.7 0 00-.7-.7H2.7zm8 0a.7.7 0 00-.7.7v12.6a.7.7 0 00.7.7h2.6a.7.7 0 00.7-.7V1.7a.7.7 0 00-.7-.7h-2.6z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 16 16">
                <path d="M3 1.713a.7.7 0 011.05-.607l10.89 6.288a.7.7 0 010 1.212L4.05 14.894A.7.7 0 013 14.288V1.713z" />
              </svg>
            )}
          </span>
        </div>

        {/* Song info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 bg-background-tinted rounded flex-shrink-0 flex items-center justify-center overflow-hidden">
            {song.cover_url ? (
              <img src={song.cover_url} alt={song.title} className="w-full h-full object-cover rounded" />
            ) : (
              <svg className="w-4 h-4 text-foreground-subdued" fill="currentColor" viewBox="0 0 24 24">
                <path d="M15 4v12.167a3.5 3.5 0 11-3.5-3.5H13V4h2zm-2 10.667h-1.5a1.5 1.5 0 100 3 1.5 1.5 0 001.5-1.5v-1.5z" />
              </svg>
            )}
          </div>
          <div className="min-w-0">
            <p className={`font-medium truncate ${isActive ? "text-spotify-green" : "text-white"}`}>{song.title}</p>
            <p className="text-sm text-foreground-subdued truncate">{song.artist || "Unknown artist"}</p>
          </div>
        </div>

        {/* Album */}
        <div className="flex items-center min-w-0">
          <span className="text-sm text-foreground-subdued truncate">{song.album || "—"}</span>
        </div>

        {/* Duration & actions */}
        <div className="flex items-center justify-end gap-2">
          {onToggleLike && (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleLike(); }}
              className={`w-8 h-8 items-center justify-center transition-colors ${
                isLiked ? "flex text-spotify-green" : "hidden group-hover:flex text-foreground-subdued hover:text-white"
              }`}
              title={isLiked ? "Remove from Liked Songs" : "Save to Liked Songs"}
            >
              {isLiked ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M15.724 4.22A4.313 4.313 0 0012.192.814a4.269 4.269 0 00-3.622 1.13.837.837 0 01-1.14 0 4.272 4.272 0 00-6.38 5.57l5.593 7.434a1.12 1.12 0 001.733-.074l.033-.044 5.315-7.315z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M1.69 2A4.582 4.582 0 018 2.023 4.583 4.583 0 0114.31 2a4.583 4.583 0 01.003 6.208L8 15.024 1.694 8.21A4.583 4.583 0 011.69 2zm2.876.297A3.073 3.073 0 002.5 5.59a3.073 3.073 0 00.002 3.395L8 14.085l5.498-5.1A3.073 3.073 0 0013.5 5.59a3.073 3.073 0 00-5.066-2.294L8 3.723l-.434-.427A3.073 3.073 0 004.566 2.297z" />
                </svg>
              )}
            </button>
          )}
          {currentSong && (
            <button
              onClick={(e) => { e.stopPropagation(); addToQueue(song); }}
              className="w-8 h-8 hidden group-hover:flex items-center justify-center text-foreground-subdued hover:text-white transition-colors"
              title="Add to queue"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                <path d="M15 15H1v-1.5h14V15zm0-4.5H1V9h14v1.5zm-14-5v-1l11.5.001V1h1.5v4H1z" />
              </svg>
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="w-8 h-8 hidden group-hover:flex items-center justify-center text-foreground-subdued hover:text-white transition-colors"
              title="Remove"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                <path d="M5.5 5.5A.5.5 0 016 6v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm2.5 0a.5.5 0 01.5.5v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm3 .5a.5.5 0 00-1 0v6a.5.5 0 001 0V6z" />
                <path fillRule="evenodd" d="M14.5 3a1 1 0 01-1 1H13v9a2 2 0 01-2 2H5a2 2 0 01-2-2V4h-.5a1 1 0 01-1-1V2a1 1 0 011-1H6a1 1 0 011-1h2a1 1 0 011 1h3.5a1 1 0 011 1v1zM4.118 4L4 4.059V13a1 1 0 001 1h6a1 1 0 001-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" />
              </svg>
            </button>
          )}
          <span className="text-sm text-foreground-subdued">{formatDuration(song.duration)}</span>
        </div>
      </div>
    </>
  );
}
