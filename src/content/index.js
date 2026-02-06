/**
 * AI Chat Navigator - Content Script
 * 注入到ChatGPT页面，负责捕获消息和实现导航功能
 */

class ChatNavigator {
  constructor() {
    this.messages = [];
    this.sidebar = null;
    this.isSidebarVisible = false; // 默认折叠状态
    this.currentConversationId = this.extractConversationId();
    this.processedElements = new Set(); // 追踪已处理的消息元素
    this.checkInterval = null; // 定期检查URL变化
    this.expandMode = 'hover'; // 展开方式: 'hover' 或 'click'，默认hover
    this.hoverTimer = null; // hover延迟计时器
    this.collapseTimer = null; // 折叠延迟计时器
    this.pluginEnabled = true; // 插件是否启用
    this.init();
  }

  /**
   * 从URL提取对话ID
   */
  extractConversationId() {
    const match = window.location.pathname.match(/\/c\/([a-f0-9-]+)/);
    return match ? match[1] : 'default';
  }

  /**
   * 检查并处理对话切换
   */
  checkConversationChange() {
    // 如果插件被禁用，不处理对话切换
    if (!this.pluginEnabled) return;

    const newConversationId = this.extractConversationId();

    if (newConversationId !== this.currentConversationId) {
      console.log('[AI Chat Navigator] 检测到对话切换:', this.currentConversationId, '->', newConversationId);
      this.currentConversationId = newConversationId;
      this.resetState();
    }
  }

  async init() {
    console.log('[AI Chat Navigator] 初始化中...');

    // 加载配置
    await this.loadSettings();

    // 如果插件被禁用，不创建侧边栏
    if (!this.pluginEnabled) {
      console.log('[AI Chat Navigator] 插件已禁用');
      return;
    }

    // 等待页面加载完成
    await this.waitForChatContainer();

    // 创建导航侧边栏
    this.createSidebar();

    // 延迟扫描消息，确保DOM完全加载
    setTimeout(() => {
      this.scanExistingMessages();
    }, 1000);

    // 监听新消息
    this.observeMessages();

    // 监听URL变化（对话切换）- 定期检查
    this.startUrlMonitoring();

    // 监听快捷键
    this.setupKeyboardShortcuts();

    // 监听来自popup的消息
    this.setupMessageListener();

    console.log('[AI Chat Navigator] 初始化完成');
  }

  /**
   * 等待聊天容器加载
   */
  async waitForChatContainer() {
    return new Promise((resolve) => {
      const checkContainer = () => {
        const main = document.querySelector('main');
        if (main && main.querySelector('article')) {
          resolve(main);
        } else {
          setTimeout(checkContainer, 100);
        }
      };
      checkContainer();
    });
  }

  /**
   * 创建导航侧边栏
   */
  createSidebar() {
    // 创建侧边栏容器
    this.sidebar = document.createElement('div');
    this.sidebar.id = 'ai-chat-navigator-sidebar';
    this.sidebar.classList.add('collapsed'); // 默认折叠状态
    this.sidebar.innerHTML = `
      <div class="navigator-header">
        <h3>对话导航</h3>
        <button id="toggle-navigator" class="toggle-btn" title="折叠/展开">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <!-- 折叠状态图标容器 -->
        <div class="collapsed-icon-container" id="collapsed-icon" title="点击展开对话导航">
          <div class="collapsed-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <span class="collapsed-badge" id="collapsed-badge">0</span>
        </div>
      </div>
      <div class="navigator-search">
        <input type="text" id="search-input" placeholder="搜索消息内容...">
      </div>
      <div class="navigator-content" id="navigator-content">
        <div class="loading-state">正在加载对话...</div>
      </div>
      <div class="navigator-footer">
        <span id="message-count">0 条消息</span>
      </div>
    `;

    document.body.appendChild(this.sidebar);

    // 绑定事件
    this.bindSidebarEvents();
  }

