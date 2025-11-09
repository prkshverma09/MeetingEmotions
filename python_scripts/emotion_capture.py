import cv2
import mss
import numpy as np
import os
from datetime import datetime
from PIL import Image

# Try to import transformers for Hugging Face emotion detection
EMOTION_DETECTOR_AVAILABLE = False
emotion_pipeline = None

try:
    from transformers import pipeline
    print("Loading emotion detection model from Hugging Face...")
    # Using a vision-language model for emotion detection
    # This model can analyze facial expressions
    emotion_pipeline = pipeline(
        "image-classification",
        model="trpakov/vit-face-expression",
        device=-1  # Use CPU (-1) or GPU (0, 1, etc.)
    )
    EMOTION_DETECTOR_AVAILABLE = True
    print("Emotion detection model loaded successfully!")
except ImportError:
    print("Warning: transformers library not available. Install with: pip install transformers torch pillow")
    print("Emotion detection will be skipped.")
except Exception as e:
    print(f"Warning: Could not load emotion detection model: {e}")
    print("Trying alternative model...")
    try:
        # Try a simpler alternative model
        from transformers import pipeline
        emotion_pipeline = pipeline(
            "image-classification",
            model="dima806/facial_emotions_image_detection",
            device=-1
        )
        EMOTION_DETECTOR_AVAILABLE = True
        print("Alternative emotion detection model loaded successfully!")
    except Exception as e2:
        print(f"Warning: Could not load alternative model: {e2}")
        print("Emotion detection will be skipped.")

# --- DO THIS ONCE ---
# Helper function to detect emotion using Hugging Face model
def detect_emotion_with_hf(face_image):
    """Detect emotion in face image using Hugging Face model"""
    if not EMOTION_DETECTOR_AVAILABLE or emotion_pipeline is None:
        return None

    try:
        # Convert BGR to RGB for PIL
        face_rgb = cv2.cvtColor(face_image, cv2.COLOR_BGR2RGB)
        # Convert numpy array to PIL Image
        pil_image = Image.fromarray(face_rgb)

        # Run emotion detection
        results = emotion_pipeline(pil_image)

        if results and len(results) > 0:
            # Get the top emotion prediction
            top_result = results[0]
            emotion_label = top_result.get('label', '')
            # Return the emotion (remove any prefixes/suffixes if needed)
            return emotion_label.upper()

        return None
    except Exception as e:
        # If detection fails, return None
        return None

# 2. Load OpenCV's fast face detector
face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
)
# --------------------

# 3. Ensure data folder exists (at project root)
script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(script_dir)
data_folder = os.path.join(project_root, "data")
os.makedirs(data_folder, exist_ok=True)

# 4. Start the screen capture loop
with mss.mss() as sct:
    # Define the monitor to capture
    monitor = sct.monitors[1]

    frame_count = 0
    while "Running":
        # Grab the screen
        sct_img = sct.grab(monitor)
        frame = np.array(sct_img)

        # Convert BGRA to BGR for processing
        frame_bgr = cv2.cvtColor(frame, cv2.COLOR_BGRA2BGR)

        # Convert to grayscale for the face detector
        gray_frame = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2GRAY)

        # Detect all faces. Returns a list of (x, y, w, h)
        faces = face_cascade.detectMultiScale(gray_frame, 1.1, 4)

        # Find the largest face
        largest_face_coords = None
        max_area = 0
        for (x, y, w, h) in faces:
            area = w * h
            if area > max_area:
                max_area = area
                largest_face_coords = (x, y, w, h)

        # Emotion detection for the largest face using local vLLM
        detected_emotion = None
        if largest_face_coords:
            # Unpack the coordinates
            x, y, w, h = largest_face_coords

            # Crop the face from the original color frame (BGR)
            speaker_crop = frame_bgr[y : y + h, x : x + w]

            # Run Emotion Analysis using Hugging Face model
            detected_emotion = detect_emotion_with_hf(speaker_crop)

            # Print face detected message with emotion
            if detected_emotion:
                print(f"face detected with emotion: {detected_emotion.lower()}")
            else:
                print("face detected with emotion: unknown")

            # Draw a rectangle around the face
            cv2.rectangle(frame_bgr, (x, y), (x + w, y + h), (0, 255, 0), 2)

            # Add emotion text above the face if detected
            if detected_emotion:
                cv2.putText(frame_bgr, f'Emotion: {detected_emotion}', (x, y - 10),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)

        # Generate unique filename with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
        filename = os.path.join(data_folder, f"screen_capture_{timestamp}.png")

        # Save the captured screen
        cv2.imwrite(filename, frame_bgr)
        frame_count += 1

        # (All other steps will go inside this loop)
        # Note: Press Ctrl+C to stop the script
