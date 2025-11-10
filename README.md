# 🎭 Emotion Detector - Chrome Extension

A real-time emotion detection tool for video meetings. Captures frames from your video call and displays detected emotions as beautiful popups.

---

## 🚀 Quick Start (5 minutes)

### Step 1: Install Dependencies

```bash
pip install fastapi uvicorn opencv-python pillow transformers torch
```

### Step 2: Run the Backend API

Save your `main.py` file and run:

```bash
python main.py
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
```

**Keep this terminal open!** The API needs to keep running.

### Step 3: Install Chrome Extension

1. Go to `chrome://extensions/`
2. Turn on **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select your `emotion-detector` folder
5. A purple icon should appear in your toolbar

### Step 4: Use the Extension

1. Open a video call (Google Meet, Teams, Zoom)
2. Click the purple icon
3. Enter API endpoint: `http://127.0.0.1:8000/detect/file`
4. Enter your name
5. Click **Start Detection**
6. Watch emotion popups appear! ✨

---

## 🔧 What's Running Where

| Component | Location | Purpose |
|-----------|----------|---------|
| **Backend API** | `http://127.0.0.1:8000` | Analyzes images, returns emotions |
| **Chrome Extension** | In your browser toolbar | Captures video frames, sends to API, shows popups |

---

## 📊 How It Works

1. **You click "Start Detection"** in the Chrome extension
2. **Extension captures a frame** from your video call every 1.5 seconds
3. **Frame is sent to the API** running on your computer
4. **API analyzes the face** and detects emotion (Happy, Sad, Angry, etc.)
5. **Emotion popup appears** on your screen in real-time
6. **Data is logged** for later export as JSON

---

## 💾 Export Your Data

1. Click **Export Logs** in the extension popup
2. A JSON file downloads with timestamps and emotions
3. Use it for analysis or reporting

Example log:
```json
[
  {
    "timestamp": "2025-01-15T10:30:45.123Z",
    "participant_name": "You",
    "emotion": "HAPPY"
  },
  {
    "timestamp": "2025-01-15T10:30:46.500Z",
    "participant_name": "You",
    "emotion": "NEUTRAL"
  }
]
```

---

## 📋 System Requirements

- **Python 3.8+**
- **Chrome/Chromium browser**
- **4GB RAM** (minimum)
- **Internet connection** (for first-time model download)

---

## 📝 Notes

- Emotions are detected **locally** on your computer (no cloud upload)
- Data is stored in browser storage, exportable as JSON
- Works on Google Meet, Microsoft Teams, Zoom, and any video site
- Keep the API terminal window open while using the extension

---

## 🚀 Next Steps

- **Detect multiple people:** Modify `emotion_capture.py` to detect all faces instead of just the largest one
- **Real-time dashboard:** Build a web dashboard to visualize emotions over time
- **Custom emotions:** Train the model with your own emotion labels
- **Sound notifications:** Add audio alerts when specific emotions are detected
- **Cloud deployment:** Deploy the API to Vercel, AWS, or Heroku for remote use
- **Video recording:** Save video clips with emotion timestamps
