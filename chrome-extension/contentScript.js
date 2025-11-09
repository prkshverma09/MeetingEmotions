// Content script: renders an overlay in the top-left corner with the emotion text
// Also runs an optional auto-analyze loop based on stored settings.

const OVERLAY_ID = "meeting-emotions-overlay";
const DEFAULT_INTERVAL_MS = 2500;
let autoTimerId = null;

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === "SHOW_EMOTION") {
    const value = String(message.emotion || "").toLowerCase();
    if (value === "fear" || value === "neutral") {
      removeOverlay();
      return;
    }
    renderOverlay(message.emotion || "unknown");
  }
});

function renderOverlay(text) {
  let root = document.getElementById(OVERLAY_ID);
  if (!root) {
    root = document.createElement("div");
    root.id = OVERLAY_ID;
    Object.assign(root.style, {
      position: "fixed",
      top: "8px",
      left: "8px",
      zIndex: "2147483647",
      background: "rgba(0, 0, 0, 0.7)",
      color: "white",
      padding: "8px 12px",
      borderRadius: "6px",
      fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
      fontSize: "14px",
      lineHeight: "1.2",
      boxShadow: "0 2px 10px rgba(0,0,0,.3)",
      pointerEvents: "none"
    });
    document.documentElement.appendChild(root);
  }
  root.textContent = `Emotion: ${text}`;
}

function removeOverlay() {
  const root = document.getElementById(OVERLAY_ID);
  if (root && root.parentNode) {
    root.parentNode.removeChild(root);
  }
}

// Auto analyze logic
initAutoMode();
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "sync") return;
  if ("autoMode" in changes || "intervalMs" in changes) {
    initAutoMode();
  }
});

async function initAutoMode() {
  const { autoMode = false, intervalMs = DEFAULT_INTERVAL_MS } = await chrome.storage.sync.get({
    autoMode: false,
    intervalMs: DEFAULT_INTERVAL_MS
  });
  if (autoMode) {
    startAuto(intervalMs);
  } else {
    stopAuto();
  }
}

function startAuto(ms) {
  stopAuto();
  autoTimerId = setInterval(() => {
    chrome.runtime.sendMessage({ type: "ANALYZE_CURRENT_TAB" }, () => {
      // ignore errors; background will manage capture/API and may fail on restricted pages
    });
  }, Math.max(500, Number(ms) || DEFAULT_INTERVAL_MS));
}

function stopAuto() {
  if (autoTimerId) {
    clearInterval(autoTimerId);
    autoTimerId = null;
  }
}


