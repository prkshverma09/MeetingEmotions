// When user clicks "Start Detection" button
document.getElementById('startBtn').addEventListener('click', () => {
  const apiEndpoint = document.getElementById('apiEndpoint').value;
  const participantName = document.getElementById('participantName').value || 'You';
  
  if (!apiEndpoint) {
    alert('Please enter the API endpoint');
    return;
  }
  
  chrome.storage.local.set({
    apiEndpoint: apiEndpoint,
    participantName: participantName
  });
  
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {
      type: 'START_DETECTION',
      apiEndpoint: apiEndpoint,
      participantName: participantName
    });
    updateStatus('active', 'Detection started...');
  });
});

// When user clicks "Stop" button
document.getElementById('stopBtn').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { type: 'STOP_DETECTION' });
    updateStatus('inactive', 'Detection stopped');
  });
});

// When user clicks "Export Logs" button
document.getElementById('exportBtn').addEventListener('click', () => {
  chrome.storage.local.get(['emotionLogs'], (result) => {
    const logs = result.emotionLogs || [];
    const dataStr = JSON.stringify(logs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `emotion-logs-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
  });
});

function updateStatus(state, message) {
  const statusEl = document.getElementById('status');
  statusEl.textContent = message;
  statusEl.className = state === 'active' ? 'status active' : 'status';
}

window.addEventListener('load', () => {
  chrome.storage.local.get(['apiEndpoint', 'participantName'], (result) => {
    if (result.apiEndpoint) {
      document.getElementById('apiEndpoint').value = result.apiEndpoint;
    }
    if (result.participantName) {
      document.getElementById('participantName').value = result.participantName;
    }
  });
});