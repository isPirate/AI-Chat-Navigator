# AI Chat Navigator

A browser extension that helps you quickly navigate and locate historical conversations on the ChatGPT page.

## Features

- ✅ Records only user messages (does not record AI replies)
- Sidebar navigation panel displaying message numbers and summaries
- Quick navigation to any user input
- Search and filter conversation content
- Keyboard shortcuts
- Automatic detection of conversation switches and reset
- Persistent data storage

## Installation

### Development Mode Installation

1. Clone or download this project
2. Open Chrome browser and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked extension"
5. Select the project root directory
6. The extension is now installed

## Usage

### Basic Usage

1. Visit [ChatGPT](https://chat.openai.com/)
2. The extension will automatically record your conversations
3. Click the navigation panel on the right to view all conversation records
4. Click any message to quickly navigate to that position

### Keyboard Shortcuts

- `Alt + N`: Toggle the navigation panel visibility
- `Alt + S`: Focus on the search box

### Search Function

Enter keywords in the search box of the navigation panel to filter conversation content in real-time.

## Tech Stack

- **Manifest V3**: Latest Chrome extension API
- **Vanilla JavaScript**: No framework dependencies
- **Chrome Storage API**: Persistent data storage
- **MutationObserver**: Monitor DOM changes

## Project Structure

```
ai-chat-navigator/
├── manifest.json              # Extension configuration file
├── src/
│   ├── content/
│   │   ├── index.js          # Injection script
│   │   └── style.css         # Injection styles
│   ├── background/
│   │   └── index.js          # Background service
│   ├── popup/
│   │   ├── index.html        # Popup page
│   │   ├── style.css         # Popup page styles
│   │   └── index.js          # Popup page logic
│   └── utils/
│       └── storage.js        # Storage utility (to be implemented)
└── icons/                    # Icon files (to be added)
```

## Development Plan

- [X] Basic framework setup
- [X] Message capture functionality
- [X] Navigation sidebar
- [X] Search functionality
- [ ] Add extension icons
- [ ] Support for more AI platforms (Claude, Gemini, etc.)
- [ ] Export conversation records
- [ ] Dark/Light theme switching
- [ ] Settings page

## FAQ

### Extension not working?

1. Ensure you are using it on the ChatGPT page
2. Refresh the page and try again
3. Check the browser console for any errors

### How to clear data?

Click the extension icon and click the "Clear Data" button in the popup window.

## License

MIT License

## Contribution

Welcome to submit Issues and Pull Requests!