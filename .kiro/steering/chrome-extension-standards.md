---
inclusion: always
---

# Chrome Extension Development Standards

## Code Quality
- Always use try-catch blocks for Chrome API calls
- Handle async operations properly with await
- Add console.log for debugging during development
- Use meaningful variable names and comments

## Chrome Extension Best Practices
- Keep manifest.json minimal with only required permissions
- Use service workers efficiently (they can be terminated)
- Store data in chrome.storage.local, not variables
- Test extension functionality after each change

## UI/UX Guidelines
- Keep popup width around 350px for good user experience
- Use clear, friendly language in the interface
- Provide visual feedback for user actions
- Make buttons and interactive elements easily clickable

## Smart Tab Manager Specific
- Prioritize user learning and customization over hardcoded rules
- Show clear feedback when AI learns from user actions
- Make categorization logic transparent to users
- Allow easy reset/customization of learned patterns