// Advanced tab categorization with intelligent auto-tagging
async function categorizeTab(url, title, tab) {
    try {
        const domain = new URL(url).hostname.replace('www.', '');
        
        // Get storage data including tab analytics
        const storage = await chrome.storage.local.get([
            'customRules', 'learnedPatterns', 'userPreferences', 
            'tabAnalytics', 'tabLastAccessed'
        ]);
        
        const customRules = storage.customRules || { priority: [], timesink: [], research: [], zombie: [] };
        const learnedPatterns = storage.learnedPatterns || { priority: [], timesink: [], research: [], zombie: [] };
        const userPrefs = storage.userPreferences || {};
        const tabAnalytics = storage.tabAnalytics || {};
        const tabLastAccessed = storage.tabLastAccessed || {};
        
        // 1. Check for zombie tabs (unused for >7 days)
        const lastAccessed = tabLastAccessed[tab.id] || Date.now();
        const daysSinceAccess = (Date.now() - lastAccessed) / (1000 * 60 * 60 * 24);
        if (daysSinceAccess > 7) {
            return 'zombie';
        }
        
        // 2. Check user's custom rules first (highest priority)
        for (const [category, domains] of Object.entries(customRules)) {
            if (domains.some(d => domain.includes(d))) {
                return category;
            }
        }
        
        // 3. Check learned patterns from user behavior
        for (const [category, patterns] of Object.entries(learnedPatterns)) {
            if (patterns.some(pattern => domain.includes(pattern) || title.toLowerCase().includes(pattern))) {
                return category;
            }
        }
        
        // 4. Advanced intelligent categorization
        const category = await intelligentCategorize(domain, title, url, tab, tabAnalytics[tab.id]);
        if (category !== 'unknown') {
            return category;
        }
        
        // 5. Fallback to basic heuristics
        return basicCategorize(domain, title);
        
    } catch (e) {
        console.log('Error categorizing tab:', e);
        return 'unknown';
    }
}

// Advanced intelligent categorization with behavioral analysis
async function intelligentCategorize(domain, title, url, tab, analytics) {
    const text = (title + ' ' + domain).toLowerCase();
    
    // Time-based intelligence
    const now = new Date();
    const isWorkHours = now.getHours() >= 9 && now.getHours() <= 17;
    const isWeekday = now.getDay() >= 1 && now.getDay() <= 5;
    
    // 🔥 Priority indicators (work/productivity)
    const priorityDomains = [
        'gmail.com', 'github.com', 'docs.google.com', 'notion.so', 'slack.com',
        'trello.com', 'asana.com', 'jira.atlassian.com', 'confluence.atlassian.com',
        'stackoverflow.com', 'developer.mozilla.org', 'aws.amazon.com'
    ];
    
    const priorityKeywords = [
        'documentation', 'docs', 'api', 'tutorial', 'guide', 'learn', 'course',
        'admin', 'dashboard', 'analytics', 'report', 'meeting', 'calendar', 'email',
        'work', 'project', 'task', 'deadline', 'urgent', 'important'
    ];
    
    // ⏰ Time-sink indicators (entertainment/social)
    const timesinkDomains = [
        'youtube.com', 'netflix.com', 'reddit.com', 'twitter.com', 'x.com',
        'facebook.com', 'instagram.com', 'tiktok.com', 'twitch.tv', 'discord.com',
        'pinterest.com', 'linkedin.com'
    ];
    
    const timesinkKeywords = [
        'video', 'watch', 'stream', 'funny', 'meme', 'entertainment', 'social',
        'game', 'gaming', 'music', 'podcast', 'celebrity', 'gossip', 'viral'
    ];
    
    // 📥 Research/Read-later indicators
    const researchKeywords = [
        'article', 'blog', 'news', 'research', 'study', 'paper', 'pdf',
        'how to', 'tutorial', 'guide', 'tips', 'best practices', 'review'
    ];
    
    const researchDomains = [
        'medium.com', 'dev.to', 'hackernoon.com', 'techcrunch.com', 'wired.com',
        'arstechnica.com', 'theverge.com', 'wikipedia.org', 'arxiv.org'
    ];
    
    // Calculate scores
    let priorityScore = 0;
    let timesinkScore = 0;
    let researchScore = 0;
    
    // Domain-based scoring
    if (priorityDomains.some(d => domain.includes(d))) priorityScore += 3;
    if (timesinkDomains.some(d => domain.includes(d))) timesinkScore += 3;
    if (researchDomains.some(d => domain.includes(d))) researchScore += 2;
    
    // Keyword-based scoring
    priorityScore += priorityKeywords.reduce((score, keyword) => 
        score + (text.includes(keyword) ? 1 : 0), 0);
    timesinkScore += timesinkKeywords.reduce((score, keyword) => 
        score + (text.includes(keyword) ? 1 : 0), 0);
    researchScore += researchKeywords.reduce((score, keyword) => 
        score + (text.includes(keyword) ? 1 : 0), 0);
    
    // Time-based adjustments
    if (isWorkHours && isWeekday) {
        priorityScore *= 1.5;
        timesinkScore *= 0.6;
    } else {
        timesinkScore *= 1.3;
        researchScore *= 1.2;
    }
    
    // Behavioral analysis (if analytics available)
    if (analytics) {
        const activeTime = analytics.activeTime || 0;
        const visitCount = analytics.visitCount || 0;
        
        // Long active time on entertainment = time-sink
        if (activeTime > 600000 && timesinkScore > 0) { // 10+ minutes
            timesinkScore += 2;
        }
        
        // Frequent visits to work sites = priority
        if (visitCount > 5 && priorityScore > 0) {
            priorityScore += 1;
        }
    }
    
    // Decision logic with thresholds
    if (priorityScore >= 3) return 'priority';
    if (timesinkScore >= 3) return 'timesink';
    if (researchScore >= 2) return 'research';
    
    return 'unknown';
}

