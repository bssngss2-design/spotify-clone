"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Playlist } from "@/lib/supabase";

interface SidebarProps {
  playlists: Playlist[];
  onCreatePlaylist?: () => void;
  onClose?: () => void;
}

export function Sidebar({ playlists, onCreatePlaylist, onClose }: SidebarProps) {
  const pathname = usePathname();

  const handleNavClick = () => {
    // Close sidebar on mobile after clicking a link
    onClose?.();
  };

  return (
    <aside className="w-64 bg-black flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2" onClick={handleNavClick}>
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-white">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
          </svg>
          <span className="text-xl font-bold text-white">Spotify</span>
        </Link>
        {/* Close button for mobile */}
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden w-8 h-8 flex items-center justify-center text-foreground-subdued hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="px-2">
        <Link
          href="/"
          onClick={handleNavClick}
          className={`flex items-center gap-4 px-4 py-3 rounded-md transition-colors ${
            pathname === "/"
              ? "bg-background-tinted text-white"
              : "text-foreground-subdued hover:text-white"
          }`}
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12.5 3.247a1 1 0 00-1 0L4 7.577V20h4.5v-6a1 1 0 011-1h5a1 1 0 011 1v6H20V7.577l-7.5-4.33zm-2-1.732a3 3 0 013 0l7.5 4.33a2 2 0 011 1.732V21a1 1 0 01-1 1h-6.5a1 1 0 01-1-1v-6h-3v6a1 1 0 01-1 1H3a1 1 0 01-1-1V7.577a2 2 0 011-1.732l7.5-4.33z" />
          </svg>
          <span className="font-semibold">Home</span>
        </Link>
      </nav>

      {/* Library section */}
      <div className="flex-1 mt-6 bg-background-elevated rounded-lg mx-2 flex flex-col overflow-hidden">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-foreground-subdued hover:text-white cursor-pointer transition-colors">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 22a1 1 0 01-1-1V3a1 1 0 012 0v18a1 1 0 01-1 1zM15.5 2.134A1 1 0 0117 3v18a1 1 0 01-1.5.866l-10-6a1 1 0 010-1.732l10-6A1 1 0 0117 9v.134z" />
            </svg>
            <span className="font-semibold">Your Library</span>
          </div>
          <button
            onClick={onCreatePlaylist}
            className="w-8 h-8 flex items-center justify-center text-foreground-subdued hover:text-white hover:bg-background-tinted rounded-full transition-colors"
            title="Create playlist"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
              <path d="M15.25 8a.75.75 0 01-.75.75H8.75v5.75a.75.75 0 01-1.5 0V8.75H1.5a.75.75 0 010-1.5h5.75V1.5a.75.75 0 011.5 0v5.75h5.75a.75.75 0 01.75.75z" />
            </svg>
          </button>
        </div>

        {/* Playlists list */}
        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {playlists.length === 0 ? (
            <div className="p-4 bg-background-tinted rounded-lg">
              <p className="font-semibold text-white mb-1">
                Create your first playlist
              </p>
              <p className="text-sm text-foreground-subdued mb-4">
                It&apos;s easy, we&apos;ll help you
              </p>
              <button
                onClick={onCreatePlaylist}
                className="px-4 py-2 bg-white text-black text-sm font-semibold rounded-full hover:scale-105 transition-transform"
              >
                Create playlist
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              {playlists.map((playlist) => (
                <Link
                  key={playlist.id}
                  href={`/playlist/${playlist.id}`}
                  onClick={handleNavClick}
                  className={`flex items-center gap-3 p-2 rounded-md transition-colors ${
                    pathname === `/playlist/${playlist.id}`
                      ? "bg-background-tinted"
                      : "hover:bg-background-tinted"
                  }`}
                >
                  <div className="w-12 h-12 bg-background-tinted rounded flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-6 h-6 text-foreground-subdued"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M15 4v12.167a3.5 3.5 0 11-3.5-3.5H13V4h2zm-2 10.667h-1.5a1.5 1.5 0 100 3 1.5 1.5 0 001.5-1.5v-1.5z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-medium truncate">
                      {playlist.name}
                    </p>
                    <p className="text-sm text-foreground-subdued">Playlist</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
