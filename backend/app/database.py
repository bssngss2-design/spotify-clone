import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./spotify.db")

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def apply_column_migrations() -> None:
    """Add new columns on existing DBs (SQLite / Postgres) without Alembic."""

    def _try_alter(sql: str) -> None:
        try:
            with engine.begin() as conn:
                conn.execute(text(sql))
        except Exception as e:
            msg = str(e).lower()
            if "duplicate" in msg or "already exists" in msg:
                return
            if "no such column" in msg:
                return
            raise

    _try_alter("ALTER TABLE songs ADD COLUMN genre TEXT")
    _try_alter("ALTER TABLE playlists ADD COLUMN category VARCHAR(32)")