function basicCategorize(domain, title) {
    // Fallback hardcoded rules for new categories
    const timesinkDomains = ['youtube.com', 'facebook.com', 'instagram.com', 'twitter.com', 'x.com', 'tiktok.com'];
    const priorityDomains = ['github.com', 'stackoverflow.com', 'docs.google.com', 'gmail.com'];
    const researchDomains = ['wikipedia.org', 'medium.com', 'dev.to'];
    
    if (timesinkDomains.some(d => domain.includes(d))) return 'timesink';
    if (priorityDomains.some(d => domain.includes(d))) return 'priority';
    if (researchDomains.some(d => domain.includes(d))) return 'research';
    
    return 'unknown';
}

async function loadTabs() {
    try {
        const tabs = await chrome.tabs.query({});
        const categorized = {
            priority: [],
            timesink: [],
            research: [],
            zombie: [],
            unknown: []
        };

        // Update tab last accessed times
        const storage = await chrome.storage.local.get(['tabLastAccessed']);
        const tabLastAccessed = storage.tabLastAccessed || {};
        
        // Process tabs sequentially to handle async categorization
        for (const tab of tabs) {
            // Update last accessed time for active tab
            if (tab.active) {
                tabLastAccessed[tab.id] = Date.now();
            }
            
            const category = await categorizeTab(tab.url, tab.title, tab);
            categorized[category].push(tab);
        }

        // Save updated access times
        await chrome.storage.local.set({ tabLastAccessed });

        return categorized;
    } catch (e) {
        console.log('Error loading tabs:', e);
        return { priority: [], timesink: [], research: [], zombie: [], unknown: [] };
    }
}

