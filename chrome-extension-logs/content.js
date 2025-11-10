// Variables to track detection state
let isDetecting = false;
let captureInterval = null;
let apiEndpoint = '';
let participantName = '';
const emotionLogs = [];

// Listen for messages from popup.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'START_DETECTION') {
    startEmotionDetection(request.apiEndpoint, request.participantName);
    sendResponse({ success: true });
  }
  else if (request.type === 'STOP_DETECTION') {
    stopEmotionDetection();
    sendResponse({ success: true });
  }
});

/**
 * Start capturing frames every 1.5 seconds and detecting emotions
 */
function startEmotionDetection(endpoint, name) {
  if (isDetecting) return;
  
  isDetecting = true;
  apiEndpoint = endpoint;
  participantName = name;
  emotionLogs.length = 0;
  
  console.log('🎬 Starting emotion detection...');
  
  captureInterval = setInterval(() => {
    captureAndAnalyzeFrame();
  }, 1500);
}

/**
 * Stop detecting emotions and save all the logs
 */
function stopEmotionDetection() {
  if (!isDetecting) return;
  
  isDetecting = false;
  clearInterval(captureInterval);
  
  chrome.storage.local.get(['emotionLogs'], (result) => {
    const allLogs = result.emotionLogs || [];
    const updatedLogs = [...allLogs, ...emotionLogs];
    chrome.storage.local.set({ emotionLogs: updatedLogs });
  });
  
  console.log('🛑 Emotion detection stopped. Logs saved.');
}

/**
 * Main process:
 * 1. Capture a frame
 * 2. Send to API
 * 3. Display emotion popup
 * 4. Save to logs
 */
async function captureAndAnalyzeFrame() {
  try {
    const canvas = await captureVisibleTab();
    if (!canvas) return;
    
    canvas.toBlob(async (blob) => {
      const emotion = await sendFrameToAPI(blob);
      if (emotion) {
        displayEmotionPopup(emotion);
        logEmotion(emotion);
      }
    }, 'image/jpeg', 0.8);
  } catch (error) {
    console.error('Error capturing frame:', error);
  }
}

/**
 * Find the video element on the page and capture it as an image
 */
async function captureVisibleTab() {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const videoElements = document.querySelectorAll('video');
    
    if (videoElements.length > 0) {
      ctx.drawImage(videoElements[0], 0, 0, canvas.width, canvas.height);
    }
    
    return canvas;
  } catch (error) {
    console.error('Error in captureVisibleTab:', error);
    return null;
  }
}

/**
 * Send frame to your local API and get emotion prediction
 */
async function sendFrameToAPI(blob) {
  try {
    console.log('📸 Frame captured, sending to API:', apiEndpoint);
    
    const formData = new FormData();
    formData.append('image', blob, 'frame.jpg');
    
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      console.error('API error:', response.status, response.statusText);
      return null;
    }
    
    const data = await response.json();
    console.log('✅ API response:', data);
    
    return data.emotion || data.label || data.result || null;
    
  } catch (error) {
    console.error('❌ Error sending frame to API:', error);
    return null;
  }
}

/**
 * Display emotion popup with glassmorphism design
 */
function displayEmotionPopup(emotion) {
  const popup = document.createElement('div');
  popup.className = 'emotion-popup';
  popup.innerHTML = `
    <div class="emotion-content">
      <strong>${participantName}</strong>
      <p>${emotion}</p>
    </div>
  `;
  
  // Add styles if we haven't already
  if (!document.getElementById('emotion-detector-styles')) {
    const style = document.createElement('style');
    style.id = 'emotion-detector-styles';
    style.textContent = `
      .emotion-popup {
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(255, 255, 255, 0.15);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        color: white;
        padding: 16px 24px;
        border-radius: 20px;
        border: 1px solid rgba(255, 255, 255, 0.25);
        box-shadow: 
          0 8px 32px rgba(31, 38, 135, 0.37),
          inset 0 1px 1px rgba(255, 255, 255, 0.3);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        z-index: 10000;
        animation: slideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        pointer-events: none;
        min-width: 200px;
      }
      
      .emotion-content {
        display: flex;
        flex-direction: column;
        gap: 8px;
        align-items: center;
        text-align: center;
      }
      
      .emotion-content strong {
        font-size: 12px;
        opacity: 0.85;
        letter-spacing: 0.5px;
        text-transform: uppercase;
      }
      
      .emotion-content p {
        margin: 0;
        font-size: 32px;
        font-weight: 600;
      }
      
      @keyframes slideIn {
        from {
          transform: translateX(400px) rotateY(45deg);
          opacity: 0;
        }
        to {
          transform: translateX(0) rotateY(0);
          opacity: 1;
        }
      }
      
      @keyframes slideOut {
        from {
          transform: translateX(0) rotateY(0);
          opacity: 1;
        }
        to {
          transform: translateX(400px) rotateY(-45deg);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }
  
  document.body.appendChild(popup);
  
  setTimeout(() => {
    popup.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => popup.remove(), 300);
  }, 3000);
}

/**
 * Save emotion data with timestamp to logs
 */
function logEmotion(emotion) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    participant_name: participantName,
    emotion: emotion
  };
  
  emotionLogs.push(logEntry);
  console.log('📊 Emotion logged:', logEntry);
}