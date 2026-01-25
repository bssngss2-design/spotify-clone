-- =====================================================
-- SPOTIFY CLONE STORAGE SETUP
-- Run this in your Supabase SQL Editor AFTER schema.sql
-- =====================================================

-- Create the audio files bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio', 'audio', false)
ON CONFLICT (id) DO NOTHING;

-- Create the cover images bucket (for album art)
INSERT INTO storage.buckets (id, name, public)
VALUES ('covers', 'covers', true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- STORAGE POLICIES
-- Users can only access their own files
-- =====================================================

-- Audio bucket policies
CREATE POLICY "Users can upload their own audio files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'audio' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own audio files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'audio' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own audio files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'audio' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Covers bucket policies (public read, authenticated write)
CREATE POLICY "Users can upload their own cover images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'covers' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Anyone can view cover images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'covers');

CREATE POLICY "Users can delete their own cover images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'covers' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
