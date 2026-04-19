"""Tool registry for the /step API contract (Collinear clone-template).

Each tool is a pure function that takes a SQLAlchemy session + a Pydantic
Args model and returns a JSON-serializable dict (the `structured_content`).
Observation text is a human-readable summary generated alongside.

Tools reference users by `username` (not JWT) so agents can drive the clone
via HTTP without session state. The verifier will query Postgres directly
based on the data these tools mutate.
"""

from __future__ import annotations

from typing import Any, Callable, Optional
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, func

from .models import User, Song, Playlist, PlaylistSong, LikedSong, PlayerState
from .auth import verify_password


class ToolError(Exception):
    """Raised by a handler when the input is semantically invalid. Converted
    to an observation with is_error=True by the /step dispatcher."""

    def __init__(self, message: str, code: str = "tool_error") -> None:
        super().__init__(message)
        self.message = message
        self.code = code


def _require_user(db: Session, username: str) -> User:
    if not username:
        raise ToolError("username is required", code="missing_username")
    u = db.query(User).filter(
        or_(func.lower(User.username) == username.strip().lower(),
            func.lower(User.email) == username.strip().lower())
    ).first()
    if not u:
        raise ToolError(f"user '{username}' not found", code="user_not_found")
    return u


def _song_dict(s: Song) -> dict[str, Any]:
    return {
        "id": str(s.id),
        "title": s.title,
        "artist": s.artist,
        "album": s.album,
        "genre": s.genre,
        "duration": s.duration,
        "cover_url": s.cover_url,
        "file_url": s.file_url,
    }


def _playlist_dict(p: Playlist, include_songs: bool = False) -> dict[str, Any]:
    d: dict[str, Any] = {
        "id": str(p.id),
        "name": p.name,
        "owner": str(p.user_id),
        "category": p.category,
        "created_at": p.created_at.isoformat() if p.created_at else None,
    }
    if include_songs:
        d["songs"] = [
            {"position": ps.position, **_song_dict(ps.song)}
            for ps in sorted(p.playlist_songs, key=lambda x: x.position)
            if ps.song
        ]
    return d


# ─── Args schemas ────────────────────────────────────────────────────────────

class LoginArgs(BaseModel):
    username: str = Field(..., description="Username or email")
    password: str = Field(..., description="Plain-text password")


class UsernameArgs(BaseModel):
    username: str = Field(..., description="Username of the acting user")


class NoArgs(BaseModel):
    pass


class SearchSongsArgs(BaseModel):
    query: Optional[str] = Field(default=None, description="Free-text search over title/artist/album/genre")
    genre: Optional[str] = Field(default=None)
    artist: Optional[str] = Field(default=None)
    album: Optional[str] = Field(default=None)
    username: Optional[str] = Field(default=None, description="Scope results to a user's library; omit for global catalog")
    limit: int = Field(default=50, ge=1, le=200)


class SongIdArgs(BaseModel):
    song_id: str


class CreatePlaylistArgs(BaseModel):
    username: str
    name: str = Field(..., min_length=1, max_length=200)


class PlaylistIdArgs(BaseModel):
    playlist_id: str


class RenamePlaylistArgs(BaseModel):
    playlist_id: str
    name: str = Field(..., min_length=1, max_length=200)


class AddSongToPlaylistArgs(BaseModel):
    playlist_id: str
    song_id: str
    position: Optional[int] = None


class RemoveSongFromPlaylistArgs(BaseModel):
    playlist_id: str
    song_id: str


class ReorderPlaylistSongArgs(BaseModel):
    playlist_id: str
    song_id: str
    new_position: int = Field(..., ge=0)


class LikeArgs(BaseModel):
    username: str
    song_id: str


class PlaySongArgs(BaseModel):
    username: str
    song_id: str


class SetVolumeArgs(BaseModel):
    username: str
    volume: float = Field(..., ge=0, le=1)


class SeekArgs(BaseModel):
    username: str
    position: float = Field(..., ge=0)


# ─── Handlers ────────────────────────────────────────────────────────────────

def t_login(db: Session, args: LoginArgs) -> dict[str, Any]:
    u = _require_user(db, args.username)
    if not verify_password(args.password, u.hashed_password):
        raise ToolError("invalid credentials", code="invalid_credentials")
    return {
        "user": {"id": str(u.id), "username": u.username, "email": u.email, "role": u.role},
        "message": f"Logged in as {u.username or u.email}",
    }


