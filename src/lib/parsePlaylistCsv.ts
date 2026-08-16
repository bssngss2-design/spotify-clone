export interface CsvTrack {
  title: string;
  artist: string;
}

/** Split a CSV line respecting double-quoted fields. */
function splitCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      fields.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  fields.push(current);
  return fields.map((f) => f.trim());
}

function normalizeHeader(h: string): string {
  return h.replace(/^\uFEFF/, "").trim().toLowerCase();
}

/**
 * Parse Exportify (and similar) playlist CSVs into track rows.
 * Looks for Track Name / Artist Name(s) columns, with common fallbacks.
 */
export function parsePlaylistCsv(text: string): CsvTrack[] {
  const lines = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter((l) => l.trim().length > 0);

  if (lines.length < 2) {
    throw new Error("CSV has no tracks");
  }

  const headers = splitCsvLine(lines[0]).map(normalizeHeader);
  const titleIdx = headers.findIndex((h) =>
    ["track name", "track", "title", "song", "name"].includes(h)
  );
  const artistIdx = headers.findIndex((h) =>
    ["artist name(s)", "artist name", "artist(s)", "artist", "artists"].includes(
      h
    )
  );

  if (titleIdx === -1) {
    throw new Error('Missing "Track Name" column');
  }

  const tracks: CsvTrack[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]);
    const title = (cols[titleIdx] || "").trim();
    if (!title) continue;
    const artist =
      artistIdx >= 0 ? (cols[artistIdx] || "").trim() : "";
    tracks.push({ title, artist });
  }

  if (tracks.length === 0) {
    throw new Error("No valid tracks found in CSV");
  }

  return tracks;
}

export function searchQueryForTrack(track: CsvTrack): string {
  return track.artist
    ? `${track.artist} - ${track.title}`
    : track.title;
}
