from sqlalchemy.orm import Session, joinedload
from fastapi import APIRouter, Depends
from ..deps import get_db, get_current_user
from ..models import User, Playlist, PlaylistSong, Song
from ..schemas import PlaylistOut, SongOut

router = APIRouter()


@router.get("/home")
def home_discover(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    def pls(cat: str, limit: int = 12):
        rows = (
            db.query(Playlist)
            .filter(Playlist.user_id == user.id, Playlist.category == cat)
            .order_by(Playlist.created_at.desc())
            .limit(limit)
            .all()
        )
        return [PlaylistOut.model_validate(p) for p in rows]

    recent_pl = (
        db.query(Playlist)
        .filter(Playlist.user_id == user.id, Playlist.category == "recently_played")
        .order_by(Playlist.created_at.desc())
        .first()
    )
    recent_songs: list[SongOut] = []
    if recent_pl:
        ps = (
            db.query(PlaylistSong)
            .filter(PlaylistSong.playlist_id == recent_pl.id)
            .options(joinedload(PlaylistSong.song))
            .order_by(PlaylistSong.position)
            .limit(20)
            .all()
        )
        for item in ps:
            if item.song:
                recent_songs.append(SongOut.model_validate(item.song))

    return {
        "made_for_you": pls("made_for_you"),
        "new_releases": pls("new_releases"),
        "popular_artists": pls("popular_artist"),
        "recently_played": recent_songs,
    }
