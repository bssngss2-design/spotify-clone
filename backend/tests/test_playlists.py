import io


def _create_song(authed_client):
    fake = io.BytesIO(b"\x00" * 512)
    r = authed_client.post("/api/songs/upload", files={"file": ("Song.mp3", fake, "audio/mpeg")})
    return r.json()["id"]


def test_create_playlist(authed_client):
    r = authed_client.post("/api/playlists", json={"name": "My Playlist"})
    assert r.status_code == 200
    assert r.json()["name"] == "My Playlist"


def test_list_playlists(authed_client):
    authed_client.post("/api/playlists", json={"name": "PL1"})
    authed_client.post("/api/playlists", json={"name": "PL2"})
    r = authed_client.get("/api/playlists")
    assert r.status_code == 200
    assert len(r.json()) == 2


def test_get_playlist_detail(authed_client):
    r = authed_client.post("/api/playlists", json={"name": "Detail"})
    pid = r.json()["id"]
    r2 = authed_client.get(f"/api/playlists/{pid}")
    assert r2.status_code == 200
    assert r2.json()["name"] == "Detail"
    assert r2.json()["songs"] == []


def test_update_playlist(authed_client):
    r = authed_client.post("/api/playlists", json={"name": "Old Name"})
    pid = r.json()["id"]
    r2 = authed_client.patch(f"/api/playlists/{pid}", json={"name": "New Name"})
    assert r2.status_code == 200
    assert r2.json()["name"] == "New Name"


def test_delete_playlist(authed_client):
    r = authed_client.post("/api/playlists", json={"name": "Delete Me"})
    pid = r.json()["id"]
    r2 = authed_client.delete(f"/api/playlists/{pid}")
    assert r2.status_code == 200
    r3 = authed_client.get("/api/playlists")
    assert len(r3.json()) == 0


def test_add_song_to_playlist(authed_client):
    song_id = _create_song(authed_client)
    r = authed_client.post("/api/playlists", json={"name": "WithSongs"})
    pid = r.json()["id"]
    r2 = authed_client.post(f"/api/playlists/{pid}/songs", json={"song_id": song_id})
    assert r2.status_code == 200
    r3 = authed_client.get(f"/api/playlists/{pid}")
    assert len(r3.json()["songs"]) == 1


def test_remove_song_from_playlist(authed_client):
    song_id = _create_song(authed_client)
    r = authed_client.post("/api/playlists", json={"name": "RemoveSong"})
    pid = r.json()["id"]
    authed_client.post(f"/api/playlists/{pid}/songs", json={"song_id": song_id})
    r2 = authed_client.delete(f"/api/playlists/{pid}/songs/{song_id}")
    assert r2.status_code == 200
    r3 = authed_client.get(f"/api/playlists/{pid}")
    assert len(r3.json()["songs"]) == 0


def test_add_duplicate_song(authed_client):
    song_id = _create_song(authed_client)
    r = authed_client.post("/api/playlists", json={"name": "DupTest"})
    pid = r.json()["id"]
    authed_client.post(f"/api/playlists/{pid}/songs", json={"song_id": song_id})
    r2 = authed_client.post(f"/api/playlists/{pid}/songs", json={"song_id": song_id})
    assert r2.status_code == 200
    r3 = authed_client.get(f"/api/playlists/{pid}")
    assert len(r3.json()["songs"]) == 1
