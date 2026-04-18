"""Small shared helpers."""
from sqlalchemy import func
from sqlalchemy.orm import Session
from .models import Playlist, PlaylistSong, Song


def playlist_cover_map(db: Session, playlists: list[Playlist]) -> dict[str, str | None]:
    """Return {playlist_id: first_song.cover_url} for the given playlists in one query."""
    if not playlists:
        return {}
    ids = [str(p.id) for p in playlists]
    first_pos = (
        db.query(PlaylistSong.playlist_id, func.min(PlaylistSong.position).label("min_pos"))
        .filter(PlaylistSong.playlist_id.in_(ids))
        .group_by(PlaylistSong.playlist_id)
        .subquery()
    )
    rows = (
        db.query(PlaylistSong.playlist_id, Song.cover_url)
        .join(
            first_pos,
            (PlaylistSong.playlist_id == first_pos.c.playlist_id)
            & (PlaylistSong.position == first_pos.c.min_pos),
        )
        .join(Song, Song.id == PlaylistSong.song_id)
        .all()
    )
    return {str(pid): cov for pid, cov in rows}


def attach_covers(
    playlists: list[Playlist], cover_map: dict[str, str | None]
) -> list[dict]:
    """Serialize playlists as dicts with cover_url populated from the map."""
    out = []
    for p in playlists:
        out.append(
            {
                "id": str(p.id),
                "user_id": str(p.user_id),
                "name": p.name,
                "category": p.category,
                "cover_url": cover_map.get(str(p.id)),
                "created_at": p.created_at,
            }
        )
    return out
