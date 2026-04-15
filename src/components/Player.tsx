"use client";

import { useState, useRef, useEffect } from "react";
import { usePlayer } from "@/context/PlayerContext";
import { formatDuration } from "@/lib/audioUtils";
import { useLikedSongs } from "@/hooks/useLikedSongs";
import { useToast } from "@/hooks/useToast";
import { ConnectPopup } from "./ConnectPopup";

interface PlayerProps {
  activePanel?: string;
  onToggleNowPlaying?: () => void;
  onToggleQueue?: () => void;
  onToggleLyrics?: () => void;
}

export function Player({ activePanel, onToggleNowPlaying, onToggleQueue, onToggleLyrics }: PlayerProps) {
  const [connectOpen, setConnectOpen] = useState(false);
  const connectRef = useRef<HTMLDivElement>(null);
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    shuffle,
    repeat,
    togglePlay,
    previous,
    next,
    seek,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeat,
  } = usePlayer();

  const { isLiked, toggleLike } = useLikedSongs();
  const { toast } = useToast();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (connectRef.current && !connectRef.current.contains(e.target as Node)) setConnectOpen(false);
    }
    if (connectOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [connectOpen]);

  if (!currentSong) {
    return (
      <footer className="h-20 bg-player-bg border-t border-border" />
    );
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <footer className="bg-player-bg border-t border-border">
      {/* Mobile Layout */}
      <div className="md:hidden">
        {/* Progress bar at top for mobile */}
        <div
          className="w-full h-1 bg-progress-bar cursor-pointer"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            seek(percent * duration);
          }}
        >
          <div
            className="h-full bg-spotify-green"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {/* Mobile player content */}
        <div className="flex items-center justify-between px-3 py-2 gap-2">
          {/* Song info - left side */}
          <div className="flex items-center min-w-0 flex-1 gap-3">
            <div className="w-10 h-10 bg-background-tinted rounded flex-shrink-0 flex items-center justify-center overflow-hidden">
              {currentSong.cover_url ? (
                <img
                  src={currentSong.cover_url}
                  alt={currentSong.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <svg className="w-5 h-5 text-foreground-subdued" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M15 4v12.167a3.5 3.5 0 11-3.5-3.5H13V4h2zm-2 10.667h-1.5a1.5 1.5 0 100 3 1.5 1.5 0 001.5-1.5v-1.5z" />
                </svg>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white text-sm font-medium truncate leading-tight">
                {currentSong.title}
              </p>
              <p className="text-foreground-subdued text-xs truncate leading-tight">
                {currentSong.artist || "Unknown"}
              </p>
            </div>
          </div>
          
          {/* Mobile controls - right side */}
          <div className="flex items-center gap-0 flex-shrink-0">
            {/* Shuffle */}
            <button
              onClick={toggleShuffle}
              className={`w-9 h-9 flex items-center justify-center transition-colors active:scale-95 ${
                shuffle ? "text-spotify-green" : "text-foreground-subdued"
              }`}
              title={shuffle ? "Disable shuffle" : "Enable shuffle"}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                <path d="M13.151.922a.75.75 0 10-1.06 1.06L13.109 3H11.16a3.75 3.75 0 00-2.873 1.34l-6.173 7.356A2.25 2.25 0 01.39 12.5H0V14h.391a3.75 3.75 0 002.873-1.34l6.173-7.356a2.25 2.25 0 011.724-.804h1.947l-1.017 1.018a.75.75 0 001.06 1.06l2.306-2.306a.75.75 0 000-1.06L13.15.922zM.391 3.5H0V2h.391c1.109 0 2.16.49 2.873 1.34L4.89 5.277l-.979 1.167-1.796-2.14A2.25 2.25 0 00.39 3.5z" />
                <path d="M7.5 10.723l.98-1.167.957 1.14a2.25 2.25 0 001.724.804h1.947l-1.017-1.018a.75.75 0 111.06-1.06l2.306 2.306a.75.75 0 010 1.06l-2.306 2.306a.75.75 0 11-1.06-1.06L13.109 13H11.16a3.75 3.75 0 01-2.873-1.34l-.787-.938z" />
              </svg>
            </button>

            <button
              onClick={previous}
              className="w-10 h-10 flex items-center justify-center text-white active:scale-95"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 16 16">
                <path d="M3.3 1a.7.7 0 01.7.7v5.15l9.95-5.744a.7.7 0 011.05.606v12.575a.7.7 0 01-1.05.607L4 9.149V14.3a.7.7 0 01-.7.7H1.7a.7.7 0 01-.7-.7V1.7a.7.7 0 01.7-.7h1.6z" />
              </svg>
            </button>
            <button
              onClick={togglePlay}
              className="w-11 h-11 bg-white rounded-full flex items-center justify-center active:scale-95"
            >
              {isPlaying ? (
                <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M2.7 1a.7.7 0 00-.7.7v12.6a.7.7 0 00.7.7h2.6a.7.7 0 00.7-.7V1.7a.7.7 0 00-.7-.7H2.7zm8 0a.7.7 0 00-.7.7v12.6a.7.7 0 00.7.7h2.6a.7.7 0 00.7-.7V1.7a.7.7 0 00-.7-.7h-2.6z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-black ml-0.5" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M3 1.713a.7.7 0 011.05-.607l10.89 6.288a.7.7 0 010 1.212L4.05 14.894A.7.7 0 013 14.288V1.713z" />
                </svg>
              )}
            </button>
            <button
              onClick={next}
              className="w-10 h-10 flex items-center justify-center text-white active:scale-95"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 16 16">
                <path d="M12.7 1a.7.7 0 00-.7.7v5.15L2.05 1.107A.7.7 0 001 1.712v12.575a.7.7 0 001.05.607L12 9.149V14.3a.7.7 0 00.7.7h1.6a.7.7 0 00.7-.7V1.7a.7.7 0 00-.7-.7h-1.6z" />
              </svg>
            </button>

            {/* Repeat / Loop */}
            <button
              onClick={cycleRepeat}
              className={`w-9 h-9 flex items-center justify-center transition-colors active:scale-95 ${
                repeat !== "off" ? "text-spotify-green" : "text-foreground-subdued"
              }`}
              title={`Repeat: ${repeat}`}
            >
              {repeat === "one" ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M0 4.75A3.75 3.75 0 013.75 1h.75v1.5h-.75A2.25 2.25 0 001.5 4.75v5A2.25 2.25 0 003.75 12H5v1.5H3.75A3.75 3.75 0 010 9.75v-5zM12.25 2.5h-.75V1h.75A3.75 3.75 0 0116 4.75v5a3.75 3.75 0 01-3.75 3.75H10.5V12h1.75a2.25 2.25 0 002.25-2.25v-5a2.25 2.25 0 00-2.25-2.25z" />
                  <path d="M4.75 6.5a.75.75 0 01.75.75V9.5h.75a.75.75 0 010 1.5H4a.75.75 0 01-.75-.75V7.25a.75.75 0 01.75-.75zM12.25.5l2.5 2-2.5 2V.5zm-8.5 15l-2.5-2 2.5-2v4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M0 4.75A3.75 3.75 0 013.75 1h8.5A3.75 3.75 0 0116 4.75v5a3.75 3.75 0 01-3.75 3.75H5.5l1.97 1.97a.75.75 0 11-1.06 1.06L2.97 13.1a.75.75 0 010-1.06l3.44-3.44a.75.75 0 111.06 1.06L5.5 12h6.75a2.25 2.25 0 002.25-2.25v-5A2.25 2.25 0 0012.25 2.5h-8.5a2.25 2.25 0 00-2.25 2.25v5A2.25 2.25 0 003.75 12H4v1.5h-.25A3.75 3.75 0 010 9.75v-5z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:flex h-20 px-4 items-center">
        {/* Left - Song info */}
        <div className="flex items-center w-[30%] min-w-[180px]">
          <div className="w-14 h-14 bg-background-tinted rounded flex items-center justify-center flex-shrink-0">
            {currentSong.cover_url ? (
              <img
                src={currentSong.cover_url}
                alt={currentSong.title}
                className="w-full h-full object-cover rounded"
              />
            ) : (
              <svg className="w-6 h-6 text-foreground-subdued" fill="currentColor" viewBox="0 0 24 24">
                <path d="M15 4v12.167a3.5 3.5 0 11-3.5-3.5H13V4h2zm-2 10.667h-1.5a1.5 1.5 0 100 3 1.5 1.5 0 001.5-1.5v-1.5z" />
              </svg>
            )}
          </div>
          <div className="min-w-0 ml-3 flex-1">
            <p className="text-white text-sm font-medium truncate">
              {currentSong.title}
            </p>
            <p className="text-foreground-subdued text-xs truncate">
              {currentSong.artist || "Unknown artist"}
            </p>
          </div>
          <button
            onClick={() => toggleLike(currentSong.id)}
            className={`w-8 h-8 flex items-center justify-center flex-shrink-0 transition-colors ${
              isLiked(currentSong.id) ? "text-spotify-green" : "text-foreground-subdued hover:text-white"
            }`}
            title={isLiked(currentSong.id) ? "Remove from Liked Songs" : "Save to Liked Songs"}
          >
            {isLiked(currentSong.id) ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                <path d="M15.724 4.22A4.313 4.313 0 0012.192.814a4.269 4.269 0 00-3.622 1.13.837.837 0 01-1.14 0 4.272 4.272 0 00-6.38 5.57l5.593 7.434a1.12 1.12 0 001.733-.074l.033-.044 5.315-7.315z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                <path d="M1.69 2A4.582 4.582 0 018 2.023 4.583 4.583 0 0114.31 2a4.583 4.583 0 01.003 6.208L8 15.024 1.694 8.21A4.583 4.583 0 011.69 2zm2.876.297A3.073 3.073 0 002.5 5.59a3.073 3.073 0 00.002 3.395L8 14.085l5.498-5.1A3.073 3.073 0 0013.5 5.59a3.073 3.073 0 00-5.066-2.294L8 3.723l-.434-.427A3.073 3.073 0 004.566 2.297z" />
              </svg>
            )}
          </button>
        </div>

        {/* Center - Player controls */}
        <div className="flex-1 max-w-[722px] flex flex-col items-center">
        {/* Control buttons */}
        <div className="flex items-center gap-4 mb-2">
          {/* Shuffle */}
          <button
            onClick={toggleShuffle}
            className={`w-8 h-8 flex items-center justify-center transition-colors ${
              shuffle ? "text-spotify-green" : "text-foreground-subdued hover:text-white"
            }`}
            title={shuffle ? "Disable shuffle" : "Enable shuffle"}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
              <path d="M13.151.922a.75.75 0 10-1.06 1.06L13.109 3H11.16a3.75 3.75 0 00-2.873 1.34l-6.173 7.356A2.25 2.25 0 01.39 12.5H0V14h.391a3.75 3.75 0 002.873-1.34l6.173-7.356a2.25 2.25 0 011.724-.804h1.947l-1.017 1.018a.75.75 0 001.06 1.06l2.306-2.306a.75.75 0 000-1.06L13.15.922zM.391 3.5H0V2h.391c1.109 0 2.16.49 2.873 1.34L4.89 5.277l-.979 1.167-1.796-2.14A2.25 2.25 0 00.39 3.5z" />
              <path d="M7.5 10.723l.98-1.167.957 1.14a2.25 2.25 0 001.724.804h1.947l-1.017-1.018a.75.75 0 111.06-1.06l2.306 2.306a.75.75 0 010 1.06l-2.306 2.306a.75.75 0 11-1.06-1.06L13.109 13H11.16a3.75 3.75 0 01-2.873-1.34l-.787-.938z" />
            </svg>
          </button>

          {/* Previous */}
          <button
            onClick={previous}
            className="w-8 h-8 flex items-center justify-center text-foreground-subdued hover:text-white transition-colors"
            title="Previous"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
              <path d="M3.3 1a.7.7 0 01.7.7v5.15l9.95-5.744a.7.7 0 011.05.606v12.575a.7.7 0 01-1.05.607L4 9.149V14.3a.7.7 0 01-.7.7H1.7a.7.7 0 01-.7-.7V1.7a.7.7 0 01.7-.7h1.6z" />
            </svg>
          </button>

          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            className="w-8 h-8 bg-white rounded-full flex items-center justify-center hover:scale-105 transition-transform"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 16 16">
                <path d="M2.7 1a.7.7 0 00-.7.7v12.6a.7.7 0 00.7.7h2.6a.7.7 0 00.7-.7V1.7a.7.7 0 00-.7-.7H2.7zm8 0a.7.7 0 00-.7.7v12.6a.7.7 0 00.7.7h2.6a.7.7 0 00.7-.7V1.7a.7.7 0 00-.7-.7h-2.6z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-black ml-0.5" fill="currentColor" viewBox="0 0 16 16">
                <path d="M3 1.713a.7.7 0 011.05-.607l10.89 6.288a.7.7 0 010 1.212L4.05 14.894A.7.7 0 013 14.288V1.713z" />
              </svg>
            )}
          </button>

          {/* Next */}
          <button
            onClick={next}
            className="w-8 h-8 flex items-center justify-center text-foreground-subdued hover:text-white transition-colors"
            title="Next"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
              <path d="M12.7 1a.7.7 0 00-.7.7v5.15L2.05 1.107A.7.7 0 001 1.712v12.575a.7.7 0 001.05.607L12 9.149V14.3a.7.7 0 00.7.7h1.6a.7.7 0 00.7-.7V1.7a.7.7 0 00-.7-.7h-1.6z" />
            </svg>
          </button>

          {/* Repeat */}
          <button
            onClick={cycleRepeat}
            className={`w-8 h-8 flex items-center justify-center transition-colors relative ${
              repeat !== "off" ? "text-spotify-green" : "text-foreground-subdued hover:text-white"
            }`}
            title={`Repeat: ${repeat}`}
          >
            {repeat === "one" ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                <path d="M0 4.75A3.75 3.75 0 013.75 1h.75v1.5h-.75A2.25 2.25 0 001.5 4.75v5A2.25 2.25 0 003.75 12H5v1.5H3.75A3.75 3.75 0 010 9.75v-5zM12.25 2.5h-.75V1h.75A3.75 3.75 0 0116 4.75v5a3.75 3.75 0 01-3.75 3.75H10.5V12h1.75a2.25 2.25 0 002.25-2.25v-5a2.25 2.25 0 00-2.25-2.25z" />
                <path d="M4.75 6.5a.75.75 0 01.75.75V9.5h.75a.75.75 0 010 1.5H4a.75.75 0 01-.75-.75V7.25a.75.75 0 01.75-.75zM12.25.5l2.5 2-2.5 2V.5zm-8.5 15l-2.5-2 2.5-2v4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                <path d="M0 4.75A3.75 3.75 0 013.75 1h8.5A3.75 3.75 0 0116 4.75v5a3.75 3.75 0 01-3.75 3.75H5.5l1.97 1.97a.75.75 0 11-1.06 1.06L2.97 13.1a.75.75 0 010-1.06l3.44-3.44a.75.75 0 111.06 1.06L5.5 12h6.75a2.25 2.25 0 002.25-2.25v-5A2.25 2.25 0 0012.25 2.5h-8.5a2.25 2.25 0 00-2.25 2.25v5A2.25 2.25 0 003.75 12H4v1.5h-.25A3.75 3.75 0 010 9.75v-5z" />
              </svg>
            )}
          </button>
        </div>

        {/* Progress bar */}
        <div className="w-full flex items-center gap-2">
          <span className="text-xs text-foreground-subdued w-10 text-right">
            {formatDuration(currentTime)}
          </span>
          <div className="flex-1 group relative">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={(e) => seek(Number(e.target.value))}
              className="w-full h-1 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, var(--spotify-green) ${progress}%, var(--progress-bar) ${progress}%)`,
              }}
            />
          </div>
          <span className="text-xs text-foreground-subdued w-10">
            {formatDuration(duration)}
          </span>
        </div>
      </div>

        {/* Right controls */}
        <div className="w-[30%] min-w-[180px] flex items-center justify-end gap-1">
          {/* Now Playing View -- screen with play triangle */}
          <button
            onClick={onToggleNowPlaying}
            className={`w-8 h-8 flex items-center justify-center transition-colors ${activePanel === "now-playing" ? "text-spotify-green" : "text-foreground-subdued hover:text-white"}`}
            title="Now Playing View"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
              <path d="M1 3v9a1 1 0 001 1h4.5v1.707a.5.5 0 00.854.353L8.707 14H14a1 1 0 001-1V3a1 1 0 00-1-1H2a1 1 0 00-1 1zm1.5.5h11v8h-4.793l-.854.854V11.5H2.5v-8zM6.5 6v4l3.5-2-3.5-2z" />
            </svg>
          </button>

          {/* Lyrics -- microphone icon */}
          <button
            onClick={onToggleLyrics}
            className={`w-8 h-8 flex items-center justify-center transition-colors ${activePanel === "lyrics" ? "text-spotify-green" : "text-foreground-subdued hover:text-white"}`}
            title="Lyrics"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 0a4 4 0 014 4v4a4 4 0 01-8 0V4a4 4 0 014-4zm-2.5 4v4a2.5 2.5 0 005 0V4a2.5 2.5 0 00-5 0zM8 11.5A5.5 5.5 0 012.5 6H1a7 7 0 006.25 6.96V15h1.5v-2.04A7 7 0 0015 6h-1.5A5.5 5.5 0 018 11.5z" />
            </svg>
          </button>

          {/* Queue -- stacked list with top item */}
          <button
            onClick={onToggleQueue}
            className={`w-8 h-8 flex items-center justify-center transition-colors ${activePanel === "queue" ? "text-spotify-green" : "text-foreground-subdued hover:text-white"}`}
            title="Queue"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
              <path d="M15 15H1v-1.5h14V15zm0-4.5H1V9h14v1.5zm-14-5V4h11.5V1.5h1.5V7H1V5.5z" />
            </svg>
          </button>

          {/* Connect to device -- computer monitor icon */}
          <div ref={connectRef} className="relative">
            <button
              onClick={() => setConnectOpen(!connectOpen)}
              className={`w-8 h-8 flex items-center justify-center transition-colors ${connectOpen ? "text-spotify-green" : "text-foreground-subdued hover:text-white"}`}
              title="Connect to a device"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                <path d="M0 3a2 2 0 012-2h12a2 2 0 012 2v7a2 2 0 01-2 2H9.5v2H12a.5.5 0 010 1H4a.5.5 0 010-1h2.5v-2H2a2 2 0 01-2-2V3zm1.5 0v7a.5.5 0 00.5.5h12a.5.5 0 00.5-.5V3a.5.5 0 00-.5-.5H2a.5.5 0 00-.5.5z" />
              </svg>
            </button>
            {connectOpen && <ConnectPopup onClose={() => setConnectOpen(false)} />}
          </div>

          {/* Volume */}
          <div className="flex items-center gap-1">
            <button
              onClick={toggleMute}
              className="w-8 h-8 flex items-center justify-center text-foreground-subdued hover:text-white transition-colors"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted || volume === 0 ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M13.86 5.47a.75.75 0 00-1.061 0l-1.47 1.47-1.47-1.47A.75.75 0 008.8 6.53L10.269 8l-1.47 1.47a.75.75 0 101.06 1.06l1.47-1.47 1.47 1.47a.75.75 0 001.06-1.06L12.39 8l1.47-1.47a.75.75 0 000-1.06z" />
                  <path d="M10.116 1.5A.75.75 0 008.991.85l-6.925 4a3.642 3.642 0 00-1.33 4.967 3.639 3.639 0 001.33 1.332l6.925 4a.75.75 0 001.125-.649v-1.906a4.73 4.73 0 01-1.5-.694v1.3L2.817 9.852a2.141 2.141 0 01-.781-2.92c.187-.324.456-.594.78-.782l5.8-3.35v1.3c.45-.313.956-.55 1.5-.694V1.5z" />
                </svg>
              ) : volume < 0.5 ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M9.741.85a.75.75 0 01.375.65v13a.75.75 0 01-1.125.65l-6.925-4a3.642 3.642 0 01-1.33-4.967 3.639 3.639 0 011.33-1.332l6.925-4a.75.75 0 01.75 0zm-6.924 5.3a2.139 2.139 0 000 3.7l5.8 3.35V2.8l-5.8 3.35zm8.683 4.29V5.56a2.75 2.75 0 010 4.88z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M9.741.85a.75.75 0 01.375.65v13a.75.75 0 01-1.125.65l-6.925-4a3.642 3.642 0 01-1.33-4.967 3.639 3.639 0 011.33-1.332l6.925-4a.75.75 0 01.75 0zm-6.924 5.3a2.139 2.139 0 000 3.7l5.8 3.35V2.8l-5.8 3.35zm8.683 6.087a4.502 4.502 0 000-8.474v1.65a2.999 2.999 0 010 5.175v1.649z" />
                </svg>
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-24 h-1 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, var(--foreground) ${(isMuted ? 0 : volume) * 100}%, var(--progress-bar) ${(isMuted ? 0 : volume) * 100}%)`,
              }}
            />
          </div>

          {/* Mini player -- picture-in-picture style */}
          <button
            onClick={() => toast("Mini Player is not available yet")}
            className="w-8 h-8 flex items-center justify-center text-foreground-subdued hover:text-white transition-colors"
            title="Mini Player"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
              <path d="M1 2.75A.75.75 0 011.75 2h12.5a.75.75 0 01.75.75v5.5h-1.5V3.5h-11v9h4V14H1.75a.75.75 0 01-.75-.75V2.75z" />
              <path d="M9 9.75A.75.75 0 019.75 9h4.5a.75.75 0 01.75.75v3.5a.75.75 0 01-.75.75h-4.5a.75.75 0 01-.75-.75v-3.5z" />
            </svg>
          </button>

          {/* Fullscreen -- expand arrows */}
          <button
            onClick={() => {
              if (document.fullscreenElement) {
                document.exitFullscreen();
              } else {
                document.documentElement.requestFullscreen();
              }
            }}
            className="w-8 h-8 flex items-center justify-center text-foreground-subdued hover:text-white transition-colors"
            title="Full screen"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
              <path d="M6.53 9.47a.75.75 0 010 1.06l-2.72 2.72h1.018a.75.75 0 010 1.5H1.25v-3.578a.75.75 0 011.5 0v1.018l2.72-2.72a.75.75 0 011.06 0zm2.94-2.94a.75.75 0 010-1.06l2.72-2.72h-1.018a.75.75 0 110-1.5h3.578v3.578a.75.75 0 01-1.5 0V3.81l-2.72 2.72a.75.75 0 01-1.06 0z" />
            </svg>
          </button>
        </div>
      </div>
    </footer>
  );
}
