"use client";

import { usePlayer } from "@/context/PlayerContext";
import { useLikedSongs } from "@/hooks/useLikedSongs";

interface NowPlayingPanelProps {
  onClose: () => void;
}

export function NowPlayingPanel({ onClose }: NowPlayingPanelProps) {
  const { currentSong, queue, currentIndex } = usePlayer();
  const { isLiked, toggleLike } = useLikedSongs();

  if (!currentSong) return null;

  const upNext = queue.slice(currentIndex + 1, currentIndex + 4);

  return (
    <aside className="w-[320px] h-full bg-background-elevated rounded-lg m-2 ml-0 flex flex-col overflow-hidden flex-shrink-0">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <span className="text-sm font-bold text-white">Now Playing</span>
        <div className="flex items-center gap-1">
          <button className="w-8 h-8 flex items-center justify-center text-foreground-subdued hover:text-white transition-colors" title="More options">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16"><path d="M3 8a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm6.5 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM16 8a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" /></svg>
          </button>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-foreground-subdued hover:text-white transition-colors" title="Close">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16"><path d="M4.646 4.646a.5.5 0 01.708 0L8 7.293l2.646-2.647a.5.5 0 01.708.708L8.707 8l2.647 2.646a.5.5 0 01-.708.708L8 8.707l-2.646 2.647a.5.5 0 01-.708-.708L7.293 8 4.646 5.354a.5.5 0 010-.708z" /></svg>
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto min-h-0 px-4 pb-4">
        {/* Album art */}
        <div className="w-full aspect-square bg-background-tinted rounded-lg mb-4 flex items-center justify-center overflow-hidden">
          {currentSong.cover_url ? (
            <img src={currentSong.cover_url} alt={currentSong.title} className="w-full h-full object-cover rounded-lg" />
          ) : (
            <svg className="w-16 h-16 text-foreground-subdued" fill="currentColor" viewBox="0 0 24 24">
              <path d="M15 4v12.167a3.5 3.5 0 11-3.5-3.5H13V4h2zm-2 10.667h-1.5a1.5 1.5 0 100 3 1.5 1.5 0 001.5-1.5v-1.5z" />
            </svg>
          )}
        </div>

        {/* Song title + like */}
        <div className="flex items-start justify-between mb-6">
          <div className="min-w-0 flex-1">
            <p className="text-xl font-bold text-white truncate">{currentSong.title}</p>
            <p className="text-sm text-foreground-subdued truncate">{currentSong.artist || "Unknown artist"}</p>
          </div>
          <button
            onClick={() => toggleLike(currentSong.id)}
            className={`w-8 h-8 flex items-center justify-center flex-shrink-0 transition-colors ${
              isLiked(currentSong.id) ? "text-spotify-green" : "text-foreground-subdued hover:text-white"
            }`}
          >
            {isLiked(currentSong.id) ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 16 16"><path d="M15.724 4.22A4.313 4.313 0 0012.192.814a4.269 4.269 0 00-3.622 1.13.837.837 0 01-1.14 0 4.272 4.272 0 00-6.38 5.57l5.593 7.434a1.12 1.12 0 001.733-.074l.033-.044 5.315-7.315z" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 16 16"><path d="M1.69 2A4.582 4.582 0 018 2.023 4.583 4.583 0 0114.31 2a4.583 4.583 0 01.003 6.208L8 15.024 1.694 8.21A4.583 4.583 0 011.69 2zm2.876.297A3.073 3.073 0 002.5 5.59a3.073 3.073 0 00.002 3.395L8 14.085l5.498-5.1A3.073 3.073 0 0013.5 5.59a3.073 3.073 0 00-5.066-2.294L8 3.723l-.434-.427A3.073 3.073 0 004.566 2.297z" /></svg>
            )}
          </button>
        </div>

        {/* About the artist */}
        {currentSong.artist && (
          <div className="bg-background-tinted rounded-lg p-4 mb-4">
            <p className="text-sm font-bold text-white mb-1">About the artist</p>
            <p className="text-base font-bold text-white">{currentSong.artist}</p>
          </div>
        )}

        {/* Credits */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-white">Credits</p>
            <span className="text-xs text-foreground-subdued hover:underline cursor-pointer">Show all</span>
          </div>
          {currentSong.artist && (
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm text-white font-medium">{currentSong.artist}</p>
                <p className="text-xs text-foreground-subdued">Main Artist</p>
              </div>
              <button className="px-3 py-1 text-xs font-semibold text-white border border-foreground-subdued rounded-full hover:border-white transition-colors">
                Follow
              </button>
            </div>
          )}
        </div>

        {/* Next in queue */}
        {upNext.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-white">Next in queue</p>
              <span className="text-xs text-foreground-subdued hover:underline cursor-pointer">Open queue</span>
            </div>
            {upNext.map((song) => (
              <div key={song.id} className="flex items-center gap-3 py-2 rounded-md hover:bg-background-tinted transition-colors">
                <div className="w-10 h-10 bg-background-tinted rounded flex-shrink-0 flex items-center justify-center overflow-hidden">
                  {song.cover_url ? (
                    <img src={song.cover_url} alt={song.title} className="w-full h-full object-cover rounded" />
                  ) : (
                    <svg className="w-4 h-4 text-foreground-subdued" fill="currentColor" viewBox="0 0 24 24"><path d="M15 4v12.167a3.5 3.5 0 11-3.5-3.5H13V4h2zm-2 10.667h-1.5a1.5 1.5 0 100 3 1.5 1.5 0 001.5-1.5v-1.5z" /></svg>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-white font-medium truncate">{song.title}</p>
                  <p className="text-xs text-foreground-subdued truncate">{song.artist || "Unknown"}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
