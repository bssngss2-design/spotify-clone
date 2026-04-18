"""Seed database with demo@demo.com / demo123 — playlists, songs, genres, browse data.

Run: python seed.py
Force re-run (replace demo user): SEED_FORCE=1 python seed.py
"""
import hashlib
import os
import random
import shutil
import subprocess
import sys
from urllib.parse import quote

sys.path.insert(0, os.path.dirname(__file__))

from app.database import engine, SessionLocal, Base, apply_column_migrations
from app.models import User, Song, Playlist, PlaylistSong, LikedSong
from app.auth import hash_password

Base.metadata.create_all(bind=engine)
apply_column_migrations()

DEMO_EMAIL = "demo@demo.com"
DEMO_PASSWORD = "demo123"

BACKEND_ROOT = os.path.dirname(os.path.abspath(__file__))
FORCE = os.environ.get("SEED_FORCE") == "1" or "--force" in sys.argv

# SS1 + SS2 browse tiles (genre key = stored Song.genre)
BROWSE_GENRES = [
    # Row A — discovery-style (keys also used as genres)
    "new_hot",
    "top_picks",
    "throwback",
    "discover_weekly",
    "release_radar",
    # SS1
    "Pop",
    "Hip-Hop",
    "Rock",
    "Latin",
    "Dance/Electronic",
    "Indie",
    "R&B",
    "Country",
    "Jazz",
    "Classical",
    "Metal",
    "Folk & Acoustic",
    "Blues",
    "Soul",
    "Punk",
    # SS2
    "Reggae",
    "Ambient",
    "K-Pop",
    "Podcasts",
    "Mood",
    "Workout",
    "Focus",
    "Chill",
    "Sleep",
]

MADE_FOR_YOU = [
    "Discover Weekly",
    "Daily Mix 1",
    "Daily Mix 2",
    "Release Radar",
    "On Repeat",
    "Your Top Songs 2026",
]

NEW_RELEASES = [
    "New Music Friday",
    "Fresh Finds",
    "Breaking Hits",
    "Indie Radar",
    "Scouted",
    "Algorithm Radio",
]

POPULAR_ARTISTS = [
    "The Weeknd",
    "Taylor Swift",
    "Drake",
    "Bad Bunny",
    "Billie Eilish",
    "SZA",
]

# Each popular artist gets a signature track so their playlist cover pulls a
# person photo instead of a random landscape. Picked real-ish titles for vibe.
POPULAR_ARTIST_TRACKS: dict[str, list[tuple[str, str]]] = {
    "The Weeknd":    [("Blinding Lights", "After Hours"), ("Save Your Tears", "After Hours"), ("Starboy", "Starboy")],
    "Taylor Swift":  [("Anti-Hero", "Midnights"), ("Cruel Summer", "Lover"), ("Shake It Off", "1989")],
    "Drake":         [("God's Plan", "Scorpion"), ("One Dance", "Views"), ("Hotline Bling", "Views")],
    "Bad Bunny":     [("Titi Me Pregunto", "Un Verano Sin Ti"), ("Dakiti", "El Ultimo Tour Del Mundo"), ("Me Porto Bonito", "Un Verano Sin Ti")],
    "Billie Eilish": [("bad guy", "When We All Fall Asleep"), ("lovely", "Lovely"), ("Happier Than Ever", "Happier Than Ever")],
    "SZA":           [("Kill Bill", "SOS"), ("Good Days", "SOS"), ("Snooze", "SOS")],
}

USER_PLAYLISTS = [
    "Late Night Drive",
    "Gym Beats",
    "Study Session",
    "Sunday Morning",
    "Party Mode",
    "Rainy Day",
    "Road Trip",
    "Deep Focus",
]

TITLE_PREFIXES = [
    "Midnight",
    "Golden",
    "Lost",
    "Neon",
    "Velvet",
    "Crystal",
    "Electric",
    "Silent",
    "Wild",
    "Urban",
]


DEMO_MP3_SECONDS = 240  # must match real file length so UI duration matches playback


