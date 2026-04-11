"use client";

import { usePlayer } from "@/context/PlayerContext";

interface QueuePanelProps {
  onClose: () => void;
}

export function QueuePanel({ onClose }: QueuePanelProps) {
  const { currentSong, queue, getUpcomingSongs, playQueue } = usePlayer();

  if (!currentSong) return null;

  const upNext = getUpcomingSongs();

  return (
    <aside className="w-[320px] h-full bg-background-elevated rounded-lg m-2 ml-0 flex flex-col overflow-hidden flex-shrink-0">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between flex-shrink-0">
        <span className="text-base font-bold text-white">Queue</span>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-foreground-subdued hover:text-white transition-colors" title="Close">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16"><path d="M4.646 4.646a.5.5 0 01.708 0L8 7.293l2.646-2.647a.5.5 0 01.708.708L8.707 8l2.647 2.646a.5.5 0 01-.708.708L8 8.707l-2.646 2.647a.5.5 0 01-.708-.708L7.293 8 4.646 5.354a.5.5 0 010-.708z" /></svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 px-4 pb-4">
        {/* Now playing */}
        <p className="text-sm font-bold text-white mb-3">Now playing</p>
        <div className="flex items-center gap-3 p-2 bg-background-tinted rounded-md mb-6">
          <div className="w-12 h-12 bg-background-highlight rounded flex-shrink-0 flex items-center justify-center overflow-hidden">
            {currentSong.cover_url ? (
              <img src={currentSong.cover_url} alt={currentSong.title} className="w-full h-full object-cover rounded" />
            ) : (
              <svg className="w-5 h-5 text-foreground-subdued" fill="currentColor" viewBox="0 0 24 24"><path d="M15 4v12.167a3.5 3.5 0 11-3.5-3.5H13V4h2zm-2 10.667h-1.5a1.5 1.5 0 100 3 1.5 1.5 0 001.5-1.5v-1.5z" /></svg>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-spotify-green truncate">{currentSong.title}</p>
            <p className="text-xs text-foreground-subdued truncate">{currentSong.artist || "Unknown"}</p>
          </div>
        </div>

        {/* Next from queue */}
        {upNext.length > 0 && (
          <>
            <p className="text-sm font-bold text-white mb-3">Next from: Liked Songs</p>
            <div className="space-y-0.5">
              {upNext.map((song, i) => (
                <div
                  key={`${song.id}-${i}`}
                  onClick={() => {
                    const idx = queue.findIndex((s) => s.id === song.id);
                    if (idx >= 0) playQueue(queue, idx);
                  }}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-background-tinted transition-colors cursor-pointer group"
                >
                  <div className="w-12 h-12 bg-background-tinted rounded flex-shrink-0 flex items-center justify-center overflow-hidden relative">
                    {song.cover_url ? (
                      <img src={song.cover_url} alt={song.title} className="w-full h-full object-cover rounded" />
                    ) : (
                      <svg className="w-5 h-5 text-foreground-subdued" fill="currentColor" viewBox="0 0 24 24"><path d="M15 4v12.167a3.5 3.5 0 11-3.5-3.5H13V4h2zm-2 10.667h-1.5a1.5 1.5 0 100 3 1.5 1.5 0 001.5-1.5v-1.5z" /></svg>
                    )}
                    <div className="absolute inset-0 bg-black/50 items-center justify-center hidden group-hover:flex rounded">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 16 16"><path d="M3 1.713a.7.7 0 011.05-.607l10.89 6.288a.7.7 0 010 1.212L4.05 14.894A.7.7 0 013 14.288V1.713z" /></svg>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white truncate">{song.title}</p>
                    <p className="text-xs text-foreground-subdued truncate">{song.artist || "Unknown"}</p>
                  </div>
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="w-8 h-8 hidden group-hover:flex items-center justify-center text-foreground-subdued hover:text-white"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16"><path d="M3 8a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm6.5 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM16 8a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" /></svg>
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {upNext.length === 0 && (
          <div className="text-center py-8">
            <p className="text-foreground-subdued text-sm">No more songs in queue</p>
          </div>
        )}
      </div>
    </aside>
  );
}
