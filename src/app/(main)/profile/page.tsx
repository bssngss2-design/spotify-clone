"use client";

import { useEffect, useState } from "react";
import { api, Song, Playlist } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useLikedSongs } from "@/hooks/useLikedSongs";
import { usePlayer } from "@/context/PlayerContext";
import { useToast } from "@/hooks/useToast";
import { formatDuration } from "@/lib/audioUtils";

const FAKE_FOLLOWERS = [
  { name: "Jamie Rivers", avatar: "https://i.pravatar.cc/300?u=jamie-rivers" },
  { name: "Alex Chen", avatar: "https://i.pravatar.cc/300?u=alex-chen" },
  { name: "Nora Vasquez", avatar: "https://i.pravatar.cc/300?u=nora-vasquez" },
  { name: "Kai Anders", avatar: "https://i.pravatar.cc/300?u=kai-anders" },
];

const FAKE_FOLLOWING_USERS = [
  { name: "Riley Park", avatar: "https://i.pravatar.cc/300?u=riley-park" },
  { name: "Theo Blanc", avatar: "https://i.pravatar.cc/300?u=theo-blanc" },
  { name: "Mila Ortega", avatar: "https://i.pravatar.cc/300?u=mila-ortega" },
];

export default function ProfilePage() {
  const { user } = useAuth();
  const { isLiked } = useLikedSongs();
  const { playSong } = usePlayer();
  const { toast } = useToast();

  const [songs, setSongs] = useState<Song[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [followers] = useState(2);
  const [following] = useState(13);

  useEffect(() => {
    (async () => {
      try {
        const [s, p] = await Promise.all([
          api.get<Song[]>("/api/songs"),
          api.get<Playlist[]>("/api/playlists"),
        ]);
        setSongs(s);
        setPlaylists(p);
      } catch { /* api wrapper handles redirect */ }
    })();
  }, []);

  const displayName = user?.email?.split("@")[0] || "You";
  const initial = (displayName[0] || "U").toUpperCase();
  const topTracks = songs.slice(0, 4);

  const followingArtists = Array.from(
    new Map(
      songs
        .filter((s) => s.artist)
        .map((s) => [s.artist as string, s])
    ).values()
  ).slice(0, 3);

  return (
    <div className="pb-8">
      {/* Hero banner */}
      <div
        className="relative px-6 pt-12 pb-8"
        style={{ background: "linear-gradient(180deg, #2a4c7c 0%, #1f3a5f 60%, #1a1a1a 100%)" }}
      >
        <div className="flex items-end gap-6">
          <div className="w-[180px] h-[180px] md:w-[200px] md:h-[200px] rounded-full bg-[#333] flex items-center justify-center text-8xl font-black text-white shadow-2xl flex-shrink-0 overflow-hidden">
            {initial}
          </div>
          <div className="min-w-0 pb-2">
            <p className="text-sm font-semibold text-white mb-2">Profile</p>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-tight mb-4 leading-none">
              {displayName}
            </h1>
            <p className="text-sm text-white/90">
              <span className="font-semibold">{playlists.length} Public Playlists</span>
              <span className="mx-1.5">•</span>
              <span className="font-semibold">{followers} Followers</span>
              <span className="mx-1.5">•</span>
              <span className="font-semibold">{following} Following</span>
            </p>
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div className="px-6 py-4 flex items-center gap-5">
        <button
          onClick={() => toast("Settings not available in this demo")}
          className="text-[#b3b3b3] hover:text-white transition-colors"
          title="Profile settings"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 16 16">
            <path d="M7.5 1a.75.75 0 00-.75.75v.76a6.5 6.5 0 00-1.908.79l-.537-.537a.75.75 0 00-1.061 0l-.707.707a.75.75 0 000 1.06l.537.538A6.5 6.5 0 002.28 6.97H1.52a.75.75 0 00-.75.75v1a.75.75 0 00.75.75h.76a6.5 6.5 0 00.79 1.908l-.537.537a.75.75 0 000 1.061l.707.707a.75.75 0 001.06 0l.538-.537a6.5 6.5 0 001.908.79v.76c0 .414.336.75.75.75h1a.75.75 0 00.75-.75v-.76a6.5 6.5 0 001.908-.79l.537.537a.75.75 0 001.061 0l.707-.707a.75.75 0 000-1.06l-.537-.538a6.5 6.5 0 00.79-1.908h.76a.75.75 0 00.75-.75v-1a.75.75 0 00-.75-.75h-.76a6.5 6.5 0 00-.79-1.908l.537-.537a.75.75 0 000-1.061l-.707-.707a.75.75 0 00-1.06 0l-.538.537A6.5 6.5 0 009.5 2.51v-.76A.75.75 0 008.75 1h-1zM8 10.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
          </svg>
        </button>
        <button
          onClick={() => toast("No options available")}
          className="text-[#b3b3b3] hover:text-white transition-colors"
          title="More options"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 16 16">
            <path d="M3 8a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm6.5 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM16 8a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
          </svg>
        </button>
      </div>

      <div className="px-6 space-y-10">
        {/* Top tracks this month */}
        <section>
          <div className="flex items-end justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-white">Top tracks this month</h2>
              <p className="text-xs text-[#b3b3b3] mt-1">Only visible to you</p>
            </div>
            <button
              onClick={() => toast("Full list not available in this demo")}
              className="text-xs font-bold text-[#b3b3b3] hover:text-white transition-colors"
            >
              Show all
            </button>
          </div>

          <div className="flex flex-col">
            {topTracks.map((song, i) => (
              <button
                key={song.id}
                onClick={() => playSong(song)}
                className="grid grid-cols-[28px_1fr_1fr_28px_48px] items-center gap-4 px-2 py-2 rounded-md hover:bg-[#1f1f1f] transition-colors text-left"
              >
                <span className="text-sm text-[#b3b3b3]">{i + 1}</span>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded bg-[#282828] flex-shrink-0 overflow-hidden">
                    {song.cover_url && (
                      <img src={song.cover_url} alt={song.title} loading="eager" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-white font-medium truncate">{song.title}</p>
                    <p className="text-xs text-[#b3b3b3] truncate">{song.artist || "Unknown"}</p>
                  </div>
                </div>
                <span className="text-sm text-[#b3b3b3] truncate">{song.album || song.title}</span>
                <span className="flex items-center justify-center">
                  {isLiked(song.id) && (
                    <svg className="w-4 h-4 text-spotify-green" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M16 8A8 8 0 110 8a8 8 0 0116 0zm-3.97-3.03a.75.75 0 00-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 00-1.06 1.06L6.97 11.03a.75.75 0 001.079-.02l3.992-4.99a.75.75 0 00-.01-1.05z" />
                    </svg>
                  )}
                </span>
                <span className="text-sm text-[#b3b3b3] text-right">{formatDuration(song.duration)}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Public Playlists */}
        {playlists.length > 0 && (
          <section>
            <div className="flex items-end justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">Public Playlists</h2>
              <button
                onClick={() => toast("Full list not available in this demo")}
                className="text-xs font-bold text-[#b3b3b3] hover:text-white transition-colors"
              >
                Show all
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {playlists.slice(0, 5).map((p) => (
                <a
                  key={p.id}
                  href={`/playlist/${p.id}`}
                  className="bg-[#1a1a1a] hover:bg-[#232323] p-4 rounded-md transition-colors min-w-0"
                >
                  <div className="w-full aspect-square rounded-md mb-3 bg-gradient-to-br from-[#333] to-[#121212] overflow-hidden">
                    {p.cover_url && (
                      <img src={p.cover_url} alt={p.name} loading="eager" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <p className="text-sm font-semibold text-white truncate">{p.name}</p>
                  <p className="text-xs text-[#b3b3b3] truncate">Playlist</p>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Followers */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">Followers</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {FAKE_FOLLOWERS.slice(0, followers).map((f) => (
              <div key={f.name} className="p-4 rounded-md hover:bg-[#1a1a1a] transition-colors cursor-pointer">
                <div className="w-full aspect-square rounded-full overflow-hidden bg-[#282828] mb-3">
                  <img src={f.avatar} alt={f.name} loading="eager" className="w-full h-full object-cover" />
                </div>
                <p className="text-base font-semibold text-white truncate">{f.name}</p>
                <p className="text-sm text-[#b3b3b3]">Profile</p>
              </div>
            ))}
          </div>
        </section>

        {/* Following */}
        <section>
          <div className="flex items-end justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">Following</h2>
            <button
              onClick={() => toast("Full list not available in this demo")}
              className="text-xs font-bold text-[#b3b3b3] hover:text-white transition-colors"
            >
              Show all
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {followingArtists.map((s) => (
              <a
                key={s.artist}
                href={`/artist/${encodeURIComponent(s.artist || "")}`}
                className="p-4 rounded-md hover:bg-[#1a1a1a] transition-colors"
              >
                <div className="w-full aspect-square rounded-full overflow-hidden bg-[#282828] mb-3">
                  {s.cover_url && (
                    <img src={s.cover_url} alt={s.artist || ""} loading="eager" className="w-full h-full object-cover" />
                  )}
                </div>
                <p className="text-base font-semibold text-white truncate">{s.artist}</p>
                <p className="text-sm text-[#b3b3b3]">Artist</p>
              </a>
            ))}
            {FAKE_FOLLOWING_USERS.slice(0, Math.max(0, following - followingArtists.length)).slice(0, 2).map((u) => (
              <div key={u.name} className="p-4 rounded-md hover:bg-[#1a1a1a] transition-colors cursor-pointer">
                <div className="w-full aspect-square rounded-full overflow-hidden bg-[#282828] mb-3">
                  <img src={u.avatar} alt={u.name} loading="eager" className="w-full h-full object-cover" />
                </div>
                <p className="text-base font-semibold text-white truncate">{u.name}</p>
                <p className="text-sm text-[#b3b3b3]">Profile</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
