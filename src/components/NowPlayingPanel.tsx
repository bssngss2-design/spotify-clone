"use client";

import { useState, useRef, useEffect } from "react";
import { usePlayer } from "@/context/PlayerContext";
import { useLikedSongs } from "@/hooks/useLikedSongs";

interface NowPlayingPanelProps {
  onClose: () => void;
}

export function NowPlayingPanel({ onClose }: NowPlayingPanelProps) {
  const { currentSong, getUpcomingSongs } = usePlayer();
  const { isLiked, toggleLike } = useLikedSongs();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    if (menuOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  if (!currentSong) return null;

  const upNext = getUpcomingSongs().slice(0, 4);

  return (
    <aside className="w-[320px] h-full bg-[#121212] rounded-lg m-2 ml-0 flex flex-col flex-shrink-0" style={{ overflow: "visible" }}>
      <div className="flex flex-col h-full rounded-lg overflow-hidden">
        {/* Header */}
        <div className="px-4 pt-3 pb-1 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <svg className="w-4 h-4 text-[#b3b3b3] flex-shrink-0" fill="currentColor" viewBox="0 0 16 16"><path d="M15 14.5H5V13h10v1.5zm0-5.75H5v-1.5h10v1.5zM15 3H5V1.5h10V3zM3 3H1V1.5h2V3zm0 5.75H1v-1.5h2v1.5zM3 14.5H1V13h2v1.5z" /></svg>
            <span className="text-sm font-bold text-white truncate">Liked Songs</span>
          </div>
          <div className="flex items-center gap-0.5">
            {/* ... menu */}
            <div ref={menuRef} className="relative">
              <button onClick={() => setMenuOpen(!menuOpen)} className="w-8 h-8 flex items-center justify-center text-[#b3b3b3] hover:text-white transition-colors" title="More options">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16"><path d="M3 8a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm6.5 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM16 8a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" /></svg>
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 w-52 bg-[#282828] rounded-md shadow-2xl py-1 z-[70]">
                  <button onClick={() => setMenuOpen(false)} className="w-full text-left px-3 py-2.5 text-sm text-[#eaeaea] hover:text-white hover:bg-[#3e3e3e] flex items-center gap-3 transition-colors">
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 16 16"><path d="M15.25 8a.75.75 0 01-.75.75H8.75v5.75a.75.75 0 01-1.5 0V8.75H1.5a.75.75 0 010-1.5h5.75V1.5a.75.75 0 011.5 0v5.75h5.75a.75.75 0 01.75.75z" /></svg>
                    Add to playlist
                  </button>
                  <button onClick={() => setMenuOpen(false)} className="w-full text-left px-3 py-2.5 text-sm text-[#eaeaea] hover:text-white hover:bg-[#3e3e3e] flex items-center gap-3 transition-colors">
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 16 16"><path d="M15 15H1v-1.5h14V15zm0-4.5H1V9h14v1.5zm-14-5V4h11.5V1.5h1.5V7H1V5.5z" /></svg>
                    Add to queue
                  </button>
                  <div className="border-t border-[#3e3e3e] my-1" />
                  <button onClick={() => setMenuOpen(false)} className="w-full text-left px-3 py-2.5 text-sm text-[#eaeaea] hover:text-white hover:bg-[#3e3e3e] flex items-center gap-3 transition-colors">
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 16 16"><path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8z" /><path d="M8 5a3 3 0 100 6 3 3 0 000-6z" /></svg>
                    Go to song radio
                  </button>
                  <button onClick={() => setMenuOpen(false)} className="w-full text-left px-3 py-2.5 text-sm text-[#eaeaea] hover:text-white hover:bg-[#3e3e3e] flex items-center gap-3 transition-colors">
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 16 16"><path d="M11.757 2.987A4 4 0 118.243 9.01a4 4 0 013.514-6.022zM8 6a2 2 0 104 0 2 2 0 00-4 0zm-3.5 6.5a5.5 5.5 0 0111 0V14h-11v-1.5z" /></svg>
                    Go to artist
                  </button>
                  <button onClick={() => setMenuOpen(false)} className="w-full text-left px-3 py-2.5 text-sm text-[#eaeaea] hover:text-white hover:bg-[#3e3e3e] flex items-center gap-3 transition-colors">
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 16 16"><path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8z" /><path d="M8 6.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" /></svg>
                    Go to album
                  </button>
                  <div className="border-t border-[#3e3e3e] my-1" />
                  <button onClick={() => setMenuOpen(false)} className="w-full text-left px-3 py-2.5 text-sm text-[#eaeaea] hover:text-white hover:bg-[#3e3e3e] flex items-center gap-3 transition-colors">
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 16 16"><path d="M.5 2.5A2.5 2.5 0 013 0h10a2.5 2.5 0 012.5 2.5v11A2.5 2.5 0 0113 16H3a2.5 2.5 0 01-2.5-2.5v-11zm2.5-1a1 1 0 00-1 1v11a1 1 0 001 1h10a1 1 0 001-1v-11a1 1 0 00-1-1H3zm1.5 3a.5.5 0 01.5-.5h6a.5.5 0 010 1H5a.5.5 0 01-.5-.5zm0 3a.5.5 0 01.5-.5h6a.5.5 0 010 1H5a.5.5 0 01-.5-.5zm0 3a.5.5 0 01.5-.5h4a.5.5 0 010 1H5a.5.5 0 01-.5-.5z" /></svg>
                    View credits
                  </button>
                  <button onClick={() => setMenuOpen(false)} className="w-full text-left px-3 py-2.5 text-sm text-[#eaeaea] hover:text-white hover:bg-[#3e3e3e] flex items-center gap-3 transition-colors">
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 16 16"><path d="M1 5.75A.75.75 0 011.75 5H7v1.5H2.5v8h11V7H9V5.5h4.25a.75.75 0 01.75.75v9.5a.75.75 0 01-.75.75H1.75a.75.75 0 01-.75-.75v-9.5z" /><path d="M8 1.293l2.854 2.853-1.061 1.061L8.5 3.914V10h-1V3.914L6.207 5.207 5.146 4.146 8 1.293z" /></svg>
                    Share
                  </button>
                  <div className="border-t border-[#3e3e3e] my-1" />
                  <button onClick={() => setMenuOpen(false)} className="w-full text-left px-3 py-2.5 text-sm text-[#eaeaea] hover:text-white hover:bg-[#3e3e3e] flex items-center gap-3 transition-colors">
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 16 16"><path d="M8 0a8 8 0 100 16A8 8 0 008 0zm3.669 11.538c-.147.224-.43.308-.655.16-1.793-1.095-4.05-1.342-6.71-.735a.47.47 0 01-.563-.34.47.47 0 01.34-.564c2.91-.665 5.406-.378 7.427.855.224.147.308.43.16.654zm.978-2.178c-.184.28-.568.4-.85.2-2.05-1.26-5.18-1.625-7.607-1.055a.607.607 0 11-.28-1.18c2.77-.645 6.21-.333 8.534 1.185.28.184.367.568.2.85z" /></svg>
                    Open in Desktop app
                  </button>
                </div>
              )}
            </div>
            {/* Close / expand */}
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-[#b3b3b3] hover:text-white transition-colors" title="Hide Now Playing view">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16"><path d="M6.53 9.47a.75.75 0 010 1.06l-2.72 2.72h1.018a.75.75 0 010 1.5H1.25v-3.579a.75.75 0 011.5 0v1.018l2.72-2.72a.75.75 0 011.06 0zm2.94-2.94a.75.75 0 010-1.06l2.72-2.72h-1.018a.75.75 0 110-1.5h3.578v3.579a.75.75 0 01-1.5 0V3.81l-2.72 2.72a.75.75 0 01-1.06 0z" /></svg>
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto min-h-0 px-4 pb-4">
          {/* Album art */}
          <div className="w-full aspect-square bg-[#282828] rounded-lg mb-4 flex items-center justify-center overflow-hidden">
            {currentSong.cover_url ? (
              <img src={currentSong.cover_url} alt={currentSong.title} className="w-full h-full object-cover rounded-lg" />
            ) : (
              <svg className="w-16 h-16 text-[#b3b3b3]" fill="currentColor" viewBox="0 0 24 24"><path d="M15 4v12.167a3.5 3.5 0 11-3.5-3.5H13V4h2zm-2 10.667h-1.5a1.5 1.5 0 100 3 1.5 1.5 0 001.5-1.5v-1.5z" /></svg>
            )}
          </div>

          {/* Song title + share + like */}
          <div className="flex items-start justify-between mb-6">
            <div className="min-w-0 flex-1">
              <p className="text-xl font-bold text-white truncate">{currentSong.title}</p>
              <p className="text-sm text-[#b3b3b3] truncate">{currentSong.artist || "Unknown artist"}</p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button className="w-8 h-8 flex items-center justify-center text-[#b3b3b3] hover:text-white transition-colors" title="Share">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16"><path d="M1 5.75A.75.75 0 011.75 5H7v1.5H2.5v8h11V7H9V5.5h4.25a.75.75 0 01.75.75v9.5a.75.75 0 01-.75.75H1.75a.75.75 0 01-.75-.75v-9.5z" /><path d="M8 1.293l2.854 2.853-1.061 1.061L8.5 3.914V10h-1V3.914L6.207 5.207 5.146 4.146 8 1.293z" /></svg>
              </button>
              <button onClick={() => toggleLike(currentSong.id)}
                className={`w-8 h-8 flex items-center justify-center transition-colors ${isLiked(currentSong.id) ? "text-spotify-green" : "text-[#b3b3b3] hover:text-white"}`}
                title={isLiked(currentSong.id) ? "Remove from Liked Songs" : "Save to Liked Songs"}>
                {isLiked(currentSong.id) ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 16 16"><path d="M0 8a8 8 0 1116 0A8 8 0 010 8zm11.748-1.97a.75.75 0 00-1.06-1.06l-4.47 4.47-1.405-1.406a.75.75 0 10-1.061 1.06l2.466 2.467 5.53-5.53z" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 16 16"><path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8z" /><path d="M11.75 8a.75.75 0 01-.75.75H8.75v2.25a.75.75 0 01-1.5 0V8.75H5a.75.75 0 010-1.5h2.25V5a.75.75 0 011.5 0v2.25H11a.75.75 0 01.75.75z" /></svg>
                )}
              </button>
            </div>
          </div>

          {/* About the artist */}
          {currentSong.artist && (
            <div className="bg-[#1a1a1a] rounded-lg p-4 mb-4">
              <p className="text-xs font-bold text-white mb-2 uppercase tracking-wider">About the artist</p>
              <p className="text-base font-bold text-white">{currentSong.artist}</p>
            </div>
          )}

          {/* Credits */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-base font-bold text-white">Credits</p>
              <span className="text-xs text-[#b3b3b3] font-semibold hover:underline cursor-pointer">Show all</span>
            </div>
            {currentSong.artist && (
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm text-white font-medium">{currentSong.artist}</p>
                  <p className="text-xs text-[#b3b3b3]">Main Artist</p>
                </div>
                <button className="px-3 py-1 text-xs font-bold text-white border border-[#727272] rounded-full hover:border-white hover:scale-105 transition-all">Follow</button>
              </div>
            )}
          </div>

          {/* Next in queue */}
          {upNext.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-base font-bold text-white">Next in queue</p>
                <span className="text-xs text-[#b3b3b3] font-semibold hover:underline cursor-pointer">Open queue</span>
              </div>
              {upNext.map((song, i) => (
                <div key={`${song.id}-${i}`} className="flex items-center gap-3 py-2 rounded-md hover:bg-[#1a1a1a] transition-colors group">
                  <div className="w-10 h-10 bg-[#282828] rounded flex-shrink-0 flex items-center justify-center overflow-hidden">
                    {song.cover_url ? <img src={song.cover_url} alt={song.title} className="w-full h-full object-cover rounded" /> : <svg className="w-4 h-4 text-[#b3b3b3]" fill="currentColor" viewBox="0 0 24 24"><path d="M15 4v12.167a3.5 3.5 0 11-3.5-3.5H13V4h2zm-2 10.667h-1.5a1.5 1.5 0 100 3 1.5 1.5 0 001.5-1.5v-1.5z" /></svg>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white font-medium truncate">{song.title}</p>
                    <p className="text-xs text-[#b3b3b3] truncate">{song.artist || "Unknown"}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
