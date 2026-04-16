import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, ForeignKey, DateTime, UniqueConstraint, Text, TypeDecorator
from sqlalchemy.orm import relationship
from .database import Base


class GUID(TypeDecorator):
    """Platform-independent UUID type. Uses String(36) for SQLite, native UUID for Postgres."""
    impl = String(36)
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is not None:
            return str(value)
        return value

    def process_result_value(self, value, dialect):
        return value


def utcnow():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"
    id = Column(GUID, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=utcnow)

    songs = relationship("Song", back_populates="user", cascade="all, delete-orphan")
    playlists = relationship("Playlist", back_populates="user", cascade="all, delete-orphan")
    liked_songs = relationship("LikedSong", back_populates="user", cascade="all, delete-orphan")
    player_state = relationship("PlayerState", back_populates="user", uselist=False, cascade="all, delete-orphan")


class Song(Base):
    __tablename__ = "songs"
    id = Column(GUID, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(GUID, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(Text, nullable=False)
    artist = Column(Text)
    album = Column(Text)
    duration = Column(Integer, nullable=False, default=0)
    file_url = Column(Text, nullable=False)
    cover_url = Column(Text)
    created_at = Column(DateTime, default=utcnow, index=True)

    user = relationship("User", back_populates="songs")


class Playlist(Base):
    __tablename__ = "playlists"
    id = Column(GUID, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(GUID, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(Text, nullable=False)
    created_at = Column(DateTime, default=utcnow)

    user = relationship("User", back_populates="playlists")
    playlist_songs = relationship("PlaylistSong", back_populates="playlist", cascade="all, delete-orphan")


class PlaylistSong(Base):
    __tablename__ = "playlist_songs"
    id = Column(GUID, primary_key=True, default=lambda: str(uuid.uuid4()))
    playlist_id = Column(GUID, ForeignKey("playlists.id"), nullable=False, index=True)
    song_id = Column(GUID, ForeignKey("songs.id"), nullable=False)
    position = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=utcnow)

    __table_args__ = (UniqueConstraint("playlist_id", "song_id"),)

    playlist = relationship("Playlist", back_populates="playlist_songs")
    song = relationship("Song")


class LikedSong(Base):
    __tablename__ = "liked_songs"
    id = Column(GUID, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(GUID, ForeignKey("users.id"), nullable=False, index=True)
    song_id = Column(GUID, ForeignKey("songs.id"), nullable=False)
    created_at = Column(DateTime, default=utcnow)

    __table_args__ = (UniqueConstraint("user_id", "song_id"),)

    user = relationship("User", back_populates="liked_songs")
    song = relationship("Song")


class PlayerState(Base):
    __tablename__ = "player_state"
    user_id = Column(GUID, ForeignKey("users.id"), primary_key=True)
    song_id = Column(GUID, ForeignKey("songs.id"), nullable=True)
    position = Column(Float, nullable=False, default=0)
    volume = Column(Float, nullable=False, default=1)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    user = relationship("User", back_populates="player_state")
    song = relationship("Song")
