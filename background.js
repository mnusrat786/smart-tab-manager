// Advanced background service worker for Smart Tab Manager with analytics

console.log('Smart Tab Manager background script loaded');

let activeTabId = null;
let tabStartTime = {};

// Initialize storage on install
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');

  chrome.storage.local.set({
    tabAnalytics: {},
    tabLastAccessed: {},
    weeklyStats: {},
    customRules: { priority: [], timesink: [], research: [], zombie: [] },
    learnedPatterns: { priority: [], timesink: [], research: [], zombie: [] },
    userPreferences: {
      useWorkHours: true,
      treatShoppingAsUseless: true,
      autoCloseZombies: false,
      autoArchiveResearch: false
    },
    archivedTabs: [],
    settings: {
      autoCloseEnabled: false,
      autoCloseDelay: 30,
      zombieThresholdDays: 7
    }
  });

  // Set up weekly cleanup automation
  setupAutomationAlarms();
});

// Advanced tab tracking with behavioral analytics
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const tabId = activeInfo.tabId;

  // Record time spent on previous tab
  if (activeTabId && tabStartTime[activeTabId]) {
    await recordTabTime(activeTabId, Date.now() - tabStartTime[activeTabId]);
  }

  // Start tracking new active tab
  activeTabId = tabId;
  tabStartTime[tabId] = Date.now();

  // Update last accessed time
  const storage = await chrome.storage.local.get(['tabLastAccessed']);
  const tabLastAccessed = storage.tabLastAccessed || {};
  tabLastAccessed[tabId] = Date.now();
  await chrome.storage.local.set({ tabLastAccessed });

  console.log('Tab activated:', tabId);
});

// Track tab updates and analyze content
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    console.log('Tab updated:', tab.url);

    // Update analytics
    await updateTabAnalytics(tabId, tab.url, tab.title);

    // Check for automation triggers
    await checkAutomationTriggers(tab);
  }
});

// Track tab closure
chrome.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
  // Record final time spent
  if (tabStartTime[tabId]) {
    await recordTabTime(tabId, Date.now() - tabStartTime[tabId]);
    delete tabStartTime[tabId];
  }

  // Clean up analytics for closed tab
  const storage = await chrome.storage.local.get(['tabAnalytics', 'tabLastAccessed']);
  const tabAnalytics = storage.tabAnalytics || {};
  const tabLastAccessed = storage.tabLastAccessed || {};

  delete tabAnalytics[tabId];
  delete tabLastAccessed[tabId];

  await chrome.storage.local.set({ tabAnalytics, tabLastAccessed });
});

// Record time spent on tabs for behavioral analysis
async function recordTabTime(tabId, timeSpent) {
  const storage = await chrome.storage.local.get(['tabAnalytics']);
  const tabAnalytics = storage.tabAnalytics || {};

  if (!tabAnalytics[tabId]) {
    tabAnalytics[tabId] = {
      activeTime: 0,
      visitCount: 0,
      lastVisit: Date.now()
    };
  }

  tabAnalytics[tabId].activeTime += timeSpent;
  tabAnalytics[tabId].lastVisit = Date.now();

  await chrome.storage.local.set({ tabAnalytics });
}

// Update comprehensive tab analytics
async function updateTabAnalytics(tabId, url, title) {
  const storage = await chrome.storage.local.get(['tabAnalytics']);
  const tabAnalytics = storage.tabAnalytics || {};

  if (!tabAnalytics[tabId]) {
    tabAnalytics[tabId] = {
      url: url,
      title: title,
      activeTime: 0,
      visitCount: 0,
      firstVisit: Date.now(),
      lastVisit: Date.now(),
      domain: new URL(url).hostname.replace('www.', '')
    };
  }

  tabAnalytics[tabId].visitCount += 1;
  tabAnalytics[tabId].lastVisit = Date.now();
  tabAnalytics[tabId].url = url;
  tabAnalytics[tabId].title = title;

  await chrome.storage.local.set({ tabAnalytics });
}

