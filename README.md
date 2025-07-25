#  Smart Tab Manager - Stop Tab Chaos!

**The Problem:** You have 47 tabs open. Half are YouTube videos you'll "watch later" (spoiler: you won't). The other half are work docs buried somewhere. Sound familiar?

**The Solution:** This Chrome extension uses AI to automatically sort your tabs into "Important" (work stuff) and "Useless" (that 3rd cat video today) - then lets you close the junk with one click!


##  What This Actually Does

- **Instantly categorizes** all your open tabs (no setup needed!)
- **Shows funny stats** like "You have 12 YouTube tabs open for 3 hours 😅"
- **One-click cleanup** - close all useless tabs at once
- **Learns from you** - click ❌/✅ to train the AI on your preferences
- **Gets smarter over time** - remembers your corrections and patterns

##  Quick Start (5 minutes)

### Step 1: Install the Extension
```bash
# Download this project
git clone https://github.com/mnusrat786/smart-tab-manager.git
# OR download ZIP and extract
```

### Step 2: Load into Chrome
1. Open Chrome and type `chrome://extensions/` in address bar
2. Turn ON "Developer mode" (top right toggle)
3. Click "Load unpacked" button
4. Select the `smart-tab-manager` folder you downloaded
5. Done! You'll see the extension icon in your toolbar

### Step 3: Try It Out
1. **Open some tabs** - mix of YouTube, work docs, social media
2. **Click the extension icon** - see your tabs categorized instantly
3. **Click "Close All Useless Tabs"** - watch the magic happen!
4. **Train the AI** - click ❌ next to wrong categories to teach it

## How to Use

### Basic Usage
- **Click extension icon** → See your tab stats and categories
- **Red "Close All Useless Tabs" button** → Instant cleanup
- **Green ✅ / Red ❌ buttons** → Train the AI when it gets something wrong

### Smart Features
- **⚙️ Smart Settings** → Customize work hours, shopping preferences
- **🧠 Reset Learning** → Start fresh if you want to retrain
- **Right-click any page** → Manually mark as important/useless

## 🤖 How the AI Works

### Current Intelligence:
- **Domain Recognition**: Knows YouTube = fun, GitHub = work
- **Keyword Analysis**: Scans titles for "tutorial", "meme", "documentation", etc.
- **Time Context**: Social media during work hours = more likely useless
- **User Learning**: Remembers your corrections and applies them

### What Makes It Smart:
```javascript
// Example: Same site, different context
YouTube at 2 PM on Tuesday = "useless" 
YouTube "React Tutorial" = "important"
YouTube at 11 PM = "probably useless but who cares"
```

## 🛠️ For Developers

### Project Structure
```
smart-tab-manager/
├── manifest.json          # Chrome extension config
├── popup.html/js         # Main UI and logic
├── background.js         # Background processes
├── content.js           # Page content analysis
└── .kiro/              # AI development specs
    ├── steering/       # Development standards
    └── specs/         # Feature specifications
```

### Quick Development Setup
```bash
# Make changes to any file
# Go to chrome://extensions/
# Click refresh icon on Smart Tab Manager
# Test your changes immediately
```

### Key Files to Modify:
- **`popup.js`** - Tab categorization logic and UI
- **`background.js`** - Background tasks and storage
- **`content.js`** - Page content analysis
- **`manifest.json`** - Permissions and settings

## 🎯 Current Status

### ✅ What Works Now:
- Smart tab categorization with learning
- One-click useless tab cleanup
- User training system (❌/✅ buttons)
- Time-aware categorization
- Custom rules and preferences

### 🚧 In Progress:
- Better content analysis (reading actual page content)
- Behavioral pattern recognition
- Smart notifications ("You've had Reddit open for 2 hours...")
- Export/import of learned preferences

### 💡 Future Ideas:
- Integration with productivity apps
- Team sharing of categorization rules
- Advanced analytics dashboard
- Voice commands ("Close all social media tabs")

## 🤔 Why This Exists

**Real Talk:** We all have tab addiction. This extension doesn't judge you for having 50+ tabs open - it just helps you manage the chaos with AI that actually learns your habits.

**The Goal:** Spend less time hunting for that one important tab buried among 20 YouTube videos, and more time actually getting stuff done.

## 🐛 Issues or Ideas?

- **Found a bug?** Open an issue with screenshots
- **Have an idea?** Suggest new features
- **Want to contribute?** PRs welcome!
- **Just want to say hi?** Star the repo! ⭐

## 📄 License

MIT License - Use it, modify it, share it, whatever makes you happy!

---

**Made with ❤️ and way too many browser tabs**
