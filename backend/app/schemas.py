from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: str
    email: str
    created_at: datetime
    class Config:
        from_attributes = True

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

class SongOut(BaseModel):
    id: str
    user_id: str
    title: str
    artist: Optional[str] = None
    album: Optional[str] = None
    duration: int
    file_url: str
    cover_url: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True

class PlaylistOut(BaseModel):
    id: str
    user_id: str
    name: str
    created_at: datetime
    class Config:
        from_attributes = True

class PlaylistSongOut(BaseModel):
    id: str
    playlist_id: str
    song_id: str
    position: int
    song: Optional[SongOut] = None
    class Config:
        from_attributes = True

class PlaylistDetailOut(BaseModel):
    id: str
    user_id: str
    name: str
    created_at: datetime
    songs: list[PlaylistSongOut] = []
    class Config:
        from_attributes = True

class PlaylistCreate(BaseModel):
    name: str

class PlaylistUpdate(BaseModel):
    name: str

class PlaylistSongAdd(BaseModel):
    song_id: str
    position: Optional[int] = None

class LikedSongOut(BaseModel):
    id: str
    user_id: str
    song_id: str
    created_at: datetime
    song: Optional[SongOut] = None
    class Config:
        from_attributes = True

class PlayerStateOut(BaseModel):
    song_id: Optional[str] = None
    position: float = 0
    volume: float = 1
    class Config:
        from_attributes = True

class PlayerStateUpdate(BaseModel):
    song_id: Optional[str] = None
    position: float = 0
    volume: float = 1

class YouTubeSearchResult(BaseModel):
    id: str
    title: str
    artist: str
    duration: int
    thumbnail: Optional[str] = None
    url: str

class YouTubeDownloadRequest(BaseModel):
    url: str
    title: str
    artist: Optional[str] = None
