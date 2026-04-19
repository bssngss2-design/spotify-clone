"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { api, Song, Playlist } from "@/lib/api";
import { usePlayer } from "@/context/PlayerContext";
import { useAuth } from "@/hooks/useAuth";

type RecentItem =
  | { kind: "song"; playedAt: Date; song: Song }
  | { kind: "playlist"; playedAt: Date; playlist: Playlist; songsPlayed: number };

function aprilDate(day: number, hour: number, minute: number) {
  return new Date(2025, 3, day, hour, minute);
}

const PLAY_EVENTS: { type: "song" | "playlist"; day: number; hour: number; minute: number; pick: number; count?: number }[] = [
  { type: "playlist", day: 18, hour: 22, minute: 14, pick: 0, count: 1 },
  { type: "playlist", day: 17, hour: 23, minute: 56, pick: 1, count: 20 },
  { type: "playlist", day: 17, hour: 20, minute: 30, pick: 2, count: 15 },
  { type: "song", day: 17, hour: 18, minute: 12, pick: 3 },
  { type: "playlist", day: 17, hour: 14, minute: 5, pick: 3, count: 3 },
  { type: "song", day: 16, hour: 22, minute: 8, pick: 5 },
  { type: "playlist", day: 16, hour: 19, minute: 42, pick: 0, count: 7 },
  { type: "playlist", day: 16, hour: 17, minute: 0, pick: 4, count: 4 },
  { type: "playlist", day: 16, hour: 12, minute: 30, pick: 1, count: 3 },
  { type: "playlist", day: 15, hour: 21, minute: 15, pick: 2, count: 10 },
  { type: "song", day: 15, hour: 18, minute: 47, pick: 7 },
  { type: "song", day: 14, hour: 22, minute: 18, pick: 8 },
  { type: "playlist", day: 13, hour: 20, minute: 5, pick: 0, count: 5 },
  { type: "song", day: 12, hour: 10, minute: 0, pick: 9 },
  { type: "playlist", day: 11, hour: 21, minute: 30, pick: 3, count: 2 },
  { type: "song", day: 9, hour: 19, minute: 45, pick: 10 },
  { type: "song", day: 7, hour: 11, minute: 15, pick: 11 },
  { type: "playlist", day: 5, hour: 22, minute: 0, pick: 4, count: 6 },
  { type: "song", day: 3, hour: 20, minute: 10, pick: 12 },
  { type: "song", day: 1, hour: 15, minute: 42, pick: 13 },
];

