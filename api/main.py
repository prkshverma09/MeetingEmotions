from fastapi import FastAPI, UploadFile, File, HTTPException, Body
from typing import Optional
import sys
import os

# Ensure project root is importable when running locally
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.append(PROJECT_ROOT)

from python_scripts.emotion_capture import detect_face_emotion

app = FastAPI(title="MeetingEmotions API", version="1.0.0")


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/detect/file")
async def detect_from_file(image: UploadFile = File(...)) -> dict:
    try:
        content = await image.read()
        emotion = detect_face_emotion(content)
        return {"emotion": emotion}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/detect/path")
def detect_from_path(image_path: str = Body(..., embed=True)) -> dict:
    try:
        if not os.path.isabs(image_path):
            raise HTTPException(status_code=400, detail="Provide an absolute image_path")
        if not os.path.exists(image_path):
            raise HTTPException(status_code=404, detail="image_path does not exist")
        emotion = detect_face_emotion(image_path)
        return {"emotion": emotion}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("api.main:app", host="127.0.0.1", port=8000, reload=False)


