"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api, Song, Playlist } from "@/lib/api";
import { formatDuration } from "@/lib/audioUtils";
import { usePlayer } from "@/context/PlayerContext";
import { useToast } from "@/hooks/useToast";
import { CreditsModal } from "./CreditsModal";

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
  const { toast } = useToast();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [playlistSubOpen, setPlaylistSubOpen] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [playlistSearch, setPlaylistSearch] = useState("");
  const [creditsOpen, setCreditsOpen] = useState(false);
  const [shareSubOpen, setShareSubOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setPlaylistSubOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  const fetchPlaylists = useCallback(async () => {
    try {
      const data = await api.get<Playlist[]>("/api/playlists");
      setPlaylists(data);
    } catch {
      // api handles 401
    }
  }, []);

  const openMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!menuOpen && menuBtnRef.current) {
      const rect = menuBtnRef.current.getBoundingClientRect();
      const menuHeight = 420;
      const y = rect.top - menuHeight > 0 ? rect.top - menuHeight : rect.bottom;
      setMenuPos({ x: rect.right - 280, y });
      fetchPlaylists();
    }
    setMenuOpen(!menuOpen);
    setPlaylistSubOpen(false);
  };

  const addToPlaylist = async (playlistId: string) => {
    try {
      await api.post("/api/playlists/" + playlistId + "/songs", { song_id: song.id });
    } catch {
      // backend handles duplicates
    }
    setMenuOpen(false);
    setPlaylistSubOpen(false);
  };

  const createAndAdd = async () => {
    try {
      const newPlaylist = await api.post<Playlist>("/api/playlists", { name: `My Playlist #${playlists.length + 1}` });
      await api.post("/api/playlists/" + newPlaylist.id + "/songs", { song_id: song.id });
    } catch {
      // api handles errors
    }
    setMenuOpen(false);
    setPlaylistSubOpen(false);
  };

  const closeMenu = (e: React.MouseEvent) => { e.stopPropagation(); setMenuOpen(false); };

  const filteredPlaylists = playlistSearch
    ? playlists.filter((p) => p.name.toLowerCase().includes(playlistSearch.toLowerCase()))
    : playlists;

  const MenuItem = ({ icon, label, onClick, sub, green }: { icon: React.ReactNode; label: string; onClick?: (e: React.MouseEvent) => void; sub?: boolean; green?: boolean }) => (
    <button
      onClick={onClick || closeMenu}
      onMouseEnter={sub ? undefined : () => setPlaylistSubOpen(false)}
      className={`w-full text-left px-3 py-2 text-sm hover:bg-[#3e3e3e] flex items-center justify-between transition-colors ${green ? "text-[#1db954]" : "text-[#eaeaea] hover:text-white"}`}
    >
      <div className="flex items-center gap-3">{icon}<span>{label}</span></div>
      {sub && <svg className="w-3 h-3 text-[#b3b3b3] flex-shrink-0" fill="currentColor" viewBox="0 0 16 16"><path d="M4.646 3.646a.5.5 0 01.708 0l4 4a.5.5 0 010 .708l-4 4a.5.5 0 01-.708-.708L8.293 8 4.646 4.354a.5.5 0 010-.708z" /></svg>}
    </button>
  );

  return (
    <>
      {/* Mobile */}
      <div onClick={onPlay} className={`md:hidden flex items-center gap-3 px-3 py-2 active:bg-[#1a1a1a] cursor-pointer ${isActive ? "bg-[#1a1a1a]" : ""}`}>
        <div className="w-12 h-12 bg-[#282828] rounded flex-shrink-0 flex items-center justify-center overflow-hidden">
          {song.cover_url ? <img src={song.cover_url} alt={song.title} className="w-full h-full object-cover" /> : <svg className="w-5 h-5 text-[#b3b3b3]" fill="currentColor" viewBox="0 0 24 24"><path d="M15 4v12.167a3.5 3.5 0 11-3.5-3.5H13V4h2zm-2 10.667h-1.5a1.5 1.5 0 100 3 1.5 1.5 0 001.5-1.5v-1.5z" /></svg>}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-base font-medium truncate ${isActive ? "text-spotify-green" : "text-white"}`}>{song.title}</p>
          <p className="text-sm text-[#b3b3b3] truncate">{song.artist || "Unknown artist"}</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {isActive && isPlaying ? (
            <svg className="w-4 h-4 text-spotify-green" fill="currentColor" viewBox="0 0 16 16"><path d="M10.016 10.794a.5.5 0 00.984 0V5.206a.5.5 0 00-.984 0v5.588zm-5.032 1.803a.5.5 0 00.984 0V3.403a.5.5 0 00-.984 0v9.194z" /></svg>
          ) : (
            <span className="text-sm text-[#b3b3b3]">{formatDuration(song.duration)}</span>
          )}
        </div>
      </div>

      {/* Desktop */}
      <div
        className={`hidden md:grid group grid-cols-[16px_4fr_minmax(120px,1fr)_minmax(80px,auto)] gap-4 px-4 py-1.5 rounded-md hover:bg-[#1a1a1a] transition-colors cursor-pointer ${isActive ? "bg-[#1a1a1a]" : ""}`}
        onClick={onPlay}
      >
        <div className="flex items-center justify-center w-4">
          <span className={`text-[#b3b3b3] text-sm ${isActive && isPlaying ? "hidden" : "group-hover:hidden"}`}>
            {isActive && isPlaying ? <svg className="w-4 h-4 text-spotify-green" fill="currentColor" viewBox="0 0 16 16"><path d="M10.016 10.794a.5.5 0 00.984 0V5.206a.5.5 0 00-.984 0v5.588zm-5.032 1.803a.5.5 0 00.984 0V3.403a.5.5 0 00-.984 0v9.194z" /></svg> : index + 1}
          </span>
          <span className={`hidden group-hover:block ${isActive && isPlaying ? "!block" : ""}`}>
            {isActive && isPlaying ? <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 16 16"><path d="M2.7 1a.7.7 0 00-.7.7v12.6a.7.7 0 00.7.7h2.6a.7.7 0 00.7-.7V1.7a.7.7 0 00-.7-.7H2.7zm8 0a.7.7 0 00-.7.7v12.6a.7.7 0 00.7.7h2.6a.7.7 0 00.7-.7V1.7a.7.7 0 00-.7-.7h-2.6z" /></svg> : <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 16 16"><path d="M3 1.713a.7.7 0 011.05-.607l10.89 6.288a.7.7 0 010 1.212L4.05 14.894A.7.7 0 013 14.288V1.713z" /></svg>}
          </span>
        </div>

        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 bg-[#282828] rounded flex-shrink-0 flex items-center justify-center overflow-hidden">
            {song.cover_url ? <img src={song.cover_url} alt={song.title} className="w-full h-full object-cover rounded" /> : <svg className="w-4 h-4 text-[#b3b3b3]" fill="currentColor" viewBox="0 0 24 24"><path d="M15 4v12.167a3.5 3.5 0 11-3.5-3.5H13V4h2zm-2 10.667h-1.5a1.5 1.5 0 100 3 1.5 1.5 0 001.5-1.5v-1.5z" /></svg>}
          </div>
          <div className="min-w-0">
            <p className={`font-medium truncate text-sm ${isActive ? "text-spotify-green" : "text-white"}`}>{song.title}</p>
            <p className="text-xs text-[#b3b3b3] truncate">{song.artist || "Unknown artist"}</p>
          </div>
        </div>

        <div className="flex items-center min-w-0">
          <span className="text-sm text-[#b3b3b3] truncate">{song.album || "—"}</span>
        </div>

        <div className="flex items-center justify-end gap-1">
          {onToggleLike && (
            <button onClick={(e) => { e.stopPropagation(); onToggleLike(); }}
              className={`w-7 h-7 items-center justify-center transition-colors ${isLiked ? "flex text-spotify-green" : "hidden group-hover:flex text-[#b3b3b3] hover:text-white"}`}>
              {isLiked ? <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16"><path d="M1.69 2A4.582 4.582 0 018 2.023 4.583 4.583 0 0114.31 2a4.583 4.583 0 01.003 6.208L8 15.024 1.694 8.21A4.583 4.583 0 011.69 2z" /></svg> : <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16"><path d="M1.69 2A4.582 4.582 0 018 2.023 4.583 4.583 0 0114.31 2a4.583 4.583 0 01.003 6.208L8 15.024 1.694 8.21A4.583 4.583 0 011.69 2zm2.876.297A3.073 3.073 0 002.5 5.59a3.073 3.073 0 00.002 3.395L8 14.085l5.498-5.1A3.073 3.073 0 0013.5 5.59a3.073 3.073 0 00-5.066-2.294L8 3.723l-.434-.427A3.073 3.073 0 004.566 2.297z" /></svg>}
            </button>
          )}
          <span className="text-sm text-[#b3b3b3] w-10 text-right tabular-nums">{formatDuration(song.duration)}</span>

          {/* Full context menu */}
          <div ref={menuRef} className="relative">
            <button ref={menuBtnRef} onClick={openMenu} className={`w-7 h-7 items-center justify-center text-[#b3b3b3] hover:text-white transition-colors ${menuOpen ? "flex" : "hidden group-hover:flex"}`} title="More options for this song">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16"><path d="M3 8a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm6.5 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM16 8a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" /></svg>
            </button>
            {menuOpen && menuPos && (
              <div className="fixed w-[280px] bg-[#282828] rounded-md shadow-2xl py-1 z-[60]" style={{ left: menuPos.x, top: menuPos.y }}>
                {/* Add to playlist */}
                <div className="relative" onMouseEnter={() => setPlaylistSubOpen(true)} onMouseLeave={() => setPlaylistSubOpen(false)}>
                  <MenuItem icon={<svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 16 16"><path d="M15.25 8a.75.75 0 01-.75.75H8.75v5.75a.75.75 0 01-1.5 0V8.75H1.5a.75.75 0 010-1.5h5.75V1.5a.75.75 0 011.5 0v5.75h5.75a.75.75 0 01.75.75z" /></svg>} label="Add to playlist" sub onClick={(e) => { e.stopPropagation(); setPlaylistSubOpen(!playlistSubOpen); }} />
                  {playlistSubOpen && (
                    <div className="absolute right-full top-0 mr-1 w-[250px] bg-[#282828] rounded-md shadow-2xl py-1 z-[70] max-h-80 flex flex-col">
                      <div className="px-2 py-1.5">
                        <div className="flex items-center bg-[#3e3e3e] rounded px-2 py-1.5 gap-2">
                          <svg className="w-4 h-4 text-[#b3b3b3] flex-shrink-0" fill="currentColor" viewBox="0 0 16 16"><path d="M7 1.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM0 7a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 010 7z" /></svg>
                          <input type="text" value={playlistSearch} onChange={(e) => setPlaylistSearch(e.target.value)} onClick={(e) => e.stopPropagation()} placeholder="Find a playlist" className="bg-transparent text-xs text-white placeholder-[#b3b3b3] outline-none flex-1" />
                        </div>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); createAndAdd(); }} className="w-full text-left px-3 py-2 text-sm text-[#eaeaea] hover:bg-[#3e3e3e] flex items-center gap-3 hover:text-white transition-colors">
                        <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 16 16"><path d="M15.25 8a.75.75 0 01-.75.75H8.75v5.75a.75.75 0 01-1.5 0V8.75H1.5a.75.75 0 010-1.5h5.75V1.5a.75.75 0 011.5 0v5.75h5.75a.75.75 0 01.75.75z" /></svg>
                        New playlist
                      </button>
                      <div className="border-t border-[#3e3e3e] my-1" />
                      <div className="flex-1 overflow-y-auto">
                        {filteredPlaylists.map((p) => (
                          <button key={p.id} onClick={(e) => { e.stopPropagation(); addToPlaylist(p.id); }} className="w-full text-left px-3 py-2 text-sm text-[#eaeaea] hover:bg-[#3e3e3e] hover:text-white truncate transition-colors">
                            {p.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Remove from playlist */}
                {onDelete && (
                  <MenuItem
                    icon={<svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 16 16"><path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8z" /><path d="M11.25 8a.75.75 0 01-.75.75h-5a.75.75 0 010-1.5h5a.75.75 0 01.75.75z" /></svg>}
                    label="Remove from this playlist"
                    onClick={(e) => { e.stopPropagation(); onDelete(); setMenuOpen(false); }}
                  />
                )}

                {/* Like/Unlike */}
                {onToggleLike && (
                  <MenuItem
                    icon={isLiked
                      ? <svg className="w-4 h-4 text-[#1db954] flex-shrink-0" fill="currentColor" viewBox="0 0 16 16"><path d="M0 8a8 8 0 1116 0A8 8 0 010 8zm11.748-1.97a.75.75 0 00-1.06-1.06l-4.47 4.47-1.405-1.406a.75.75 0 10-1.061 1.06l2.466 2.467 5.53-5.53z" /></svg>
                      : <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 16 16"><path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8z" /><path d="M11.75 8a.75.75 0 01-.75.75H8.75v2.25a.75.75 0 01-1.5 0V8.75H5a.75.75 0 010-1.5h2.25V5a.75.75 0 011.5 0v2.25H11a.75.75 0 01.75.75z" /></svg>
                    }
                    label={isLiked ? "Remove from your Liked Songs" : "Save to your Liked Songs"}
                    green={isLiked}
                    onClick={(e) => { e.stopPropagation(); onToggleLike(); setMenuOpen(false); }}
                  />
                )}

                {/* Add to queue */}
                <MenuItem
                  icon={<svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 16 16"><path d="M15 15H1v-1.5h14V15zm0-4.5H1V9h14v1.5zm-14-5V4h11.5V1.5h1.5V7H1V5.5z" /></svg>}
                  label="Add to queue"
                  onClick={(e) => { e.stopPropagation(); addToQueue(song); setMenuOpen(false); }}
                />

                {/* Exclude from taste profile */}
                <MenuItem
                  icon={<svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 16 16"><path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8z" /><path d="M4.646 4.646a.5.5 0 01.708 0L8 7.293l2.646-2.647a.5.5 0 01.708.708L8.707 8l2.647 2.646a.5.5 0 01-.708.708L8 8.707l-2.646 2.647a.5.5 0 01-.708-.708L7.293 8 4.646 5.354a.5.5 0 010-.708z" /></svg>}
                  label="Exclude from your taste profile"
                  onClick={(e) => { e.stopPropagation(); toast("Taste profile is not available yet"); setMenuOpen(false); }}
                />

                <div className="border-t border-[#3e3e3e] my-1" />

                {/* Go to song radio */}
                <MenuItem
                  icon={<svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 -3 20 20"><path d="M11.4324,5.63833 C11.4094,5.61278 11.3924,5.58428 11.3674,5.55971 L11.3634,5.56265 C10.5824,4.79509 9.2434,4.86683 8.5364,5.56167 C7.8294,6.25651 7.8314,7.64423 8.5384,8.33907 C8.5474,8.34791 8.5584,8.35381 8.5674,8.36265 C8.5914,8.38722 8.6084,8.41671 8.6334,8.44128 L8.6364,8.43735 C9.4174,9.20491 10.7564,9.13415 11.4634,8.43833 C12.1704,7.74349 12.1684,6.35577 11.4614,5.66093 C11.4524,5.65209 11.4414,5.64717 11.4324,5.63833 M7.1194,4.17002 L5.7054,2.77936 C3.5844,4.86486 3.6834,9.13612 5.8044,11.22064 L7.2184,9.83096 C5.8044,8.44128 5.7054,5.55971 7.1194,4.17002 M4.2914,1.38968 L2.8774,0 C-1.3656,4.17002 -0.5596,10.5258 2.9764,14 L4.3904,12.61032 C1.5624,9.83096 1.4634,4.17002 4.2914,1.38968 M14.1954,2.77936 L12.7814,4.17002 C14.1954,5.55971 14.2944,8.44128 12.8804,9.83096 L14.2944,11.22064 C16.4154,9.13612 16.3164,4.86486 14.1954,2.77936 M17.1224,14 L15.7084,12.61032 C18.5374,9.83096 18.4384,4.17002 15.6094,1.38968 L17.0234,0 C20.5594,3.47518 21.3654,9.83096 17.1224,14" /></svg>}
                  label="Go to song radio"
                  onClick={(e) => { e.stopPropagation(); router.push(`/radio/${encodeURIComponent(song.title)}`); setMenuOpen(false); }}
                />

                {/* Go to artist */}
                <MenuItem
                  icon={<svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12,11A5,5,0,1,0,7,6,5.006,5.006,0,0,0,12,11Zm0-8A3,3,0,1,1,9,6,3,3,0,0,1,12,3ZM3,22a9,9,0,0,1,18,0,1,1,0,0,1-2,0A7,7,0,0,0,5,22a1,1,0,0,1-2,0Z" /></svg>}
                  label="Go to artist"
                  onClick={(e) => { e.stopPropagation(); if (song.artist) router.push(`/artist/${encodeURIComponent(song.artist)}`); setMenuOpen(false); }}
                />

                {/* Go to album */}
                <MenuItem
                  icon={<svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 16 16"><path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8z" /><path d="M8 6.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" /></svg>}
                  label="Go to album"
                  onClick={(e) => { e.stopPropagation(); if (song.album) router.push(`/album/${encodeURIComponent(song.album)}`); setMenuOpen(false); }}
                />

                <div className="border-t border-[#3e3e3e] my-1" />

                {/* View credits */}
                <MenuItem
                  icon={<svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 16 16"><path d="M.5 2.5A2.5 2.5 0 013 0h10a2.5 2.5 0 012.5 2.5v11A2.5 2.5 0 0113 16H3a2.5 2.5 0 01-2.5-2.5v-11zm2.5-1a1 1 0 00-1 1v11a1 1 0 001 1h10a1 1 0 001-1v-11a1 1 0 00-1-1H3zm1.5 3a.5.5 0 01.5-.5h6a.5.5 0 010 1H5a.5.5 0 01-.5-.5zm0 3a.5.5 0 01.5-.5h6a.5.5 0 010 1H5a.5.5 0 01-.5-.5zm0 3a.5.5 0 01.5-.5h4a.5.5 0 010 1H5a.5.5 0 01-.5-.5z" /></svg>}
                  label="View credits"
                  onClick={(e) => { e.stopPropagation(); setCreditsOpen(true); setMenuOpen(false); }}
                />

                {/* Share */}
                <div className="relative" onMouseEnter={() => setShareSubOpen(true)} onMouseLeave={() => setShareSubOpen(false)}>
                  <MenuItem
                    icon={<svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 16 16"><path d="M1 5.75A.75.75 0 011.75 5H7v1.5H2.5v8h11V7H9V5.5h4.25a.75.75 0 01.75.75v9.5a.75.75 0 01-.75.75H1.75a.75.75 0 01-.75-.75v-9.5z" /><path d="M8 1.293l2.854 2.853-1.061 1.061L8.5 3.914V10h-1V3.914L6.207 5.207 5.146 4.146 8 1.293z" /></svg>}
                    label="Share"
                    sub
                    onClick={(e) => { e.stopPropagation(); setShareSubOpen(!shareSubOpen); }}
                  />
                  {shareSubOpen && (
                    <div className="absolute right-full top-0 mr-1 w-[200px] bg-[#282828] rounded-md shadow-2xl py-1 z-[70]">
                      <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(window.location.href); toast("Link copied to clipboard"); setMenuOpen(false); setShareSubOpen(false); }}
                        className="w-full text-left px-3 py-2.5 text-sm text-[#eaeaea] hover:bg-[#3e3e3e] hover:text-white flex items-center gap-3 transition-colors">
                        <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 16 16"><path d="M1 2.75A.75.75 0 011.75 2h6.5a.75.75 0 010 1.5H2.5v9h9V8.75a.75.75 0 011.5 0v5.5a.75.75 0 01-.75.75H1.75a.75.75 0 01-.75-.75v-11.5z" /><path d="M7 1.75A.75.75 0 017.75 1h6.5a.75.75 0 01.75.75v6.5a.75.75 0 01-1.5 0V3.56L8.28 8.78a.75.75 0 01-1.06-1.06l5.22-5.22H7.75A.75.75 0 017 1.75z" /></svg>
                        Copy link to Song
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); toast("Embed is not available"); setMenuOpen(false); setShareSubOpen(false); }}
                        className="w-full text-left px-3 py-2.5 text-sm text-[#eaeaea] hover:bg-[#3e3e3e] hover:text-white flex items-center gap-3 transition-colors">
                        <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 16 16"><path d="M0 8a.75.75 0 01.468-.694l3.5-1.5a.75.75 0 01.593 1.377L2.24 8l2.32.817a.75.75 0 01-.593 1.377l-3.5-1.5A.75.75 0 010 8zm12.032-.817l-2.32-.817a.75.75 0 01.593-1.377l3.5 1.5a.75.75 0 010 1.377l-3.5 1.5a.75.75 0 11-.593-1.377l2.32-.806zM7.266 1.147a.75.75 0 01.587.882l-2 9a.75.75 0 01-1.47-.326l2-9a.75.75 0 01.883-.556z" /></svg>
                        Embed track
                      </button>
                    </div>
                  )}
                </div>

                <div className="border-t border-[#3e3e3e] my-1" />

                {/* Open in Desktop app */}
                <MenuItem
                  icon={<svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 16 16"><path d="M8 0a8 8 0 100 16A8 8 0 008 0zm3.669 11.538c-.147.224-.43.308-.655.16-1.793-1.095-4.05-1.342-6.71-.735a.47.47 0 01-.563-.34.47.47 0 01.34-.564c2.91-.665 5.406-.378 7.427.855.224.147.308.43.16.654zm.978-2.178c-.184.28-.568.4-.85.2-2.05-1.26-5.18-1.625-7.607-1.055a.607.607 0 11-.28-1.18c2.77-.645 6.21-.333 8.534 1.185.28.184.367.568.2.85zm.084-2.268C10.153 5.56 5.9 5.42 3.438 6.167a.727.727 0 11-.424-1.392c2.825-.858 7.523-.692 10.493 1.07a.726.726 0 01-.775 1.227z" /></svg>}
                  label="Open in Desktop app"
                  onClick={(e) => { e.stopPropagation(); toast("Desktop app is not available"); setMenuOpen(false); }}
                />



              </div>
            )}
          </div>
        </div>
      </div>
      {creditsOpen && <CreditsModal song={song} onClose={() => setCreditsOpen(false)} />}
    </>
  );
}