def _seed_slug(*parts: str) -> str:
    """Stable short slug so the same album/artist keeps the same picsum image across reseeds."""
    raw = "|".join(p.strip().lower() for p in parts if p)
    return hashlib.md5(raw.encode("utf-8")).hexdigest()[:12]


def album_cover(album: str, title: str = "") -> str:
    # Picsum returns a deterministic 640x640 photo per seed. Good enough for an album tile.
    return f"https://picsum.photos/seed/{_seed_slug(album, title)}/640/640"


def artist_cover(artist: str) -> str:
    # Pravatar = real people headshots, seeded by artist name so each artist keeps the same face.
    return f"https://i.pravatar.cc/640?u={quote(_seed_slug(artist))}"


def _mp3_duration_seconds(path: str) -> int | None:
    try:
        from mutagen.mp3 import MP3

        audio = MP3(path)
        if audio.info and audio.info.length:
            return max(1, int(round(audio.info.length)))
    except Exception:
        pass
    return None


def ensure_demo_mp3() -> tuple[str, int]:
    """Single shared MP3 for all demo tracks. Length matches DB `duration` so the player bar is honest."""
    rel = "/uploads/audio/demo/demo.mp3"
    d = os.path.join(BACKEND_ROOT, "uploads", "audio", "demo")
    os.makedirs(d, exist_ok=True)
    path = os.path.join(d, "demo.mp3")

    def needs_encode() -> bool:
        if not os.path.exists(path) or os.path.getsize(path) < 2000:
            return True
        dur = _mp3_duration_seconds(path)
        return dur is None or dur < 60

    if needs_encode():
        ffmpeg = shutil.which("ffmpeg")
        if ffmpeg:
            subprocess.run(
                [
                    ffmpeg,
                    "-y",
                    "-f",
                    "lavfi",
                    "-i",
                    "anullsrc=r=44100:cl=mono",
                    "-t",
                    str(DEMO_MP3_SECONDS),
                    "-q:a",
                    "9",
                    "-acodec",
                    "libmp3lame",
                    path,
                ],
                capture_output=True,
                check=False,
            )
        if not os.path.exists(path) or os.path.getsize(path) < 1000:
            with open(path, "wb") as f:
                f.write(b"\xff" * 4096)

    dur = _mp3_duration_seconds(path) or DEMO_MP3_SECONDS
    return rel, dur


