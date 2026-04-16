from fastapi import APIRouter, Query
import httpx

router = APIRouter()


@router.get("")
async def get_lyrics(
    track: str = Query(...),
    artist: str = Query(default=""),
    album: str = Query(default=""),
    duration: int = Query(default=0),
):
    params = {"track_name": track, "artist_name": artist, "album_name": album, "duration": duration}

    async with httpx.AsyncClient(timeout=10) as client:
        try:
            r = await client.get("https://lrclib.net/api/get", params=params)
            if r.status_code == 200:
                data = r.json()
                return {"syncedLyrics": data.get("syncedLyrics"), "plainLyrics": data.get("plainLyrics")}
        except Exception:
            pass

        try:
            r = await client.get("https://lrclib.net/api/search", params={"q": f"{artist} {track}"})
            if r.status_code == 200:
                results = r.json()
                if results:
                    best = results[0]
                    return {"syncedLyrics": best.get("syncedLyrics"), "plainLyrics": best.get("plainLyrics")}
        except Exception:
            pass

    return {"syncedLyrics": None, "plainLyrics": None}
