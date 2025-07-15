# Smart Tab Manager Chrome Extension

An AI-powered Chrome extension that helps manage your tabs by automatically categorizing them as "important" or "useless" and providing insights into your browsing habits.

## Features

- **Smart Tab Categorization**: Automatically sorts tabs into useful and useless categories
- **Funny Stats**: Shows entertaining statistics about your browsing habits
- **One-Click Cleanup**: Close all useless tabs with a single button
- **Time Tracking**: Monitor how much time you spend on different types of websites
- **Auto-Close**: Automatically close old useless tabs (optional)
- **Manual Override**: Right-click to manually categorize any website

## Installation

1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the project folder
5. The extension icon should appear in your toolbar

## How It Works

The extension uses a combination of:
- Domain-based categorization (YouTube, Facebook = useless; GitHub, Stack Overflow = important)
- Content analysis (looking for work-related keywords)
- User behavior tracking (time spent, engagement level)

## Usage

1. Click the extension icon to see your tab statistics
2. View categorized tabs in the popup
3. Click "Close All Useless Tabs" to clean up
4. Right-click on any page to manually categorize it

## Customization

You can customize the categorization by:
- Right-clicking on pages to mark them as important or useless
- The extension learns from your manual categorizations

## Privacy

This extension:
- Only processes data locally on your device
- Does not send any browsing data to external servers
- Stores preferences in Chrome's local storage

## Development

To modify the extension:
1. Edit the relevant files (popup.js for UI logic, background.js for background tasks)
2. Go to `chrome://extensions/` and click the refresh icon for the extension
3. Test your changes

## Future Enhancements

- Integration with Kiro AI for smarter categorization
- More detailed time tracking and analytics
- Customizable rules and categories
- Export/import of settings