"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Song, Playlist, createClient } from "@/lib/supabase";
import { formatDuration } from "@/lib/audioUtils";
import { usePlayer } from "@/context/PlayerContext";
import { useAuth } from "@/hooks/useAuth";

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
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [playlistSubOpen, setPlaylistSubOpen] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [playlistSearch, setPlaylistSearch] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const supabase = createClient();

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
    if (!user) return;
    const { data } = await supabase.from("playlists").select("*").order("name");
    if (data) setPlaylists(data);
  }, [user, supabase]);

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
    const { data: existing } = await supabase
      .from("playlist_songs")
      .select("id")
      .eq("playlist_id", playlistId)
      .eq("song_id", song.id)
      .single();
    if (existing) { setMenuOpen(false); return; }
    const { data: count } = await supabase
      .from("playlist_songs")
      .select("id", { count: "exact" })
      .eq("playlist_id", playlistId);
    await supabase.from("playlist_songs").insert({
      playlist_id: playlistId,
      song_id: song.id,
      position: count?.length || 0,
    });
    setMenuOpen(false);
    setPlaylistSubOpen(false);
  };

  const createAndAdd = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("playlists")
      .insert({ user_id: user.id, name: `My Playlist #${playlists.length + 1}` })
      .select()
      .single();
    if (data) {
      await supabase.from("playlist_songs").insert({
        playlist_id: data.id,
        song_id: song.id,
        position: 0,
      });
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
              {isLiked ? <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16"><path d="M15.724 4.22A4.313 4.313 0 0012.192.814a4.269 4.269 0 00-3.622 1.13.837.837 0 01-1.14 0 4.272 4.272 0 00-6.38 5.57l5.593 7.434a1.12 1.12 0 001.733-.074l.033-.044 5.315-7.315z" /></svg> : <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16"><path d="M1.69 2A4.582 4.582 0 018 2.023 4.583 4.583 0 0114.31 2a4.583 4.583 0 01.003 6.208L8 15.024 1.694 8.21A4.583 4.583 0 011.69 2zm2.876.297A3.073 3.073 0 002.5 5.59a3.073 3.073 0 00.002 3.395L8 14.085l5.498-5.1A3.073 3.073 0 0013.5 5.59a3.073 3.073 0 00-5.066-2.294L8 3.723l-.434-.427A3.073 3.073 0 004.566 2.297z" /></svg>}
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

                <div className="border-t border-[#3e3e3e] my-1" />

                {/* Go to song radio */}
                <MenuItem
                  icon={<svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 16 16"><path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8z" /><path d="M8 5a3 3 0 100 6 3 3 0 000-6z" /></svg>}
                  label="Go to song radio"
                />

                {/* Go to artist */}
                <MenuItem
                  icon={<svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 16 16"><path d="M11.757 2.987A4 4 0 118.243 9.01a4 4 0 013.514-6.022zM8 6a2 2 0 104 0 2 2 0 00-4 0zm-3.5 6.5a5.5 5.5 0 0111 0V14h-11v-1.5z" /></svg>}
                  label="Go to artist"
                  sub
                />

                {/* Go to album */}
                <MenuItem
                  icon={<svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 16 16"><path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8z" /><path d="M8 6.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" /></svg>}
                  label="Go to album"
                />

                <div className="border-t border-[#3e3e3e] my-1" />

                {/* View credits */}
                <MenuItem
                  icon={<svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 16 16"><path d="M.5 2.5A2.5 2.5 0 013 0h10a2.5 2.5 0 012.5 2.5v11A2.5 2.5 0 0113 16H3a2.5 2.5 0 01-2.5-2.5v-11zm2.5-1a1 1 0 00-1 1v11a1 1 0 001 1h10a1 1 0 001-1v-11a1 1 0 00-1-1H3zm1.5 3a.5.5 0 01.5-.5h6a.5.5 0 010 1H5a.5.5 0 01-.5-.5zm0 3a.5.5 0 01.5-.5h6a.5.5 0 010 1H5a.5.5 0 01-.5-.5zm0 3a.5.5 0 01.5-.5h4a.5.5 0 010 1H5a.5.5 0 01-.5-.5z" /></svg>}
                  label="View credits"
                />

                {/* Share */}
                <MenuItem
                  icon={<svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 16 16"><path d="M1 5.75A.75.75 0 011.75 5H7v1.5H2.5v8h11V7H9V5.5h4.25a.75.75 0 01.75.75v9.5a.75.75 0 01-.75.75H1.75a.75.75 0 01-.75-.75v-9.5z" /><path d="M8 1.293l2.854 2.853-1.061 1.061L8.5 3.914V10h-1V3.914L6.207 5.207 5.146 4.146 8 1.293z" /></svg>}
                  label="Share"
                  sub
                />

                <div className="border-t border-[#3e3e3e] my-1" />

                {/* Open in Desktop app */}
                <MenuItem
                  icon={<svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 16 16"><path d="M8 0a8 8 0 100 16A8 8 0 008 0zm3.669 11.538c-.147.224-.43.308-.655.16-1.793-1.095-4.05-1.342-6.71-.735a.47.47 0 01-.563-.34.47.47 0 01.34-.564c2.91-.665 5.406-.378 7.427.855.224.147.308.43.16.654zm.978-2.178c-.184.28-.568.4-.85.2-2.05-1.26-5.18-1.625-7.607-1.055a.607.607 0 11-.28-1.18c2.77-.645 6.21-.333 8.534 1.185.28.184.367.568.2.85zm.084-2.268C10.153 5.56 5.9 5.42 3.438 6.167a.727.727 0 11-.424-1.392c2.825-.858 7.523-.692 10.493 1.07a.726.726 0 01-.775 1.227z" /></svg>}
                  label="Open in Desktop app"
                />

                {/* Remove from playlist (only if onDelete) */}
                {onDelete && (
                  <>
                    <div className="border-t border-[#3e3e3e] my-1" />
                    <MenuItem
                      icon={<svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 016 6v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm2.5 0a.5.5 0 01.5.5v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm3 .5a.5.5 0 00-1 0v6a.5.5 0 001 0V6z" /><path fillRule="evenodd" d="M14.5 3a1 1 0 01-1 1H13v9a2 2 0 01-2 2H5a2 2 0 01-2-2V4h-.5a1 1 0 01-1-1V2a1 1 0 011-1H6a1 1 0 011-1h2a1 1 0 011 1h3.5a1 1 0 011 1v1zM4.118 4L4 4.059V13a1 1 0 001 1h6a1 1 0 001-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" /></svg>}
                      label="Remove from this playlist"
                      onClick={(e) => { e.stopPropagation(); onDelete(); setMenuOpen(false); }}
                    />
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
