-- Spotify clone schema for Postgres 16 (Collinear verifier-friendly).
-- UUIDs stored as VARCHAR(36) to match SQLAlchemy GUID TypeDecorator.
-- docker-compose mounts this to /docker-entrypoint-initdb.d/ on first boot.

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR NOT NULL UNIQUE,
    username VARCHAR UNIQUE,
    role VARCHAR(32) NOT NULL DEFAULT 'standard',
    hashed_password VARCHAR NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_users_email ON users (email);
CREATE INDEX IF NOT EXISTS ix_users_username ON users (username);

CREATE TABLE IF NOT EXISTS songs (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    artist TEXT,
    album TEXT,
    genre TEXT,
    duration INTEGER NOT NULL DEFAULT 0,
    file_url TEXT NOT NULL,
    cover_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_songs_user_id ON songs (user_id);
CREATE INDEX IF NOT EXISTS ix_songs_genre ON songs (genre);
CREATE INDEX IF NOT EXISTS ix_songs_created_at ON songs (created_at);

CREATE TABLE IF NOT EXISTS playlists (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category VARCHAR(32),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_playlists_user_id ON playlists (user_id);
CREATE INDEX IF NOT EXISTS ix_playlists_category ON playlists (category);

CREATE TABLE IF NOT EXISTS playlist_songs (
    id VARCHAR(36) PRIMARY KEY,
    playlist_id VARCHAR(36) NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
    song_id VARCHAR(36) NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_playlist_song UNIQUE (playlist_id, song_id)
);

CREATE INDEX IF NOT EXISTS ix_playlist_songs_playlist_id ON playlist_songs (playlist_id);

CREATE TABLE IF NOT EXISTS liked_songs (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    song_id VARCHAR(36) NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_user_liked_song UNIQUE (user_id, song_id)
);

CREATE INDEX IF NOT EXISTS ix_liked_songs_user_id ON liked_songs (user_id);

CREATE TABLE IF NOT EXISTS player_state (
    user_id VARCHAR(36) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    song_id VARCHAR(36) REFERENCES songs(id) ON DELETE SET NULL,
    position DOUBLE PRECISION NOT NULL DEFAULT 0,
    volume DOUBLE PRECISION NOT NULL DEFAULT 1,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_log (
    id VARCHAR(36) PRIMARY KEY,
    tool_name VARCHAR(128) NOT NULL,
    username VARCHAR,
    parameters TEXT,
    result_code VARCHAR(64) NOT NULL,
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_audit_log_tool_name ON audit_log (tool_name);
CREATE INDEX IF NOT EXISTS ix_audit_log_username ON audit_log (username);
CREATE INDEX IF NOT EXISTS ix_audit_log_created_at ON audit_log (created_at);
