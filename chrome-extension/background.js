// Background service worker (MV3)
// Orchestrates capture of the visible tab and calls the local API.

const DEFAULT_API_URL = "http://127.0.0.1:8000/detect/file";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "ANALYZE_CURRENT_TAB") {
    handleAnalyzeCurrentTab().then(
      (result) => sendResponse({ ok: true, result }),
      (error) => sendResponse({ ok: false, error: String(error) })
    );
    // Keep the message channel open for async response
    return true;
  }
});

async function handleAnalyzeCurrentTab() {
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!activeTab || !activeTab.id) {
    throw new Error("No active tab found.");
  }

  // Capture current visible tab as PNG data URL
  const dataUrl = await new Promise((resolve, reject) => {
    chrome.tabs.captureVisibleTab(
      activeTab.windowId,
      { format: "png" },
      (data) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError.message || "captureVisibleTab failed");
          return;
        }
        resolve(data);
      }
    );
  });

  const blob = dataUrlToBlob(dataUrl);
  const form = new FormData();
  form.append("image", blob, "screenshot.png");

  const apiUrl = await getApiUrl();

  const response = await fetch(apiUrl, {
    method: "POST",
    body: form
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`API error (${response.status}): ${text || "Unknown error"}`);
  }

  const json = await response.json();
  const emotion = json?.emotion || "unknown";

  // Send to content script to overlay
  await chrome.tabs.sendMessage(activeTab.id, { type: "SHOW_EMOTION", emotion });
  return { emotion };
}

function dataUrlToBlob(dataUrl) {
  const [header, base64] = dataUrl.split(",");
  const mimeMatch = header.match(/data:(.*?);base64/);
  const mime = mimeMatch ? mimeMatch[1] : "image/png";
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

async function getApiUrl() {
  try {
    const { apiUrl } = await chrome.storage.sync.get({ apiUrl: DEFAULT_API_URL });
    return apiUrl || DEFAULT_API_URL;
  } catch {
    return DEFAULT_API_URL;
  }
}


