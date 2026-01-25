/**
 * Offline storage utilities using IndexedDB
 * Stores audio files for offline playback
 */

const DB_NAME = "music-offline-db";
const DB_VERSION = 1;
const AUDIO_STORE = "audio-files";

interface CachedAudio {
  id: string;
  url: string;
  blob: Blob;
  cachedAt: number;
}

/**
 * Open IndexedDB connection
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(AUDIO_STORE)) {
        db.createObjectStore(AUDIO_STORE, { keyPath: "id" });
      }
    };
  });
}

/**
 * Cache an audio file for offline playback
 */
export async function cacheAudioFile(
  songId: string,
  url: string
): Promise<void> {
  try {
    // Fetch the audio file
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch audio");

    const blob = await response.blob();
    const db = await openDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(AUDIO_STORE, "readwrite");
      const store = transaction.objectStore(AUDIO_STORE);

      const data: CachedAudio = {
        id: songId,
        url,
        blob,
        cachedAt: Date.now(),
      };

      const request = store.put(data);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (error) {
    console.error("Failed to cache audio file:", error);
    throw error;
  }
}

/**
 * Get cached audio file
 */
export async function getCachedAudio(
  songId: string
): Promise<string | null> {
  try {
    const db = await openDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(AUDIO_STORE, "readonly");
      const store = transaction.objectStore(AUDIO_STORE);
      const request = store.get(songId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result as CachedAudio | undefined;
        if (result) {
          // Create a blob URL
          const blobUrl = URL.createObjectURL(result.blob);
          resolve(blobUrl);
        } else {
          resolve(null);
        }
      };
    });
  } catch (error) {
    console.error("Failed to get cached audio:", error);
    return null;
  }
}

/**
 * Check if audio is cached
 */
export async function isAudioCached(songId: string): Promise<boolean> {
  try {
    const db = await openDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(AUDIO_STORE, "readonly");
      const store = transaction.objectStore(AUDIO_STORE);
      const request = store.getKey(songId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result !== undefined);
    });
  } catch {
    return false;
  }
}

/**
 * Remove cached audio file
 */
export async function removeCachedAudio(songId: string): Promise<void> {
  try {
    const db = await openDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(AUDIO_STORE, "readwrite");
      const store = transaction.objectStore(AUDIO_STORE);
      const request = store.delete(songId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (error) {
    console.error("Failed to remove cached audio:", error);
  }
}

/**
 * Get all cached song IDs
 */
export async function getAllCachedSongIds(): Promise<string[]> {
  try {
    const db = await openDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(AUDIO_STORE, "readonly");
      const store = transaction.objectStore(AUDIO_STORE);
      const request = store.getAllKeys();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result as string[]);
    });
  } catch {
    return [];
  }
}

/**
 * Clear all cached audio
 */
export async function clearAllCachedAudio(): Promise<void> {
  try {
    const db = await openDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(AUDIO_STORE, "readwrite");
      const store = transaction.objectStore(AUDIO_STORE);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (error) {
    console.error("Failed to clear cached audio:", error);
  }
}

/**
 * Get cache size in bytes
 */
export async function getCacheSize(): Promise<number> {
  try {
    const db = await openDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(AUDIO_STORE, "readonly");
      const store = transaction.objectStore(AUDIO_STORE);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const items = request.result as CachedAudio[];
        const totalSize = items.reduce((acc, item) => acc + item.blob.size, 0);
        resolve(totalSize);
      };
    });
  } catch {
    return 0;
  }
}
