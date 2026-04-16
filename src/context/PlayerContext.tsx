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
import { api, Song } from "@/lib/api";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

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
  
  // Queue helpers
  getUpcomingSongs: () => Song[];
  
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

  // Tracks how many songs have been manually queued after current song
  const queueInsertOffset = useRef(0);

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
      queueInsertOffset.current = 0;

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

  // Add song to queue -- inserts right after currently playing (or after last queued song)
  const addToQueue = useCallback((song: Song) => {
    const offset = queueInsertOffset.current;
    queueInsertOffset.current = offset + 1;
    setState((prev) => {
      const insertAt = prev.currentIndex + 1 + offset;
      const newQueue = [...prev.queue];
      newQueue.splice(insertAt, 0, song);
      return { ...prev, queue: newQueue };
    });
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
    queueInsertOffset.current = 0;
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
    queueInsertOffset.current = 0;
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

  const getUpcomingSongs = useCallback((): Song[] => {
    if (state.queue.length === 0 || state.currentIndex < 0) return [];

    if (state.shuffle && shuffledIndices.length > 0) {
      const currentShufflePos = shuffledIndices.indexOf(state.currentIndex);
      return shuffledIndices
        .slice(currentShufflePos + 1)
        .map((idx) => state.queue[idx])
        .filter(Boolean);
    }

    return state.queue.slice(state.currentIndex + 1);
  }, [state.queue, state.currentIndex, state.shuffle, shuffledIndices]);

  // ──────────────────────────────────────────────────────
  // SINGLE unified effect: handles song changes AND play/pause
  // No more two effects fighting over the <audio> element
  // ──────────────────────────────────────────────────────
  const loadedSongId = useRef<string | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!state.currentSong) {
      audio.pause();
      return;
    }

    const songId = state.currentSong.id;
    const songChanged = songId !== loadedSongId.current;

    if (!songChanged) {
      if (state.isPlaying) {
        audio.play().catch(() => {});
      } else {
        audio.pause();
      }
      return;
    }

    audio.pause();

    const fileUrl = state.currentSong.file_url;
    const fullUrl = fileUrl.startsWith("http") ? fileUrl : `${API_URL}${fileUrl}`;

    audio.src = fullUrl;
    audio.load();
    loadedSongId.current = songId;

    if (state.isPlaying) {
      audio.play().catch(() => {});
    }
  }, [state.currentSong?.id, state.isPlaying]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update volume
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = state.isMuted ? 0 : state.volume;
  }, [state.volume, state.isMuted]);

  // Restore player state from backend on mount
  const hasRestored = useRef(false);
  useEffect(() => {
    if (hasRestored.current) return;
    hasRestored.current = true;

    (async () => {
      try {
        const ps = await api.get<{ song_id: string | null; position: number; volume: number }>("/api/player/state");
        if (ps.volume !== undefined) {
          setState((prev) => ({ ...prev, volume: ps.volume }));
        }
        if (ps.song_id) {
          const songs = await api.get<Song[]>("/api/songs");
          const match = songs.find((s) => s.id === ps.song_id);
          if (match) {
            setState((prev) => ({
              ...prev,
              queue: songs,
              currentSong: match,
              currentIndex: songs.indexOf(match),
              currentTime: ps.position || 0,
              isPlaying: false,
            }));
            const audio = audioRef.current;
            if (audio) {
              const fileUrl = match.file_url;
              const fullUrl = fileUrl.startsWith("http") ? fileUrl : `${API_URL}${fileUrl}`;
              audio.src = fullUrl;
              audio.load();
              loadedSongId.current = match.id;
              audio.currentTime = ps.position || 0;
            }
          }
        }
      } catch {
        // No saved state or not logged in yet
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Save player state to backend every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      if (!state.currentSong) return;
      api.put("/api/player/state", {
        song_id: state.currentSong.id,
        position: state.currentTime,
        volume: state.volume,
      }).catch(() => {});
    }, 30_000);
    return () => clearInterval(interval);
  }, [state.currentSong, state.currentTime, state.volume]);

  // Save player state on song change
  const prevSongId = useRef<string | null>(null);
  useEffect(() => {
    if (!state.currentSong) return;
    if (state.currentSong.id === prevSongId.current) return;
    prevSongId.current = state.currentSong.id;
    api.put("/api/player/state", {
      song_id: state.currentSong.id,
      position: 0,
      volume: state.volume,
    }).catch(() => {});
  }, [state.currentSong, state.volume]);

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
        getUpcomingSongs,
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
