"use client";

import { useState, useEffect, useCallback, ReactNode } from "react";
import { TopBar } from "./TopBar";
import { Sidebar } from "./Sidebar";
import { Player } from "./Player";
import { PlayerProvider } from "@/context/PlayerContext";
import { NowPlayingPanel } from "./NowPlayingPanel";
import { QueuePanel } from "./QueuePanel";
import { LyricsPanel } from "./LyricsPanel";
import { api, Playlist } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useLikedSongs } from "@/hooks/useLikedSongs";
import { ToastProvider } from "@/hooks/useToast";

type RightPanel = "now-playing" | "queue" | "lyrics";

function CollapsedNowPlayingBar({ onExpand }: { onExpand: () => void }) {
  return (
    <aside className="w-8 h-full bg-[#121212] rounded-lg m-2 ml-0 flex items-center justify-center flex-shrink-0">
      <button
        onClick={onExpand}
        className="w-8 h-full flex items-center justify-center text-[#b3b3b3] hover:text-white transition-colors"
        title="Show Now Playing view"
      >
        <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 4L6 8L10 12" />
        </svg>
      </button>
    </aside>
  );
}

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [rightPanel, setRightPanel] = useState<RightPanel>("now-playing");
  const [nowPlayingCollapsed, setNowPlayingCollapsed] = useState(false);
  const { user, loading } = useAuth();
  const { likedCount } = useLikedSongs();

  useEffect(() => {
    try {
      const saved = localStorage.getItem("now_playing_collapsed");
      if (saved === "1") setNowPlayingCollapsed(true);
    } catch { /* ignore */ }
  }, []);

  const toggleNowPlayingCollapsed = useCallback((next: boolean) => {
    setNowPlayingCollapsed(next);
    try { localStorage.setItem("now_playing_collapsed", next ? "1" : "0"); } catch { /* ignore */ }
  }, []);

  const [playlistCovers, setPlaylistCovers] = useState<Record<string, string | null>>({});

  const fetchPlaylists = useCallback(async () => {
    try {
      const data = await api.get<Playlist[]>("/api/playlists");
      setPlaylists(data);
    } catch {
      // api wrapper handles 401 redirect
    }
  }, []);

  useEffect(() => { if (!loading && user) fetchPlaylists(); }, [loading, user, fetchPlaylists]);

  const handleCreatePlaylist = async (): Promise<string | null> => {
    if (!user) return null;
    try {
      const playlistNumber = playlists.length + 1;
      const data = await api.post<Playlist>("/api/playlists", { name: `My Playlist #${playlistNumber}` });
      setPlaylists((prev) => [data, ...prev]);
      return data.id;
    } catch (err) {
      alert("Failed to create playlist: " + (err instanceof Error ? err.message : "Unknown error"));
      return null;
    }
  };

  const handleDeletePlaylist = useCallback((id: string) => {
    setPlaylists((prev) => prev.filter((p) => p.id !== id));
    setPlaylistCovers((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const togglePanel = (panel: RightPanel) => {
    setRightPanel((prev) => (prev === panel ? "now-playing" : panel));
  };

  return (
    <PlayerProvider>
      <ToastProvider>
      <div className="h-screen flex flex-col bg-black">
        <div className="hidden md:block">
          <TopBar />
        </div>

        <div className="md:hidden flex items-center justify-between p-3 bg-black">
          <button onClick={() => setSidebarOpen(true)} className="w-10 h-10 flex items-center justify-center text-white">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-white">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
            </svg>
            <span className="text-base font-bold text-white">Spotify</span>
          </div>
          <div className="w-10" />
        </div>

        <div className="flex-1 flex overflow-hidden">
          {sidebarOpen && (
            <div className="md:hidden fixed inset-0 bg-black/60 z-40" onClick={() => setSidebarOpen(false)} />
          )}

          <div className={`fixed md:hidden inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
            <Sidebar playlists={playlists} playlistCovers={playlistCovers} likedCount={likedCount} collapsed={false} onToggleCollapse={() => {}} onCreatePlaylist={handleCreatePlaylist} onDeletePlaylist={handleDeletePlaylist} onClose={() => setSidebarOpen(false)} />
          </div>

          <div className="hidden md:block flex-shrink-0">
            <Sidebar playlists={playlists} playlistCovers={playlistCovers} likedCount={likedCount} collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} onCreatePlaylist={handleCreatePlaylist} onDeletePlaylist={handleDeletePlaylist} />
          </div>

          <main className="flex-1 overflow-y-auto bg-background-elevated md:rounded-lg md:mr-2 md:mb-2">
            {children}
          </main>

          {/* Right panels: Now Playing is always present (expanded or collapsed); Queue/Lyrics replace it */}
          {rightPanel === "now-playing" && !nowPlayingCollapsed && (
            <div className="hidden md:block flex-shrink-0">
              <NowPlayingPanel
                onCollapse={() => toggleNowPlayingCollapsed(true)}
                onToggleQueue={() => togglePanel("queue")}
              />
            </div>
          )}
          {rightPanel === "now-playing" && nowPlayingCollapsed && (
            <div className="hidden md:block flex-shrink-0">
              <CollapsedNowPlayingBar onExpand={() => toggleNowPlayingCollapsed(false)} />
            </div>
          )}
          {rightPanel === "queue" && (
            <div className="hidden md:block flex-shrink-0">
              <QueuePanel onClose={() => setRightPanel("now-playing")} />
            </div>
          )}
          {rightPanel === "lyrics" && (
            <div className="hidden md:block flex-shrink-0">
              <LyricsPanel onClose={() => setRightPanel("now-playing")} />
            </div>
          )}
        </div>

        <Player
          activePanel={rightPanel}
          onToggleQueue={() => togglePanel("queue")}
          onToggleLyrics={() => togglePanel("lyrics")}
        />
      </div>
      </ToastProvider>
    </PlayerProvider>
  );
}