def main() -> None:
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == DEMO_EMAIL).first()
        if existing and not FORCE:
            print(f"User {DEMO_EMAIL} already exists. Set SEED_FORCE=1 or pass --force to replace.")
            return
        if existing and FORCE:
            db.delete(existing)
            db.commit()
            print("Removed existing demo user (SEED_FORCE).")

        file_url, track_duration_sec = ensure_demo_mp3()
        rng = random.Random(42)

        user = User(email=DEMO_EMAIL, hashed_password=hash_password(DEMO_PASSWORD))
        db.add(user)
        db.commit()
        db.refresh(user)
        print(f"Created user: {DEMO_EMAIL} / {DEMO_PASSWORD}")

        songs: list[Song] = []

        def add_song(
            title: str,
            artist: str,
            album: str,
            genre: str,
            duration: int,
            cover_url: str | None = None,
        ) -> Song:
            s = Song(
                user_id=user.id,
                title=title,
                artist=artist,
                album=album,
                genre=genre,
                duration=duration,
                file_url=file_url,
                cover_url=cover_url or album_cover(album, title),
            )
            db.add(s)
            songs.append(s)
            return s

        # Signature tracks per popular artist (added first so their playlists can pull
        # these as the cover). artist_cover() gives us a real-person headshot.
        artist_song_pool: dict[str, list[Song]] = {}
        for artist_name, tracks in POPULAR_ARTIST_TRACKS.items():
            face = artist_cover(artist_name)
            bucket: list[Song] = []
            for title, album in tracks:
                s = add_song(title, artist_name, album, "Pop", track_duration_sec, cover_url=face)
                bucket.append(s)
            artist_song_pool[artist_name] = bucket

        # ~5 songs per browse genre
        for g in BROWSE_GENRES:
            for n in range(5):
                artist = f"{g} Artist {n + 1}" if g != "Podcasts" else f"Show Host {n + 1}"
                album = f"{g} Collection" if g != "Podcasts" else "Episode Series"
                title = f"{TITLE_PREFIXES[(n + len(g)) % len(TITLE_PREFIXES)]} {g} {n + 1}"
                add_song(title, artist, album, g, track_duration_sec)

        # Extra library variety for search
        for i in range(40):
            g = rng.choice(BROWSE_GENRES)
            add_song(
                f"Library Track {i + 1}",
                f"Various Artist {i % 17}",
                f"Album Vol. {i % 9}",
                g,
                track_duration_sec,
            )

        db.commit()
        for s in songs:
            db.refresh(s)
        print(f"Created {len(songs)} songs.")

        playlists: list[Playlist] = []

        def pl(name: str, category: str | None = None) -> Playlist:
            p = Playlist(user_id=user.id, name=name, category=category)
            db.add(p)
            playlists.append(p)
            return p

        for name in MADE_FOR_YOU:
            pl(name, "made_for_you")
        for name in NEW_RELEASES:
            pl(name, "new_releases")
        for name in POPULAR_ARTISTS:
            pl(name, "popular_artist")
        pl("Recently played", "recently_played")
        for name in USER_PLAYLISTS:
            pl(name, None)

        db.commit()
        for p in playlists:
            db.refresh(p)

        by_genre: dict[str, list[Song]] = {}
        for s in songs:
            by_genre.setdefault(s.genre or "", []).append(s)

        def pick(genre: str, k: int) -> list[Song]:
            pool = list(by_genre.get(genre, songs))
            rng.shuffle(pool)
            return pool[:k]

        mfy = [p for p in playlists if p.category == "made_for_you"]
        nwr = [p for p in playlists if p.category == "new_releases"]
        pop = [p for p in playlists if p.category == "popular_artist"]
        recent_pl = next(p for p in playlists if p.category == "recently_played")

        for p in mfy:
            pos = 0
            for s in pick("Pop", 4) or songs[:4]:
                db.add(PlaylistSong(playlist_id=p.id, song_id=s.id, position=pos))
                pos += 1
        for p in nwr:
            pos = 0
            for s in pick("new_hot", 4) or pick("Pop", 4) or songs[:4]:
                db.add(PlaylistSong(playlist_id=p.id, song_id=s.id, position=pos))
                pos += 1
        for p in pop:
            # p.name matches POPULAR_ARTISTS, so pin the artist's own tracks at the top
            # (playlist cover in the UI = first song's cover_url).
            own_tracks = artist_song_pool.get(p.name, [])
            own_ids = {s.id for s in own_tracks}
            # Pop pool includes artist tracks, filter them out so we don't re-insert.
            filler = [s for s in pick("Pop", 10) if s.id not in own_ids][: max(0, 5 - len(own_tracks))]
            for pos, s in enumerate(own_tracks + filler):
                db.add(PlaylistSong(playlist_id=p.id, song_id=s.id, position=pos))

        for pos, s in enumerate(songs[:25]):
            db.add(PlaylistSong(playlist_id=recent_pl.id, song_id=s.id, position=pos))

        user_pls = [p for p in playlists if p.category is None]
        for i, p in enumerate(user_pls):
            start = (i * 13) % max(1, len(songs))
            # Dedup in case len(songs) < 12 or the stride collides with itself.
            chunk: list[Song] = []
            seen: set[str] = set()
            j = 0
            while len(chunk) < min(12, len(songs)):
                s = songs[(start + j) % len(songs)]
                if s.id not in seen:
                    seen.add(s.id)
                    chunk.append(s)
                j += 1
            for j, s in enumerate(chunk):
                db.add(PlaylistSong(playlist_id=p.id, song_id=s.id, position=j))

        for s in songs[: min(35, len(songs))]:
            db.add(LikedSong(user_id=user.id, song_id=s.id))

        db.commit()
        print(
            f"Playlists: made_for_you={len(mfy)}, new_releases={len(nwr)}, "
            f"popular_artist={len(pop)}, user={len(user_pls)}, recently_played=1"
        )
        print(f"Liked songs: {min(35, len(songs))}")
        print("Seed complete.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
