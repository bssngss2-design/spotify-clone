"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "spotify_followed_artists";

function readStorage(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function writeStorage(ids: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // ignore — private mode / quota
  }
}

export function useFollowedArtists() {
  const [followed, setFollowed] = useState<Set<string>>(() => new Set(readStorage()));

  // Sync across tabs / other hook instances.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      setFollowed(new Set(readStorage()));
    };
    const onInternal = () => setFollowed(new Set(readStorage()));
    window.addEventListener("storage", onStorage);
    window.addEventListener("followed-artists-changed", onInternal);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("followed-artists-changed", onInternal);
    };
  }, []);

  const isFollowing = useCallback(
    (artist: string | null | undefined) => !!artist && followed.has(artist),
    [followed]
  );

  const toggleFollow = useCallback((artist: string | null | undefined) => {
    if (!artist) return;
    setFollowed((prev) => {
      const next = new Set(prev);
      if (next.has(artist)) {
        next.delete(artist);
      } else {
        next.add(artist);
      }
      writeStorage([...next]);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("followed-artists-changed"));
      }
      return next;
    });
  }, []);

  return { isFollowing, toggleFollow, followedCount: followed.size };
}
