import type { Song } from "@/lib/api";

export type GenreCard = {
  /** Relative link the card routes to when clicked. */
  href: string;
  title: string;
  subtitle: string;
  image: string;
  /** Artist cards render as a circle; everything else uses rounded corners. */
  shape: "square" | "circle";
};

export type GenreSection = {
  title: string;
  cards: GenreCard[];
};

const picsum = (seed: string) =>
  `https://picsum.photos/seed/${encodeURIComponent(seed)}/300/300`;

const pravatar = (seed: string) =>
  `https://i.pravatar.cc/300?u=${encodeURIComponent(seed)}`;

/** Top artists in the genre, ordered by how many of the loaded songs are theirs. */
function topArtists(songs: Song[], limit: number): string[] {
  const counts = new Map<string, number>();
  for (const song of songs) {
    if (!song.artist) continue;
    counts.set(song.artist, (counts.get(song.artist) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name]) => name);
}

/** Unique album names in the genre, in the order they were first seen. */
function uniqueAlbums(songs: Song[], limit: number): { album: string; artist: string; cover?: string | null }[] {
  const seen = new Map<string, { album: string; artist: string; cover?: string | null }>();
  for (const song of songs) {
    if (!song.album || seen.has(song.album)) continue;
    seen.set(song.album, { album: song.album, artist: song.artist ?? "Various Artists", cover: song.cover_url });
    if (seen.size >= limit) break;
  }
  return [...seen.values()];
}

/** Build the full landing-page section list for a genre. */
export function getGenreSections(key: string, label: string, songs: Song[]): GenreSection[] {
  const sections: GenreSection[] = [];

  const popularPlaylists: { slug: string; title: string; subtitle: string }[] = [
    { slug: "hot", title: `Hot ${label}`, subtitle: `Today’s top ${label} hits.` },
    { slug: "new", title: `New ${label}`, subtitle: `Fresh ${label} cuts you need on repeat.` },
    { slug: "essentials", title: `${label} Essentials`, subtitle: `The ${label} tracks everyone should know.` },
    { slug: "homegrown", title: `Homegrown ${label}`, subtitle: `Roots run deep. Local ${label} favorites.` },
  ];

  sections.push({
    title: `Popular ${label} Playlists`,
    cards: popularPlaylists.map((p) => ({
      href: `/browse/${encodeURIComponent(key)}/${p.slug}`,
      title: p.title,
      subtitle: p.subtitle,
      image: picsum(`${key}-${p.slug}-playlist`),
      shape: "square",
    })),
  });

  const newAlbums = uniqueAlbums(songs, 4);
  if (newAlbums.length > 0) {
    sections.push({
      title: `New Releases in ${label}`,
      cards: newAlbums.map((a) => ({
        href: `/album/${encodeURIComponent(a.album)}`,
        title: a.album,
        subtitle: a.artist,
        image: a.cover || picsum(`${key}-${a.album}`),
        shape: "square",
      })),
    });
  }

  const hitsPlaylists = [
    { slug: "90s", title: `90s ${label}`, subtitle: `The ${label} that made ${label.toLowerCase()} cool.` },
    { slug: "2000s", title: `2000s ${label}`, subtitle: `Two decades on, these still slap.` },
    { slug: "2010s", title: `2010s ${label}`, subtitle: `The tracks that defined a decade.` },
    { slug: "greatest", title: `${label}’s Greatest Hits`, subtitle: `All-time biggest ${label} records.` },
  ];

  sections.push({
    title: `${label} Hits`,
    cards: hitsPlaylists.map((p) => ({
      href: `/browse/${encodeURIComponent(key)}/${p.slug}`,
      title: p.title,
      subtitle: p.subtitle,
      image: picsum(`${key}-${p.slug}-hits`),
      shape: "square",
    })),
  });

  const moodPlaylists = [
    { slug: "chill", title: `Chill ${label}`, subtitle: `Kick back with mellow ${label.toLowerCase()}.` },
    { slug: "happy", title: `Happy ${label}`, subtitle: `Mood-lifting ${label.toLowerCase()} picks.` },
    { slug: "party", title: `${label} Party`, subtitle: `Turn it up — ${label.toLowerCase()} that moves.` },
    { slug: "late-night", title: `Late Night ${label}`, subtitle: `After-hours ${label.toLowerCase()} feels.` },
  ];

  sections.push({
    title: `${label} for every mood`,
    cards: moodPlaylists.map((p) => ({
      href: `/browse/${encodeURIComponent(key)}/${p.slug}`,
      title: p.title,
      subtitle: p.subtitle,
      image: picsum(`${key}-${p.slug}-mood`),
      shape: "square",
    })),
  });

  const artists = topArtists(songs, 4);
  if (artists.length > 0) {
    sections.push({
      title: `Popular ${label} Artists`,
      cards: artists.map((name) => ({
        href: `/artist/${encodeURIComponent(name)}`,
        title: name,
        subtitle: "Artist",
        image: pravatar(name),
        shape: "circle",
      })),
    });
  }

  return sections;
}

