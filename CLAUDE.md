# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI Chat Navigator is a Chrome browser extension (Manifest V3) that provides conversation navigation for ChatGPT pages. It captures user messages and presents them in a floating sidebar for quick navigation and search.

**Key characteristic**: Only records user messages, intentionally ignores AI responses.

## Architecture

The extension uses a three-component architecture:

1. **Content Script** (`src/content/index.js`) - Injects into ChatGPT pages

   - Captures user messages using MutationObserver
   - Creates and manages the floating sidebar UI
   - Handles conversation switching via URL monitoring
   - Implements keyboard shortcuts (Alt+N to toggle, Alt+S for search)
2. **Background Service Worker** (`src/background/index.js`)

   - Manages data persistence using Chrome Storage API
   - Handles cross-tab communication via message passing
   - Implements automatic cleanup (30-day retention)
   - Uses Alarms API for scheduled tasks
3. **Popup Interface** (`src/popup/`) - Extension popup showing stats and quick actions

## Development Workflow

### Running the Extension

This is a vanilla JavaScript Chrome extension with **no build process**:

1. Load unpacked extension in Chrome at `chrome://extensions/`
2. Enable Developer Mode
3. Click "Load unpacked" and select the project directory
4. Navigate to https://chat.openai.com/ to test

### Reloading After Changes

**Critical**: After making code changes, you must refresh ChatGPT pages for content script changes to take effect. Chrome does not automatically reload content scripts in already-open tabs.

The background service worker reloads automatically when you click "Reload" in `chrome://extensions/`.

### Debugging

- **Content script logs**: Open DevTools on the ChatGPT page itself (F12)
- **Background logs**: Go to `chrome://extensions/`, click "Service worker" link under the extension
- All logs are prefixed with `[AI Chat Navigator]` for easy filtering

## Technical Implementation Details

### Message Capture Pattern

The extension uses a sophisticated element tracking system to prevent duplicate processing:

1. Each message element gets a unique ID generated via `getOrGenerateId()` (format: `ai-nav-{timestamp}-{random}`)
2. Processed elements are tracked in a `Set` called `processedElements`
3. Messages are identified by finding `<article>` elements in the main container
4. User vs AI message detection uses `h5`/`h6` heading text (looks for "你说：" vs "ChatGPT 说：")

### Conversation Switching

Conversation switching is detected via URL monitoring:

- Conversation IDs are extracted from URL path pattern: `/c/{uuid}`
- URL monitoring uses a 500ms interval + `popstate` event listener
- On switch: clears message list, clears processed elements, rescans DOM
- Each conversation's data is stored independently in Chrome Storage

### State Management

- State is **not** persisted across page reloads (starts fresh each time)
- Background service worker handles data persistence, but content script uses in-memory state
- When switching conversations, the `resetState()` method clears everything and rescans

### Sidebar UI

- Fixed position on right side of screen
- Collapsible (width: 340px expanded, 50px collapsed)
- Dark theme matching ChatGPT's aesthetic
- Custom scrollbar styling
- Click on message scrolls to element and applies temporary highlight effect

## Chrome Extension Specifics

### Manifest Configuration

- Targets ChatGPT domains: `*://chat.openai.com/*`, `*://chatgpt.com/*`
- Permissions: `storage`, `activeTab`, `alarms`
- Uses Manifest V3 (service worker instead of background pages)

### Storage Schema

Data is stored in `chrome.storage.local` with keys:

- `conversation_{conversationId}`: Contains `{ messages: [], updatedAt: ISOString }`

### Message Passing

Content script communicates with background via `chrome.runtime.sendMessage()`:

- `saveData`: Save conversation data
- `loadData`: Load conversation data
- `clearData`: Clear conversation data

## Code Conventions

- **Language**: Comments and UI text are in Chinese
- **Class-based**: Main logic encapsulated in `ChatNavigator` class
- **Error handling**: Try-catch blocks around async operations
- **Logging**: Comprehensive console logging for debugging
- **No external dependencies**: Pure vanilla JavaScript, no build tools

## Testing Checklist

When testing changes:

1. Reload extension in `chrome://extensions/`
2. **Refresh the ChatGPT page** (Ctrl+R or F5)
3. Verify sidebar appears
4. Send a message and confirm it appears in sidebar
5. Test conversation switching (click different conversation in left sidebar)
6. Verify search functionality works
7. Test keyboard shortcuts (Alt+N, Alt+S)
8. Check browser console for errors

## Git操作

1. 进行git提交的时候不要添加额外的信息，比如说message是有什么工具生成的等这种标识(类似：Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>)，只给出代码的变动信息。
