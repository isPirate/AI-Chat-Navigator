/**
 * AI Chat Navigator - Popup Script
 */

// 定义所有函数（确保在调用前定义）
async function checkChatGPTStatus() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const statusText = document.getElementById('status-text');
    const statusIcon = document.querySelector('.status-icon');

    const isChatGPT = tab.url && (
      tab.url.includes('chat.openai.com') ||
      tab.url.includes('chatgpt.com')
    );

    if (isChatGPT) {
      statusText.textContent = '插件已激活，正在记录对话';
      statusIcon.classList.remove('inactive');
      statusIcon.classList.add('active');
    } else {
      statusText.textContent = '请在ChatGPT页面使用此插件';
      statusIcon.classList.remove('active');
      statusIcon.classList.add('inactive');
    }
  } catch (error) {
    console.error('[AI Chat Navigator] 检查状态失败:', error);
    const statusText = document.getElementById('status-text');
    statusText.textContent = '无法检测页面状态';
  }
}

function openChatGPT() {
  chrome.tabs.create({ url: 'https://chat.openai.com/' });
}

async function loadSettings() {
  try {
    const result = await chrome.storage.local.get(['expandMode', 'pluginEnabled']);

    // 加载展开方式
    const expandMode = result.expandMode || 'hover';
    const select = document.getElementById('expand-mode-select');
    if (select) {
      select.value = expandMode;
    }

    // 加载插件启用状态
    const pluginEnabled = result.pluginEnabled !== undefined ? result.pluginEnabled : true;
    const checkbox = document.getElementById('plugin-enabled');
    if (checkbox) {
      checkbox.checked = pluginEnabled;
      updatePluginStatusUI(pluginEnabled);
    }
  } catch (error) {
    console.error('[AI Chat Navigator] 加载设置失败:', error);
  }
}

async function saveExpandMode(event) {
  const expandMode = event.target.value;

  try {
    await chrome.storage.local.set({ expandMode });

    // 显示保存成功提示
    const settingItem = event.target.closest('.setting-item');
    showSaveNotification(settingItem);
  } catch (error) {
    console.error('[AI Chat Navigator] 保存设置失败:', error);
    alert('保存设置失败，请重试');
  }
}

async function togglePlugin(event) {
  const enabled = event.target.checked;

  try {
    await chrome.storage.local.set({ pluginEnabled: enabled });
    updatePluginStatusUI(enabled);

    // 通知content script更新状态
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && (tab.url.includes('chat.openai.com') || tab.url.includes('chatgpt.com'))) {
      chrome.tabs.sendMessage(tab.id, { action: 'togglePlugin', enabled });
    }

    // 显示保存成功提示
    showNotification(enabled ? '插件已启用' : '插件已禁用');
  } catch (error) {
    console.error('[AI Chat Navigator] 切换插件状态失败:', error);
    alert('操作失败，请重试');
  }
}

function updatePluginStatusUI(enabled) {
  const statusIcon = document.getElementById('plugin-status-icon');
  const statusText = document.getElementById('status-text');
  const toggleLabel = document.querySelector('.toggle-label');

  if (enabled) {
    statusIcon.classList.remove('inactive');
    statusIcon.classList.add('active');
    statusText.textContent = '插件已激活，正在记录对话';
    toggleLabel.textContent = '启用';
  } else {
    statusIcon.classList.remove('active');
    statusIcon.classList.add('inactive');
    statusText.textContent = '插件已禁用';
    toggleLabel.textContent = '已禁用';
  }
}

function showNotification(message) {
  const notification = document.createElement('div');
  notification.className = 'toast-notification';
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 2000);
}

function showSaveNotification(settingItem) {
  const existing = settingItem.querySelector('.save-notification');
  if (existing) existing.remove();

  const notification = document.createElement('div');
  notification.className = 'save-notification';
  notification.textContent = '✓ 已保存';
  settingItem.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 2000);
}

function initializePopup() {
  checkChatGPTStatus();
  loadSettings();

  document.getElementById('open-chatgpt').addEventListener('click', openChatGPT);
  document.getElementById('expand-mode-select').addEventListener('change', saveExpandMode);
  document.getElementById('plugin-enabled').addEventListener('change', togglePlugin);
}

// DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', initializePopup);
