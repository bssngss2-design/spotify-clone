"""Unit tests for the Collinear tool-server contract: /health, /tools, /step,
/reset, /snapshot. These tests drive the server the same way an agent would."""

from __future__ import annotations

import pytest
from app.auth import hash_password
from app.models import User, Song


def _call(client, tool_name: str, parameters: dict | None = None):
    r = client.post("/step", json={"action": {"tool_name": tool_name, "parameters": parameters or {}}})
    assert r.status_code == 200, r.text
    return r.json()


@pytest.fixture
def seeded_users(db_session):
    admin = User(email="admin@spotify.test", username="admin", role="admin",
                 hashed_password=hash_password("admin"))
    sarah = User(email="sarah@spotify.test", username="sarah.connor", role="standard",
                 hashed_password=hash_password("password"))
    viewer = User(email="viewer@spotify.test", username="viewer", role="viewer",
                  hashed_password=hash_password("password"))
    db_session.add_all([admin, sarah, viewer])
    db_session.commit()
    for u in (admin, sarah, viewer):
        db_session.refresh(u)
    return {"admin": admin, "sarah": sarah, "viewer": viewer}


@pytest.fixture
def seeded_songs(db_session, seeded_users):
    sarah = seeded_users["sarah"]
    songs = [
        Song(user_id=sarah.id, title="Song A", artist="Alpha", album="Album1", genre="pop",
             duration=200, file_url="/a.mp3"),
        Song(user_id=sarah.id, title="Song B", artist="Bravo", album="Album2", genre="rock",
             duration=180, file_url="/b.mp3"),
        Song(user_id=sarah.id, title="Another", artist="Alpha", album="Album3", genre="pop",
             duration=240, file_url="/c.mp3"),
    ]
    db_session.add_all(songs)
    db_session.commit()
    for s in songs:
        db_session.refresh(s)
    return songs


# ─── Contract endpoints ──────────────────────────────────────────────────────

def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "healthy"}


def test_tools_descriptor_shape(client):
    r = client.get("/tools")
    assert r.status_code == 200
    body = r.json()
    assert "tools" in body and isinstance(body["tools"], list)
    names = {t["name"] for t in body["tools"]}
    # a handful of the key tools the verifier will care about
    for expected in ("login", "create_playlist", "add_song_to_playlist",
                     "like_song", "play_song", "search_songs"):
        assert expected in names
    for t in body["tools"]:
        assert "name" in t and "description" in t
        assert "input_schema" in t and t["input_schema"]["type"] == "object"
        assert "mutates_state" in t


def test_step_unknown_tool(client):
    body = _call(client, "definitely_not_a_tool")
    assert body["observation"]["is_error"] is True
    assert body["observation"]["structured_content"]["error_code"] == "unknown_tool"


def test_step_invalid_parameters(client):
    body = _call(client, "create_playlist", {"username": "sarah.connor"})
    assert body["observation"]["is_error"] is True
    assert body["observation"]["structured_content"]["error_code"] == "invalid_parameters"


# ─── Auth tools ──────────────────────────────────────────────────────────────

def test_login_success(client, seeded_users):
    body = _call(client, "login", {"username": "admin", "password": "admin"})
    assert body["observation"]["is_error"] is False
    assert body["observation"]["structured_content"]["user"]["role"] == "admin"


def test_login_by_email(client, seeded_users):
    body = _call(client, "login", {"username": "sarah@spotify.test", "password": "password"})
    assert body["observation"]["is_error"] is False
    assert body["observation"]["structured_content"]["user"]["username"] == "sarah.connor"


def test_login_bad_password(client, seeded_users):
    body = _call(client, "login", {"username": "admin", "password": "wrong"})
    assert body["observation"]["is_error"] is True
    assert body["observation"]["structured_content"]["error_code"] == "invalid_credentials"


def test_login_unknown_user(client, seeded_users):
    body = _call(client, "login", {"username": "nobody", "password": "password"})
    assert body["observation"]["is_error"] is True
    assert body["observation"]["structured_content"]["error_code"] == "user_not_found"


def test_list_users(client, seeded_users):
    body = _call(client, "list_users")
    users = body["observation"]["structured_content"]["users"]
    assert {u["username"] for u in users} >= {"admin", "sarah.connor", "viewer"}


# ─── Song tools ──────────────────────────────────────────────────────────────

def test_search_songs_by_query(client, seeded_songs):
    body = _call(client, "search_songs", {"query": "song"})
    content = body["observation"]["structured_content"]
    assert content["count"] == 2
    assert {s["title"] for s in content["songs"]} == {"Song A", "Song B"}


def test_search_songs_by_genre(client, seeded_songs):
    body = _call(client, "search_songs", {"genre": "pop"})
    content = body["observation"]["structured_content"]
    assert content["count"] == 2


def test_list_songs_scoped_to_user(client, seeded_songs):
    body = _call(client, "list_songs", {"username": "sarah.connor"})
    assert body["observation"]["structured_content"]["count"] == 3