  /**
   * 绑定侧边栏事件
   */
  bindSidebarEvents() {
    // 切换显示/隐藏按钮
    const toggleBtn = document.getElementById('toggle-navigator');
    toggleBtn.addEventListener('click', () => this.toggleSidebar());

    // 折叠图标容器
    const collapsedIcon = document.getElementById('collapsed-icon');

    // 根据配置绑定不同的事件
    if (this.expandMode === 'hover') {
      // hover 模式：鼠标悬停展开，离开时自动折叠
      collapsedIcon.addEventListener('mouseenter', () => {
        if (!this.isSidebarVisible) {
          // 清除可能存在的折叠计时器
          if (this.collapseTimer) {
            clearTimeout(this.collapseTimer);
            this.collapseTimer = null;
          }
          // 延迟展开，避免误触
          this.hoverTimer = setTimeout(() => {
            this.toggleSidebar();
          }, 200);
        }
      });

      collapsedIcon.addEventListener('mouseleave', () => {
        if (this.hoverTimer) {
          clearTimeout(this.hoverTimer);
          this.hoverTimer = null;
        }
      });

      // 点击也可展开
      collapsedIcon.addEventListener('click', () => {
        if (!this.isSidebarVisible) {
          this.toggleSidebar();
        }
      });

      // 监听整个侧边栏的鼠标离开事件，自动折叠
      this.sidebar.addEventListener('mouseleave', () => {
        if (this.isSidebarVisible) {
          // 延迟折叠，避免误操作
          this.collapseTimer = setTimeout(() => {
            this.toggleSidebar();
          }, 300);
        }
      });

      // 鼠标回到侧边栏时取消折叠
      this.sidebar.addEventListener('mouseenter', () => {
        if (this.collapseTimer) {
          clearTimeout(this.collapseTimer);
          this.collapseTimer = null;
        }
      });
    } else {
      // click 模式：只响应点击
      collapsedIcon.addEventListener('click', () => this.toggleSidebar());
    }

    // 搜索功能
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', (e) => this.filterMessages(e.target.value));
  }