def t_list_users(db: Session, args: NoArgs) -> dict[str, Any]:
    rows = db.query(User).order_by(User.created_at).all()
    return {"users": [{"id": str(u.id), "username": u.username, "email": u.email, "role": u.role} for u in rows]}


def t_get_user(db: Session, args: UsernameArgs) -> dict[str, Any]:
    u = _require_user(db, args.username)
    return {"user": {"id": str(u.id), "username": u.username, "email": u.email, "role": u.role,
                     "created_at": u.created_at.isoformat() if u.created_at else None}}


def t_whoami(db: Session, args: UsernameArgs) -> dict[str, Any]:
    u = _require_user(db, args.username)
    return {"id": str(u.id), "username": u.username, "email": u.email, "role": u.role}


def t_search_songs(db: Session, args: SearchSongsArgs) -> dict[str, Any]:
    q = db.query(Song)
    if args.username:
        u = _require_user(db, args.username)
        q = q.filter(Song.user_id == u.id)
    if args.query:
        term = f"%{args.query}%"
        q = q.filter(or_(Song.title.ilike(term), Song.artist.ilike(term),
                         Song.album.ilike(term), Song.genre.ilike(term)))
    if args.genre:
        q = q.filter(Song.genre.ilike(args.genre))
    if args.artist:
        q = q.filter(Song.artist.ilike(args.artist))
    if args.album:
        q = q.filter(Song.album.ilike(args.album))
    rows = q.order_by(Song.title).limit(args.limit).all()
    return {"count": len(rows), "songs": [_song_dict(s) for s in rows]}


def t_list_songs(db: Session, args: UsernameArgs) -> dict[str, Any]:
    u = _require_user(db, args.username)
    rows = db.query(Song).filter(Song.user_id == u.id).order_by(Song.title).limit(200).all()
    return {"count": len(rows), "songs": [_song_dict(s) for s in rows]}


def t_get_song(db: Session, args: SongIdArgs) -> dict[str, Any]:
    s = db.query(Song).filter(Song.id == args.song_id).first()
    if not s:
        raise ToolError(f"song '{args.song_id}' not found", code="song_not_found")
    return {"song": _song_dict(s)}


def t_create_playlist(db: Session, args: CreatePlaylistArgs) -> dict[str, Any]:
    u = _require_user(db, args.username)
    pl = Playlist(user_id=u.id, name=args.name)
    db.add(pl)
    db.commit()
    db.refresh(pl)
    return {"playlist": _playlist_dict(pl), "message": f"Created playlist '{pl.name}'"}


def t_list_playlists(db: Session, args: UsernameArgs) -> dict[str, Any]:
    u = _require_user(db, args.username)
    rows = db.query(Playlist).filter(Playlist.user_id == u.id).order_by(Playlist.created_at.desc()).all()
    return {"count": len(rows), "playlists": [_playlist_dict(p) for p in rows]}


def t_get_playlist(db: Session, args: PlaylistIdArgs) -> dict[str, Any]:
    pl = (db.query(Playlist)
          .options(joinedload(Playlist.playlist_songs).joinedload(PlaylistSong.song))
          .filter(Playlist.id == args.playlist_id).first())
    if not pl:
        raise ToolError(f"playlist '{args.playlist_id}' not found", code="playlist_not_found")
    return {"playlist": _playlist_dict(pl, include_songs=True)}


def t_rename_playlist(db: Session, args: RenamePlaylistArgs) -> dict[str, Any]:
    pl = db.query(Playlist).filter(Playlist.id == args.playlist_id).first()
    if not pl:
        raise ToolError(f"playlist '{args.playlist_id}' not found", code="playlist_not_found")
    old = pl.name
    pl.name = args.name
    db.commit()
    return {"playlist": _playlist_dict(pl), "message": f"Renamed '{old}' → '{pl.name}'"}


def t_delete_playlist(db: Session, args: PlaylistIdArgs) -> dict[str, Any]:
    pl = db.query(Playlist).filter(Playlist.id == args.playlist_id).first()
    if not pl:
        raise ToolError(f"playlist '{args.playlist_id}' not found", code="playlist_not_found")
    name = pl.name
    db.delete(pl)
    db.commit()
    return {"deleted": True, "message": f"Deleted playlist '{name}'"}


