const DEFAULT_API_URL = "http://127.0.0.1:8000/detect/file";

const analyzeBtn = document.getElementById("analyzeBtn");
const statusEl = document.getElementById("status");
const resultEl = document.getElementById("result");
const apiUrlEl = document.getElementById("apiUrl");
const autoModeEl = document.getElementById("autoMode");
const DEFAULT_INTERVAL_MS = 2500;

init();

async function init() {
  const apiUrl = await getApiUrl();
  apiUrlEl.textContent = `API: ${apiUrl}`;
  statusEl.textContent = "";
  resultEl.textContent = "";
  const { autoMode = false } = await chrome.storage.sync.get({ autoMode: false });
  autoModeEl.checked = Boolean(autoMode);
}

analyzeBtn.addEventListener("click", async () => {
  analyzeBtn.disabled = true;
  statusEl.textContent = "Capturing tab and analyzing…";
  resultEl.textContent = "";

  try {
    const response = await sendAnalyzeMessage();
    if (!response?.ok) {
      throw new Error(response?.error || "Unknown error");
    }
    const emotion = response.result?.emotion || "unknown";
    resultEl.textContent = `Emotion: ${emotion}`;
    statusEl.textContent = "Overlay shown in the page (top-left).";
  } catch (e) {
    resultEl.textContent = "";
    statusEl.textContent = `Error: ${String(e.message || e)}`;
  } finally {
    analyzeBtn.disabled = false;
  }
});

autoModeEl.addEventListener("change", async (e) => {
  const enabled = Boolean(e.target.checked);
  await chrome.storage.sync.set({ autoMode: enabled, intervalMs: DEFAULT_INTERVAL_MS });
  statusEl.textContent = enabled ? "Auto analyze enabled." : "Auto analyze disabled.";
  setTimeout(() => (statusEl.textContent = ""), 1200);
});

function sendAnalyzeMessage() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "ANALYZE_CURRENT_TAB" }, (resp) => {
      resolve(resp);
    });
  });
}

async function getApiUrl() {
  try {
    const { apiUrl } = await chrome.storage.sync.get({ apiUrl: DEFAULT_API_URL });
    return apiUrl || DEFAULT_API_URL;
  } catch {
    return DEFAULT_API_URL;
  }
}