def test_get_song_not_found(client, seeded_songs):
    body = _call(client, "get_song", {"song_id": "does-not-exist"})
    assert body["observation"]["is_error"] is True
    assert body["observation"]["structured_content"]["error_code"] == "song_not_found"


# ─── Playlist tools (end-to-end CRUD through /step) ──────────────────────────

def test_playlist_lifecycle(client, seeded_songs):
    created = _call(client, "create_playlist", {"username": "sarah.connor", "name": "Road Trip"})
    pl_id = created["observation"]["structured_content"]["playlist"]["id"]

    listed = _call(client, "list_playlists", {"username": "sarah.connor"})
    assert listed["observation"]["structured_content"]["count"] == 1

    song_id = seeded_songs[0].id
    added = _call(client, "add_song_to_playlist", {"playlist_id": pl_id, "song_id": song_id})
    assert added["observation"]["is_error"] is False

    dup = _call(client, "add_song_to_playlist", {"playlist_id": pl_id, "song_id": song_id})
    assert dup["observation"]["structured_content"]["already_present"] is True

    detail = _call(client, "get_playlist", {"playlist_id": pl_id})
    assert len(detail["observation"]["structured_content"]["playlist"]["songs"]) == 1

    renamed = _call(client, "rename_playlist", {"playlist_id": pl_id, "name": "Summer Mix"})
    assert renamed["observation"]["structured_content"]["playlist"]["name"] == "Summer Mix"

    removed = _call(client, "remove_song_from_playlist",
                    {"playlist_id": pl_id, "song_id": song_id})
    assert removed["observation"]["is_error"] is False

    deleted = _call(client, "delete_playlist", {"playlist_id": pl_id})
    assert deleted["observation"]["structured_content"]["deleted"] is True


def test_add_song_missing_playlist(client, seeded_songs):
    body = _call(client, "add_song_to_playlist",
                 {"playlist_id": "not-a-playlist", "song_id": seeded_songs[0].id})
    assert body["observation"]["is_error"] is True
    assert body["observation"]["structured_content"]["error_code"] == "playlist_not_found"


# ─── Liked / player tools ────────────────────────────────────────────────────

def test_like_unlike_flow(client, seeded_songs):
    song_id = seeded_songs[0].id
    liked = _call(client, "like_song", {"username": "sarah.connor", "song_id": song_id})
    assert liked["observation"]["structured_content"]["liked"] is True

    again = _call(client, "like_song", {"username": "sarah.connor", "song_id": song_id})
    assert again["observation"]["structured_content"]["already_liked"] is True

    listed = _call(client, "list_liked_songs", {"username": "sarah.connor"})
    assert listed["observation"]["structured_content"]["count"] == 1

    unliked = _call(client, "unlike_song", {"username": "sarah.connor", "song_id": song_id})
    assert unliked["observation"]["structured_content"]["liked"] is False


def test_player_state_persists(client, seeded_songs):
    song_id = seeded_songs[0].id
    _call(client, "play_song", {"username": "sarah.connor", "song_id": song_id})
    _call(client, "set_volume", {"username": "sarah.connor", "volume": 0.5})
    _call(client, "seek", {"username": "sarah.connor", "position": 42.0})

    state = _call(client, "get_player_state", {"username": "sarah.connor"})
    sc = state["observation"]["structured_content"]
    assert sc["song_id"] == song_id
    assert sc["volume"] == 0.5
    assert sc["position"] == 42.0


def test_set_volume_out_of_range_rejected(client, seeded_users):
    body = _call(client, "set_volume", {"username": "sarah.connor", "volume": 1.5})
    assert body["observation"]["is_error"] is True
    assert body["observation"]["structured_content"]["error_code"] == "invalid_parameters"


# ─── Snapshot / reset ────────────────────────────────────────────────────────

def test_snapshot_shape(client, seeded_songs):
    r = client.get("/snapshot")
    assert r.status_code == 200
    snap = r.json()
    assert set(snap["counts"].keys()) == {
        "users", "songs", "playlists", "playlist_songs", "liked_songs", "player_states", "audit_log",
    }
    assert "audit_log" in snap and isinstance(snap["audit_log"], list)
    assert snap["counts"]["users"] == 3
    assert snap["counts"]["songs"] == 3


def test_reset_clears_content_but_keeps_users(client, seeded_songs):
    _call(client, "create_playlist", {"username": "sarah.connor", "name": "To be wiped"})
    _call(client, "like_song", {"username": "sarah.connor", "song_id": seeded_songs[0].id})

    r = client.post("/reset")
    assert r.status_code == 200 and r.json()["reset"] is True

    snap = client.get("/snapshot").json()
    assert snap["counts"]["playlists"] == 0
    assert snap["counts"]["songs"] == 0
    assert snap["counts"]["liked_songs"] == 0
    assert snap["counts"]["users"] == 3  # login still works after reset
