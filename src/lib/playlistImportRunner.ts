import { createClient, Song } from "@/lib/supabase";
import {
  CsvTrack,
  searchQueryForTrack,
} from "@/lib/parsePlaylistCsv";

export type RowStatus =
  | "pending"
  | "checking"
  | "searching"
  | "downloading"
  | "done"
  | "already"
  | "linked"
  | "skipped"
  | "error";

export type ImportPhase = "idle" | "preparing" | "importing";

export interface ImportRow {
  track: CsvTrack;
  status: RowStatus;
  message?: string;
}

export interface ImportProgress {
  done: number;
  total: number;
  ok: number;
  failed: number;
  already: number;
  linked: number;
}

export interface ImportPrep {
  reusedPlaylist: boolean;
  alreadyInPlaylist: number;
  linkedFromLibrary: number;
  toDownload: number;
}

export interface ImportState {
  playlistName: string;
  rows: ImportRow[];
  running: boolean;
  phase: ImportPhase;
  phaseMessage: string | null;
  prep: ImportPrep | null;
  error: string | null;
  progress: ImportProgress;
  playlistId: string | null;
  /** User hid the global banner (Stop/X); reset on next Import. */
  bannerDismissed: boolean;
}

type Listener = () => void;

const emptyProgress = (): ImportProgress => ({
  done: 0,
  total: 0,
  ok: 0,
  failed: 0,
  already: 0,
  linked: 0,
});

let state: ImportState = {
  playlistName: "Liked Songs",
  rows: [],
  running: false,
  phase: "idle",
  phaseMessage: null,
  prep: null,
  error: null,
  progress: emptyProgress(),
  playlistId: null,
  bannerDismissed: false,
};

let stopRequested = false;
let activeJob: Promise<void> | null = null;
let abortController: AbortController | null = null;
const listeners = new Set<Listener>();
const songAddedHandlers = new Set<(song: Song) => void>();

function isAbortError(err: unknown): boolean {
  return (
    (err instanceof DOMException && err.name === "AbortError") ||
    (err instanceof Error && err.name === "AbortError")
  );
}

/** Pause the import loop until the browser is online again (or Stop/abort). */
function waitForOnline(signal: AbortSignal): Promise<void> {
  if (typeof navigator === "undefined" || navigator.onLine) {
    return Promise.resolve();
  }

  setState({
    phaseMessage: "No internet — waiting to reconnect (import paused, not logged out)…",
  });

  return new Promise((resolve) => {
    const done = () => {
      window.removeEventListener("online", onOnline);
      signal.removeEventListener("abort", onAbort);
      resolve();
    };
    const onOnline = () => done();
    const onAbort = () => done();
    window.addEventListener("online", onOnline);
    signal.addEventListener("abort", onAbort);
  });
}

function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function trackKey(title: string, artist: string | null | undefined): string {
  return `${normalizeText(title)}::${normalizeText(artist || "")}`;
}

function emit() {
  listeners.forEach((l) => l());
}

function setState(patch: Partial<ImportState>) {
  state = { ...state, ...patch };
  emit();
}

function updateRow(index: number, patch: Partial<ImportRow>) {
  state = {
    ...state,
    rows: state.rows.map((row, i) =>
      i === index ? { ...row, ...patch } : row
    ),
  };
  emit();
}

export function getImportState(): ImportState {
  return state;
}

