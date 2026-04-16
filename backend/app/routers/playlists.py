import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session, joinedload
from ..deps import get_db, get_current_user
from ..models import User, Playlist, PlaylistSong, Song
from ..schemas import PlaylistOut, PlaylistDetailOut, PlaylistSongOut, PlaylistCreate, PlaylistUpdate, PlaylistSongAdd, SongOut

router = APIRouter()

UPLOADS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")


@router.get("", response_model=list[PlaylistOut])
def list_playlists(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    pls = db.query(Playlist).filter(Playlist.user_id == user.id).order_by(Playlist.created_at.desc()).all()
    return [PlaylistOut.model_validate(p) for p in pls]


@router.post("", response_model=PlaylistOut)
def create_playlist(body: PlaylistCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    pl = Playlist(user_id=user.id, name=body.name)
    db.add(pl)
    db.commit()
    db.refresh(pl)
    return PlaylistOut.model_validate(pl)


@router.get("/{playlist_id}", response_model=PlaylistDetailOut)
def get_playlist(playlist_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    pl = db.query(Playlist).filter(Playlist.id == playlist_id, Playlist.user_id == user.id).first()
    if not pl:
        raise HTTPException(status_code=404, detail="Playlist not found")
    ps = db.query(PlaylistSong).filter(PlaylistSong.playlist_id == playlist_id).options(joinedload(PlaylistSong.song)).order_by(PlaylistSong.position).all()
    songs_out = []
    for item in ps:
        pso = PlaylistSongOut(id=str(item.id), playlist_id=str(item.playlist_id), song_id=str(item.song_id), position=item.position)
        if item.song:
            pso.song = SongOut.model_validate(item.song)
        songs_out.append(pso)
    return PlaylistDetailOut(id=str(pl.id), user_id=str(pl.user_id), name=pl.name, created_at=pl.created_at, songs=songs_out)


@router.patch("/{playlist_id}", response_model=PlaylistOut)
def update_playlist(playlist_id: str, body: PlaylistUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    pl = db.query(Playlist).filter(Playlist.id == playlist_id, Playlist.user_id == user.id).first()
    if not pl:
        raise HTTPException(status_code=404, detail="Playlist not found")
    pl.name = body.name
    db.commit()
    db.refresh(pl)
    return PlaylistOut.model_validate(pl)


@router.delete("/{playlist_id}")
def delete_playlist(playlist_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    pl = db.query(Playlist).filter(Playlist.id == playlist_id, Playlist.user_id == user.id).first()
    if not pl:
        raise HTTPException(status_code=404, detail="Playlist not found")
    db.delete(pl)
    db.commit()
    return {"ok": True}


@router.post("/{playlist_id}/songs", response_model=PlaylistSongOut)
def add_song_to_playlist(playlist_id: str, body: PlaylistSongAdd, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    pl = db.query(Playlist).filter(Playlist.id == playlist_id, Playlist.user_id == user.id).first()
    if not pl:
        raise HTTPException(status_code=404, detail="Playlist not found")
    existing = db.query(PlaylistSong).filter(PlaylistSong.playlist_id == playlist_id, PlaylistSong.song_id == body.song_id).first()
    if existing:
        return PlaylistSongOut.model_validate(existing)
    count = db.query(PlaylistSong).filter(PlaylistSong.playlist_id == playlist_id).count()
    ps = PlaylistSong(playlist_id=playlist_id, song_id=body.song_id, position=body.position if body.position is not None else count)
    db.add(ps)
    db.commit()
    db.refresh(ps)
    return PlaylistSongOut(id=str(ps.id), playlist_id=str(ps.playlist_id), song_id=str(ps.song_id), position=ps.position)


@router.delete("/{playlist_id}/songs/{song_id}")
def remove_song_from_playlist(playlist_id: str, song_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    pl = db.query(Playlist).filter(Playlist.id == playlist_id, Playlist.user_id == user.id).first()
    if not pl:
        raise HTTPException(status_code=404, detail="Playlist not found")
    ps = db.query(PlaylistSong).filter(PlaylistSong.playlist_id == playlist_id, PlaylistSong.song_id == song_id).first()
    if ps:
        db.delete(ps)
        db.commit()
    return {"ok": True}


@router.post("/{playlist_id}/cover")
async def upload_cover(playlist_id: str, file: UploadFile = File(...), user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    pl = db.query(Playlist).filter(Playlist.id == playlist_id, Playlist.user_id == user.id).first()
    if not pl:
        raise HTTPException(status_code=404, detail="Playlist not found")
    covers_dir = os.path.join(UPLOADS_DIR, "covers", str(user.id))
    os.makedirs(covers_dir, exist_ok=True)
    ext = file.filename.rsplit(".", 1)[-1] if file.filename and "." in file.filename else "jpg"
    filename = f"{playlist_id}.{ext}"
    filepath = os.path.join(covers_dir, filename)
    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)
    url = f"/uploads/covers/{user.id}/{filename}"
    return {"url": url}
