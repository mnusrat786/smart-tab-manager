// Content script for Smart Tab Manager
// This runs on every page to collect additional context

// Track user activity on the page
let pageStartTime = Date.now();
let isActive = true;

// Listen for visibility changes
document.addEventListener('visibilitychange', () => {
  isActive = !document.hidden;
  
  if (isActive) {
    pageStartTime = Date.now();
  } else {
    // Page became inactive, record time spent
    const timeSpent = Date.now() - pageStartTime;
    chrome.runtime.sendMessage({
      type: 'PAGE_TIME_SPENT',
      url: window.location.href,
      timeSpent: timeSpent
    });
  }
});

// Detect if user is actually engaging with the page
let scrollCount = 0;
let clickCount = 0;

window.addEventListener('scroll', () => {
  scrollCount++;
});

document.addEventListener('click', () => {
  clickCount++;
});

// Send engagement data periodically
setInterval(() => {
  if (scrollCount > 0 || clickCount > 0) {
    chrome.runtime.sendMessage({
      type: 'PAGE_ENGAGEMENT',
      url: window.location.href,
      scrollCount: scrollCount,
      clickCount: clickCount,
      timeSpent: Date.now() - pageStartTime
    });
    
    scrollCount = 0;
    clickCount = 0;
  }
}, 30000); // Every 30 seconds

// Analyze page content for better categorization
function analyzePageContent() {
  const title = document.title;
  const headings = Array.from(document.querySelectorAll('h1, h2, h3')).map(h => h.textContent);
  const metaDescription = document.querySelector('meta[name="description"]')?.content || '';
  
  // Look for work-related indicators
  const workIndicators = [
    'documentation', 'api', 'tutorial', 'guide', 'learn', 'course',
    'github', 'stackoverflow', 'developer', 'programming', 'code'
  ];
  
  // Look for entertainment indicators
  const entertainmentIndicators = [
    'video', 'game', 'funny', 'meme', 'entertainment', 'social',
    'watch', 'stream', 'music', 'news', 'sports'
  ];
  
  const allText = (title + ' ' + headings.join(' ') + ' ' + metaDescription).toLowerCase();
  
  const workScore = workIndicators.reduce((score, indicator) => {
    return score + (allText.includes(indicator) ? 1 : 0);
  }, 0);
  
  const entertainmentScore = entertainmentIndicators.reduce((score, indicator) => {
    return score + (allText.includes(indicator) ? 1 : 0);
  }, 0);
  
  return {
    workScore,
    entertainmentScore,
    title,
    headings: headings.slice(0, 3), // First 3 headings
    metaDescription
  };
}

// Send page analysis to background script
setTimeout(() => {
  const analysis = analyzePageContent();
  chrome.runtime.sendMessage({
    type: 'PAGE_ANALYSIS',
    url: window.location.href,
    analysis: analysis
  });
}, 2000); // Wait 2 seconds for page to load