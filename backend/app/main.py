import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .database import engine, Base
from .routers import auth, songs, playlists, liked, player, lyrics, youtube

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Spotify Clone API")

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

uploads_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(songs.router, prefix="/api/songs", tags=["songs"])
app.include_router(playlists.router, prefix="/api/playlists", tags=["playlists"])
app.include_router(liked.router, prefix="/api/liked", tags=["liked"])
app.include_router(player.router, prefix="/api/player", tags=["player"])
app.include_router(lyrics.router, prefix="/api/lyrics", tags=["lyrics"])
app.include_router(youtube.router, prefix="/api/youtube", tags=["youtube"])


@app.get("/api/health")
def health():
    return {"status": "ok"}
