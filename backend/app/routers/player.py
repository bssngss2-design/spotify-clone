from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..deps import get_db, get_current_user
from ..models import User, PlayerState
from ..schemas import PlayerStateOut, PlayerStateUpdate

router = APIRouter()


@router.get("/state", response_model=PlayerStateOut)
def get_state(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ps = db.query(PlayerState).filter(PlayerState.user_id == user.id).first()
    if not ps:
        return PlayerStateOut()
    return PlayerStateOut(song_id=str(ps.song_id) if ps.song_id else None, position=ps.position, volume=ps.volume)


@router.put("/state", response_model=PlayerStateOut)
def save_state(body: PlayerStateUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ps = db.query(PlayerState).filter(PlayerState.user_id == user.id).first()
    if ps:
        ps.song_id = body.song_id
        ps.position = body.position
        ps.volume = body.volume
    else:
        ps = PlayerState(user_id=user.id, song_id=body.song_id, position=body.position, volume=body.volume)
        db.add(ps)
    db.commit()
    db.refresh(ps)
    return PlayerStateOut(song_id=str(ps.song_id) if ps.song_id else None, position=ps.position, volume=ps.volume)