  /**
   * 监听新消息
   */
  observeMessages() {
    const main = document.querySelector('main');
    if (!main) return;

    // 使用MutationObserver监听DOM变化
    const observer = new MutationObserver((mutations) => {
      let shouldUpdate = false;

      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            // 检查是否是新的article元素
            if (node.tagName === 'ARTICLE' || node.querySelector('article')) {
              shouldUpdate = true;
            }
          }
        });
      });

      if (shouldUpdate) {
        // 延迟扫描，等待内容完全加载
        setTimeout(() => {
          this.scanExistingMessages();
        }, 500);
      }
    });

    observer.observe(main, {
      childList: true,
      subtree: true
    });
  }

  /**
   * 开始URL监控（定期检查对话切换）
   */
  startUrlMonitoring() {
    // 每500ms检查一次URL变化
    this.checkInterval = setInterval(() => {
      this.checkConversationChange();
    }, 500);

    // 同时监听popstate事件
    window.addEventListener('popstate', () => {
      setTimeout(() => this.checkConversationChange(), 100);
    });
  }

  /**
   * 重置状态（当切换对话时调用）
   */
  resetState() {
    // 如果插件被禁用或侧边栏不存在，不执行重置
    if (!this.pluginEnabled || !this.sidebar) {
      return;
    }

    // 清空消息列表
    this.messages = [];

    // 清空已处理元素集合
    this.processedElements.clear();

    // 清空搜索框
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.value = '';
    }

    // 更新侧边栏显示
    this.updateSidebar();

    console.log('[AI Chat Navigator] 状态已重置');

    // 延迟重新扫描消息
    setTimeout(() => {
      this.scanExistingMessages();
    }, 1000);
  }

  /**
   * 扫描页面中已存在的消息
   */
  scanExistingMessages() {
    // 如果插件被禁用，不扫描消息
    if (!this.pluginEnabled) return;

    const articles = document.querySelectorAll('main article');
    const newMessages = [];

    articles.forEach((article) => {
      // 跳过已处理的元素
      const elementId = this.getOrGenerateId(article);
      if (this.processedElements.has(elementId)) {
        return;
      }

      // 提取消息信息
      const messageInfo = this.extractMessageInfo(article);
      if (messageInfo) {
        messageInfo.elementId = elementId;
        newMessages.push(messageInfo);
        this.processedElements.add(elementId);
      }
    });

    // 如果有新消息，添加到列表
    if (newMessages.length > 0) {
      this.messages = [...this.messages, ...newMessages];
      this.updateSidebar();
    }
  }

  /**
   * 获取或生成元素ID
   */
  getOrGenerateId(element) {
    if (element.id) {
      return element.id;
    }
    const id = `ai-nav-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    element.id = id;
    return id;
  }

  /**
   * 从article中提取消息信息
   */
  extractMessageInfo(article) {
    // 找到heading来确定是用户还是AI消息
    const heading = article.querySelector('h5, h6');
    if (!heading) return null;

    const headingText = heading.textContent.trim();
    const isUser = headingText.includes('你说：');
    const isAI = headingText.includes('ChatGPT 说：') || headingText.includes('GPT 说：');

    // 只记录用户消息，忽略AI消息
    if (!isUser) return null;

    // 提取消息内容（排除heading、按钮等）
    const content = this.extractMessageContent(article, heading);

    if (!content || content.length < 5) return null;

    return {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'user', // 只有用户消息
      text: content.substring(0, 150) + (content.length > 150 ? '...' : ''),
      fullText: content,
      index: this.messages.length
    };
  }

  /**
   * 提取消息的实际内容
   */
  extractMessageContent(article, heading) {
    // 克隆节点以避免修改原始DOM
    const clone = article.cloneNode(true);

    // 移除不需要的元素
    const elementsToRemove = clone.querySelectorAll(`
      h5, h6, heading,
      button,
      [class*="button"],
      [role="button"],
      .clipboard,
      [class*="copy"],
      [class*="edit"],
      nav,
      footer
    `);

    elementsToRemove.forEach(el => el.remove());

    // 获取文本内容
    let text = clone.textContent.trim();

    // 移除标题文本
    if (heading) {
      text = text.replace(heading.textContent.trim(), '').trim();
    }

    // 移除多余的空白
    text = text.replace(/\s+/g, ' ').trim();

    // 限制长度
    if (text.length > 500) {
      text = text.substring(0, 500);
    }

    return text;
  }

  /**
   * 更新侧边栏内容
   */
  updateSidebar() {
    const content = document.getElementById('navigator-content');
    const countEl = document.getElementById('message-count');
    const badgeEl = document.getElementById('collapsed-badge');

    if (!content || !countEl) return;

    if (this.messages.length === 0) {
      content.innerHTML = '<div class="empty-state">暂无对话记录</div>';
      countEl.textContent = '0 条消息';
      if (badgeEl) badgeEl.textContent = '0';
      return;
    }

    content.innerHTML = this.messages.map((msg, idx) => {
      // 只显示序号，不显示图标和类型标签，移除时间显示，移除井号
      return `
        <div class="message-item" data-message-id="${msg.id}" data-index="${idx}">
          <div class="message-index">${idx + 1}</div>
          <div class="message-content">
            <div class="message-text">${this.escapeHtml(msg.text)}</div>
          </div>
        </div>
      `;
    }).join('');

    countEl.textContent = `${this.messages.length} 条消息`;

    // 更新折叠状态的徽章数量
    if (badgeEl) {
      badgeEl.textContent = this.messages.length > 99 ? '99+' : this.messages.length;
    }

    // 绑定点击事件
    content.querySelectorAll('.message-item').forEach(item => {
      item.addEventListener('click', () => {
        const messageId = item.dataset.messageId;
        this.scrollToMessage(messageId);
      });
    });
  }

  /**
   * 滚动到指定消息
   */
  scrollToMessage(messageId) {
    const message = this.messages.find(m => m.id === messageId);
    if (!message) return;

    const element = document.getElementById(message.elementId);
    if (!element) return;

    // 判断是否是最后一条消息
    const isLastMessage = message.index === this.messages.length - 1;

    // 延迟执行滚动，确保 DOM 完全渲染
    setTimeout(() => {
      // 根据是否是最后一条消息使用不同的滚动策略
      if (isLastMessage) {
        // 对于最后一条消息，使用 end 策略，确保滚动到视口底部
        element.scrollIntoView({ behavior: 'smooth', block: 'end' });
      } else {
        // 对于其他消息，使用 center 策略
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      // 高亮效果
      element.classList.add('ai-nav-highlight');
      setTimeout(() => {
        element.classList.remove('ai-nav-highlight');
      }, 3000);
    }, 100);
  }

  /**
   * 过滤消息
   */
  filterMessages(query) {
    const items = document.querySelectorAll('.message-item');
    const lowerQuery = query.toLowerCase().trim();

    if (!lowerQuery) {
      // 显示所有
      items.forEach(item => {
        item.style.display = 'flex';
      });
      return;
    }

    items.forEach(item => {
      const index = parseInt(item.dataset.index);
      const message = this.messages[index];
      if (!message) return;

      const matches = message.text.toLowerCase().includes(lowerQuery) ||
                      message.fullText.toLowerCase().includes(lowerQuery);
      item.style.display = matches ? 'flex' : 'none';
    });
  }

  /**
   * 切换侧边栏显示
   */
  toggleSidebar() {
    // 如果侧边栏不存在或插件被禁用，不执行切换
    if (!this.sidebar || !this.pluginEnabled) return;

    this.isSidebarVisible = !this.isSidebarVisible;
    this.sidebar.classList.toggle('collapsed', !this.isSidebarVisible);

    // 更新按钮图标 - 不再需要，CSS已处理旋转
  }

  /**
   * 设置快捷键
   */
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // 如果插件被禁用，不响应快捷键
      if (!this.pluginEnabled) return;

      // Alt + N: 切换导航栏
      if (e.altKey && e.key === 'n') {
        e.preventDefault();
        this.toggleSidebar();
      }

      // Alt + S: 聚焦搜索框
      if (e.altKey && e.key === 's') {
        e.preventDefault();
        const searchInput = document.getElementById('search-input');
        searchInput?.focus();
      }
    });
  }

  /**
   * 转义HTML
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * 加载设置
   */
  async loadSettings() {
    try {
      const result = await chrome.storage.local.get(['expandMode', 'pluginEnabled']);

      if (result.expandMode && ['hover', 'click'].includes(result.expandMode)) {
        this.expandMode = result.expandMode;
        console.log('[AI Chat Navigator] 展开模式:', this.expandMode);
      }

      if (result.pluginEnabled !== undefined) {
        this.pluginEnabled = result.pluginEnabled;
        console.log('[AI Chat Navigator] 插件状态:', this.pluginEnabled ? '启用' : '禁用');
      }
    } catch (error) {
      console.error('[AI Chat Navigator] 加载设置失败:', error);
    }
  }

  /**
   * 监听来自popup的消息
   */
  setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'togglePlugin') {
        const { enabled } = request;
        this.pluginEnabled = enabled;

        if (enabled) {
          // 重新初始化或显示侧边栏
          if (!this.sidebar) {
            // 如果侧边栏不存在，重新初始化
            this.waitForChatContainer().then(() => {
              this.createSidebar();
              setTimeout(() => {
                this.scanExistingMessages();
              }, 1000);
              this.observeMessages();
            });
          } else {
            // 如果侧边栏已存在，直接显示
            this.sidebar.style.display = 'flex';
          }
          console.log('[AI Chat Navigator] 插件已启用');
        } else {
          // 移除侧边栏（不仅仅是隐藏）
          if (this.sidebar) {
            this.sidebar.remove();
            this.sidebar = null;
          }
          console.log('[AI Chat Navigator] 插件已禁用');
        }

        sendResponse({ success: true });
      }
      return true;
    });
  }
}

// 立即初始化插件
console.log('[AI Chat Navigator] Script loaded');

// 清理旧实例
if (window.chatNavigator) {
  console.log('[AI Chat Navigator] 清理旧实例');
  const oldSidebar = document.getElementById('ai-chat-navigator-sidebar');
  if (oldSidebar) {
    oldSidebar.remove();
  }
}

// 创建新实例
const chatNavigator = new ChatNavigator();

// 立即暴露到全局
window.chatNavigator = chatNavigator;

console.log('[AI Chat Navigator] Plugin initialized, instance:', !!window.chatNavigator);
