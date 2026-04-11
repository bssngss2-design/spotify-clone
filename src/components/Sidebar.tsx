"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Playlist } from "@/lib/supabase";

interface SidebarProps {
  playlists: Playlist[];
  likedCount: number;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onCreatePlaylist?: () => void;
  onClose?: () => void;
}

export function Sidebar({ playlists, likedCount, collapsed, onToggleCollapse, onCreatePlaylist, onClose }: SidebarProps) {
  const pathname = usePathname();

  const handleNavClick = () => {
    onClose?.();
  };

  if (collapsed) {
    return (
      <aside className="w-[72px] bg-black flex flex-col h-full">
        <div className="bg-background-elevated rounded-lg mx-1 mt-2 mb-2 flex-1 flex flex-col overflow-hidden">
          <div className="p-2 flex flex-col items-center gap-1">
            <button
              onClick={onToggleCollapse}
              className="w-12 h-12 flex items-center justify-center text-foreground-subdued hover:text-white transition-colors"
              title="Expand Your Library"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 22a1 1 0 01-1-1V3a1 1 0 012 0v18a1 1 0 01-1 1zM15.5 2.134A1 1 0 0117 3v18a1 1 0 01-1.5.866l-10-6a1 1 0 010-1.732l10-6A1 1 0 0117 9v.134z" />
              </svg>
            </button>
            <button
              onClick={onCreatePlaylist}
              className="w-12 h-12 flex items-center justify-center text-foreground-subdued hover:text-white hover:bg-background-tinted rounded transition-colors"
              title="Create playlist"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 16 16">
                <path d="M15.25 8a.75.75 0 01-.75.75H8.75v5.75a.75.75 0 01-1.5 0V8.75H1.5a.75.75 0 010-1.5h5.75V1.5a.75.75 0 011.5 0v5.75h5.75a.75.75 0 01.75.75z" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-1 pb-2 space-y-1">
            {/* Liked Songs */}
            <Link
              href="/liked"
              onClick={handleNavClick}
              className={`block ${pathname === "/liked" ? "ring-2 ring-white rounded" : ""}`}
              title="Liked Songs"
            >
              <div className="w-12 h-12 mx-auto rounded bg-gradient-to-br from-[#450af5] to-[#c4efd9] flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M15.724 4.22A4.313 4.313 0 0012.192.814a4.269 4.269 0 00-3.622 1.13.837.837 0 01-1.14 0 4.272 4.272 0 00-6.38 5.57l5.593 7.434a1.12 1.12 0 001.733-.074l.033-.044 5.315-7.315z" />
                </svg>
              </div>
            </Link>
            {playlists.map((playlist) => (
              <Link
                key={playlist.id}
                href={`/playlist/${playlist.id}`}
                onClick={handleNavClick}
                className={`block ${pathname === `/playlist/${playlist.id}` ? "ring-2 ring-white rounded" : ""}`}
                title={playlist.name}
              >
                <div className="w-12 h-12 mx-auto bg-background-tinted rounded flex items-center justify-center">
                  <svg className="w-5 h-5 text-foreground-subdued" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M15 4v12.167a3.5 3.5 0 11-3.5-3.5H13V4h2zm-2 10.667h-1.5a1.5 1.5 0 100 3 1.5 1.5 0 001.5-1.5v-1.5z" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-[280px] bg-black flex flex-col h-full">
      {onClose && (
        <div className="md:hidden flex justify-end p-2">
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-foreground-subdued hover:text-white">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className="flex-1 bg-background-elevated rounded-lg mx-2 mt-2 mb-2 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
          <button onClick={onToggleCollapse} className="flex items-center gap-3 text-foreground-subdued hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 22a1 1 0 01-1-1V3a1 1 0 012 0v18a1 1 0 01-1 1zM15.5 2.134A1 1 0 0117 3v18a1 1 0 01-1.5.866l-10-6a1 1 0 010-1.732l10-6A1 1 0 0117 9v.134z" />
            </svg>
            <span className="font-bold text-base">Your Library</span>
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={onCreatePlaylist}
              className="h-8 px-3 flex items-center gap-1 text-foreground-subdued hover:text-white hover:bg-background-tinted rounded-full transition-colors text-sm font-semibold"
              title="Create playlist or folder"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                <path d="M15.25 8a.75.75 0 01-.75.75H8.75v5.75a.75.75 0 01-1.5 0V8.75H1.5a.75.75 0 010-1.5h5.75V1.5a.75.75 0 011.5 0v5.75h5.75a.75.75 0 01.75.75z" />
              </svg>
            </button>
            <button
              onClick={onToggleCollapse}
              className="w-8 h-8 hidden md:flex items-center justify-center text-foreground-subdued hover:text-white hover:bg-background-tinted rounded-full transition-colors"
              title="Show less"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                <path d="M7.596 7.304a.802.802 0 010 1.392l-6.363 3.692C.713 12.69 0 12.345 0 11.692V4.308c0-.653.713-.998 1.233-.696l6.363 3.692z" />
                <path d="M15.596 7.304a.802.802 0 010 1.392l-6.363 3.692C8.713 12.69 8 12.345 8 11.692V4.308c0-.653.713-.998 1.233-.696l6.363 3.692z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Filter chips */}
        <div className="px-4 pb-2 flex gap-2">
          <span className="px-3 py-1.5 bg-white text-black text-xs font-semibold rounded-full">Playlists</span>
          <span className="px-3 py-1.5 bg-background-tinted text-white text-xs font-semibold rounded-full hover:bg-background-highlight cursor-pointer transition-colors">Artists</span>
        </div>

        {/* Library list */}
        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {/* Liked Songs - always first */}
          <Link
            href="/liked"
            onClick={handleNavClick}
            className={`flex items-center gap-3 p-2 rounded-md transition-colors ${
              pathname === "/liked" ? "bg-background-tinted" : "hover:bg-background-tinted"
            }`}
          >
            <div className="w-12 h-12 rounded bg-gradient-to-br from-[#450af5] to-[#c4efd9] flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 16 16">
                <path d="M15.724 4.22A4.313 4.313 0 0012.192.814a4.269 4.269 0 00-3.622 1.13.837.837 0 01-1.14 0 4.272 4.272 0 00-6.38 5.57l5.593 7.434a1.12 1.12 0 001.733-.074l.033-.044 5.315-7.315z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className={`font-medium truncate ${pathname === "/liked" ? "text-spotify-green" : "text-white"}`}>
                Liked Songs
              </p>
              <div className="flex items-center gap-1 text-sm text-foreground-subdued">
                <svg className="w-3 h-3 text-spotify-green flex-shrink-0" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8.822.797a2.72 2.72 0 0 1 3.847 0l2.534 2.533a2.72 2.72 0 0 1 0 3.848l-6.356 6.355a.8.8 0 0 1-.566.235H3.28a3.51 3.51 0 0 1-2.481-1.028A3.51 3.51 0 0 1-.23 10.26V5.26a.8.8 0 0 1 .236-.566L6.36 1.34z" />
                </svg>
                <span>Playlist</span>
                <span>·</span>
                <span>{likedCount} songs</span>
              </div>
            </div>
          </Link>

          {/* User playlists */}
          {playlists.length === 0 ? (
            <div className="p-4 mt-2 bg-background-tinted rounded-lg">
              <p className="font-semibold text-white mb-1">Create your first playlist</p>
              <p className="text-sm text-foreground-subdued mb-4">It&apos;s easy, we&apos;ll help you</p>
              <button
                onClick={onCreatePlaylist}
                className="px-4 py-2 bg-white text-black text-sm font-semibold rounded-full hover:scale-105 transition-transform"
              >
                Create playlist
              </button>
            </div>
          ) : (
            <div className="space-y-0.5 mt-0.5">
              {playlists.map((playlist) => (
                <Link
                  key={playlist.id}
                  href={`/playlist/${playlist.id}`}
                  onClick={handleNavClick}
                  className={`flex items-center gap-3 p-2 rounded-md transition-colors ${
                    pathname === `/playlist/${playlist.id}` ? "bg-background-tinted" : "hover:bg-background-tinted"
                  }`}
                >
                  <div className="w-12 h-12 bg-background-tinted rounded flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-foreground-subdued" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M15 4v12.167a3.5 3.5 0 11-3.5-3.5H13V4h2zm-2 10.667h-1.5a1.5 1.5 0 100 3 1.5 1.5 0 001.5-1.5v-1.5z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-medium truncate">{playlist.name}</p>
                    <p className="text-sm text-foreground-subdued">Playlist · B</p>
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
