"use client";

import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import { Song } from "@/lib/supabase";
import { getCachedAudio, cacheAudioFile, getAllCachedSongIds } from "@/lib/offlineStorage";

export type RepeatMode = "off" | "all" | "one";

interface PlayerState {
  currentSong: Song | null;
  queue: Song[];
  currentIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
}

interface PlayerContextType extends PlayerState {
  // Playback controls
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  
  // Queue controls
  playQueue: (songs: Song[], startIndex?: number) => void;
  playSong: (song: Song) => void;
  addToQueue: (song: Song) => void;
  next: () => void;
  previous: () => void;
  
  // Mode controls
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  
  // Audio ref for external use
  audioRef: React.RefObject<HTMLAudioElement | null>;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<PlayerState>({
    currentSong: null,
    queue: [],
    currentIndex: -1,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    isMuted: false,
    shuffle: false,
    repeat: "off",
  });

  // Shuffled indices for shuffle mode
  const [shuffledIndices, setShuffledIndices] = useState<number[]>([]);

  // Create shuffled order
  const shuffleArray = useCallback((length: number, currentIdx: number) => {
    const indices = Array.from({ length }, (_, i) => i);
    // Remove current index
    const remaining = indices.filter((i) => i !== currentIdx);
    // Fisher-Yates shuffle
    for (let i = remaining.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
    }
    // Put current song first
    return [currentIdx, ...remaining];
  }, []);

  // Play a specific queue
  const playQueue = useCallback(
    (songs: Song[], startIndex = 0) => {
      if (songs.length === 0) return;
      
      setState((prev) => ({
        ...prev,
        queue: songs,
        currentIndex: startIndex,
        currentSong: songs[startIndex],
        isPlaying: true,
      }));

      if (state.shuffle) {
        setShuffledIndices(shuffleArray(songs.length, startIndex));
      }
    },
    [state.shuffle, shuffleArray]
  );

  // Play a single song
  const playSong = useCallback((song: Song) => {
    setState((prev) => ({
      ...prev,
      queue: [song],
      currentIndex: 0,
      currentSong: song,
      isPlaying: true,
    }));
    setShuffledIndices([0]);
  }, []);

  // Add song to queue
  const addToQueue = useCallback((song: Song) => {
    setState((prev) => ({
      ...prev,
      queue: [...prev.queue, song],
    }));
  }, []);

  // Get next index considering shuffle
  const getNextIndex = useCallback(() => {
    if (state.queue.length === 0) return -1;

    if (state.repeat === "one") {
      return state.currentIndex;
    }

    let nextIdx: number;
    
    if (state.shuffle && shuffledIndices.length > 0) {
      const currentShufflePos = shuffledIndices.indexOf(state.currentIndex);
      const nextShufflePos = currentShufflePos + 1;
      
      if (nextShufflePos >= shuffledIndices.length) {
        if (state.repeat === "all") {
          nextIdx = shuffledIndices[0];
        } else {
          return -1; // End of queue
        }
      } else {
        nextIdx = shuffledIndices[nextShufflePos];
      }
    } else {
      nextIdx = state.currentIndex + 1;
      if (nextIdx >= state.queue.length) {
        if (state.repeat === "all") {
          nextIdx = 0;
        } else {
          return -1;
        }
      }
    }

    return nextIdx;
  }, [state.queue.length, state.currentIndex, state.shuffle, state.repeat, shuffledIndices]);

  // Get previous index
  const getPreviousIndex = useCallback(() => {
    if (state.queue.length === 0) return -1;

    if (state.shuffle && shuffledIndices.length > 0) {
      const currentShufflePos = shuffledIndices.indexOf(state.currentIndex);
      const prevShufflePos = currentShufflePos - 1;
      
      if (prevShufflePos < 0) {
        if (state.repeat === "all") {
          return shuffledIndices[shuffledIndices.length - 1];
        }
        return state.currentIndex; // Stay at current
      }
      return shuffledIndices[prevShufflePos];
    }

    let prevIdx = state.currentIndex - 1;
    if (prevIdx < 0) {
      if (state.repeat === "all") {
        prevIdx = state.queue.length - 1;
      } else {
        prevIdx = 0;
      }
    }
    return prevIdx;
  }, [state.queue.length, state.currentIndex, state.shuffle, state.repeat, shuffledIndices]);

  // Next track
  const next = useCallback(() => {
    const nextIdx = getNextIndex();
    if (nextIdx >= 0 && nextIdx < state.queue.length) {
      setState((prev) => ({
        ...prev,
        currentIndex: nextIdx,
        currentSong: prev.queue[nextIdx],
        isPlaying: true,
      }));
    } else {
      setState((prev) => ({ ...prev, isPlaying: false }));
    }
  }, [getNextIndex, state.queue.length]);

