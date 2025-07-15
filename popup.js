// Smart tab categorization with learning capabilities
async function categorizeTab(url, title) {
    try {
        const domain = new URL(url).hostname.replace('www.', '');

        // Get user's custom rules and learned patterns
        const storage = await chrome.storage.local.get(['customRules', 'learnedPatterns', 'userPreferences']);
        const customRules = storage.customRules || { important: [], useless: [] };
        const learnedPatterns = storage.learnedPatterns || { important: [], useless: [] };
        const userPrefs = storage.userPreferences || {};

        // 1. Check user's custom rules first (highest priority)
        if (customRules.important.some(d => domain.includes(d))) {
            return 'important';
        }
        if (customRules.useless.some(d => domain.includes(d))) {
            return 'useless';
        }

        // 2. Check learned patterns from user behavior
        if (learnedPatterns.important.some(pattern => domain.includes(pattern) || title.toLowerCase().includes(pattern))) {
            return 'important';
        }
        if (learnedPatterns.useless.some(pattern => domain.includes(pattern) || title.toLowerCase().includes(pattern))) {
            return 'useless';
        }

        // 3. Smart context-aware categorization
        const category = await smartCategorize(domain, title, userPrefs);
        if (category !== 'unknown') {
            return category;
        }

        // 4. Fallback to basic heuristics
        return basicCategorize(domain, title);

    } catch (e) {
        console.log('Error categorizing tab:', e);
        return 'unknown';
    }
}

async function smartCategorize(domain, title, userPrefs) {
    const text = (title + ' ' + domain).toLowerCase();

    // Time-based intelligence
    const now = new Date();
    const isWorkHours = now.getHours() >= 9 && now.getHours() <= 17;
    const isWeekday = now.getDay() >= 1 && now.getDay() <= 5;

    // Work indicators (stronger during work hours)
    const workIndicators = [
        'documentation', 'docs', 'api', 'tutorial', 'guide', 'learn', 'course',
        'github', 'stackoverflow', 'developer', 'programming', 'code', 'admin',
        'dashboard', 'analytics', 'report', 'meeting', 'calendar', 'email',
        'jira', 'confluence', 'trello', 'asana', 'monday', 'basecamp'
    ];

    // Entertainment indicators (stronger outside work hours)
    const entertainmentIndicators = [
        'video', 'game', 'funny', 'meme', 'entertainment', 'social',
        'watch', 'stream', 'music', 'news', 'sports', 'celebrity',
        'gossip', 'viral', 'trending', 'subscribe', 'like', 'share'
    ];

    // Shopping indicators
    const shoppingIndicators = [
        'buy', 'shop', 'cart', 'price', 'deal', 'sale', 'discount',
        'amazon', 'ebay', 'store', 'checkout', 'payment'
    ];

    let workScore = workIndicators.reduce((score, indicator) => {
        return score + (text.includes(indicator) ? 1 : 0);
    }, 0);

    let entertainmentScore = entertainmentIndicators.reduce((score, indicator) => {
        return score + (text.includes(indicator) ? 1 : 0);
    }, 0);

    let shoppingScore = shoppingIndicators.reduce((score, indicator) => {
        return score + (text.includes(indicator) ? 1 : 0);
    }, 0);

    // Adjust scores based on context
    if (isWorkHours && isWeekday) {
        workScore *= 1.5; // Boost work score during work hours
        entertainmentScore *= 0.7; // Reduce entertainment score during work hours
    } else {
        entertainmentScore *= 1.2; // Boost entertainment score outside work hours
    }

    // Decision logic
    if (workScore >= 2) return 'important';
    if (entertainmentScore >= 2) return 'useless';
    if (shoppingScore >= 2) return userPrefs.treatShoppingAsUseless !== false ? 'useless' : 'unknown';

    return 'unknown';
}

function basicCategorize(domain, title) {
    // Fallback hardcoded rules (much smaller set)
    const commonUseless = ['youtube.com', 'facebook.com', 'instagram.com', 'twitter.com', 'x.com', 'tiktok.com'];
    const commonWork = ['github.com', 'stackoverflow.com', 'docs.google.com'];

    if (commonUseless.some(d => domain.includes(d))) return 'useless';
    if (commonWork.some(d => domain.includes(d))) return 'important';

    return 'unknown';
}