/**
 * Themed sub-playlists (the ones under a genre landing). We don’t have real
 * metadata to partition songs by year/mood, so each slug renders the full
 * genre song list with its own title + cover. That’s enough for the demo
 * and keeps every card in the landing interactive.
 */
export type SubPlaylistMeta = {
  title: (label: string) => string;
  subtitle: (label: string) => string;
  /** Seed for the Picsum cover — stable per slug so it matches the landing card. */
  coverSeed: (key: string) => string;
};

export const SUB_PLAYLIST_META: Record<string, SubPlaylistMeta> = {
  hot:         { title: (l) => `Hot ${l}`,           subtitle: (l) => `Today’s top ${l} hits.`,                    coverSeed: (k) => `${k}-hot-playlist` },
  new:         { title: (l) => `New ${l}`,           subtitle: (l) => `Fresh ${l} cuts you need on repeat.`,       coverSeed: (k) => `${k}-new-playlist` },
  essentials:  { title: (l) => `${l} Essentials`,    subtitle: (l) => `The ${l} tracks everyone should know.`,     coverSeed: (k) => `${k}-essentials-playlist` },
  homegrown:   { title: (l) => `Homegrown ${l}`,     subtitle: (l) => `Roots run deep. Local ${l} favorites.`,     coverSeed: (k) => `${k}-homegrown-playlist` },
  "90s":       { title: (l) => `90s ${l}`,           subtitle: (l) => `The ${l} that made ${l.toLowerCase()} cool.`,         coverSeed: (k) => `${k}-90s-hits` },
  "2000s":     { title: (l) => `2000s ${l}`,         subtitle: (l) => `Two decades on, these still slap.`,         coverSeed: (k) => `${k}-2000s-hits` },
  "2010s":     { title: (l) => `2010s ${l}`,         subtitle: (l) => `The tracks that defined a decade.`,         coverSeed: (k) => `${k}-2010s-hits` },
  greatest:    { title: (l) => `${l}’s Greatest Hits`, subtitle: (l) => `All-time biggest ${l} records.`,          coverSeed: (k) => `${k}-greatest-hits` },
  chill:       { title: (l) => `Chill ${l}`,         subtitle: (l) => `Kick back with mellow ${l.toLowerCase()}.`, coverSeed: (k) => `${k}-chill-mood` },
  happy:       { title: (l) => `Happy ${l}`,         subtitle: (l) => `Mood-lifting ${l.toLowerCase()} picks.`,    coverSeed: (k) => `${k}-happy-mood` },
  party:       { title: (l) => `${l} Party`,         subtitle: (l) => `Turn it up — ${l.toLowerCase()} that moves.`, coverSeed: (k) => `${k}-party-mood` },
  "late-night": { title: (l) => `Late Night ${l}`,   subtitle: (l) => `After-hours ${l.toLowerCase()} feels.`,     coverSeed: (k) => `${k}-late-night-mood` },
};
