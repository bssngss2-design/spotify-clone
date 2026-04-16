from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session
from ..deps import get_db, get_current_user
from ..models import User
from ..schemas import UserCreate, UserLogin, TokenOut, UserOut
from ..auth import hash_password, verify_password, create_access_token

router = APIRouter()


def _normalize_email(email: str) -> str:
    return email.strip().lower()


@router.post("/register", response_model=TokenOut)
def register(body: UserCreate, db: Session = Depends(get_db)):
    email = _normalize_email(str(body.email))
    if db.query(User).filter(func.lower(User.email) == email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(email=email, hashed_password=hash_password(body.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token(str(user.id))
    return TokenOut(access_token=token, user=UserOut(id=str(user.id), email=user.email, created_at=user.created_at))


@router.post("/login", response_model=TokenOut)
def login(body: UserLogin, db: Session = Depends(get_db)):
    email = _normalize_email(str(body.email))
    user = db.query(User).filter(func.lower(User.email) == email).first()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token(str(user.id))
    return TokenOut(access_token=token, user=UserOut(id=str(user.id), email=user.email, created_at=user.created_at))


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return UserOut(id=str(user.id), email=user.email, created_at=user.created_at)
