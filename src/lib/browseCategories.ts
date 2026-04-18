/**
 * Browse-all tiles. `key` doubles as the `Song.genre` filter we send to the API,
 * so it must match what `backend/seed.py` writes into the DB.
 */
export type BrowseTile = {
  key: string;
  label: string;
  /** Background gradient classes for the tile. */
  className: string;
  /** Deterministic Picsum URL used as the tile thumbnail. */
  image: string;
};

/**
 * Build a stable Picsum URL for a tile. Using `key` as the seed keeps the image
 * identical across reloads and matches the pattern used in `backend/seed.py`.
 */
const tileImage = (key: string) =>
  `https://picsum.photos/seed/${encodeURIComponent(`browse-${key}`)}/300/300`;

/** 10 most famous music styles — top grid on the Browse all page. */
export const MUSIC_STYLES: BrowseTile[] = [
  { key: "Pop", label: "Pop", className: "bg-gradient-to-br from-[#8b44ac] to-[#c76fd8]", image: tileImage("Pop") },
  { key: "Hip-Hop", label: "Hip-Hop", className: "bg-gradient-to-br from-[#e8115b] to-[#ff6b35]", image: tileImage("Hip-Hop") },
  { key: "Rock", label: "Rock", className: "bg-gradient-to-br from-[#b71c1c] to-[#e53935]", image: tileImage("Rock") },
  { key: "Latin", label: "Latin", className: "bg-gradient-to-br from-[#ff5722] to-[#ff9800]", image: tileImage("Latin") },
  { key: "Dance/Electronic", label: "Dance/Electronic", className: "bg-gradient-to-br from-[#d500f9] to-[#ff4081]", image: tileImage("Dance-Electronic") },
  { key: "R&B", label: "R&B", className: "bg-gradient-to-br from-[#006064] to-[#00838f]", image: tileImage("RnB") },
  { key: "Indie", label: "Indie", className: "bg-gradient-to-br from-[#558b2f] to-[#9ccc65]", image: tileImage("Indie") },
  { key: "Country", label: "Country", className: "bg-gradient-to-br from-[#5d4037] to-[#8d6e63]", image: tileImage("Country") },
  { key: "Jazz", label: "Jazz", className: "bg-gradient-to-br from-[#0d47a1] to-[#1565c0]", image: tileImage("Jazz") },
  { key: "Metal", label: "Metal", className: "bg-gradient-to-br from-[#1a237e] to-[#3949ab]", image: tileImage("Metal") },
];

/** Curated categories — shown in the "For you" section below music styles. */
export const BROWSE_CATEGORIES: BrowseTile[] = [
  { key: "discover_weekly", label: "Discover Weekly", className: "bg-gradient-to-br from-[#283593] to-[#5c6bc0]", image: tileImage("discover_weekly") },
  { key: "release_radar", label: "Release Radar", className: "bg-gradient-to-br from-[#e91e63] to-[#f48fb1]", image: tileImage("release_radar") },
  { key: "Workout", label: "Workout", className: "bg-gradient-to-br from-[#c62828] to-[#ff7043]", image: tileImage("Workout") },
  { key: "Focus", label: "Focus", className: "bg-gradient-to-br from-[#311b92] to-[#5e35b1]", image: tileImage("Focus") },
  { key: "Chill", label: "Chill", className: "bg-gradient-to-br from-[#0277bd] to-[#4fc3f7]", image: tileImage("Chill") },
  { key: "Sleep", label: "Sleep", className: "bg-gradient-to-br from-[#0d47a1] to-[#1e88e5]", image: tileImage("Sleep") },
];

/** Kept for any callers that want every tile; now just the union. */
export const BROWSE_TILES: BrowseTile[] = [...MUSIC_STYLES, ...BROWSE_CATEGORIES];

/** Lookup by key (used by the `/browse/[key]` page to render its header). */
export const BROWSE_TILE_BY_KEY: Record<string, BrowseTile> = Object.fromEntries(
  BROWSE_TILES.map((tile) => [tile.key, tile])
);
