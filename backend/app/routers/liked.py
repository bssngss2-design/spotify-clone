from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from ..deps import get_db, get_current_user
from ..models import User, LikedSong
from ..schemas import LikedSongOut, SongOut

router = APIRouter()


@router.get("", response_model=list[LikedSongOut])
def list_liked(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    items = (
        db.query(LikedSong)
        .filter(LikedSong.user_id == user.id)
        .options(joinedload(LikedSong.song))
        .order_by(LikedSong.created_at.desc())
        .all()
    )
    result = []
    for item in items:
        out = LikedSongOut(id=str(item.id), user_id=str(item.user_id), song_id=str(item.song_id), created_at=item.created_at)
        if item.song:
            out.song = SongOut.model_validate(item.song)
        result.append(out)
    return result


@router.post("/{song_id}", response_model=LikedSongOut)
def like_song(song_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    existing = db.query(LikedSong).filter(LikedSong.user_id == user.id, LikedSong.song_id == song_id).first()
    if existing:
        return LikedSongOut(id=str(existing.id), user_id=str(existing.user_id), song_id=str(existing.song_id), created_at=existing.created_at)
    ls = LikedSong(user_id=user.id, song_id=song_id)
    db.add(ls)
    db.commit()
    db.refresh(ls)
    return LikedSongOut(id=str(ls.id), user_id=str(ls.user_id), song_id=str(ls.song_id), created_at=ls.created_at)


@router.delete("/{song_id}")
def unlike_song(song_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ls = db.query(LikedSong).filter(LikedSong.user_id == user.id, LikedSong.song_id == song_id).first()
    if ls:
        db.delete(ls)
        db.commit()
    return {"ok": True}
