import io


def _create_song(authed_client):
    fake = io.BytesIO(b"\x00" * 512)
    r = authed_client.post("/api/songs/upload", files={"file": ("Song.mp3", fake, "audio/mpeg")})
    return r.json()["id"]


def test_get_state_default(authed_client):
    r = authed_client.get("/api/player/state")
    assert r.status_code == 200
    assert r.json()["song_id"] is None
    assert r.json()["position"] == 0
    assert r.json()["volume"] == 1


def test_save_state(authed_client):
    song_id = _create_song(authed_client)
    r = authed_client.put("/api/player/state", json={"song_id": song_id, "position": 42.5, "volume": 0.8})
    assert r.status_code == 200
    assert r.json()["song_id"] == song_id
    assert r.json()["position"] == 42.5


def test_restore_state(authed_client):
    song_id = _create_song(authed_client)
    authed_client.put("/api/player/state", json={"song_id": song_id, "position": 10, "volume": 0.5})
    r = authed_client.get("/api/player/state")
    assert r.json()["song_id"] == song_id
    assert r.json()["position"] == 10
    assert r.json()["volume"] == 0.5


def test_update_state(authed_client):
    song_id = _create_song(authed_client)
    authed_client.put("/api/player/state", json={"song_id": song_id, "position": 10, "volume": 1})
    authed_client.put("/api/player/state", json={"song_id": song_id, "position": 99, "volume": 0.3})
    r = authed_client.get("/api/player/state")
    assert r.json()["position"] == 99
    assert r.json()["volume"] == 0.3
