import io


def _create_song(authed_client):
    fake = io.BytesIO(b"\x00" * 512)
    r = authed_client.post("/api/songs/upload", files={"file": ("Song.mp3", fake, "audio/mpeg")})
    return r.json()["id"]


def test_list_liked_empty(authed_client):
    r = authed_client.get("/api/liked")
    assert r.status_code == 200
    assert r.json() == []


def test_like_song(authed_client):
    song_id = _create_song(authed_client)
    r = authed_client.post(f"/api/liked/{song_id}")
    assert r.status_code == 200
    assert r.json()["song_id"] == song_id


def test_list_liked_after_like(authed_client):
    song_id = _create_song(authed_client)
    authed_client.post(f"/api/liked/{song_id}")
    r = authed_client.get("/api/liked")
    assert len(r.json()) == 1


def test_unlike_song(authed_client):
    song_id = _create_song(authed_client)
    authed_client.post(f"/api/liked/{song_id}")
    r = authed_client.delete(f"/api/liked/{song_id}")
    assert r.status_code == 200
    r2 = authed_client.get("/api/liked")
    assert len(r2.json()) == 0


def test_double_like_idempotent(authed_client):
    song_id = _create_song(authed_client)
    authed_client.post(f"/api/liked/{song_id}")
    r = authed_client.post(f"/api/liked/{song_id}")
    assert r.status_code == 200
    r2 = authed_client.get("/api/liked")
    assert len(r2.json()) == 1
