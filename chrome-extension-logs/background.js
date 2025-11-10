// Initialize storage when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    emotionLogs: [],
    apiEndpoint: '',
    participantName: ''
  });
  console.log('🚀 Emotion Detector extension installed!');
});