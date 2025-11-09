// Content script: renders an overlay in the top-left corner with the emotion text

const OVERLAY_ID = "meeting-emotions-overlay";

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === "SHOW_EMOTION") {
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


