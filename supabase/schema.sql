-- =====================================================
-- SPOTIFY CLONE DATABASE SCHEMA
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- SONGS TABLE
-- Stores metadata about uploaded audio files
-- =====================================================
CREATE TABLE IF NOT EXISTS songs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  artist TEXT,
  album TEXT,
  duration INTEGER NOT NULL DEFAULT 0, -- Duration in seconds
  file_url TEXT NOT NULL,
  cover_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster user-specific queries
CREATE INDEX IF NOT EXISTS idx_songs_user_id ON songs(user_id);
CREATE INDEX IF NOT EXISTS idx_songs_created_at ON songs(created_at DESC);

-- =====================================================
-- PLAYLISTS TABLE
-- User-created playlists
-- =====================================================
CREATE TABLE IF NOT EXISTS playlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster user-specific queries
CREATE INDEX IF NOT EXISTS idx_playlists_user_id ON playlists(user_id);

-- =====================================================
-- PLAYLIST_SONGS TABLE
-- Junction table linking songs to playlists with ordering
-- =====================================================
CREATE TABLE IF NOT EXISTS playlist_songs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  song_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure no duplicate songs in the same playlist
  UNIQUE(playlist_id, song_id)
);

-- Index for faster playlist queries
CREATE INDEX IF NOT EXISTS idx_playlist_songs_playlist_id ON playlist_songs(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_songs_position ON playlist_songs(playlist_id, position);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Users can only access their own data
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_songs ENABLE ROW LEVEL SECURITY;

-- Songs policies
CREATE POLICY "Users can view their own songs"
  ON songs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own songs"
  ON songs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own songs"
  ON songs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own songs"
  ON songs FOR DELETE
  USING (auth.uid() = user_id);

-- Playlists policies
CREATE POLICY "Users can view their own playlists"
  ON playlists FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own playlists"
  ON playlists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own playlists"
  ON playlists FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own playlists"
  ON playlists FOR DELETE
  USING (auth.uid() = user_id);

-- Playlist songs policies (user must own the playlist)
CREATE POLICY "Users can view songs in their playlists"
  ON playlist_songs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM playlists
      WHERE playlists.id = playlist_songs.playlist_id
      AND playlists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add songs to their playlists"
  ON playlist_songs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM playlists
      WHERE playlists.id = playlist_songs.playlist_id
      AND playlists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update songs in their playlists"
  ON playlist_songs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM playlists
      WHERE playlists.id = playlist_songs.playlist_id
      AND playlists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove songs from their playlists"
  ON playlist_songs FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM playlists
      WHERE playlists.id = playlist_songs.playlist_id
      AND playlists.user_id = auth.uid()
    )
  );
