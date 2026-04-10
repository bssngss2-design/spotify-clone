"use client";

import { useState, useEffect, useCallback, ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Player } from "./Player";
import { PlayerProvider } from "@/context/PlayerContext";
import { createClient, Playlist } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const supabase = createClient();

  // Fetch playlists
  const fetchPlaylists = useCallback(async () => {
    if (!user) return;

    const { data } = await supabase
      .from("playlists")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) {
      setPlaylists(data);
    }
  }, [user, supabase]);

  useEffect(() => {
    fetchPlaylists();
  }, [fetchPlaylists]);

  // Create new playlist
  const handleCreatePlaylist = async () => {
    if (!user) {
      console.error("No user logged in");
      return;
    }

    const playlistNumber = playlists.length + 1;
    const { data, error } = await supabase
      .from("playlists")
      .insert({
        user_id: user.id,
        name: `My Playlist #${playlistNumber}`,
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create playlist:", error);
      alert("Failed to create playlist: " + error.message);
      return;
    }

    if (data) {
      setPlaylists((prev) => [data, ...prev]);
    }
  };

  return (
    <PlayerProvider>
      <div className="h-screen flex flex-col bg-black">
        {/* Mobile header */}
        <div className="md:hidden flex items-center justify-between p-4 bg-black">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-10 h-10 flex items-center justify-center text-white"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-white">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
            </svg>
            <span className="text-lg font-bold text-white">Spotify</span>
          </div>
          <div className="w-10"></div>
        </div>

        {/* Main content area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Mobile sidebar overlay */}
          {sidebarOpen && (
            <div
              className="md:hidden fixed inset-0 bg-black/60 z-40"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Sidebar */}
          <div
            className={`fixed md:relative inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${
              sidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <Sidebar
              playlists={playlists}
              onCreatePlaylist={handleCreatePlaylist}
              onClose={() => setSidebarOpen(false)}
            />
          </div>

          {/* Main content */}
          <main className="flex-1 overflow-y-auto bg-background-elevated md:rounded-lg md:m-2 md:ml-0">
            {children}
          </main>
        </div>

        {/* Player */}
        <Player />
      </div>
    </PlayerProvider>
  );
}