// Advanced Analytics Dashboard with behavioral insights
async function displayStats() {
    const tabs = await loadTabs();
    const totalTabs = Object.values(tabs).flat().length;
    const priorityCount = tabs.priority.length;
    const timesinkCount = tabs.timesink.length;
    const researchCount = tabs.research.length;
    const zombieCount = tabs.zombie.length;
    const unknownCount = tabs.unknown.length;

    // Get analytics data
    const storage = await chrome.storage.local.get(['tabAnalytics', 'tabLastAccessed', 'weeklyStats']);
    const tabAnalytics = storage.tabAnalytics || {};
    const tabLastAccessed = storage.tabLastAccessed || {};
    const weeklyStats = storage.weeklyStats || {};

    // Calculate oldest tab
    let oldestTab = null;
    let oldestDays = 0;
    Object.entries(tabLastAccessed).forEach(([tabId, timestamp]) => {
        const days = (Date.now() - timestamp) / (1000 * 60 * 60 * 24);
        if (days > oldestDays) {
            oldestDays = days;
            const tab = Object.values(tabs).flat().find(t => t.id == tabId);
            if (tab) oldestTab = tab;
        }
    });

    // Calculate total time wasted this week
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const timeWasted = Object.values(tabAnalytics)
        .filter(analytics => analytics.lastVisit > weekStart.getTime())
        .reduce((total, analytics) => total + (analytics.activeTime || 0), 0);

    const statsDiv = document.getElementById('statsContent');
    statsDiv.innerHTML = '';
    
    // Real-time stats with humor
    const statsMessages = [
        `📊 Total tabs: ${totalTabs} ${totalTabs > 50 ? '(Chrome is crying 😭)' : totalTabs > 20 ? '(Getting heavy 😅)' : '(Manageable! 👍)'}`,
        `🔥 Priority: ${priorityCount} | ⏰ Time-sinks: ${timesinkCount} | 📥 Research: ${researchCount}`,
        `🗑️ Zombie tabs: ${zombieCount} ${zombieCount > 0 ? '(Ancient relics!)' : ''}`,
        oldestTab ? `👴 Oldest tab: "${oldestTab.title.substring(0, 30)}..." (${Math.floor(oldestDays)} days old)` : '',
        timeWasted > 0 ? `⏱️ Time wasted this week: ${Math.floor(timeWasted / 60000)} minutes` : ''
    ].filter(msg => msg);

    statsMessages.forEach(message => {
        const p = document.createElement('p');
        p.textContent = message;
        p.style.margin = '5px 0';
        p.style.fontSize = '11px';
        statsDiv.appendChild(p);
    });

    // Add visual chart
    const chartDiv = document.createElement('div');
    chartDiv.className = 'analytics-chart';
    chartDiv.innerHTML = '<strong>Tab Distribution:</strong>';
    
    const categories = [
        { name: '🔥 Priority', count: priorityCount, color: '#4CAF50' },
        { name: '⏰ Time-sinks', count: timesinkCount, color: '#FF5722' },
        { name: '📥 Research', count: researchCount, color: '#2196F3' },
        { name: '🗑️ Zombies', count: zombieCount, color: '#9C27B0' }
    ];

    categories.forEach(cat => {
        if (cat.count > 0) {
            const bar = document.createElement('div');
            bar.className = 'chart-bar';
            bar.style.background = cat.color;
            bar.style.width = `${(cat.count / totalTabs) * 100}%`;
            
            const label = document.createElement('div');
            label.className = 'chart-label';
            label.textContent = `${cat.name} (${cat.count})`;
            
            bar.appendChild(label);
            chartDiv.appendChild(bar);
        }
    });
    
    statsDiv.appendChild(chartDiv);

    // Display behavioral nudges
    displayBehavioralNudges(tabs, tabAnalytics);
}

