import os
import uuid
from fastapi import APIRouter, Depends, UploadFile, File, Query
from sqlalchemy.orm import Session
from ..deps import get_db, get_current_user
from ..models import User, Song
from ..schemas import SongOut

router = APIRouter()

UPLOADS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")


@router.get("", response_model=list[SongOut])
def list_songs(
    q: str = Query(default=""),
    artist: str = Query(default=""),
    album: str = Query(default=""),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Song).filter(Song.user_id == user.id)
    if q:
        term = f"%{q}%"
        query = query.filter(
            (Song.title.ilike(term)) | (Song.artist.ilike(term)) | (Song.album.ilike(term))
        )
    if artist:
        query = query.filter(Song.artist.ilike(artist))
    if album:
        query = query.filter(Song.album.ilike(album))
    songs = query.order_by(Song.title).limit(50).all()
    return [SongOut.model_validate(s) for s in songs]


@router.post("/upload", response_model=SongOut)
async def upload_song(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_dir = os.path.join(UPLOADS_DIR, "audio", str(user.id))
    os.makedirs(user_dir, exist_ok=True)

    file_id = str(uuid.uuid4())
    ext = file.filename.rsplit(".", 1)[-1] if file.filename and "." in file.filename else "mp3"
    filename = f"{file_id}.{ext}"
    filepath = os.path.join(user_dir, filename)

    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)

    title = file.filename.rsplit(".", 1)[0] if file.filename else "Unknown"
    artist_parsed = None
    if " - " in title:
        parts = title.split(" - ", 1)
        artist_parsed = parts[0].strip()
        title = parts[1].strip()

    duration = 0
    try:
        from mutagen import File as MutagenFile
        audio = MutagenFile(filepath)
        if audio and audio.info:
            duration = int(audio.info.length)
    except Exception:
        pass

    file_url = f"/uploads/audio/{user.id}/{filename}"

    song = Song(
        user_id=user.id,
        title=title,
        artist=artist_parsed,
        duration=duration,
        file_url=file_url,
    )
    db.add(song)
    db.commit()
    db.refresh(song)
    return SongOut.model_validate(song)
