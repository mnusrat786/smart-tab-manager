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
        'dashboard', 'analytics', 'report', 'meeting', 'calendar', 'email'
    ];
    
    // Entertainment indicators (stronger outside work hours)
    const entertainmentIndicators = [
        'video', 'game', 'funny', 'meme', 'entertainment', 'social',
        'watch', 'stream', 'music', 'news', 'sports', 'celebrity'
    ];
    
    // Shopping indicators
    const shoppingIndicators = [
        'buy', 'shop', 'cart', 'price', 'deal', 'sale', 'discount'
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
        workScore *= 1.5;
        entertainmentScore *= 0.7;
    } else {
        entertainmentScore *= 1.2;
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
    const totalTabs = Object.values(tabs).flat().length;
    const uselessCount = tabs.useless.length;
    const importantCount = tabs.important.length;
    const unknownCount = tabs.unknown.length;

    const funnyMessages = [
        `You have ${uselessCount} tabs that are probably just for fun 😅`,
        `${importantCount} tabs are doing actual work (good job!) 💪`,
        `${unknownCount} tabs that I'm not sure about 🤔`,
        `Total tabs: ${totalTabs} (that's ${totalTabs > 20 ? 'a lot' : 'manageable'}!) 📊`
    ];

    const statsDiv = document.getElementById('statsContent');
    statsDiv.textContent = '';
    
    funnyMessages.forEach((message, index) => {
        const p = document.createElement('p');
        p.textContent = message;
        p.style.margin = '5px 0';
        statsDiv.appendChild(p);
    });
    
    // Debug info - remove this later
    console.log('Tab breakdown:', {
        important: importantCount,
        useless: uselessCount,
        unknown: unknownCount,
        total: totalTabs
    });
}

async function displayTabs() {
    const tabs = await loadTabs();

    // Display important tabs
    const importantDiv = document.getElementById('importantTabs');
    importantDiv.textContent = '';
    
    if (tabs.important.length === 0) {
        const div = document.createElement('div');
        div.className = 'tab-item';
        div.textContent = 'No important tabs found 🤔';
        importantDiv.appendChild(div);
    } else {
        tabs.important.forEach((tab, index) => {
            const div = document.createElement('div');
            div.className = 'tab-item';
            
            const text = document.createElement('span');
            text.textContent = tab.title.substring(0, 40) + '...';
            
            const button = document.createElement('button');
            button.className = 'train-btn';
            button.textContent = '❌';
            button.style.float = 'right';
            button.addEventListener('click', () => trainTab(tab.url, tab.title, 'useless'));
            
            div.appendChild(text);
            div.appendChild(button);
            importantDiv.appendChild(div);
        });
    }

    // Display useless tabs
    const uselessDiv = document.getElementById('uselessTabs');
    uselessDiv.textContent = '';
    
    if (tabs.useless.length === 0) {
        const div = document.createElement('div');
        div.className = 'tab-item';
        div.textContent = 'No useless tabs found! 🎉';
        uselessDiv.appendChild(div);
    } else {
        tabs.useless.forEach((tab, index) => {
            const div = document.createElement('div');
            div.className = 'tab-item';
            
            const text = document.createElement('span');
            text.textContent = tab.title.substring(0, 40) + '...';
            
            const button = document.createElement('button');
            button.className = 'train-btn';
            button.textContent = '✅';
            button.style.float = 'right';
            button.addEventListener('click', () => trainTab(tab.url, tab.title, 'important'));
            
            div.appendChild(text);
            div.appendChild(button);
            uselessDiv.appendChild(div);
        });
    }

    // Display unknown tabs
    const unknownDiv = document.getElementById('unknownTabs');
    unknownDiv.textContent = '';
    
    if (tabs.unknown.length === 0) {
        const div = document.createElement('div');
        div.className = 'tab-item';
        div.textContent = 'All tabs categorized! 🎯';
        unknownDiv.appendChild(div);
    } else {
        tabs.unknown.forEach((tab, index) => {
            const div = document.createElement('div');
            div.className = 'tab-item';
            
            const text = document.createElement('span');
            text.textContent = tab.title.substring(0, 35) + '...';
            
            // Add both training buttons for unknown tabs
            const importantBtn = document.createElement('button');
            importantBtn.className = 'train-btn';
            importantBtn.textContent = '✅';
            importantBtn.style.float = 'right';
            importantBtn.style.marginLeft = '2px';
            importantBtn.addEventListener('click', () => trainTab(tab.url, tab.title, 'important'));
            
            const uselessBtn = document.createElement('button');
            uselessBtn.className = 'train-btn';
            uselessBtn.textContent = '❌';
            uselessBtn.style.float = 'right';
            uselessBtn.style.marginLeft = '2px';
            uselessBtn.addEventListener('click', () => trainTab(tab.url, tab.title, 'useless'));
            
            div.appendChild(text);
            div.appendChild(importantBtn);
            div.appendChild(uselessBtn);
            unknownDiv.appendChild(div);
        });
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

// Close useless tabs functionality
document.addEventListener('DOMContentLoaded', () => {
    displayStats();
    displayTabs();
    loadSettings();
    
    // Close useless tabs button
    document.getElementById('closeUseless').addEventListener('click', async () => {
        const tabs = await loadTabs();
        const tabIds = tabs.useless.map(tab => tab.id);

        if (tabIds.length > 0) {
            await chrome.tabs.remove(tabIds);
            displayTabs();
            displayStats();
        }
    });
    
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
        feedback.style.position = 'fixed';
        feedback.style.top = '10px';
        feedback.style.right = '10px';
        feedback.style.background = '#FF9800';
        feedback.style.color = 'white';
        feedback.style.padding = '10px';
        feedback.style.borderRadius = '4px';
        feedback.style.fontSize = '12px';
        feedback.style.zIndex = '1000';
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