def t_add_song_to_playlist(db: Session, args: AddSongToPlaylistArgs) -> dict[str, Any]:
    pl = db.query(Playlist).filter(Playlist.id == args.playlist_id).first()
    if not pl:
        raise ToolError(f"playlist '{args.playlist_id}' not found", code="playlist_not_found")
    s = db.query(Song).filter(Song.id == args.song_id).first()
    if not s:
        raise ToolError(f"song '{args.song_id}' not found", code="song_not_found")
    existing = db.query(PlaylistSong).filter(
        PlaylistSong.playlist_id == args.playlist_id,
        PlaylistSong.song_id == args.song_id,
    ).first()
    if existing:
        return {"playlist_song": {"id": str(existing.id), "position": existing.position},
                "message": f"'{s.title}' was already in '{pl.name}'", "already_present": True}
    count = db.query(PlaylistSong).filter(PlaylistSong.playlist_id == args.playlist_id).count()
    ps = PlaylistSong(playlist_id=args.playlist_id, song_id=args.song_id,
                      position=args.position if args.position is not None else count)
    db.add(ps)
    db.commit()
    db.refresh(ps)
    return {"playlist_song": {"id": str(ps.id), "position": ps.position},
            "message": f"Added '{s.title}' to '{pl.name}'"}


def t_remove_song_from_playlist(db: Session, args: RemoveSongFromPlaylistArgs) -> dict[str, Any]:
    ps = db.query(PlaylistSong).filter(
        PlaylistSong.playlist_id == args.playlist_id,
        PlaylistSong.song_id == args.song_id,
    ).first()
    if not ps:
        raise ToolError("song is not in that playlist", code="not_in_playlist")
    db.delete(ps)
    db.commit()
    return {"removed": True, "message": "Removed song from playlist"}


def t_reorder_playlist_song(db: Session, args: ReorderPlaylistSongArgs) -> dict[str, Any]:
    ps = db.query(PlaylistSong).filter(
        PlaylistSong.playlist_id == args.playlist_id,
        PlaylistSong.song_id == args.song_id,
    ).first()
    if not ps:
        raise ToolError("song is not in that playlist", code="not_in_playlist")
    old_pos = ps.position
    ps.position = args.new_position
    db.commit()
    return {"moved": True, "message": f"Moved song from position {old_pos} to {args.new_position}"}


def t_list_liked_songs(db: Session, args: UsernameArgs) -> dict[str, Any]:
    u = _require_user(db, args.username)
    rows = (db.query(LikedSong).filter(LikedSong.user_id == u.id)
            .options(joinedload(LikedSong.song))
            .order_by(LikedSong.created_at.desc()).all())
    return {"count": len(rows),
            "liked_songs": [{"song_id": str(r.song_id), **(_song_dict(r.song) if r.song else {})} for r in rows]}


def t_like_song(db: Session, args: LikeArgs) -> dict[str, Any]:
    u = _require_user(db, args.username)
    s = db.query(Song).filter(Song.id == args.song_id).first()
    if not s:
        raise ToolError(f"song '{args.song_id}' not found", code="song_not_found")
    existing = db.query(LikedSong).filter(LikedSong.user_id == u.id, LikedSong.song_id == args.song_id).first()
    if existing:
        return {"liked": True, "already_liked": True, "message": f"'{s.title}' already liked"}
    ls = LikedSong(user_id=u.id, song_id=args.song_id)
    db.add(ls)
    db.commit()
    return {"liked": True, "message": f"Liked '{s.title}'"}


def t_unlike_song(db: Session, args: LikeArgs) -> dict[str, Any]:
    u = _require_user(db, args.username)
    ls = db.query(LikedSong).filter(LikedSong.user_id == u.id, LikedSong.song_id == args.song_id).first()
    if not ls:
        return {"liked": False, "was_liked": False, "message": "song was not liked"}
    db.delete(ls)
    db.commit()
    return {"liked": False, "message": "Unliked song"}


def _get_or_create_player_state(db: Session, user_id: Any) -> PlayerState:
    ps = db.query(PlayerState).filter(PlayerState.user_id == user_id).first()
    if not ps:
        ps = PlayerState(user_id=user_id, position=0, volume=1)
        db.add(ps)
        db.commit()
        db.refresh(ps)
    return ps


