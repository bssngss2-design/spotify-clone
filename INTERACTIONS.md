# User Interactions

Full inventory of what a user can do across the app.

## Auth
- Log in (`/login`) with email + password.
- Sign up (`/signup`) to create a new account.
- Log out from the top-bar profile menu or Settings.

## Top bar (persistent on main app)
- Click Spotify logo → go home.
- Click Home button (filled when on `/`, outlined otherwise).
- Click Browse-all icon in the search bar → `/search`.
- Type in the search bar (when enabled on the search page).
- Click `Explore Premium` (white pill) → `/premium` in same tab.
- Click `Install App` (toast).
- Click What's New / Friend Activity bells (toasts).
- Click avatar → opens dropdown:
  - Account → `/account`.
  - Profile → `/profile`.
  - Recents → `/recents`.
  - Upgrade to Premium → opens `/premium` in a **new tab**.
  - Support / Download (toasts).
  - Settings → `/settings`.
  - Log out.

## Left Sidebar (Your Library)
- Toggle sidebar collapsed/expanded.
- Create new playlist via `+` button or `+ → Playlist` menu → auto-redirects to `/playlist/<new-id>`.
- Filter chips: All / Playlists / Artists / Podcasts & Shows.
- Sort dropdown: Recents (localStorage-based) / Recently Added / Alphabetical.
- Click any library item → navigate to that playlist / artist / liked / etc.
- Right-click on a playlist item → context menu (Create playlist, Delete, etc.).
- Delete a playlist from its menu.
- Empty-library prompts (`Create your first playlist` / etc.).

## Right sidebar (Now Playing panel)
- Always visible on desktop (no toggle button).
- Collapse via the panel-hide icon → shrinks to a 32px vertical bar with `<`.
- Click the `<` bar to re-expand (state persists in localStorage).
- Tabs: Now Playing / Queue / Lyrics.
- View current song art, title, artist, lyrics preview, queue preview (depending on tab).

## Bottom Player (persistent)
- Play / Pause / Previous / Next.
- Toggle Shuffle.
- Toggle Repeat (off / all / one).
- Seek via progress bar.
- Volume slider / mute toggle.
- Like / Unlike current song.
- Click current song title / artist → go to that artist/album.
- Click mini cover → focus Now Playing view.

## Home (`/`)
- Filter chips: All / Music / Podcasts / Audiobooks.
- Good morning grid: quick-access playlist tiles (hover → play button, click → playlist page).
- "Made for you" / "Recently played" / "Popular artists" / etc. horizontal rows — click a card to open its page, click its play button to start it.

## Search / Browse All (`/search`)
- Type to search catalog (when query is present).
- Filter result tabs (All / Songs / Artists / Albums / etc.).
- Click "Browse all" tiles:
  - 10 music genre tiles (Pop / Rock / Hip-Hop / Latin / R&B / …).
  - 5–6 category tiles (Workout / Focus / Chill / Sleep / Podcasts / …).
- Tiles navigate to `/browse/<key>`.

## Genre landing (`/browse/[key]`)
- Scroll multiple horizontal rows of cards (playlists / albums / artists).
- Click a card → `/browse/<key>/<slug>` (sub-playlist) or artist/album pages.
- Back via browser history.

## Sub-playlist (`/browse/[key]/[slug]`)
- Play the curated song list.
- Click individual tracks to play.
- Like/unlike tracks.
- Add to queue.

## Playlist (`/playlist/[id]`)
- Edit playlist image + name via the cover tile / title click (modal).
- Play all (big green play button).
- Shuffle play.
- Download (toast).
- Invite collaborators (new icon).
- Three-dots menu: Add to queue / Edit details / Delete / Make public / Invite collaborators / Exclude from taste profile / Move to folder / Copy link / Share / Open in Desktop app.
- Each track row: play, like, add to queue, remove, context menu.
- "Let's find something for your playlist" panel at the bottom:
  - Type in `Search for songs or episodes`.
  - Click `Add` next to a matching song → instantly added, disappears from results.
  - Clear the search with the `×` inside the input.
  - Close panel with the top-right `×` → collapses to a `Find more` link.

## Liked Songs (`/liked`)
- Play all / shuffle.
- Unlike a track (removes from list).
- Add to queue, context menu per row.

## Artist (`/artist/[name]`)
- Play / follow (toast) / shuffle.
- Click tracks, albums, related artists.
- Monthly listeners, bio section, etc.

## Album (`/album/[name]`)
- Play the full album.
- Like album.
- Play individual tracks.
- Context menu per track.

## Radio (`/radio/[title]`)
- Play the radio mix.

## Blend (`/blend`)
- CTA to pick a friend (toast — demo only).

## Recents (`/recents`)
- Grouped by date (Today / Yesterday / Thu, Apr 16, etc.).
- Click a row to expand it:
  - Songs show themselves as a single entry.
  - Playlists fetch and show the first N tracks played.
- Click any song in the expanded view → plays it.
- Click a playlist row header → go to that playlist.

## Profile (`/profile`)
- View own info (initial, email-derived name, public playlist count).
- Top tracks this month (click to play).
- Public Playlists (click → playlist page).
- Followers / Following mock lists.
- Edit Profile (toast).

## Account (`/account`) — full app chrome
- Explore plans → `/premium`.
- Join Premium big tile → `/premium`.
- Account section: Manage subscription / Edit personal info / Recover playlists / Address.
- Payment section: Payment history / **Saved payment cards → `/account/payment-cards`** / Redeem.
- Security & privacy: Manage apps / Notifications / Account privacy / Edit login methods / Set device password / Close account / Sign out everywhere (actually logs out).
- Advertising: Ad preferences.
- Help: Spotify support.

## Saved payment cards (`/account/payment-cards`) — standalone layout
Custom top bar, no sidebars / player.
- Search bar (stub toast).
- Back button (floating left / inline on narrow screens).
- `Add card` → inline form:
  - Card number (auto-formats `0000 0000 0000 0000`, 16-digit cap).
  - Expiry (auto-formats `MM / YY`).
  - Security code + `?` help circle.
  - Save (toast, closes form) / Cancel (closes form).

## Settings (`/settings`)
- Account: Edit login methods pill.
- Language dropdown.
- Audio quality: Streaming quality dropdown + Normalize volume toggle.
- Your Library: Compact layout toggle + Import library pill.
- Display: Now-playing panel toggle + Canvas toggle.
- Playback: SVG equalizer (visual) + Mac-app download banner with green CTA.
- Social: 3 toggles (public playlists, followers visibility, share listening activity).
- Footer: Company / Communities / Useful links / Spotify Plans (route to `/premium`) + Instagram / Twitter / Facebook social buttons.

## Premium (`/premium`) — standalone layout
- Custom top bar: Spotify logo, Premium plans / Support / Download links, divider, Profile dropdown (Account / Profile / Back to Spotify / Log out), `Renew subscription` pink pill.
- Hero: rotating word (music → artists → fans → live events → video every 1.5s) + `Renew subscription` + `Terms apply.` link.
- Plan cards (scrollable): Individual / Student / Duo / Family, each with its own colored `Get Premium X` CTA and per-plan `Terms apply.` footer.

## Global
- Toast notifications fire for any not-yet-implemented action (so user always gets feedback).
- URL routing is all client-side via Next's App Router.
- Auth-protected routes redirect to `/login` on 401.
