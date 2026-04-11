"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "./useAuth";

export function useLikedSongs() {
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [likedCount, setLikedCount] = useState(0);
  const { user } = useAuth();
  const supabase = createClient();

  const fetchLikedIds = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("liked_songs")
      .select("song_id")
      .eq("user_id", user.id);
    if (data) {
      setLikedIds(new Set(data.map((r) => r.song_id)));
      setLikedCount(data.length);
    }
  }, [user, supabase]);

  useEffect(() => {
    fetchLikedIds();
  }, [fetchLikedIds]);

  const isLiked = useCallback((songId: string) => likedIds.has(songId), [likedIds]);

  const toggleLike = useCallback(async (songId: string) => {
    if (!user) return;
    if (likedIds.has(songId)) {
      setLikedIds((prev) => { const n = new Set(prev); n.delete(songId); return n; });
      setLikedCount((c) => c - 1);
      await supabase.from("liked_songs").delete().eq("user_id", user.id).eq("song_id", songId);
    } else {
      setLikedIds((prev) => new Set(prev).add(songId));
      setLikedCount((c) => c + 1);
      await supabase.from("liked_songs").insert({ user_id: user.id, song_id: songId });
    }
  }, [user, likedIds, supabase]);

  return { likedIds, likedCount, isLiked, toggleLike, refetch: fetchLikedIds };
}