  // Previous track (or restart if > 3 seconds in)
  const previous = useCallback(() => {
    if (state.currentTime > 3) {
      // Restart current song
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
      }
      return;
    }

    const prevIdx = getPreviousIndex();
    if (prevIdx >= 0 && prevIdx < state.queue.length) {
      setState((prev) => ({
        ...prev,
        currentIndex: prevIdx,
        currentSong: prev.queue[prevIdx],
        isPlaying: true,
      }));
    }
  }, [state.currentTime, getPreviousIndex, state.queue.length]);

  // Basic controls
  const play = useCallback(() => {
    setState((prev) => ({ ...prev, isPlaying: true }));
  }, []);

  const pause = useCallback(() => {
    setState((prev) => ({ ...prev, isPlaying: false }));
  }, []);

  const togglePlay = useCallback(() => {
    setState((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
  }, []);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
    setState((prev) => ({ ...prev, currentTime: time }));
  }, []);

  const setVolume = useCallback((volume: number) => {
    setState((prev) => ({ ...prev, volume, isMuted: volume === 0 }));
  }, []);

  const toggleMute = useCallback(() => {
    setState((prev) => ({ ...prev, isMuted: !prev.isMuted }));
  }, []);

  const toggleShuffle = useCallback(() => {
    setState((prev) => {
      const newShuffle = !prev.shuffle;
      if (newShuffle && prev.queue.length > 0) {
        setShuffledIndices(shuffleArray(prev.queue.length, prev.currentIndex));
      }
      return { ...prev, shuffle: newShuffle };
    });
  }, [shuffleArray]);

  const cycleRepeat = useCallback(() => {
    setState((prev) => {
      const modes: RepeatMode[] = ["off", "all", "one"];
      const currentIdx = modes.indexOf(prev.repeat);
      const nextIdx = (currentIdx + 1) % modes.length;
      return { ...prev, repeat: modes[nextIdx] };
    });
  }, []);

  // ──────────────────────────────────────────────────────
  // SINGLE unified effect: handles song changes AND play/pause
  // No more two effects fighting over the <audio> element
  // ──────────────────────────────────────────────────────
  const loadedSongId = useRef<string | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // No song selected — nothing to do
    if (!state.currentSong) {
      audio.pause();
      return;
    }

    const songId = state.currentSong.id;
    const songChanged = songId !== loadedSongId.current;

    // ── SAME SONG: just toggle play/pause (synchronous, no source change) ──
    if (!songChanged) {
      if (state.isPlaying) {
        audio.play().catch(() => {});
      } else {
        audio.pause();
      }
      return;
    }

    // ── DIFFERENT SONG: stop old audio, resolve source, load, play ──
    audio.pause();

    let cancelled = false;

    async function loadNewSong() {
      if (!audio || cancelled) return;

      const isOnline = typeof navigator !== "undefined" && navigator.onLine;
      const remoteUrl = state.currentSong!.file_url;

      // Step 1: Check offline cache
      let cachedSrc: string | null = null;
      try {
        cachedSrc = await getCachedAudio(songId);
      } catch {
        // IndexedDB not available
      }
      if (cancelled) return;

      // Step 2: Determine source
      const audioSrc = cachedSrc || (isOnline ? remoteUrl : null);

      if (audioSrc) {
        // Step 3: Load and play
        audio.src = audioSrc;
        audio.load();
        loadedSongId.current = songId;

        if (state.isPlaying) {
          audio.play().catch(() => {});
        }

        // Step 4: Background cache if we used the remote URL
        if (!cachedSrc && isOnline && remoteUrl) {
          cacheAudioFile(songId, remoteUrl).catch(() => {});
        }
      } else {
        // Offline and not cached — find next cached song in the queue
        let cachedIds: string[] = [];
        try {
          cachedIds = await getAllCachedSongIds();
        } catch {}
        if (cancelled) return;

        const cachedSet = new Set(cachedIds);
        const queue = state.queue;
        const idx = state.currentIndex;

        // Search forward through queue for a cached song
        let foundIdx = -1;
        for (let i = 1; i < queue.length; i++) {
          const check = (idx + i) % queue.length;
          if (cachedSet.has(queue[check].id)) {
            foundIdx = check;
            break;
          }
        }

        if (foundIdx >= 0) {
          // Reset so the effect treats it as a new song (even if same ID)
          loadedSongId.current = null;
          // Jump to the next cached song (this triggers this effect again)
          setState((prev) => ({
            ...prev,
            currentIndex: foundIdx,
            currentSong: prev.queue[foundIdx],
            isPlaying: true,
          }));
        } else {
          // Nothing cached at all — stop
          loadedSongId.current = null;
          setState((prev) => ({ ...prev, isPlaying: false }));
        }
      }
    }

    loadNewSong();

    return () => {
      cancelled = true;
    };
  }, [state.currentSong?.id, state.isPlaying]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update volume
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = state.isMuted ? 0 : state.volume;
  }, [state.volume, state.isMuted]);

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setState((prev) => ({ ...prev, currentTime: audio.currentTime }));
    };

    const handleLoadedMetadata = () => {
      setState((prev) => ({ ...prev, duration: audio.duration }));
    };

    const handleEnded = () => {
      next();
    };

    // Suppress audio element errors (e.g. offline with no cached source)
    const handleError = () => {
      // Don't propagate — loadAudio already handles fallback logic
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
    };
  }, [next]);

  // Global keyboard shortcut for spacebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if not typing in an input
      if (e.code === "Space" && 
          !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        togglePlay();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlay]);

  return (
    <PlayerContext.Provider
      value={{
        ...state,
        play,
        pause,
        togglePlay,
        seek,
        setVolume,
        toggleMute,
        playQueue,
        playSong,
        addToQueue,
        next,
        previous,
        toggleShuffle,
        cycleRepeat,
        audioRef,
      }}
    >
      {/* Hidden audio element */}
      <audio ref={audioRef} preload="auto" />
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error("usePlayer must be used within a PlayerProvider");
  }
  return context;
}
