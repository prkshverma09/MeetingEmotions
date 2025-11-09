const DEFAULT_API_URL = "http://127.0.0.1:8000/detect/file";

const apiUrlInput = document.getElementById("apiUrl");
const saveBtn = document.getElementById("saveBtn");
const statusEl = document.getElementById("status");

init();

async function init() {
  const apiUrl = await getApiUrl();
  apiUrlInput.value = apiUrl;
  statusEl.textContent = "";
}

saveBtn.addEventListener("click", async () => {
  const value = apiUrlInput.value.trim();
  await setApiUrl(value || DEFAULT_API_URL);
  statusEl.textContent = "Saved.";
  setTimeout(() => (statusEl.textContent = ""), 1500);
});

async function getApiUrl() {
  try {
    const { apiUrl } = await chrome.storage.sync.get({ apiUrl: DEFAULT_API_URL });
    return apiUrl || DEFAULT_API_URL;
  } catch {
    return DEFAULT_API_URL;
  }
}

async function setApiUrl(url) {
  try {
    await chrome.storage.sync.set({ apiUrl: url });
  } catch (e) {
    console.error("Failed to save API URL", e);
  }
}


