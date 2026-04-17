# Spotify Clone

A 1:1 Spotify web player clone — Next.js 16 frontend, FastAPI backend, Postgres/SQLite, JWT auth, local file storage. Seeded demo user with playlists, browse categories, liked songs.

## Stack

| Layer      | Choice                                               |
| ---------- | ---------------------------------------------------- |
| Frontend   | Next.js 16 (App Router), React 19, TypeScript, Tailwind v4 |
| Backend    | FastAPI, SQLAlchemy, Pydantic v2                     |
| DB         | Postgres 16 (Docker) · SQLite (local default)        |
| Auth       | JWT (bcrypt hashing, `python-jose`)                  |
| Storage    | Local filesystem (`backend/uploads/`)                |
| Testing    | pytest (backend) · Playwright (frontend E2E)         |
| Infra      | Docker Compose, Makefile                             |

## Quick start (local, no Docker)

```bash
# Backend
cd backend
python3 -m venv venv
./venv/bin/pip install -r requirements.txt
./venv/bin/python seed.py                      # demo@demo.com / demo123
./venv/bin/uvicorn app.main:app --port 8080 --reload

# Frontend (new shell)
cp env.example .env.local                      # already points BACKEND_URL=http://127.0.0.1:8080
npm install
npm run dev
```

Open http://localhost:3000 and log in with **`demo@demo.com` / `demo123`**.

## Quick start (Docker)

```bash
make build
make dev         # Postgres + FastAPI + Next at localhost:3000
make seed        # seed demo user + playlists
```

Re-seed (wipe demo user and recreate):
```bash
cd backend && SEED_FORCE=1 ./venv/bin/python seed.py
```

## Environment

Next.js talks to FastAPI through server-side rewrites, so the browser only ever hits same-origin `/api/*`. No CORS dance in dev.

```env
# Where FastAPI is (read by next.config.ts rewrites)
BACKEND_URL=http://127.0.0.1:8080

# Optional: bypass the rewrite and call FastAPI directly from the browser
# NEXT_PUBLIC_API_URL=http://127.0.0.1:8080
```

Backend env (read by `backend/app/`):
```env
DATABASE_URL=sqlite:///./spotify.db      # or postgresql://user:pass@host:5432/db
JWT_SECRET=change-me
```

## Features

- **Auth:** Signup, login, `/api/auth/me` with JWT, auto-redirect via Next middleware.
- **Library:** Upload audio (MP3/WAV/OGG/FLAC/M4A/AAC/Opus), auto-parse `Artist - Title` + duration.
- **Player:** Shuffle, repeat (off/all/one), next/previous, volume, mute, fullscreen, queue with insert-next, persisted player state.
- **Playlists:** Create, rename, delete, reorder, add/remove songs, cover upload.
- **Liked Songs:** Heart toggle, Liked Songs page.
- **Discover:** Home sections — Made for you, New releases, Popular artists, Recently played.
- **Browse:** 29-genre grid on Search (Pop, Hip-Hop, Rock, Latin, Jazz, Ambient, K-Pop, Podcasts, Workout, Focus, Sleep, …).
- **Lyrics:** `/api/lyrics/{song_id}` endpoint.
- **YouTube import:** `/api/youtube/search` + `/api/youtube/download` via `yt-dlp` + `ffmpeg`.
- **UI fidelity:** Pixel-matched Spotify right-click menus, modals, credits, radio, blend, artist/album pages, toasts, context menus, editing flows.
- **PWA:** Installable, manifest, service worker (`next-pwa`, disabled in dev).

## API (FastAPI)

All routes under `/api`:

| Group        | Endpoints                                                                 |
| ------------ | ------------------------------------------------------------------------- |
| Auth         | `POST /auth/register` · `POST /auth/login` · `GET /auth/me`               |
| Songs        | `GET /songs?q&genre&artist&album` · `POST /songs/upload`                  |
| Playlists    | CRUD on `/playlists`, `/playlists/{id}/songs`, `POST /playlists/{id}/cover` |
| Liked        | `GET/POST/DELETE /liked/{song_id}`                                        |
| Player State | `GET /player/state` · `PUT /player/state`                                 |
| Discover     | `GET /discover/home`                                                      |
| Lyrics       | `GET /lyrics/{song_id}`                                                   |
| YouTube      | `GET /youtube/search` · `POST /youtube/download`                          |

## Testing

```bash
# Backend (29 tests)
cd backend && ./venv/bin/python -m pytest tests/ -q

# Frontend E2E (Playwright)
npm install
npx playwright install    # first time only
npm test
```

Playwright expects backend + frontend running and the demo user seeded.

## Project layout

```
spotify/
├── backend/
│   ├── app/
│   │   ├── main.py               # FastAPI entry + CORS + rewrites mount
│   │   ├── database.py           # SQLAlchemy + lightweight migrations
│   │   ├── models.py             # User, Song, Playlist, PlaylistSong, LikedSong, PlayerState
│   │   ├── schemas.py            # Pydantic v2 (ConfigDict)
│   │   ├── auth.py               # bcrypt + JWT helpers
│   │   └── routers/              # auth, songs, playlists, liked, player, lyrics, youtube, discover
│   ├── tests/                    # pytest (in-memory SQLite)
│   ├── uploads/                  # audio + cover storage
│   └── seed.py                   # demo user + ~185 songs across all browse genres
├── src/
│   ├── app/
│   │   ├── (main)/               # authed app (home, search, liked, playlist, artist, album, radio, blend)
│   │   ├── login/  signup/
│   │   └── layout.tsx
│   ├── components/               # MainLayout, Sidebar, Player, NowPlayingPanel, TrackRow, modals
│   ├── context/PlayerContext.tsx
│   ├── hooks/                    # useAuth, useToast, useLikedSongs
│   ├── lib/
│   │   ├── api.ts                # fetch wrapper + JWT cookie sync
│   │   ├── types.ts              # shared Song/Playlist/HomeDiscover types
│   │   └── browseCategories.ts   # search page browse tiles
│   └── proxy.ts                  # Next middleware (auth redirect, skips /api + /uploads)
├── tests/e2e/                    # Playwright specs
├── docker-compose.yml · Dockerfile · backend/Dockerfile
├── Makefile
└── next.config.ts                # /api + /uploads rewrite → BACKEND_URL
```

## License

Personal portfolio project. Not affiliated with Spotify.
