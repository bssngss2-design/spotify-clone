"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { useAuth } from "./useAuth";

export function useLikedSongs() {
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [likedCount, setLikedCount] = useState(0);
  const { user } = useAuth();

  const fetchLikedIds = useCallback(async () => {
    if (!user) return;
    try {
      const data = await api.get<{ song_id: string }[]>("/api/liked");
      const ids = data.map((r) => r.song_id);
      setLikedIds(new Set(ids));
      setLikedCount(ids.length);
    } catch {
      // token might be missing / expired — handled by api wrapper redirect
    }
  }, [user]);

  useEffect(() => {
    fetchLikedIds();
  }, [fetchLikedIds]);

  const isLiked = useCallback((songId: string) => likedIds.has(songId), [likedIds]);

  const toggleLike = useCallback(async (songId: string) => {
    if (!user) return;
    if (likedIds.has(songId)) {
      setLikedIds((prev) => { const n = new Set(prev); n.delete(songId); return n; });
      setLikedCount((c) => c - 1);
      await api.del("/api/liked/" + songId);
    } else {
      setLikedIds((prev) => new Set(prev).add(songId));
      setLikedCount((c) => c + 1);
      await api.post("/api/liked/" + songId);
    }
  }, [user, likedIds]);

  return { likedIds, likedCount, isLiked, toggleLike, refetch: fetchLikedIds };
}
