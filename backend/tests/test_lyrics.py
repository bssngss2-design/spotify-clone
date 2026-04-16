from unittest.mock import patch, AsyncMock
import httpx


def test_lyrics_endpoint(client):
    mock_response = httpx.Response(200, json={"syncedLyrics": "[00:01] Hello", "plainLyrics": "Hello"})

    with patch("httpx.AsyncClient.get", new_callable=AsyncMock, return_value=mock_response):
        r = client.get("/api/lyrics?track=Hello&artist=Adele")
        assert r.status_code == 200
        data = r.json()
        assert data["syncedLyrics"] is not None or data["plainLyrics"] is not None


def test_lyrics_no_results(client):
    mock_404 = httpx.Response(404, json={})
    mock_empty = httpx.Response(200, json=[])

    with patch("httpx.AsyncClient.get", new_callable=AsyncMock, side_effect=[mock_404, mock_empty]):
        r = client.get("/api/lyrics?track=Nonexistent&artist=Nobody")
        assert r.status_code == 200
        data = r.json()
        assert data["syncedLyrics"] is None
        assert data["plainLyrics"] is None
