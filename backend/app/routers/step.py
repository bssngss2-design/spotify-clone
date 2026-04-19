"""Tool-server contract endpoints for the Collinear rl-gym agent framework.

- GET  /health    → {"status": "healthy"}
- GET  /tools     → {"tools": [{name, description, input_schema, mutates_state}, ...]}
- POST /step      → dispatch a tool call, return an Observation
- POST /reset     → wipe all mutable tables (seed must be re-run)
- GET  /snapshot  → dump current DB state as JSON (for verifiers + debugging)

These live at the root of the FastAPI app (no /api prefix) to match the
playbook contract. The existing /api/... routes keep serving the React UI.
"""

from __future__ import annotations

import json
from typing import Any
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field, ValidationError
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..deps import get_db
from ..models import Song, Playlist, PlaylistSong, LikedSong, PlayerState, User, AuditLog
from ..tools import TOOLS_BY_NAME, ToolError, tool_descriptors


def _audit(db: Session, tool_name: str, username: str | None, params: dict,
           result_code: str, message: str | None) -> None:
    try:
        entry = AuditLog(
            tool_name=tool_name,
            username=username,
            parameters=json.dumps(params, default=str)[:4000],
            result_code=result_code,
            message=(message or "")[:1000],
        )
        db.add(entry)
        db.commit()
    except Exception:
        db.rollback()


router = APIRouter()


class Action(BaseModel):
    tool_name: str = Field(..., description="Name of the tool to invoke (see GET /tools)")
    parameters: dict[str, Any] = Field(default_factory=dict)


class StepRequest(BaseModel):
    action: Action


class Observation(BaseModel):
    is_error: bool = False
    text: str = ""
    structured_content: Any = None


class StepResponse(BaseModel):
    observation: Observation
    reward: float | None = None
    done: bool = False


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "healthy"}


@router.get("/tools")
def list_tools() -> dict[str, Any]:
    return {"tools": tool_descriptors()}


@router.post("/step", response_model=StepResponse)
def step(body: StepRequest, db: Session = Depends(get_db)) -> StepResponse:
    tool_name = body.action.tool_name
    params = body.action.parameters or {}
    username = params.get("username") if isinstance(params, dict) else None
    tool = TOOLS_BY_NAME.get(tool_name)
    if not tool:
        available = ", ".join(sorted(TOOLS_BY_NAME.keys()))
        return StepResponse(observation=Observation(
            is_error=True,
            text=f"unknown tool '{tool_name}'. available: {available}",
            structured_content={"error_code": "unknown_tool", "tool_name": tool_name},
        ))

    try:
        args = tool.args_model.model_validate(params)
    except ValidationError as e:
        if tool.mutates_state:
            _audit(db, tool_name, username, params, "invalid_parameters", None)
        return StepResponse(observation=Observation(
            is_error=True,
            text=f"invalid parameters for '{tool_name}': {e.errors(include_url=False)}",
            structured_content={"error_code": "invalid_parameters", "errors": e.errors(include_url=False)},
        ))

    try:
        result = tool.handler(db, args)
    except ToolError as e:
        db.rollback()
        if tool.mutates_state:
            _audit(db, tool_name, username, params, e.code, e.message)
        return StepResponse(observation=Observation(
            is_error=True, text=e.message,
            structured_content={"error_code": e.code},
        ))
    except Exception as e:
        db.rollback()
        if tool.mutates_state:
            _audit(db, tool_name, username, params, "internal_error", str(e))
        return StepResponse(observation=Observation(
            is_error=True, text=f"internal error: {e}",
            structured_content={"error_code": "internal_error"},
        ))

    text = tool.summary(result) if tool.summary else (result.get("message") or "ok")
    if tool.mutates_state:
        _audit(db, tool_name, username, params, "ok", str(text))
    return StepResponse(observation=Observation(
        is_error=False, text=str(text), structured_content=result,
    ))


@router.post("/reset")
def reset(db: Session = Depends(get_db)) -> dict[str, Any]:
    """Wipe mutable tables. Users are kept so login still works after reset;
    the seed script re-populates content."""
    db.query(PlaylistSong).delete()
    db.query(Playlist).delete()
    db.query(LikedSong).delete()
    db.query(PlayerState).delete()
    db.query(Song).delete()
    db.query(AuditLog).delete()
    db.commit()
    return {"reset": True, "message": "Cleared playlists, liked songs, player state, songs, and audit log. Re-run seed."}


@router.get("/snapshot")
def snapshot(db: Session = Depends(get_db)) -> dict[str, Any]:
    users = db.query(User).all()
    songs = db.query(Song).all()
    playlists = db.query(Playlist).all()
    playlist_songs = db.query(PlaylistSong).all()
    liked = db.query(LikedSong).all()
    player_states = db.query(PlayerState).all()
    audit_total = db.query(func.count(AuditLog.id)).scalar() or 0
    audits = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(500).all()
    return {
        "counts": {
            "users": len(users),
            "songs": len(songs),
            "playlists": len(playlists),
            "playlist_songs": len(playlist_songs),
            "liked_songs": len(liked),
            "player_states": len(player_states),
            "audit_log": audit_total,
        },
        "users": [{"id": str(u.id), "username": u.username, "email": u.email, "role": u.role}
                  for u in users],
        "songs": [{"id": str(s.id), "user_id": str(s.user_id), "title": s.title,
                   "artist": s.artist, "album": s.album, "genre": s.genre,
                   "duration": s.duration} for s in songs],
        "playlists": [{"id": str(p.id), "user_id": str(p.user_id), "name": p.name,
                       "category": p.category} for p in playlists],
        "playlist_songs": [{"id": str(ps.id), "playlist_id": str(ps.playlist_id),
                            "song_id": str(ps.song_id), "position": ps.position}
                           for ps in playlist_songs],
        "liked_songs": [{"user_id": str(l.user_id), "song_id": str(l.song_id)} for l in liked],
        "player_states": [{"user_id": str(ps.user_id),
                           "song_id": str(ps.song_id) if ps.song_id else None,
                           "position": ps.position, "volume": ps.volume}
                          for ps in player_states],
        "audit_log": [
            {
                "id": str(a.id),
                "tool_name": a.tool_name,
                "username": a.username,
                "result_code": a.result_code,
                "message": a.message,
                "created_at": a.created_at.isoformat() if a.created_at else None,
            }
            for a in audits
        ],
    }