// Behavioral Nudges - Passive-aggressive alerts with humor
async function displayBehavioralNudges(tabs, tabAnalytics) {
    const nudgesDiv = document.getElementById('behavioralNudges');
    nudgesDiv.innerHTML = '';
    
    const nudges = [];
    
    // Count social media reopens
    const socialSites = ['facebook.com', 'twitter.com', 'x.com', 'instagram.com', 'reddit.com'];
    const socialTabs = tabs.timesink.filter(tab => 
        socialSites.some(site => tab.url.includes(site))
    );
    
    if (socialTabs.length >= 3) {
        nudges.push(`🤦‍♂️ You have ${socialTabs.length} social media tabs open. Productivity has left the chat.`);
    }
    
    // YouTube addiction check
    const youtubeTabs = tabs.timesink.filter(tab => tab.url.includes('youtube.com'));
    if (youtubeTabs.length >= 5) {
        nudges.push(`📺 ${youtubeTabs.length} YouTube tabs? That's a whole Netflix series worth of procrastination!`);
    }
    
    // Zombie tab shame
    if (tabs.zombie.length > 0) {
        nudges.push(`🧟‍♂️ ${tabs.zombie.length} zombie tabs detected. These tabs are so old, they remember Internet Explorer.`);
    }
    
    // Memory usage warning
    const totalTabs = Object.values(tabs).flat().length;
    if (totalTabs > 30) {
        nudges.push(`💾 ${totalTabs} tabs are eating your RAM like it's a buffet. Your computer is crying.`);
    }
    
    // Research tab hoarding
    if (tabs.research.length > 10) {
        nudges.push(`📚 ${tabs.research.length} research tabs? Either you're writing a PhD thesis or you're a professional procrastinator.`);
    }
    
    // Display nudges
    if (nudges.length > 0) {
        nudges.forEach(nudge => {
            const div = document.createElement('div');
            div.className = 'nudge-item';
            div.textContent = nudge;
            nudgesDiv.appendChild(div);
        });
    }
}

// Display tabs in new 4-category system with training buttons
async function displayTabs() {
    const tabs = await loadTabs();

    // Helper function to create tab display
    function createTabDisplay(tab, category, containerDiv) {
        const div = document.createElement('div');
        div.className = 'tab-item';
        
        const text = document.createElement('span');
        text.textContent = tab.title.substring(0, 35) + '...';
        text.title = tab.title; // Show full title on hover
        
        // Add category training buttons
        const categories = [
            { name: 'priority', emoji: '🔥', label: 'Priority' },
            { name: 'timesink', emoji: '⏰', label: 'Time-sink' },
            { name: 'research', emoji: '📥', label: 'Research' },
            { name: 'zombie', emoji: '🗑️', label: 'Zombie' }
        ];
        
        categories.forEach(cat => {
            if (cat.name !== category) { // Don't show current category button
                const button = document.createElement('button');
                button.className = 'category-btn';
                button.textContent = cat.emoji;
                button.title = `Mark as ${cat.label}`;
                button.addEventListener('click', () => trainTab(tab.url, tab.title, cat.name));
                div.appendChild(button);
            }
        });
        
        div.appendChild(text);
        containerDiv.appendChild(div);
    }

    // Display Priority tabs
    const priorityDiv = document.getElementById('priorityTabs');
    priorityDiv.innerHTML = '';
    if (tabs.priority.length === 0) {
        priorityDiv.innerHTML = '<div class="tab-item">No priority tabs found 🤔</div>';
    } else {
        tabs.priority.forEach(tab => createTabDisplay(tab, 'priority', priorityDiv));
    }

    // Display Time-sink tabs
    const timesinkDiv = document.getElementById('timesinkTabs');
    timesinkDiv.innerHTML = '';
    if (tabs.timesink.length === 0) {
        timesinkDiv.innerHTML = '<div class="tab-item">No time-sinks detected! 🎉</div>';
    } else {
        tabs.timesink.forEach(tab => createTabDisplay(tab, 'timesink', timesinkDiv));
    }

    // Display Research tabs
    const researchDiv = document.getElementById('researchTabs');
    researchDiv.innerHTML = '';
    if (tabs.research.length === 0) {
        researchDiv.innerHTML = '<div class="tab-item">No research tabs found 📚</div>';
    } else {
        tabs.research.forEach(tab => createTabDisplay(tab, 'research', researchDiv));
    }

    // Display Zombie tabs
    const zombieDiv = document.getElementById('zombieTabs');
    zombieDiv.innerHTML = '';
    if (tabs.zombie.length === 0) {
        zombieDiv.innerHTML = '<div class="tab-item">No zombie tabs! Fresh browsing! 🧟‍♂️</div>';
    } else {
        tabs.zombie.forEach(tab => createTabDisplay(tab, 'zombie', zombieDiv));
    }

    // Display Unknown tabs
    const unknownDiv = document.getElementById('unknownTabs');
    unknownDiv.innerHTML = '';
    if (tabs.unknown.length === 0) {
        unknownDiv.innerHTML = '<div class="tab-item">All tabs categorized! 🎯</div>';
    } else {
        tabs.unknown.forEach(tab => createTabDisplay(tab, 'unknown', unknownDiv));
    }
}

