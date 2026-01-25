# Personal Music Library (Spotify Clone)

A personal music library PWA that looks and works like Spotify. Upload your own audio files, create playlists, and listen offline.

## Features

- **Spotify-like UI** - Dark theme, sidebar navigation, bottom player bar
- **Drag & drop uploads** - Just drop your audio files to add them
- **Audio playback** - Play/pause, next/previous, progress bar, volume control
- **Shuffle & repeat modes** - All playback options you'd expect
- **Playlists** - Create, rename, delete playlists; add/remove songs
- **Offline support** - PWA with offline caching for downloaded songs
- **Mobile & Desktop** - Responsive design + installable PWA

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS v4
- **Backend**: Supabase (Auth, Database, Storage)
- **PWA**: next-pwa for service worker generation

## Getting Started

### 1. Clone and install dependencies

```bash
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to the SQL Editor and run the scripts in `/supabase/schema.sql` and `/supabase/storage.sql`
3. Copy your project URL and anon key from Settings > API

### 3. Configure environment variables

Copy `env.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp env.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to use the app.

## Supported Audio Formats

- MP3
- WAV
- OGG
- FLAC
- M4A
- AAC
- WebM
- Opus

## Project Structure

```
src/
├── app/
│   ├── (main)/           # Authenticated routes with main layout
│   │   ├── page.tsx      # Home/library view
│   │   └── playlist/     # Playlist pages
│   ├── login/            # Login page
│   ├── signup/           # Signup page
│   └── auth/callback/    # OAuth callback handler
├── components/
│   ├── MainLayout.tsx    # App shell with sidebar + player
│   ├── Player.tsx        # Bottom player bar
│   ├── Sidebar.tsx       # Left navigation
│   ├── SongList.tsx      # Song list component
│   ├── TrackRow.tsx      # Individual song row
│   └── UploadZone.tsx    # Drag & drop upload area
├── context/
│   └── PlayerContext.tsx # Global audio player state
├── hooks/
│   └── useAuth.ts        # Auth hook
└── lib/
    ├── supabase.ts       # Supabase client
    ├── audioUtils.ts     # Audio metadata extraction
    └── offlineStorage.ts # IndexedDB for offline caching
```

## License

This is a personal project. Not affiliated with Spotify.
