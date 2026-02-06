/**
 * AI Chat Navigator - Popup Script
 */

document.addEventListener('DOMContentLoaded', () => {
  initializePopup();
});

function initializePopup() {
  // 检查ChatGPT页面状态
  checkChatGPTStatus();

  // 加载设置
  loadSettings();

  // 绑定按钮事件
  document.getElementById('open-chatgpt').addEventListener('click', openChatGPT);
  document.getElementById('clear-data').addEventListener('click', clearAllData);

  // 绑定设置变更事件
  document.getElementById('expand-mode-select').addEventListener('change', saveExpandMode);
}

/**
 * 检查ChatGPT页面状态
 */
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

/**
 * 打开ChatGPT
 */
function openChatGPT() {
  chrome.tabs.create({ url: 'https://chat.openai.com/' });
}

/**
 * 清除所有数据
 */
async function clearAllData() {
  const confirmed = confirm('确定要清除所有对话记录吗？此操作不可恢复。');
  if (!confirmed) return;

  try {
    const allData = await chrome.storage.local.get(null);
    const keysToRemove = Object.keys(allData).filter(key => key.startsWith('conversation_'));

    await chrome.storage.local.remove(keysToRemove);

    // 显示成功提示
    alert('数据已清除');
  } catch (error) {
    console.error('[AI Chat Navigator] 清除数据失败:', error);
    alert('清除数据失败，请重试');
  }
}

/**
 * 加载设置
 */
async function loadSettings() {
  try {
    const result = await chrome.storage.local.get('expandMode');
    const expandMode = result.expandMode || 'hover'; // 默认hover

    const select = document.getElementById('expand-mode-select');
    if (select) {
      select.value = expandMode;
    }
  } catch (error) {
    console.error('[AI Chat Navigator] 加载设置失败:', error);
  }
}

/**
 * 保存展开方式
 */
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

/**
 * 显示保存成功提示
 */
function showSaveNotification(settingItem) {
  // 移除已存在的通知
  const existing = settingItem.querySelector('.save-notification');
  if (existing) existing.remove();

  // 创建通知
  const notification = document.createElement('div');
  notification.className = 'save-notification';
  notification.textContent = '✓ 已保存';
  settingItem.appendChild(notification);

  // 2秒后移除
  setTimeout(() => {
    notification.remove();
  }, 2000);
}
