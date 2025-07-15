// Minimal background service worker for Smart Tab Manager

console.log('Smart Tab Manager background script loaded');

// Initialize storage on install
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
  
  chrome.storage.local.set({
    timeSpent: {},
    lastReset: Date.now(),
    settings: {
      autoCloseEnabled: false,
      autoCloseDelay: 30
    }
  });
});

// Track active tab changes
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  console.log('Tab activated:', activeInfo.tabId);
});

// Track tab updates
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    console.log('Tab updated:', tab.url);
  }
});