from pydantic import BaseModel, ConfigDict, EmailStr
from typing import Optional
from datetime import datetime


class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    created_at: datetime

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

class SongOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    title: str
    artist: Optional[str] = None
    album: Optional[str] = None
    genre: Optional[str] = None
    duration: int
    file_url: str
    cover_url: Optional[str] = None
    created_at: datetime

class PlaylistOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    name: str
    category: Optional[str] = None
    created_at: datetime

class PlaylistSongOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    playlist_id: str
    song_id: str
    position: int
    song: Optional[SongOut] = None

class PlaylistDetailOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    name: str
    created_at: datetime
    songs: list[PlaylistSongOut] = []

class PlaylistCreate(BaseModel):
    name: str

class PlaylistUpdate(BaseModel):
    name: str

class PlaylistSongAdd(BaseModel):
    song_id: str
    position: Optional[int] = None

class LikedSongOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    song_id: str
    created_at: datetime
    song: Optional[SongOut] = None

class PlayerStateOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    song_id: Optional[str] = None
    position: float = 0
    volume: float = 1

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
