import cv2
import numpy as np
from typing import Optional, Union
from PIL import Image, ImageOps

# Initialize emotion classifier (Hugging Face) if available
EMOTION_DETECTOR_AVAILABLE = False
emotion_pipeline = None

try:
    from transformers import pipeline
    # Prefer a small CPU-friendly model for serverless cold starts
    emotion_pipeline = pipeline(
        "image-classification",
        model="trpakov/vit-face-expression",
        device=-1  # CPU by default; change to 0 if deploying with GPU
    )
    EMOTION_DETECTOR_AVAILABLE = True
except Exception:
    # Best-effort fallback: try an alternative model
    try:
        from transformers import pipeline as _pipeline_alt
        emotion_pipeline = _pipeline_alt(
            "image-classification",
            model="dima806/facial_emotions_image_detection",
            device=-1
        )
        EMOTION_DETECTOR_AVAILABLE = True
    except Exception:
        EMOTION_DETECTOR_AVAILABLE = False

# Load OpenCV's Haar cascade face detector once
face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
)


def _to_bgr_ndarray(image: Union[np.ndarray, Image.Image, bytes, str]) -> Optional[np.ndarray]:
    """
    Normalize various image inputs to an OpenCV BGR ndarray.
    Accepts:
      - numpy ndarray (BGR, BGRA, RGB, RGBA, or grayscale)
      - PIL.Image.Image
      - file path (str) to an image
      - raw bytes of an encoded image
    Returns:
      - BGR ndarray or None if conversion fails
    """
    try:
        if isinstance(image, np.ndarray):
            arr = image
        elif isinstance(image, Image.Image):
            arr = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        elif isinstance(image, (bytes, bytearray)):
            data = np.frombuffer(image, dtype=np.uint8)
            arr = cv2.imdecode(data, cv2.IMREAD_UNCHANGED)
        elif isinstance(image, str):
            arr = cv2.imread(image, cv2.IMREAD_UNCHANGED)
        else:
            return None

        if arr is None:
            return None

        # Normalize channel format to BGR
        if len(arr.shape) == 2:  # grayscale
            return cv2.cvtColor(arr, cv2.COLOR_GRAY2BGR)
        if arr.shape[2] == 4:  # BGRA or RGBA
            # Heuristically assume OpenCV's imdecode/imread gives BGRA; convert to BGR
            return cv2.cvtColor(arr, cv2.COLOR_BGRA2BGR)
        if arr.shape[2] == 3:
            # Could be RGB or BGR; if source was PIL we already converted to BGR
            return arr
        return None
    except Exception:
        return None


def detect_face_emotion(image: Union[np.ndarray, Image.Image, bytes, str]) -> Optional[str]:
    """
    Detect the dominant face in the provided image and return its emotion label.

    Parameters:
      - image: numpy ndarray, PIL.Image, image file path (str), or encoded image bytes

    Returns:
      - Uppercased emotion label (e.g., "HAPPY", "SAD"), or None if undetected.

    Notes for serverless environments (e.g., Vercel):
      - Import time may initialize the model; consider keeping the module warm across invocations.
      - Ensure OpenCV and model weights are available in the deployment package or layer.
    """
    bgr = _to_bgr_ndarray(image)
    if bgr is None:
        return None

    # Detect faces
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=4)
    if len(faces) == 0:
        return None

    # Choose largest face
    x, y, w, h = max(faces, key=lambda rect: rect[2] * rect[3])
    face_bgr = bgr[y : y + h, x : x + w]

    if not EMOTION_DETECTOR_AVAILABLE or emotion_pipeline is None:
        return None

    try:
        # Convert to PIL RGB for HF pipeline
        face_rgb = cv2.cvtColor(face_bgr, cv2.COLOR_BGR2RGB)
        pil_img = Image.fromarray(face_rgb)
        # (Optional) basic normalization to reduce inference variance
        pil_img = ImageOps.exif_transpose(pil_img)

        results = emotion_pipeline(pil_img)
        if results and len(results) > 0:
            label = results[0].get("label", "")
            return label.upper() if label else None
        return None
    except Exception:
        return None