// Training function for user feedback - Updated for 4-category system
async function trainTab(url, title, newCategory) {
    try {
        const domain = new URL(url).hostname.replace('www.', '');
        
        // Learn from this user action
        await learnFromUserAction(domain, title, newCategory);
        
        // Also add to custom rules for this domain
        const storage = await chrome.storage.local.get(['customRules']);
        const customRules = storage.customRules || { priority: [], timesink: [], research: [], zombie: [] };
        
        const domainPattern = domain.split('.').slice(-2).join('.');
        
        // Remove from all other categories
        const allCategories = ['priority', 'timesink', 'research', 'zombie'];
        allCategories.forEach(category => {
            if (category !== newCategory) {
                customRules[category] = customRules[category].filter(d => d !== domainPattern);
            }
        });
        
        // Add to new category
        if (!customRules[newCategory].includes(domainPattern)) {
            customRules[newCategory].push(domainPattern);
        }
        
        await chrome.storage.local.set({ customRules });
        
        // Refresh the display
        displayTabs();
        displayStats();
        
        // Show feedback
        showTrainingFeedback(domainPattern, newCategory);
        
    } catch (e) {
        console.log('Error training tab:', e);
    }
}

// Function to learn from user behavior - Updated for 4-category system
async function learnFromUserAction(domain, title, category) {
    const storage = await chrome.storage.local.get(['learnedPatterns']);
    const learnedPatterns = storage.learnedPatterns || { priority: [], timesink: [], research: [], zombie: [] };
    
    // Extract meaningful patterns
    const domainPattern = domain.split('.').slice(-2).join('.'); // Get main domain
    const titleWords = title.toLowerCase().split(' ').filter(word => word.length > 3);
    
    // Initialize category if it doesn't exist
    if (!learnedPatterns[category]) {
        learnedPatterns[category] = [];
    }
    
    // Add domain pattern
    if (!learnedPatterns[category].includes(domainPattern)) {
        learnedPatterns[category].push(domainPattern);
    }
    
    // Add significant title words
    titleWords.slice(0, 3).forEach(word => {
        if (!learnedPatterns[category].includes(word)) {
            learnedPatterns[category].push(word);
        }
    });
    
    // Keep only recent patterns (max 50 per category)
    learnedPatterns[category] = learnedPatterns[category].slice(-50);
    
    await chrome.storage.local.set({ learnedPatterns });
}

function showTrainingFeedback(domain, category) {
    const message = `✅ Learned! ${domain} is now ${category}`;
    const feedback = document.createElement('div');
    feedback.style.position = 'fixed';
    feedback.style.top = '10px';
    feedback.style.right = '10px';
    feedback.style.background = '#4CAF50';
    feedback.style.color = 'white';
    feedback.style.padding = '10px';
    feedback.style.borderRadius = '4px';
    feedback.style.fontSize = '12px';
    feedback.style.zIndex = '1000';
    feedback.textContent = message;
    document.body.appendChild(feedback);
    
    setTimeout(() => feedback.remove(), 3000);
}

// Automation Functions - Smart Actions
async function closeTimesinkTabs() {
    const tabs = await loadTabs();
    const tabIds = tabs.timesink.map(tab => tab.id);
    
    if (tabIds.length > 0) {
        await chrome.tabs.remove(tabIds);
        showActionFeedback(`🎯 Closed ${tabIds.length} time-sink tabs! Focus restored.`);
        displayTabs();
        displayStats();
    }
}

