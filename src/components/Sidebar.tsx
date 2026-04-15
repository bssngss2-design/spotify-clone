"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Playlist, createClient } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";

interface SidebarProps {
  playlists: Playlist[];
  playlistCovers?: Record<string, string | null>;
  likedCount: number;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onCreatePlaylist?: () => void;
  onDeletePlaylist?: (id: string) => void;
  onClose?: () => void;
}

export function Sidebar({ playlists, playlistCovers = {}, likedCount, collapsed, onToggleCollapse, onCreatePlaylist, onDeletePlaylist, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const supabase = createClient();
  const [librarySearch, setLibrarySearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("playlists");
  const [sortOrder, setSortOrder] = useState<"recents" | "alphabetical">("recents");
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; playlistId: string; playlistName: string } | null>(null);
  const ctxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ctxRef.current && !ctxRef.current.contains(e.target as Node)) setCtxMenu(null);
    }
    if (ctxMenu) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [ctxMenu]);

  const handlePlaylistContextMenu = (e: React.MouseEvent, playlist: Playlist) => {
    e.preventDefault();
    e.stopPropagation();
    setCtxMenu({ x: e.clientX, y: e.clientY, playlistId: playlist.id, playlistName: playlist.name });
  };

  const deletePlaylist = useCallback(async (id: string) => {
    await supabase.from("playlists").delete().eq("id", id);
    setCtxMenu(null);
    if (pathname === `/playlist/${id}`) router.push("/");
    onDeletePlaylist?.(id);
  }, [supabase, pathname, router, onDeletePlaylist]);

  const handleNavClick = () => { onClose?.(); };

  const sortedPlaylists = sortOrder === "alphabetical"
    ? [...playlists].sort((a, b) => a.name.localeCompare(b.name))
    : playlists;

  const filteredPlaylists = librarySearch
    ? sortedPlaylists.filter((p) => p.name.toLowerCase().includes(librarySearch.toLowerCase()))
    : sortedPlaylists;

  if (collapsed) {
    return (
      <aside className="w-[72px] bg-black flex flex-col h-full">
        <div className="bg-[#121212] rounded-lg mx-1 mt-2 mb-2 flex-1 flex flex-col overflow-hidden">
          <div className="py-3 flex flex-col items-center gap-2">
            <button onClick={onToggleCollapse} className="w-10 h-10 flex items-center justify-center text-[#b3b3b3] hover:text-white transition-colors" title="Expand Your Library">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M3 2a1 1 0 00-1 1v18a1 1 0 002 0V3a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v18a1 1 0 002 0V3a1 1 0 00-1-1zm5.5.13c-.2-.08-.5.02-.5.37v19c0 .35.3.45.5.37l8-3.5c.3-.13.5-.42.5-.75V5.88c0-.33-.2-.62-.5-.75l-8-3z" /></svg>
            </button>
            <button onClick={onCreatePlaylist} className="w-10 h-10 flex items-center justify-center text-[#b3b3b3] hover:text-white hover:bg-[#1a1a1a] rounded-full transition-colors" title="Create playlist">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16"><path d="M15.25 8a.75.75 0 01-.75.75H8.75v5.75a.75.75 0 01-1.5 0V8.75H1.5a.75.75 0 010-1.5h5.75V1.5a.75.75 0 011.5 0v5.75h5.75a.75.75 0 01.75.75z" /></svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-1.5 pb-2 space-y-1">
            <Link href="/liked" onClick={handleNavClick} className={`block ${pathname === "/liked" ? "ring-2 ring-white rounded" : ""}`} title="Liked Songs">
              <div className="w-12 h-12 mx-auto rounded bg-gradient-to-br from-[#450af5] to-[#c4efd9] flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 16 16"><path d="M15.724 4.22A4.313 4.313 0 0012.192.814a4.269 4.269 0 00-3.622 1.13.837.837 0 01-1.14 0 4.272 4.272 0 00-6.38 5.57l5.593 7.434a1.12 1.12 0 001.733-.074l.033-.044 5.315-7.315z" /></svg>
              </div>
            </Link>
            {playlists.map((playlist) => (
              <Link key={playlist.id} href={`/playlist/${playlist.id}`} onClick={handleNavClick} className={`block ${pathname === `/playlist/${playlist.id}` ? "ring-2 ring-white rounded" : ""}`} title={playlist.name}>
                <div className="w-12 h-12 mx-auto bg-[#282828] rounded flex items-center justify-center overflow-hidden">
                  {playlistCovers[playlist.id] ? (
                    <img src={playlistCovers[playlist.id]!} alt={playlist.name} className="w-full h-full object-cover rounded" />
                  ) : (
                    <svg className="w-5 h-5 text-[#b3b3b3]" fill="currentColor" viewBox="0 0 24 24"><path d="M15 4v12.167a3.5 3.5 0 11-3.5-3.5H13V4h2zm-2 10.667h-1.5a1.5 1.5 0 100 3 1.5 1.5 0 001.5-1.5v-1.5z" /></svg>
                  )}
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
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-[#b3b3b3] hover:text-white">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      <div className="flex-1 bg-[#121212] rounded-lg mx-2 mt-2 mb-2 flex flex-col overflow-hidden">
        {/* Header: Library icon + Create + Expand */}
        <div className="px-4 pt-3 pb-1 flex items-center justify-between">
          <button onClick={onToggleCollapse} className="flex items-center gap-3 text-[#b3b3b3] hover:text-white transition-colors">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M3 2a1 1 0 00-1 1v18a1 1 0 002 0V3a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v18a1 1 0 002 0V3a1 1 0 00-1-1zm5.5.13c-.2-.08-.5.02-.5.37v19c0 .35.3.45.5.37l8-3.5c.3-.13.5-.42.5-.75V5.88c0-.33-.2-.62-.5-.75l-8-3z" /></svg>
            <span className="font-bold text-base">Your Library</span>
          </button>
          <div className="flex items-center gap-1">
            <button onClick={onCreatePlaylist} className="h-8 px-3 flex items-center gap-1.5 text-[#b3b3b3] hover:text-white hover:bg-[#1a1a1a] rounded-full transition-colors text-sm font-bold" title="Create playlist or folder">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16"><path d="M15.25 8a.75.75 0 01-.75.75H8.75v5.75a.75.75 0 01-1.5 0V8.75H1.5a.75.75 0 010-1.5h5.75V1.5a.75.75 0 011.5 0v5.75h5.75a.75.75 0 01.75.75z" /></svg>
            </button>
            <button onClick={onToggleCollapse} className="w-8 h-8 hidden md:flex items-center justify-center text-[#b3b3b3] hover:text-white hover:bg-[#1a1a1a] rounded-full transition-colors" title="Show more">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16"><path d="M6.53 9.47a.75.75 0 010 1.06l-2.72 2.72h1.018a.75.75 0 010 1.5H1.25v-3.579a.75.75 0 011.5 0v1.018l2.72-2.72a.75.75 0 011.06 0zm2.94-2.94a.75.75 0 010-1.06l2.72-2.72h-1.018a.75.75 0 110-1.5h3.578v3.579a.75.75 0 01-1.5 0V3.81l-2.72 2.72a.75.75 0 01-1.06 0z" /></svg>
            </button>
          </div>
        </div>

        {/* Filter chips */}
        <div className="px-3 py-2 flex gap-2 overflow-x-auto no-scrollbar">
          {(["playlists", "artists", "podcasts"] as const).map((filter) => (
            <button key={filter} onClick={() => setActiveFilter(filter)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap cursor-pointer transition-colors ${activeFilter === filter ? "bg-white text-black" : "bg-[#232323] text-white hover:bg-[#2a2a2a]"}`}>
              {filter === "playlists" ? "Playlists" : filter === "artists" ? "Artists" : "Podcasts & Shows"}
            </button>
          ))}
        </div>

        {/* Search + Recents row */}
        <div className="px-3 py-1 flex items-center justify-between">
          <div className="flex items-center">
            {searchOpen ? (
              <div className="flex items-center bg-[#2a2a2a] rounded px-2 py-1 gap-1">
                <svg className="w-4 h-4 text-[#b3b3b3] flex-shrink-0" fill="currentColor" viewBox="0 0 16 16"><path d="M7 1.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM0 7a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 010 7z" /></svg>
                <input
                  type="text"
                  value={librarySearch}
                  onChange={(e) => setLibrarySearch(e.target.value)}
                  placeholder="Search in Your Library"
                  className="bg-transparent text-xs text-white placeholder-[#b3b3b3] outline-none w-28"
                  autoFocus
                  onBlur={() => { if (!librarySearch) setSearchOpen(false); }}
                />
                {librarySearch && (
                  <button onClick={() => { setLibrarySearch(""); setSearchOpen(false); }} className="text-[#b3b3b3] hover:text-white">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 16 16"><path d="M4.646 4.646a.5.5 0 01.708 0L8 7.293l2.646-2.647a.5.5 0 01.708.708L8.707 8l2.647 2.646a.5.5 0 01-.708.708L8 8.707l-2.646 2.647a.5.5 0 01-.708-.708L7.293 8 4.646 5.354a.5.5 0 010-.708z" /></svg>
                  </button>
                )}
              </div>
            ) : (
              <button onClick={() => setSearchOpen(true)} className="w-8 h-8 flex items-center justify-center text-[#b3b3b3] hover:text-white transition-colors" title="Search in Your Library">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16"><path d="M7 1.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM0 7a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 010 7z" /></svg>
              </button>
            )}
          </div>
          <button onClick={() => setSortOrder((p) => p === "recents" ? "alphabetical" : "recents")} className="flex items-center gap-1 text-[#b3b3b3] hover:text-white transition-colors">
            <span className="text-xs font-medium">{sortOrder === "recents" ? "Recents" : "A-Z"}</span>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16"><path d="M15 14.5H5V13h10v1.5zm0-5.75H5v-1.5h10v1.5zM15 3H5V1.5h10V3zM3 3H1V1.5h2V3zm0 5.75H1v-1.5h2v1.5zM3 14.5H1V13h2v1.5z" /></svg>
          </button>
        </div>

        {/* Playlist list */}
        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {/* Liked Songs */}
          <Link href="/liked" onClick={handleNavClick}
            className={`flex items-center gap-3 p-2 rounded-md transition-colors ${pathname === "/liked" ? "bg-[#1a1a1a]" : "hover:bg-[#1a1a1a]"}`}>
            <div className="w-12 h-12 rounded bg-gradient-to-br from-[#450af5] to-[#c4efd9] flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 16 16"><path d="M15.724 4.22A4.313 4.313 0 0012.192.814a4.269 4.269 0 00-3.622 1.13.837.837 0 01-1.14 0 4.272 4.272 0 00-6.38 5.57l5.593 7.434a1.12 1.12 0 001.733-.074l.033-.044 5.315-7.315z" /></svg>
            </div>
            <div className="min-w-0">
              <p className={`font-medium truncate text-sm ${pathname === "/liked" ? "text-spotify-green" : "text-white"}`}>Liked Songs</p>
              <div className="flex items-center gap-1 text-xs text-[#b3b3b3]">
                <svg className="w-3 h-3 text-spotify-green flex-shrink-0" fill="currentColor" viewBox="0 0 16 16"><path d="M8.822.797a2.72 2.72 0 013.847 0l2.534 2.533a2.72 2.72 0 010 3.848l-6.356 6.355a.8.8 0 01-.566.235H3.28a3.51 3.51 0 01-2.481-1.028A3.51 3.51 0 01-.23 10.26V5.26a.8.8 0 01.236-.566L6.36 1.34z" /></svg>
                <span>Playlist</span>
                <span>·</span>
                <span>{likedCount} songs</span>
              </div>
            </div>
          </Link>

          {/* User playlists */}
          {filteredPlaylists.length === 0 && playlists.length === 0 ? (
            <div className="p-4 mt-2 bg-[#1a1a1a] rounded-lg">
              <p className="font-semibold text-white text-sm mb-1">Create your first playlist</p>
              <p className="text-xs text-[#b3b3b3] mb-4">It&apos;s easy, we&apos;ll help you</p>
              <button onClick={onCreatePlaylist} className="px-4 py-1.5 bg-white text-black text-xs font-bold rounded-full hover:scale-105 transition-transform">Create playlist</button>
            </div>
          ) : (
            <div className="space-y-0.5 mt-0.5">
              {filteredPlaylists.map((playlist) => (
                <Link key={playlist.id} href={`/playlist/${playlist.id}`} onClick={handleNavClick}
                  onContextMenu={(e) => handlePlaylistContextMenu(e, playlist)}
                  className={`flex items-center gap-3 p-2 rounded-md transition-colors ${pathname === `/playlist/${playlist.id}` ? "bg-[#1a1a1a]" : "hover:bg-[#1a1a1a]"}`}>
                  <div className="w-12 h-12 bg-[#282828] rounded flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {playlistCovers[playlist.id] ? (
                      <img src={playlistCovers[playlist.id]!} alt={playlist.name} className="w-full h-full object-cover rounded" />
                    ) : (
                      <svg className="w-5 h-5 text-[#b3b3b3]" fill="currentColor" viewBox="0 0 24 24"><path d="M15 4v12.167a3.5 3.5 0 11-3.5-3.5H13V4h2zm-2 10.667h-1.5a1.5 1.5 0 100 3 1.5 1.5 0 001.5-1.5v-1.5z" /></svg>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white text-sm font-medium truncate">{playlist.name}</p>
                    <p className="text-xs text-[#b3b3b3]">Playlist · B</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Playlist right-click context menu */}
      {ctxMenu && (
        <div ref={ctxRef} className="fixed z-[80] w-56 bg-[#282828] rounded-md shadow-2xl py-1" style={{ left: ctxMenu.x, top: ctxMenu.y }}>
          <button onClick={() => { toast("Added playlist to queue"); setCtxMenu(null); }} className="w-full text-left px-3 py-2 text-sm text-[#eaeaea] hover:bg-[#3e3e3e] hover:text-white flex items-center gap-3">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16"><path d="M15 15H1v-1.5h14V15zm0-4.5H1V9h14v1.5zm-14-5V4h11.5V1.5h1.5V7H1V5.5z" /></svg>
            Add to queue
          </button>
          <button onClick={() => { setCtxMenu(null); router.push(`/playlist/${ctxMenu.playlistId}`); }} className="w-full text-left px-3 py-2 text-sm text-[#eaeaea] hover:bg-[#3e3e3e] hover:text-white flex items-center gap-3">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16"><path d="M13.426 2.574a2.831 2.831 0 00-4.797 1.55l3.247 3.247a2.831 2.831 0 001.55-4.797zM10.5 8.118l-2.619-2.62A63.088 63.088 0 011.348 9.65.5.5 0 001 10.104v3.396a.5.5 0 00.5.5h3.396a.5.5 0 00.454-.348 63.088 63.088 0 014.15-5.534z" /></svg>
            Edit details
          </button>
          <button onClick={() => { if (confirm(`Delete "${ctxMenu.playlistName}"?`)) deletePlaylist(ctxMenu.playlistId); }} className="w-full text-left px-3 py-2 text-sm text-[#eaeaea] hover:bg-[#3e3e3e] hover:text-white flex items-center gap-3">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16"><path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8z" /><path d="M11.25 8a.75.75 0 01-.75.75h-5a.75.75 0 010-1.5h5a.75.75 0 01.75.75z" /></svg>
            Delete
          </button>
          <div className="border-t border-[#3e3e3e] my-1" />
          <button onClick={() => { setCtxMenu(null); onCreatePlaylist?.(); }} className="w-full text-left px-3 py-2 text-sm text-[#eaeaea] hover:bg-[#3e3e3e] hover:text-white flex items-center gap-3">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16"><path d="M2 0a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V2a2 2 0 00-2-2H2zm6.75 4.5a.75.75 0 00-1.5 0v3h-3a.75.75 0 000 1.5h3v3a.75.75 0 001.5 0v-3h3a.75.75 0 000-1.5h-3v-3z" /></svg>
            Create playlist
          </button>
          <button onClick={() => { toast("Folders are not available yet"); setCtxMenu(null); }} className="w-full text-left px-3 py-2 text-sm text-[#eaeaea] hover:bg-[#3e3e3e] hover:text-white flex items-center gap-3">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16"><path d="M1 3.5A1.5 1.5 0 012.5 2h3A1.5 1.5 0 017 3.5V4h5.5A1.5 1.5 0 0114 5.5v7a1.5 1.5 0 01-1.5 1.5h-9A1.5 1.5 0 012 12.5v-9zm1.5 0V4H5V3.5H2.5zm0 2v7h9v-7h-9z" /></svg>
            Create folder
          </button>
          <div className="border-t border-[#3e3e3e] my-1" />
          <button onClick={() => { toast("Public playlists are not available yet"); setCtxMenu(null); }} className="w-full text-left px-3 py-2 text-sm text-[#eaeaea] hover:bg-[#3e3e3e] hover:text-white flex items-center gap-3">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16"><path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8z" /></svg>
            Make public
          </button>
          <button onClick={() => { toast("Collaboration is not available yet"); setCtxMenu(null); }} className="w-full text-left px-3 py-2 text-sm text-[#eaeaea] hover:bg-[#3e3e3e] hover:text-white flex items-center gap-3">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16"><path d="M11.757 2.987A4 4 0 118.243 9.01a4 4 0 013.514-6.022zM8 6a2 2 0 104 0 2 2 0 00-4 0zm-3.5 6.5a5.5 5.5 0 0111 0V14h-11v-1.5z" /></svg>
            Invite collaborators
          </button>
          <button onClick={() => { toast("Taste profile is not available yet"); setCtxMenu(null); }} className="w-full text-left px-3 py-2 text-sm text-[#eaeaea] hover:bg-[#3e3e3e] hover:text-white flex items-center gap-3">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16"><path d="M8 0a8 8 0 100 16A8 8 0 008 0zM4.646 4.646a.5.5 0 01.708 0L8 7.293l2.646-2.647a.5.5 0 01.708.708L8.707 8l2.647 2.646a.5.5 0 01-.708.708L8 8.707l-2.646 2.647a.5.5 0 01-.708-.708L7.293 8 4.646 5.354a.5.5 0 010-.708z" /></svg>
            Exclude from your taste profile
          </button>
          <div className="border-t border-[#3e3e3e] my-1" />
          <button onClick={() => { toast("Folders are not available yet"); setCtxMenu(null); }} className="w-full text-left px-3 py-2 text-sm text-[#eaeaea] hover:bg-[#3e3e3e] hover:text-white flex items-center gap-3 justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16"><path d="M1 3.5A1.5 1.5 0 012.5 2h3A1.5 1.5 0 017 3.5V4h5.5A1.5 1.5 0 0114 5.5v7a1.5 1.5 0 01-1.5 1.5h-9A1.5 1.5 0 012 12.5v-9zm1.5 0V4H5V3.5H2.5zm0 2v7h9v-7h-9z" /></svg>
              Move to folder
            </div>
            <svg className="w-3 h-3 text-[#b3b3b3]" fill="currentColor" viewBox="0 0 16 16"><path d="M4.646 3.646a.5.5 0 01.708 0l4 4a.5.5 0 010 .708l-4 4a.5.5 0 01-.708-.708L8.293 8 4.646 4.354a.5.5 0 010-.708z" /></svg>
          </button>
          <button onClick={() => { toast("Playlist unpinned"); setCtxMenu(null); }} className="w-full text-left px-3 py-2 text-sm text-[#eaeaea] hover:bg-[#3e3e3e] hover:text-white flex items-center gap-3">
            <svg className="w-4 h-4 text-[#1db954]" fill="currentColor" viewBox="0 0 16 16"><path d="M8.822.797a2.72 2.72 0 013.847 0l2.534 2.533a2.72 2.72 0 010 3.848l-6.356 6.355a.8.8 0 01-.566.235H3.28a3.51 3.51 0 01-2.481-1.028A3.51 3.51 0 01-.23 10.26V5.26a.8.8 0 01.236-.566L6.36 1.34z" /></svg>
            Unpin playlist
          </button>
          <button onClick={() => { navigator.clipboard.writeText(window.location.href); toast("Link copied to clipboard"); setCtxMenu(null); }} className="w-full text-left px-3 py-2 text-sm text-[#eaeaea] hover:bg-[#3e3e3e] hover:text-white flex items-center gap-3 justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16"><path d="M1 5.75A.75.75 0 011.75 5H7v1.5H2.5v8h11V7H9V5.5h4.25a.75.75 0 01.75.75v9.5a.75.75 0 01-.75.75H1.75a.75.75 0 01-.75-.75v-9.5z" /><path d="M8 1.293l2.854 2.853-1.061 1.061L8.5 3.914V10h-1V3.914L6.207 5.207 5.146 4.146 8 1.293z" /></svg>
              Share
            </div>
            <svg className="w-3 h-3 text-[#b3b3b3]" fill="currentColor" viewBox="0 0 16 16"><path d="M4.646 3.646a.5.5 0 01.708 0l4 4a.5.5 0 010 .708l-4 4a.5.5 0 01-.708-.708L8.293 8 4.646 4.354a.5.5 0 010-.708z" /></svg>
          </button>
        </div>
      )}
    </aside>
  );
}