// Check for automation triggers
async function checkAutomationTriggers(tab) {
  const storage = await chrome.storage.local.get(['userPreferences', 'tabLastAccessed']);
  const userPrefs = storage.userPreferences || {};
  const tabLastAccessed = storage.tabLastAccessed || {};

  // Auto-close zombie tabs if enabled
  if (userPrefs.autoCloseZombies) {
    const lastAccessed = tabLastAccessed[tab.id] || Date.now();
    const daysSinceAccess = (Date.now() - lastAccessed) / (1000 * 60 * 60 * 24);

    if (daysSinceAccess > 7) {
      console.log('Auto-closing zombie tab:', tab.title);
      chrome.tabs.remove(tab.id);
    }
  }
}

// Setup automation alarms for periodic cleanup
function setupAutomationAlarms() {
  // Weekly zombie cleanup (Fridays at 5 PM)
  chrome.alarms.create('weeklyZombieCleanup', {
    when: getNextFriday5PM(),
    periodInMinutes: 7 * 24 * 60 // Weekly
  });

  // Daily analytics update
  chrome.alarms.create('dailyAnalyticsUpdate', {
    delayInMinutes: 1,
    periodInMinutes: 24 * 60 // Daily
  });
}

// Handle automation alarms
chrome.alarms.onAlarm.addListener(async (alarm) => {
  console.log('Alarm triggered:', alarm.name);

  switch (alarm.name) {
    case 'weeklyZombieCleanup':
      await performWeeklyZombieCleanup();
      break;
    case 'dailyAnalyticsUpdate':
      await updateWeeklyStats();
      break;
  }
});

// Automated weekly zombie cleanup
async function performWeeklyZombieCleanup() {
  const storage = await chrome.storage.local.get(['userPreferences', 'tabLastAccessed']);
  const userPrefs = storage.userPreferences || {};

  if (!userPrefs.autoCloseZombies) return;

  const tabs = await chrome.tabs.query({});
  const tabLastAccessed = storage.tabLastAccessed || {};
  const zombieTabIds = [];

  tabs.forEach(tab => {
    const lastAccessed = tabLastAccessed[tab.id] || Date.now();
    const daysSinceAccess = (Date.now() - lastAccessed) / (1000 * 60 * 60 * 24);

    if (daysSinceAccess > 7) {
      zombieTabIds.push(tab.id);
    }
  });

  if (zombieTabIds.length > 0) {
    await chrome.tabs.remove(zombieTabIds);
    console.log(`Auto-closed ${zombieTabIds.length} zombie tabs`);

    // Show notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon.png',
      title: 'Smart Tab Manager',
      message: `🧟‍♂️ Auto-closed ${zombieTabIds.length} zombie tabs! Your browser is cleaner.`
    });
  }
}

// Update weekly statistics
async function updateWeeklyStats() {
  const storage = await chrome.storage.local.get(['tabAnalytics', 'weeklyStats']);
  const tabAnalytics = storage.tabAnalytics || {};
  const weeklyStats = storage.weeklyStats || {};

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());

  // Calculate weekly time spent by category
  const weeklyTimeSpent = {
    priority: 0,
    timesink: 0,
    research: 0,
    zombie: 0
  };

  Object.values(tabAnalytics).forEach(analytics => {
    if (analytics.lastVisit > weekStart.getTime()) {
      // This would need categorization logic, simplified for now
      weeklyTimeSpent.timesink += analytics.activeTime || 0;
    }
  });

  weeklyStats[weekStart.toISOString().split('T')[0]] = weeklyTimeSpent;

  await chrome.storage.local.set({ weeklyStats });
}

// Helper function to get next Friday 5 PM
function getNextFriday5PM() {
  const now = new Date();
  const friday = new Date();
  friday.setDate(now.getDate() + (5 - now.getDay() + 7) % 7);
  friday.setHours(17, 0, 0, 0);

  if (friday <= now) {
    friday.setDate(friday.getDate() + 7);
  }

  return friday.getTime();
}

// Handle messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Message received:', message);

  switch (message.type) {
    case 'GET_TAB_ANALYTICS':
      chrome.storage.local.get(['tabAnalytics']).then(sendResponse);
      return true;
    case 'TRIGGER_ZOMBIE_CLEANUP':
      performWeeklyZombieCleanup().then(() => sendResponse({ success: true }));
      return true;
  }
});