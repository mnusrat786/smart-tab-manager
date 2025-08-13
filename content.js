// Advanced content script for Smart Tab Manager
// Enhanced page analysis and behavioral tracking

let pageStartTime = Date.now();
let isActive = true;
let engagementData = {
  scrollCount: 0,
  clickCount: 0,
  keystrokes: 0,
  mouseMovements: 0,
  focusTime: 0
};

// Enhanced visibility tracking
document.addEventListener('visibilitychange', () => {
  isActive = !document.hidden;
  
  if (isActive) {
    pageStartTime = Date.now();
  } else {
    // Page became inactive, record comprehensive time data
    const timeSpent = Date.now() - pageStartTime;
    chrome.runtime.sendMessage({
      type: 'PAGE_TIME_SPENT',
      url: window.location.href,
      timeSpent: timeSpent,
      engagement: { ...engagementData }
    });
  }
});

// Enhanced user engagement tracking
window.addEventListener('scroll', () => {
  engagementData.scrollCount++;
});

document.addEventListener('click', () => {
  engagementData.clickCount++;
});

document.addEventListener('keydown', () => {
  engagementData.keystrokes++;
});

document.addEventListener('mousemove', () => {
  engagementData.mouseMovements++;
});

window.addEventListener('focus', () => {
  pageStartTime = Date.now();
});

// Advanced page content analysis for better categorization
function analyzePageContent() {
  const title = document.title;
  const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4')).map(h => h.textContent);
  const metaDescription = document.querySelector('meta[name="description"]')?.content || '';
  const metaKeywords = document.querySelector('meta[name="keywords"]')?.content || '';
  
  // Get first paragraph of content
  const firstParagraph = document.querySelector('p')?.textContent || '';
  
  // Analyze page structure
  const hasVideo = document.querySelectorAll('video, iframe[src*="youtube"], iframe[src*="vimeo"]').length > 0;
  const hasCodeBlocks = document.querySelectorAll('pre, code, .highlight').length > 0;
  const hasComments = document.querySelectorAll('[class*="comment"], [id*="comment"]').length > 0;
  const hasShoppingElements = document.querySelectorAll('[class*="cart"], [class*="price"], [class*="buy"]').length > 0;
  
  // 🔥 Priority indicators (work/productivity)
  const priorityIndicators = [
    'documentation', 'docs', 'api', 'reference', 'tutorial', 'guide', 'learn', 'course',
    'admin', 'dashboard', 'analytics', 'report', 'meeting', 'calendar', 'email',
    'work', 'project', 'task', 'deadline', 'urgent', 'important', 'business',
    'enterprise', 'professional', 'corporate', 'official'
  ];
  
  // ⏰ Time-sink indicators (entertainment/social)
  const timesinkIndicators = [
    'video', 'watch', 'stream', 'funny', 'meme', 'entertainment', 'social',
    'game', 'gaming', 'music', 'podcast', 'celebrity', 'gossip', 'viral',
    'trending', 'popular', 'hot', 'breaking', 'latest', 'live', 'chat',
    'comment', 'like', 'share', 'follow', 'subscribe'
  ];
  
  // 📥 Research indicators
  const researchIndicators = [
    'article', 'blog', 'news', 'research', 'study', 'paper', 'pdf',
    'how to', 'tips', 'best practices', 'review', 'analysis', 'comparison',
    'deep dive', 'comprehensive', 'detailed', 'explained', 'understanding',
    'wikipedia', 'academic', 'journal', 'publication'
  ];
  
  // 🗑️ Zombie indicators (likely to become stale)
  const zombieIndicators = [
    'temporary', 'temp', 'test', 'demo', 'example', 'placeholder',
    'coming soon', 'under construction', 'maintenance', 'error', '404',
    'not found', 'expired', 'old', 'archived', 'deprecated'
  ];
  
  // Combine all text for analysis
  const allText = (title + ' ' + headings.join(' ') + ' ' + metaDescription + ' ' + 
                   metaKeywords + ' ' + firstParagraph.substring(0, 500)).toLowerCase();
  
  // Calculate scores
  const priorityScore = priorityIndicators.reduce((score, indicator) => 
    score + (allText.includes(indicator) ? 1 : 0), 0);
  const timesinkScore = timesinkIndicators.reduce((score, indicator) => 
    score + (allText.includes(indicator) ? 1 : 0), 0);
  const researchScore = researchIndicators.reduce((score, indicator) => 
    score + (allText.includes(indicator) ? 1 : 0), 0);
  const zombieScore = zombieIndicators.reduce((score, indicator) => 
    score + (allText.includes(indicator) ? 1 : 0), 0);
  
  // Structural analysis bonuses
  let structuralBonuses = {
    priority: 0,
    timesink: 0,
    research: 0,
    zombie: 0
  };
  
  if (hasCodeBlocks) structuralBonuses.priority += 2;
  if (hasVideo) structuralBonuses.timesink += 2;
  if (hasComments) structuralBonuses.timesink += 1;
  if (hasShoppingElements) structuralBonuses.timesink += 1;
  if (headings.length > 5) structuralBonuses.research += 1;
  
  return {
    scores: {
      priority: priorityScore + structuralBonuses.priority,
      timesink: timesinkScore + structuralBonuses.timesink,
      research: researchScore + structuralBonuses.research,
      zombie: zombieScore + structuralBonuses.zombie
    },
    metadata: {
      title,
      headings: headings.slice(0, 5),
      metaDescription,
      hasVideo,
      hasCodeBlocks,
      hasComments,
      hasShoppingElements,
      wordCount: allText.split(' ').length,
      domain: window.location.hostname.replace('www.', '')
    },
    engagement: { ...engagementData }
  };
}