function labelForDate(d: Date, today: Date): string {
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = Math.round((todayOnly.getTime() - dOnly.getTime()) / 86_400_000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export default function RecentsPage() {
  const { playSong } = usePlayer();
  const { user } = useAuth();
  const [songs, setSongs] = useState<Song[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [playlistSongs, setPlaylistSongs] = useState<Record<string, Song[]>>({});

  const ownerLabel = (user?.email?.[0] || "B").toUpperCase();

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
      setLoading(false);
    })();
  }, []);

  const loadPlaylistSongs = useCallback(async (playlistId: string) => {
    if (playlistSongs[playlistId]) return;
    try {
      const data = await api.get<{ songs: { song: Song }[] }>("/api/playlists/" + playlistId);
      const list = data.songs.map((ps) => ps.song).filter(Boolean);
      setPlaylistSongs((prev) => ({ ...prev, [playlistId]: list }));
    } catch { /* ignore */ }
  }, [playlistSongs]);

  const toggleExpanded = useCallback((key: string, item: RecentItem) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
    if (item.kind === "playlist") loadPlaylistSongs(item.playlist.id);
  }, [loadPlaylistSongs]);

  const items = useMemo<RecentItem[]>(() => {
    if (songs.length === 0 && playlists.length === 0) return [];
    const out: RecentItem[] = [];
    for (const ev of PLAY_EVENTS) {
      if (ev.type === "song" && songs.length > 0) {
        out.push({
          kind: "song",
          playedAt: aprilDate(ev.day, ev.hour, ev.minute),
          song: songs[ev.pick % songs.length],
        });
      } else if (ev.type === "playlist" && playlists.length > 0) {
        out.push({
          kind: "playlist",
          playedAt: aprilDate(ev.day, ev.hour, ev.minute),
          playlist: playlists[ev.pick % playlists.length],
          songsPlayed: ev.count ?? 1,
        });
      }
    }
    return out;
  }, [songs, playlists]);

  const groups = useMemo(() => {
    const today = new Date(2025, 3, 18);
    const buckets = new Map<string, { label: string; sortKey: number; items: RecentItem[] }>();
    for (const item of items) {
      const key = `${item.playedAt.getFullYear()}-${item.playedAt.getMonth()}-${item.playedAt.getDate()}`;
      const existing = buckets.get(key);
      if (existing) {
        existing.items.push(item);
      } else {
        buckets.set(key, {
          label: labelForDate(item.playedAt, today),
          sortKey: item.playedAt.getTime(),
          items: [item],
        });
      }
    }
    return Array.from(buckets.values()).sort((a, b) => b.sortKey - a.sortKey);
  }, [items]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-foreground-subdued border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-6 py-8 max-w-4xl">
      <div className="mb-6">
        <p className="text-sm font-semibold text-[#b3b3b3]">Listening history</p>
        <h1 className="text-4xl md:text-5xl font-black text-white mt-1">Recents</h1>
      </div>

      {groups.length === 0 ? (
        <p className="text-[#b3b3b3]">Nothing to show yet.</p>
      ) : (
        <div className="space-y-8">
          {groups.map((g) => (
            <section key={g.label + g.sortKey}>
              <h2 className="text-2xl md:text-3xl font-black text-white mb-3">{g.label}</h2>
              <div className="flex flex-col">
                {g.items.map((item, i) => {
                  const key = `${g.label}-${g.sortKey}-${i}`;
                  const isOpen = !!expanded[key];
                  return (
                    <RecentRow
                      key={key}
                      item={item}
                      ownerLabel={ownerLabel}
                      open={isOpen}
                      onToggle={() => toggleExpanded(key, item)}
                      playlistSongs={item.kind === "playlist" ? playlistSongs[item.playlist.id] : undefined}
                      onPlaySong={playSong}
                    />
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function RecentRow({
  item,
  ownerLabel,
  open,
  onToggle,
  playlistSongs,
  onPlaySong,
}: {
  item: RecentItem;
  ownerLabel: string;
  open: boolean;
  onToggle: () => void;
  playlistSongs: Song[] | undefined;
  onPlaySong: (song: Song) => void;
}) {
  const isSong = item.kind === "song";
  const cover = isSong ? item.song.cover_url : item.playlist.cover_url;
  const title = isSong ? item.song.title : item.playlist.name;
  const subtitle = isSong
    ? `Song · ${item.song.artist || "Unknown"}`
    : `${item.songsPlayed} ${item.songsPlayed === 1 ? "song" : "songs"} played · Playlist · ${ownerLabel}`;

  const expandedSongs: Song[] = isSong
    ? [item.song]
    : (playlistSongs ?? []).slice(0, item.songsPlayed);

  return (
    <div className="flex flex-col">
      <button
        onClick={onToggle}
        className="flex items-center gap-4 px-2 py-2 rounded-md hover:bg-[#1f1f1f] transition-colors group text-left"
      >
        <div className={`w-14 h-14 ${isSong ? "rounded" : "rounded"} bg-gradient-to-br from-[#333] to-[#121212] overflow-hidden flex-shrink-0`}>
          {cover && (
            <img src={cover} alt={title} loading="eager" className="w-full h-full object-cover" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold text-white truncate">{title}</p>
          <p className="text-sm text-[#b3b3b3] truncate">{subtitle}</p>
        </div>
        <svg
          className={`w-5 h-5 text-[#b3b3b3] group-hover:text-white transition-all flex-shrink-0 ${open ? "rotate-180" : ""}`}
          fill="currentColor"
          viewBox="0 0 16 16"
        >
          <path d="M14 6l-6 6-6-6 1.41-1.41L8 9.17l4.59-4.58L14 6z" />
        </svg>
      </button>

      {open && (
        <div className="pl-[72px] pr-2 pt-1 pb-3 flex flex-col">
          {isSong ? null : !playlistSongs ? (
            <div className="py-2 text-sm text-[#b3b3b3]">Loading...</div>
          ) : expandedSongs.length === 0 ? (
            <div className="py-2 text-sm text-[#b3b3b3]">No songs to show.</div>
          ) : null}
          {expandedSongs.map((song, i) => (
            <div
              key={`${song.id}-${i}`}
              className="flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-[#1f1f1f] transition-colors cursor-pointer"
              onClick={() => onPlaySong(song)}
            >
              <div className="w-10 h-10 rounded bg-[#282828] overflow-hidden flex-shrink-0">
                {song.cover_url && (
                  <img src={song.cover_url} alt={song.title} loading="eager" className="w-full h-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white truncate">{song.title}</p>
                <p className="text-xs text-[#b3b3b3] truncate">{song.artist || "Unknown"}</p>
              </div>
              <span className="w-6 h-6 flex items-center justify-center text-[#b3b3b3]">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M3 8a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm6.5 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM16 8a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                </svg>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
