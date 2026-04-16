import io


def test_list_songs_empty(authed_client):
    r = authed_client.get("/api/songs")
    assert r.status_code == 200
    assert r.json() == []


def test_upload_song(authed_client):
    fake_audio = io.BytesIO(b"\x00" * 1024)
    r = authed_client.post("/api/songs/upload", files={"file": ("Artist - Title.mp3", fake_audio, "audio/mpeg")})
    assert r.status_code == 200
    data = r.json()
    assert data["title"] == "Title"
    assert data["artist"] == "Artist"
    assert "/uploads/audio/" in data["file_url"]


def test_list_songs_after_upload(authed_client):
    fake_audio = io.BytesIO(b"\x00" * 512)
    authed_client.post("/api/songs/upload", files={"file": ("Test Song.mp3", fake_audio, "audio/mpeg")})
    r = authed_client.get("/api/songs")
    assert r.status_code == 200
    assert len(r.json()) == 1


def test_search_songs(authed_client):
    fake_audio = io.BytesIO(b"\x00" * 512)
    authed_client.post("/api/songs/upload", files={"file": ("Searchable Track.mp3", fake_audio, "audio/mpeg")})
    r = authed_client.get("/api/songs?q=Searchable")
    assert r.status_code == 200
    assert len(r.json()) == 1
    r2 = authed_client.get("/api/songs?q=Nonexistent")
    assert len(r2.json()) == 0