async function closeZombieTabs() {
    const tabs = await loadTabs();
    const tabIds = tabs.zombie.map(tab => tab.id);
    
    if (tabIds.length > 0) {
        await chrome.tabs.remove(tabIds);
        showActionFeedback(`🧟‍♂️ Eliminated ${tabIds.length} zombie tabs! Your browser feels lighter.`);
        displayTabs();
        displayStats();
    }
}

async function archiveResearchTabs() {
    const tabs = await loadTabs();
    const researchTabs = tabs.research;
    
    if (researchTabs.length > 0) {
        // Store URLs for later (could integrate with Pocket/Raindrop.io)
        const storage = await chrome.storage.local.get(['archivedTabs']);
        const archivedTabs = storage.archivedTabs || [];
        
        researchTabs.forEach(tab => {
            archivedTabs.push({
                url: tab.url,
                title: tab.title,
                archivedAt: Date.now()
            });
        });
        
        await chrome.storage.local.set({ archivedTabs });
        
        // Close the tabs
        const tabIds = researchTabs.map(tab => tab.id);
        await chrome.tabs.remove(tabIds);
        
        showActionFeedback(`📥 Archived ${tabIds.length} research tabs! Check settings to view archived items.`);
        displayTabs();
        displayStats();
    }
}

function showActionFeedback(message) {
    const feedback = document.createElement('div');
    feedback.style.position = 'fixed';
    feedback.style.top = '10px';
    feedback.style.right = '10px';
    feedback.style.background = '#2196F3';
    feedback.style.color = 'white';
    feedback.style.padding = '10px';
    feedback.style.borderRadius = '4px';
    feedback.style.fontSize = '12px';
    feedback.style.zIndex = '1000';
    feedback.style.maxWidth = '250px';
    feedback.textContent = message;
    document.body.appendChild(feedback);
    
    setTimeout(() => feedback.remove(), 4000);
}

// Event Handlers - Updated for new 4-category system
document.addEventListener('DOMContentLoaded', () => {
    displayStats();
    displayTabs();
    loadSettings();
    
    // New category-specific action buttons
    document.getElementById('closeTimesinks').addEventListener('click', closeTimesinkTabs);
    document.getElementById('closeZombies').addEventListener('click', closeZombieTabs);
    document.getElementById('archiveResearch').addEventListener('click', archiveResearchTabs);
    
    // Settings panel toggle
    document.getElementById('showSettings').addEventListener('click', () => {
        const panel = document.getElementById('settingsPanel');
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    });
    
    // Reset learning data - Updated for new categories
    document.getElementById('resetLearning').addEventListener('click', async () => {
        await chrome.storage.local.set({
            customRules: { priority: [], timesink: [], research: [], zombie: [] },
            learnedPatterns: { priority: [], timesink: [], research: [], zombie: [] },
            tabAnalytics: {},
            tabLastAccessed: {}
        });
        
        showActionFeedback('🧠 AI learning reset! All patterns cleared. Start training again.');
        
        // Refresh display
        displayTabs();
        displayStats();
    });
    
    // Save settings when changed
    document.getElementById('workHoursEnabled').addEventListener('change', saveSettings);
    document.getElementById('shoppingAsUseless').addEventListener('change', saveSettings);
});

async function loadSettings() {
    const storage = await chrome.storage.local.get(['userPreferences']);
    const prefs = storage.userPreferences || {};
    
    document.getElementById('workHoursEnabled').checked = prefs.useWorkHours !== false;
    document.getElementById('shoppingAsUseless').checked = prefs.treatShoppingAsUseless !== false;
}

async function saveSettings() {
    const prefs = {
        useWorkHours: document.getElementById('workHoursEnabled').checked,
        treatShoppingAsUseless: document.getElementById('shoppingAsUseless').checked
    };
    
    await chrome.storage.local.set({ userPreferences: prefs });
    
    // Refresh categorization with new settings
    displayTabs();
    displayStats();
}