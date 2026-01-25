"use client";

import { Song } from "@/lib/supabase";
import { TrackRow } from "./TrackRow";
import { usePlayer } from "@/context/PlayerContext";

interface SongListProps {
  songs: Song[];
  onDeleteSong?: (songId: string) => void;
}

export function SongList({ songs, onDeleteSong }: SongListProps) {
  const { currentSong, playQueue } = usePlayer();

  if (songs.length === 0) {
    return null;
  }

  return (
    <div className="mt-4">
      {/* Header */}
      <div className="grid grid-cols-[16px_4fr_minmax(120px,1fr)_40px] gap-4 px-4 py-2 border-b border-border text-foreground-subdued text-xs uppercase tracking-wider">
        <div className="flex items-center justify-center">#</div>
        <div>Title</div>
        <div>Album</div>
        <div className="flex justify-end">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 3.5a.5.5 0 00-1 0V9a.5.5 0 00.252.434l3.5 2a.5.5 0 00.496-.868L8 8.71V3.5z" />
            <path d="M8 16A8 8 0 108 0a8 8 0 000 16zm7-8A7 7 0 111 8a7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Song rows */}
      <div className="mt-2">
        {songs.map((song, index) => (
          <TrackRow
            key={song.id}
            song={song}
            index={index}
            isActive={currentSong?.id === song.id}
            onPlay={() => playQueue(songs, index)}
            onDelete={onDeleteSong ? () => onDeleteSong(song.id) : undefined}
          />
        ))}
      </div>
    </div>
  );
}
