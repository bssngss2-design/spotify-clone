import os
import uuid
import subprocess
import json
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from ..deps import get_db, get_current_user
from ..models import User, Song
from ..schemas import YouTubeSearchResult, YouTubeDownloadRequest, SongOut

router = APIRouter()

UPLOADS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")


@router.get("/search")
def search_youtube(q: str = Query(...)):
    try:
        result = subprocess.run(
            ["yt-dlp", "--dump-json", "--no-download", "--flat-playlist", f"ytsearch10:{q}"],
            capture_output=True, text=True, timeout=30,
        )
        results = []
        for line in result.stdout.strip().split("\n"):
            if not line:
                continue
            try:
                data = json.loads(line)
                results.append(YouTubeSearchResult(
                    id=data.get("id", ""),
                    title=data.get("title", ""),
                    artist=data.get("uploader", data.get("channel", "")),
                    duration=int(data.get("duration") or 0),
                    thumbnail=data.get("thumbnail"),
                    url=data.get("webpage_url") or data.get("url", f"https://www.youtube.com/watch?v={data.get('id', '')}"),
                ))
            except (json.JSONDecodeError, KeyError):
                continue
        return {"results": results}
    except FileNotFoundError:
        return {"results": [], "error": "yt-dlp not installed"}
    except subprocess.TimeoutExpired:
        return {"results": [], "error": "Search timed out"}


@router.post("/download", response_model=SongOut)
def download_youtube(body: YouTubeDownloadRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user_dir = os.path.join(UPLOADS_DIR, "audio", str(user.id))
    os.makedirs(user_dir, exist_ok=True)

    file_id = str(uuid.uuid4())
    output_path = os.path.join(user_dir, f"{file_id}.mp3")

    try:
        subprocess.run(
            ["yt-dlp", "-x", "--audio-format", "mp3", "--audio-quality", "0", "-o", output_path, body.url],
            capture_output=True, timeout=120,
        )
    except (FileNotFoundError, subprocess.TimeoutExpired) as e:
        raise HTTPException(status_code=500, detail=f"Download failed: {e}")

    if not os.path.exists(output_path):
        yt_output = output_path.rsplit(".", 1)[0] + ".mp3"
        if os.path.exists(yt_output):
            os.rename(yt_output, output_path)
        else:
            raise HTTPException(status_code=500, detail="Download produced no file")

    duration = 0
    try:
        from mutagen import File as MutagenFile
        audio = MutagenFile(output_path)
        if audio and audio.info:
            duration = int(audio.info.length)
    except Exception:
        pass

    file_url = f"/uploads/audio/{user.id}/{file_id}.mp3"
    song = Song(user_id=user.id, title=body.title, artist=body.artist, duration=duration, file_url=file_url)
    db.add(song)
    db.commit()
    db.refresh(song)
    return SongOut.model_validate(song)
