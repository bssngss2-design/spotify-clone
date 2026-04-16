export interface Song {
  id: string;
  user_id: string;
  title: string;
  artist: string | null;
  album: string | null;
  duration: number;
  file_url: string;
  cover_url: string | null;
  created_at: string;
}

export interface Playlist {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface PlaylistSong {
  id: string;
  playlist_id: string;
  song_id: string;
  position: number;
  song?: Song;
}

export interface LikedSong {
  id: string;
  user_id: string;
  song_id: string;
  created_at: string;
}