// Detect page type based on URL patterns
function detectPageType() {
  const url = window.location.href.toLowerCase();
  const pathname = window.location.pathname.toLowerCase();
  
  // Common patterns
  if (url.includes('/admin') || url.includes('/dashboard')) return 'priority';
  if (url.includes('/watch') || url.includes('/video')) return 'timesink';
  if (url.includes('/article') || url.includes('/blog')) return 'research';
  if (url.includes('/404') || url.includes('/error')) return 'zombie';
  
  // File extensions
  if (pathname.endsWith('.pdf') || pathname.endsWith('.doc')) return 'research';
  if (pathname.endsWith('.mp4') || pathname.endsWith('.mp3')) return 'timesink';
  
  return 'unknown';
}

// Send comprehensive analysis to background script
setTimeout(() => {
  const analysis = analyzePageContent();
  const pageType = detectPageType();
  
  chrome.runtime.sendMessage({
    type: 'ENHANCED_PAGE_ANALYSIS',
    url: window.location.href,
    analysis: analysis,
    pageType: pageType,
    timestamp: Date.now()
  });
}, 3000); // Wait 3 seconds for page to fully load

// Send periodic engagement updates
setInterval(() => {
  if (isActive && (engagementData.scrollCount > 0 || engagementData.clickCount > 0)) {
    chrome.runtime.sendMessage({
      type: 'PAGE_ENGAGEMENT_UPDATE',
      url: window.location.href,
      engagement: { ...engagementData },
      timeSpent: Date.now() - pageStartTime
    });
    
    // Reset counters but keep cumulative data
    engagementData = {
      scrollCount: 0,
      clickCount: 0,
      keystrokes: 0,
      mouseMovements: 0,
      focusTime: engagementData.focusTime + (Date.now() - pageStartTime)
    };
    pageStartTime = Date.now();
  }
}, 30000); // Every 30 seconds

// Detect if user is likely procrastinating
function detectProcrastination() {
  const now = new Date();
  const isWorkHours = now.getHours() >= 9 && now.getHours() <= 17;
  const isWeekday = now.getDay() >= 1 && now.getDay() <= 5;
  
  if (isWorkHours && isWeekday) {
    const domain = window.location.hostname;
    const procrastinationSites = [
      'youtube.com', 'facebook.com', 'twitter.com', 'x.com', 'instagram.com',
      'reddit.com', 'tiktok.com', 'netflix.com', 'twitch.tv'
    ];
    
    if (procrastinationSites.some(site => domain.includes(site))) {
      chrome.runtime.sendMessage({
        type: 'PROCRASTINATION_DETECTED',
        url: window.location.href,
        domain: domain,
        timeSpent: Date.now() - pageStartTime
      });
    }
  }
}

// Check for procrastination every 5 minutes
setInterval(detectProcrastination, 5 * 60 * 1000);