def t_get_player_state(db: Session, args: UsernameArgs) -> dict[str, Any]:
    u = _require_user(db, args.username)
    ps = _get_or_create_player_state(db, u.id)
    return {"song_id": str(ps.song_id) if ps.song_id else None,
            "position": ps.position, "volume": ps.volume}


def t_play_song(db: Session, args: PlaySongArgs) -> dict[str, Any]:
    u = _require_user(db, args.username)
    s = db.query(Song).filter(Song.id == args.song_id).first()
    if not s:
        raise ToolError(f"song '{args.song_id}' not found", code="song_not_found")
    ps = _get_or_create_player_state(db, u.id)
    ps.song_id = args.song_id
    ps.position = 0
    db.commit()
    return {"playing": True, "song_id": str(s.id), "title": s.title,
            "message": f"Now playing '{s.title}' by {s.artist or 'Unknown'}"}


def t_pause(db: Session, args: UsernameArgs) -> dict[str, Any]:
    u = _require_user(db, args.username)
    _get_or_create_player_state(db, u.id)
    return {"paused": True, "message": "Playback paused"}


def t_resume(db: Session, args: UsernameArgs) -> dict[str, Any]:
    u = _require_user(db, args.username)
    ps = _get_or_create_player_state(db, u.id)
    return {"paused": False, "song_id": str(ps.song_id) if ps.song_id else None,
            "message": "Playback resumed"}


def t_set_volume(db: Session, args: SetVolumeArgs) -> dict[str, Any]:
    u = _require_user(db, args.username)
    ps = _get_or_create_player_state(db, u.id)
    ps.volume = args.volume
    db.commit()
    return {"volume": ps.volume, "message": f"Volume set to {int(args.volume * 100)}%"}


def t_seek(db: Session, args: SeekArgs) -> dict[str, Any]:
    u = _require_user(db, args.username)
    ps = _get_or_create_player_state(db, u.id)
    ps.position = args.position
    db.commit()
    return {"position": ps.position, "message": f"Seeked to {args.position:.1f}s"}


def t_get_home_feed(db: Session, args: UsernameArgs) -> dict[str, Any]:
    u = _require_user(db, args.username)

    def cat(name: str, limit: int = 12):
        rows = (db.query(Playlist)
                .filter(Playlist.user_id == u.id, Playlist.category == name)
                .order_by(Playlist.created_at.desc()).limit(limit).all())
        return [_playlist_dict(p) for p in rows]

    return {
        "made_for_you": cat("made_for_you"),
        "new_releases": cat("new_releases"),
        "popular_artists": cat("popular_artist"),
    }


def t_get_recently_played(db: Session, args: UsernameArgs) -> dict[str, Any]:
    u = _require_user(db, args.username)
    recent_pl = (db.query(Playlist)
                 .filter(Playlist.user_id == u.id, Playlist.category == "recently_played")
                 .order_by(Playlist.created_at.desc()).first())
    songs: list[dict] = []
    if recent_pl:
        ps = (db.query(PlaylistSong)
              .filter(PlaylistSong.playlist_id == recent_pl.id)
              .options(joinedload(PlaylistSong.song))
              .order_by(PlaylistSong.position).limit(20).all())
        songs = [_song_dict(p.song) for p in ps if p.song]
    return {"count": len(songs), "songs": songs}


# ─── Registry ────────────────────────────────────────────────────────────────

class ToolDef:
    __slots__ = ("name", "description", "args_model", "handler", "mutates_state", "summary")

    def __init__(self, name: str, description: str, args_model: type[BaseModel],
                 handler: Callable[[Session, Any], dict[str, Any]],
                 mutates_state: bool, summary: Callable[[dict], str] | None = None) -> None:
        self.name = name
        self.description = description
        self.args_model = args_model
        self.handler = handler
        self.mutates_state = mutates_state
        self.summary = summary


def _summary(d: dict) -> str:
    msg = d.get("message")
    return str(msg) if msg else "ok"