export function subscribeImport(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function onImportSongAdded(
  handler: (song: Song) => void
): () => void {
  songAddedHandlers.add(handler);
  return () => songAddedHandlers.delete(handler);
}

function notifySongAdded(song: Song) {
  songAddedHandlers.forEach((h) => {
    try {
      h(song);
    } catch {
      // ignore UI handler errors
    }
  });
}

export function setImportPlaylistName(name: string) {
  if (state.running) return;
  // Clear resolved playlist so the next import re-looks up by name
  setState({ playlistName: name, playlistId: null, prep: null });
}

export function loadImportTracks(tracks: CsvTrack[], suggestedName?: string) {
  if (state.running) return;
  stopRequested = false;
  setState({
    rows: tracks.map((track) => ({ track, status: "pending" })),
    progress: { ...emptyProgress(), total: tracks.length },
    playlistId: null,
    prep: null,
    phase: "idle",
    phaseMessage: null,
    error: null,
    playlistName:
      suggestedName?.trim() || state.playlistName || "Liked Songs",
  });
}

export function setImportError(message: string | null) {
  setState({ error: message });
}

export function stopImport() {
  stopRequested = true;
  abortController?.abort();
  abortController = null;
  activeJob = null;

  const rows = state.rows.map((row) =>
    row.status === "searching" ||
    row.status === "downloading" ||
    row.status === "checking"
      ? { ...row, status: "pending" as RowStatus, message: "Stopped" }
      : row
  );
  setState({
    running: false,
    phase: "idle",
    phaseMessage: null,
    prep: null,
    rows,
    error: null,
    bannerDismissed: true,
  });
}

/** Hide the global import bar without clearing the CSV rows on Home. */
export function dismissImportBanner() {
  setState({ bannerDismissed: true });
}

export function resetImportUi() {
  stopRequested = true;
  abortController?.abort();
  abortController = null;
  activeJob = null;
  setState({
    playlistName: "Liked Songs",
    rows: [],
    running: false,
    phase: "idle",
    phaseMessage: null,
    prep: null,
    error: null,
    progress: emptyProgress(),
    playlistId: null,
    bannerDismissed: false,
  });
}

function needsDownload(status: RowStatus): boolean {
  return status === "pending" || status === "error" || status === "skipped";
}

export async function startImport(userId: string): Promise<void> {
  if (!userId) {
    setImportError("Log in first, then click Import.");
    return;
  }
  if (state.rows.length === 0) {
    setImportError("Choose a CSV file first.");
    return;
  }
  if (state.running && !activeJob) {
    setState({ running: false });
  }
  if (activeJob) {
    setImportError("Import is already running.");
    return;
  }

  stopRequested = false;
  abortController?.abort();
  abortController = new AbortController();
  const signal = abortController.signal;

  setState({
    running: true,
    phase: "preparing",
    phaseMessage: "Starting…",
    error: null,
    bannerDismissed: false,
  });

  const job = (async () => {
    const supabase = createClient();
    let snapshot = state.rows.map((r) => ({ ...r }));
    let activePlaylistId = state.playlistId;
    let ok = 0;
    let failed = 0;
    let already = 0;
    let linked = 0;
    let position = 0;
    let reusedPlaylist = false;
    let finishedMessage: string | null = null;

    try {
      await waitForOnline(signal);
      if (stopRequested || signal.aborted) return;

      // ── 1) Find or create playlist by name ─────────────────────────
      const name = state.playlistName.trim() || "Imported Playlist";
      setState({
        phase: "preparing",
        phaseMessage: `Looking for playlist “${name}”…`,
      });

      if (!activePlaylistId) {
        const { data: existing, error: findErr } = await supabase
          .from("playlists")
          .select("*")
          .eq("user_id", userId)
          .ilike("name", name);

        if (findErr) {
          throw new Error(findErr.message);
        }

        const match = (existing || []).find(
          (p) => p.name.trim().toLowerCase() === name.toLowerCase()
        );

        if (match) {
          activePlaylistId = match.id;
          reusedPlaylist = true;
          setState({
            playlistId: match.id,
            phaseMessage: `Found existing playlist “${match.name}”. Checking songs…`,
          });
        } else {
          setState({
            phaseMessage: `Creating playlist “${name}”…`,
          });
          const { data, error: createErr } = await supabase
            .from("playlists")
            .insert({ user_id: userId, name })
            .select()
            .single();

          if (createErr || !data) {
            throw new Error(createErr?.message || "Failed to create playlist");
          }

          activePlaylistId = data.id;
          setState({
            playlistId: data.id,
            phaseMessage: "Playlist created. Checking your library…",
          });
          if (typeof window !== "undefined") {
            window.dispatchEvent(new Event("playlists:refresh"));
          }
        }
      } else {
        reusedPlaylist = true;
        setState({
          phaseMessage: "Checking songs already in this playlist…",
        });
      }

      if (stopRequested || signal.aborted) return;

      // ── 2) Load playlist tracks + library for cross-check ──────────
      setState({
        phaseMessage: "Loading songs already in the playlist…",
      });

      // Mark rows as checking so UI shows activity
      snapshot = snapshot.map((row) =>
        row.status === "done" || row.status === "already" || row.status === "linked"
          ? row
          : { ...row, status: "checking" as RowStatus, message: "Comparing…" }
      );
      setState({ rows: snapshot });

      const { data: playlistSongs, error: psErr } = await supabase
        .from("playlist_songs")
        .select("position, song:songs(*)")
        .eq("playlist_id", activePlaylistId)
        .order("position", { ascending: true });

      if (psErr) {
        throw new Error(psErr.message);
      }

      if (stopRequested || signal.aborted) return;

      setState({ phaseMessage: "Scanning your library for matches…" });

      const { data: librarySongs, error: libErr } = await supabase
        .from("songs")
        .select("*")
        .eq("user_id", userId);

      if (libErr) {
        throw new Error(libErr.message);
      }

      const playlistKeyToSong = new Map<string, Song>();
      let maxPosition = -1;
      for (const row of playlistSongs || []) {
        const song = row.song as unknown as Song | null;
        if (row.position != null && row.position > maxPosition) {
          maxPosition = row.position;
        }
        if (song?.title) {
          playlistKeyToSong.set(trackKey(song.title, song.artist), song);
        }
      }
      position = maxPosition + 1;

      const libraryKeyToSong = new Map<string, Song>();
      for (const song of librarySongs || []) {
        if (song?.title) {
          libraryKeyToSong.set(trackKey(song.title, song.artist), song);
        }
      }

      if (stopRequested || signal.aborted) return;

      // ── 3) Cross-check CSV vs playlist / library ───────────────────
      setState({
        phaseMessage: "Matching CSV tracks to playlist…",
      });

      let alreadyInPlaylist = 0;
      let linkedFromLibrary = 0;
      let toDownload = 0;

      for (let i = 0; i < snapshot.length; i++) {
        if (stopRequested || signal.aborted) break;
        const row = snapshot[i];
        if (row.status === "done") {
          ok++;
          continue;
        }

        const key = trackKey(row.track.title, row.track.artist);
        const inPlaylist = playlistKeyToSong.get(key);

        if (inPlaylist) {
          snapshot[i] = {
            ...row,
            status: "already",
            message: "Already in playlist",
          };
          alreadyInPlaylist++;
          already++;
          continue;
        }

        const inLibrary = libraryKeyToSong.get(key);
        if (inLibrary) {
          const { error: addErr } = await supabase
            .from("playlist_songs")
            .insert({
              playlist_id: activePlaylistId,
              song_id: inLibrary.id,
              position,
            });

          if (addErr) {
            // Unique violation → treat as already there
            if (addErr.code === "23505") {
              snapshot[i] = {
                ...row,
                status: "already",
                message: "Already in playlist",
              };
              alreadyInPlaylist++;
              already++;
              continue;
            }
            snapshot[i] = {
              ...row,
              status: "error",
              message: addErr.message,
            };
            failed++;
            continue;
          }

          position++;
          playlistKeyToSong.set(key, inLibrary);
          notifySongAdded(inLibrary);
          snapshot[i] = {
            ...row,
            status: "linked",
            message: "Added from library (no download)",
          };
          linkedFromLibrary++;
          linked++;
          continue;
        }

        snapshot[i] = {
          ...row,
          status: "pending",
          message: "Queued for download",
        };
        toDownload++;
      }

      setState({
        rows: snapshot,
        prep: {
          reusedPlaylist,
          alreadyInPlaylist,
          linkedFromLibrary,
          toDownload,
        },
        progress: {
          done: alreadyInPlaylist + linkedFromLibrary + ok,
          total: snapshot.length,
          ok,
          failed,
          already: alreadyInPlaylist,
          linked: linkedFromLibrary,
        },
        phaseMessage:
          toDownload === 0
            ? "Nothing new to download — playlist is up to date."
            : `Ready: ${alreadyInPlaylist} already there · ${linkedFromLibrary} linked · ${toDownload} to download`,
      });

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("playlists:refresh"));
      }

      if (stopRequested || signal.aborted) return;

      // ── 4) Download only missing tracks ────────────────────────────
      if (toDownload === 0) {
        finishedMessage = "All CSV tracks are already in the playlist.";
        setState({
          phase: "idle",
          phaseMessage: finishedMessage,
        });
        return;
      }

      setState({
        phase: "importing",
        phaseMessage: `Downloading ${toDownload} missing track${toDownload === 1 ? "" : "s"}…`,
      });

      for (let i = 0; i < snapshot.length; i++) {
        if (stopRequested || signal.aborted) break;
        const row = snapshot[i];
        if (!needsDownload(row.status)) continue;

        await waitForOnline(signal);
        if (stopRequested || signal.aborted) break;

        updateRow(i, { status: "searching", message: undefined });
        setState({
          phase: "importing",
          phaseMessage: `Downloading missing tracks… (${ok} new so far)`,
        });

        try {
          const q = searchQueryForTrack(row.track);
          const searchRes = await fetch(
            `/api/youtube/search?q=${encodeURIComponent(q)}`,
            { signal }
          );
          const searchData = await searchRes.json();

          if (!searchRes.ok) {
            throw new Error(searchData.error || "Search failed");
          }

          const first = searchData.results?.[0];
          if (!first?.id) {
            snapshot[i] = {
              ...row,
              status: "skipped",
              message: "No YouTube match",
            };
            updateRow(i, { status: "skipped", message: "No YouTube match" });
            failed++;
            setState({
              progress: {
                done: i + 1,
                total: snapshot.length,
                ok,
                failed,
                already,
                linked,
              },
            });
            continue;
          }

          if (stopRequested || signal.aborted) break;
          updateRow(i, { status: "downloading", message: first.title });

          const dlRes = await fetch("/api/youtube/download", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              videoId: first.id,
              title: row.track.title,
              userId,
            }),
            signal,
          });
          const dlData = await dlRes.json();

          if (!dlRes.ok || !dlData.song) {
            throw new Error(dlData.error || "Download failed");
          }

          if (stopRequested || signal.aborted) break;

          const song = dlData.song as Song;

          if (row.track.artist && !song.artist) {
            await supabase
              .from("songs")
              .update({ artist: row.track.artist })
              .eq("id", song.id);
            song.artist = row.track.artist;
          }

          await supabase.from("playlist_songs").insert({
            playlist_id: activePlaylistId,
            song_id: song.id,
            position,
          });
          position++;

          notifySongAdded(song);
          snapshot[i] = { ...row, status: "done", message: song.title };
          updateRow(i, { status: "done", message: song.title });
          ok++;
        } catch (err) {
          if (isAbortError(err) || stopRequested || signal.aborted) {
            updateRow(i, { status: "pending", message: "Stopped" });
            break;
          }
          failed++;
          const message = err instanceof Error ? err.message : "Failed";
          snapshot[i] = { ...row, status: "error", message };
          updateRow(i, { status: "error", message });
        }

        const processed =
          snapshot.filter((r) =>
            ["done", "already", "linked", "skipped", "error"].includes(r.status)
          ).length;

        setState({
          progress: {
            done: processed,
            total: snapshot.length,
            ok,
            failed,
            already,
            linked,
          },
          phaseMessage: `Downloading… ${ok} new · ${already} already · ${failed} failed`,
        });
      }
    } catch (err) {
      if (!isAbortError(err) && !stopRequested) {
        setState({
          error: err instanceof Error ? err.message : "Import failed",
        });
      }
    } finally {
      stopRequested = false;
      if (abortController?.signal === signal) {
        abortController = null;
      }
      setState({
        running: false,
        phase: "idle",
        // Clear so the global banner / Home status UI disappear when done
        phaseMessage: null,
        prep: null,
      });
      // finishedMessage kept only for debugging via console if needed
      if (finishedMessage && typeof console !== "undefined") {
        console.info("[import]", finishedMessage);
      }
    }
  })();

  activeJob = job;
  try {
    await job;
  } finally {
    if (activeJob === job) activeJob = null;
  }
}
