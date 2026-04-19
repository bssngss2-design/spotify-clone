# Spotify clone — feature catalog (Collinear template)

Tier **1** = full implementation: UI + REST + `POST /step` tool + seed + tests.  
Tier **2** = stub or read-only surface so navigation never dead-ends.

## Tier 1 — core product (10–15)

| # | Feature | Surfaces | Tool names (representative) | Notes |
|---|---------|----------|-------------------------------|-------|
| 1 | Email/password auth + JWT session | Login, signup | `login` (step), `/api/auth/*` | Seeded users: `admin`/`admin`, `sarah.connor`/`password`, `john.smith`/`password`, `viewer`/`password`, plus `demo@demo.com` |
| 2 | Home discovery feed (made for you, new releases, popular artists) | Home | `get_home_feed`, `/api/discover/home` | Category playlists + seeded songs |
| 3 | Search catalog (library + filters) | Search, playlist add panel | `search_songs`, `list_songs`, `/api/songs` | Genre/artist/album filters |
| 4 | Playlist CRUD | Library, playlist page | `create_playlist`, `rename_playlist`, `delete_playlist`, `list_playlists`, `get_playlist`, `/api/playlists` | |
| 5 | Playlist track order | Playlist page | `add_song_to_playlist`, `remove_song_from_playlist`, `reorder_playlist_song` | |
| 6 | Liked songs | Liked playlist, track heart | `like_song`, `unlike_song`, `list_liked_songs`, `/api/liked` | |
| 7 | Player state persistence | Bottom player | `play_song`, `get_player_state`, `set_volume`, `seek`, `pause`, `resume`, `/api/player/state` | Last position + volume |
| 8 | Browse all → genre → playlists | Browse routes | Same as search + discover; tier-2 landing where not wired | |
| 9 | Upload audio (user library) | Uploads | `/api/songs/upload` | File + mutagen duration |
| 10 | Tool-server agent API | Headless / automation | `GET /health`, `GET /tools`, `POST /step`, `POST /reset`, `GET /snapshot` | All Tier-1 mutations mirrored in tools |
| 11 | Audit trail for mutating tools | Verifier | `audit_log` table + rows from `/step` | |
| 12 | Account / profile / settings / premium / payment-cards (demo) | Static routes | Toasts / navigation only | Visual fidelity for portfolio |

## Tier 2 — stubs / partial (5–10)

| # | Feature | Behavior |
|---|---------|------------|
| A | Lyrics panel | `/api/lyrics` → lrclib; no persistence |
| B | YouTube download | `/api/youtube`; demo only |
| C | Real payments / subscription | UI only; toasts |
| D | Social follow graph | Profile page mock data |
| E | Recents page | Client mock grouping |
| F | Podcasts / audiobooks filters | UI chips; same catalog |

## Operations matrix

Every Tier-1 mutation is available via **React UI** and via **`POST /step`** (`tool_name` + `parameters`). Read paths are covered by `GET /snapshot` and tool `get_*` / `list_*` helpers.

## Record counts (seed target)

Roughly **50–200** seeded entities (songs + playlists + playlist rows + likes) on full `seed.py` run after `SEED_FORCE=1` (single demo owner) plus fixed role users.