TOOLS: list[ToolDef] = [
    # auth
    ToolDef("login", "Verify a username/email and password; returns user info on success.",
            LoginArgs, t_login, False),
    ToolDef("list_users", "List every user in the system.", NoArgs, t_list_users, False,
            lambda d: f"{len(d['users'])} users"),
    ToolDef("get_user", "Fetch details for a single user by username or email.",
            UsernameArgs, t_get_user, False,
            lambda d: f"user {d['user']['username'] or d['user']['email']}"),
    ToolDef("whoami", "Echo the user record for a given username.",
            UsernameArgs, t_whoami, False,
            lambda d: f"{d.get('username') or d.get('email')} (role={d.get('role')})"),

    # songs
    ToolDef("search_songs", "Search the catalog by free-text query and/or genre/artist/album.",
            SearchSongsArgs, t_search_songs, False,
            lambda d: f"{d['count']} song(s) found"),
    ToolDef("list_songs", "List every song in a user's library.",
            UsernameArgs, t_list_songs, False,
            lambda d: f"{d['count']} song(s)"),
    ToolDef("get_song", "Fetch a single song by id.",
            SongIdArgs, t_get_song, False,
            lambda d: f"song '{d['song']['title']}'"),

    # playlists
    ToolDef("create_playlist", "Create an empty playlist owned by the given user.",
            CreatePlaylistArgs, t_create_playlist, True),
    ToolDef("list_playlists", "List every playlist owned by a user.",
            UsernameArgs, t_list_playlists, False,
            lambda d: f"{d['count']} playlist(s)"),
    ToolDef("get_playlist", "Fetch a playlist including its ordered tracks.",
            PlaylistIdArgs, t_get_playlist, False,
            lambda d: f"playlist '{d['playlist']['name']}' ({len(d['playlist'].get('songs', []))} songs)"),
    ToolDef("rename_playlist", "Change a playlist's name.",
            RenamePlaylistArgs, t_rename_playlist, True),
    ToolDef("delete_playlist", "Delete a playlist (also drops its tracks).",
            PlaylistIdArgs, t_delete_playlist, True),
    ToolDef("add_song_to_playlist", "Append or insert a song into a playlist.",
            AddSongToPlaylistArgs, t_add_song_to_playlist, True),
    ToolDef("remove_song_from_playlist", "Remove a song from a playlist.",
            RemoveSongFromPlaylistArgs, t_remove_song_from_playlist, True),
    ToolDef("reorder_playlist_song", "Move a song to a new position within its playlist.",
            ReorderPlaylistSongArgs, t_reorder_playlist_song, True),

    # liked
    ToolDef("list_liked_songs", "List every song a user has liked.",
            UsernameArgs, t_list_liked_songs, False,
            lambda d: f"{d['count']} liked song(s)"),
    ToolDef("like_song", "Mark a song as liked for the given user.",
            LikeArgs, t_like_song, True),
    ToolDef("unlike_song", "Remove the like on a song for the given user.",
            LikeArgs, t_unlike_song, True),

    # player
    ToolDef("get_player_state", "Read the persisted player state for a user.",
            UsernameArgs, t_get_player_state, False,
            lambda d: f"song_id={d['song_id']} pos={d['position']:.1f}s vol={d['volume']:.2f}"),
    ToolDef("play_song", "Set the user's current song and reset position to 0.",
            PlaySongArgs, t_play_song, True),
    ToolDef("pause", "Mark playback as paused for the user.",
            UsernameArgs, t_pause, True),
    ToolDef("resume", "Mark playback as resumed for the user.",
            UsernameArgs, t_resume, True),
    ToolDef("set_volume", "Set the persisted playback volume (0..1).",
            SetVolumeArgs, t_set_volume, True),
    ToolDef("seek", "Set the persisted playback position (seconds).",
            SeekArgs, t_seek, True),

    # discover
    ToolDef("get_home_feed", "Return Made-for-you, New releases, and Popular artists sections for a user.",
            UsernameArgs, t_get_home_feed, False),
    ToolDef("get_recently_played", "Return the user's recently played tracks.",
            UsernameArgs, t_get_recently_played, False,
            lambda d: f"{d['count']} recent song(s)"),
]


TOOLS_BY_NAME: dict[str, ToolDef] = {t.name: t for t in TOOLS}


def tool_descriptors() -> list[dict[str, Any]]:
    return [{
        "name": t.name,
        "description": t.description,
        "input_schema": t.args_model.model_json_schema(),
        "mutates_state": t.mutates_state,
    } for t in TOOLS]
