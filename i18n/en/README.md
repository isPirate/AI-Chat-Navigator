# AI Chat Navigator  

A browser extension that helps you quickly navigate and locate historical conversations on ChatGPT pages.  

## Features  

- ✅ Only records user messages (does not record AI replies)  
- Sidebar navigation panel displaying message numbers and summaries  
- Quick jump to any user input  
- Search and filter conversation content  
- Keyboard shortcuts  
- Automatically detects conversation switches and resets  
- Persistent data storage  

## Installation  

### Development Mode Installation  

1. Clone or download this project  
2. Open Chrome browser and go to `chrome://extensions/`  
3. Enable "Developer mode" in the top-right corner  
4. Click "Load unpacked extension"  
5. Select the project root directory  
6. The extension is now installed  

## Usage  

### Basic Usage  

1. Visit [ChatGPT](https://chat.openai.com/)  
2. The extension will automatically record your conversations  
3. Click the navigation panel on the right to view all conversation records  
4. Click any message to quickly jump to its location  

### Keyboard Shortcuts  

- `Alt + N`: Toggle navigation panel visibility  
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
│   │   ├── index.js          # Injected script  
│   │   └── style.css         # Injected styles  
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

## Development Roadmap  

- [X] Basic framework setup  
- [X] Message capture functionality  
- [X] Navigation sidebar  
- [X] Search functionality  
- [ ] Add extension icons  
- [ ] Support for more AI platforms (Claude, Gemini, etc.)  
- [ ] Export conversation history  
- [ ] Dark/light theme toggle  
- [ ] Settings page  

## FAQ  

### Extension not working?  

1. Ensure you're on a ChatGPT page  
2. Refresh the page and try again  
3. Check the browser console for errors  

### How to clear data?  

Click the extension icon and click the "Clear Data" button in the popup window.  

## License  

MIT License  

## Contributions  

Welcome to submit Issues and Pull Requests!