// Function to learn from user behavior
async function learnFromUserAction(domain, title, category) {
    const storage = await chrome.storage.local.get(['learnedPatterns']);
    const learnedPatterns = storage.learnedPatterns || { important: [], useless: [] };

    // Extract meaningful patterns
    const domainPattern = domain.split('.').slice(-2).join('.'); // Get main domain
    const titleWords = title.toLowerCase().split(' ').filter(word => word.length > 3);

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

async function loadTabs() {
    try {
        const tabs = await chrome.tabs.query({});
        const categorized = {
            important: [],
            useless: [],
            unknown: []
        };

        // Process tabs sequentially to handle async categorization
        for (const tab of tabs) {
            const category = await categorizeTab(tab.url, tab.title);
            categorized[category].push(tab);
        }

        return categorized;
    } catch (e) {
        console.log('Error loading tabs:', e);
        return { important: [], useless: [], unknown: [] };
    }
}

async function displayStats() {
    const tabs = await loadTabs();
    const storage = await chrome.storage.local.get(['timeSpent', 'lastReset']);

    const totalTabs = Object.values(tabs).flat().length;
    const uselessCount = tabs.useless.length;
    const importantCount = tabs.important.length;

    const funnyMessages = [
        `You have ${uselessCount} tabs that are probably just for fun 😅`,
        `${importantCount} tabs are doing actual work (good job!) 💪`,
        `Total tabs: ${totalTabs} (that's ${totalTabs > 20 ? 'a lot' : 'manageable'}!) 📊`
    ];

    document.getElementById('statsContent').innerHTML = funnyMessages.join('<br>');
}

async function displayTabs() {
    const tabs = await loadTabs();

    // Display important tabs with training buttons
    const importantDiv = document.getElementById('importantTabs');
    if (tabs.important.length === 0) {
        importantDiv.innerHTML = '<div class="tab-item">No important tabs found 🤔</div>';
    } else {
        importantDiv.innerHTML = tabs.important.map(tab =>
            `<div class="tab-item">
                ${tab.title.substring(0, 40)}...
                <button class="train-btn" onclick="trainTab('${tab.url}', '${tab.title.replace(/'/g, "\\'")}', 'useless')">❌</button>
            </div>`
        ).join('');
    }

    // Display useless tabs with training buttons
    const uselessDiv = document.getElementById('uselessTabs');
    if (tabs.useless.length === 0) {
        uselessDiv.innerHTML = '<div class="tab-item">No useless tabs found! 🎉</div>';
    } else {
        uselessDiv.innerHTML = tabs.useless.map(tab =>
            `<div class="tab-item">
                ${tab.title.substring(0, 40)}...
                <button class="train-btn" onclick="trainTab('${tab.url}', '${tab.title.replace(/'/g, "\\'")}', 'important')">✅</button>
            </div>`
        ).join('');
    }
}

// Training function for user feedback
async function trainTab(url, title, newCategory) {
    try {
        const domain = new URL(url).hostname.replace('www.', '');

        // Learn from this user action
        await learnFromUserAction(domain, title, newCategory);

        // Also add to custom rules for this domain
        const storage = await chrome.storage.local.get(['customRules']);
        const customRules = storage.customRules || { important: [], useless: [] };

        const domainPattern = domain.split('.').slice(-2).join('.');

        // Remove from opposite category if it exists
        const oppositeCategory = newCategory === 'important' ? 'useless' : 'important';
        customRules[oppositeCategory] = customRules[oppositeCategory].filter(d => d !== domainPattern);

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

function showTrainingFeedback(domain, category) {
    const message = `✅ Learned! ${domain} is now ${category}`;
    const feedback = document.createElement('div');
    feedback.style.cssText = `
        position: fixed; top: 10px; right: 10px; 
        background: #4CAF50; color: white; 
        padding: 10px; border-radius: 4px; 
        font-size: 12px; z-index: 1000;
    `;
    feedback.textContent = message;
    document.body.appendChild(feedback);

    setTimeout(() => feedback.remove(), 3000);
}

// Close useless tabs functionality
document.getElementById('closeUseless').addEventListener('click', async () => {
    const tabs = await loadTabs();
    const tabIds = tabs.useless.map(tab => tab.id);

    if (tabIds.length > 0) {
        await chrome.tabs.remove(tabIds);
        displayTabs(); // Refresh the display
        displayStats(); // Refresh stats
    }
});

// Settings panel functionality
document.addEventListener('DOMContentLoaded', () => {
    displayStats();
    displayTabs();
    loadSettings();

    // Settings panel toggle
    document.getElementById('showSettings').addEventListener('click', () => {
        const panel = document.getElementById('settingsPanel');
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    });

    // Reset learning data
    document.getElementById('resetLearning').addEventListener('click', async () => {
        await chrome.storage.local.set({
            customRules: { important: [], useless: [] },
            learnedPatterns: { important: [], useless: [] }
        });

        // Show feedback
        const feedback = document.createElement('div');
        feedback.style.cssText = `
            position: fixed; top: 10px; right: 10px; 
            background: #FF9800; color: white; 
            padding: 10px; border-radius: 4px; 
            font-size: 12px; z-index: 1000;
        `;
        feedback.textContent = '🧠 AI learning reset! Start training again.';
        document.body.appendChild(feedback);
        setTimeout(() => feedback.remove(), 3000);

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

// Make trainTab globally accessible
window.trainTab = trainTab;