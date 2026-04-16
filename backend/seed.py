"""Seed the database with a demo user and sample playlists."""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from app.database import engine, SessionLocal, Base
from app.models import User, Song, Playlist, PlaylistSong, LikedSong
from app.auth import hash_password

Base.metadata.create_all(bind=engine)

db = SessionLocal()

existing = db.query(User).filter(User.email == "demo@spotify.com").first()
if existing:
    print("Demo user already exists, skipping seed.")
    db.close()
    sys.exit(0)

user = User(email="demo@spotify.com", hashed_password=hash_password("demo123"))
db.add(user)
db.commit()
db.refresh(user)
print(f"Created demo user: {user.email} (password: demo123)")

sample_songs = [
    ("Love Me Not", "Ravyn Lenae", "Bird's Eye", 213),
    ("End of Beginning", "Djo", "DECIDE", 159),
    ("Nope your too late", "wifiskeleton", "suburban daredevil", 90),
    ("Pink + White", "Frank Ocean", "Blonde", 193),
    ("Ivy", "Frank Ocean", "Blonde", 249),
    ("Redbone", "Childish Gambino", "Awaken My Love", 326),
    ("Electric Feel", "MGMT", "Oracular Spectacular", 229),
    ("Midnight City", "M83", "Hurry Up, We're Dreaming", 244),
    ("Tadow", "Masego & FKJ", None, 326),
    ("Bags", "Clairo", "Immunity", 243),
]

songs = []
for title, artist, album, duration in sample_songs:
    song = Song(user_id=user.id, title=title, artist=artist, album=album, duration=duration, file_url=f"/uploads/audio/sample/{title.lower().replace(' ', '_')}.mp3")
    db.add(song)
    songs.append(song)

db.commit()
for s in songs:
    db.refresh(s)
print(f"Created {len(songs)} sample songs")

pl1 = Playlist(user_id=user.id, name="Vibes")
pl2 = Playlist(user_id=user.id, name="Late Night")
pl3 = Playlist(user_id=user.id, name="Chill")
db.add_all([pl1, pl2, pl3])
db.commit()
for pl in [pl1, pl2, pl3]:
    db.refresh(pl)

for i, song in enumerate(songs[:5]):
    db.add(PlaylistSong(playlist_id=pl1.id, song_id=song.id, position=i))
for i, song in enumerate(songs[3:8]):
    db.add(PlaylistSong(playlist_id=pl2.id, song_id=song.id, position=i))
for i, song in enumerate(songs[6:]):
    db.add(PlaylistSong(playlist_id=pl3.id, song_id=song.id, position=i))

for song in songs[:4]:
    db.add(LikedSong(user_id=user.id, song_id=song.id))

db.commit()
print("Created 3 playlists with songs and 4 liked songs")
print("Seed complete!")

db.close()
