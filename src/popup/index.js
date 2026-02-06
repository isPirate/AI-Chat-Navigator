/**
 * AI Chat Navigator - Popup Script
 */

document.addEventListener('DOMContentLoaded', () => {
  initializePopup();
});

function initializePopup() {
  // 检查ChatGPT页面状态
  checkChatGPTStatus();

  // 加载统计数据
  loadStatistics();

  // 绑定按钮事件
  document.getElementById('open-chatgpt').addEventListener('click', openChatGPT);
  document.getElementById('clear-data').addEventListener('click', clearAllData);
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
 * 加载统计数据
 */
async function loadStatistics() {
  try {
    const allData = await chrome.storage.local.get(null);
    const conversations = [];
    let totalMessages = 0;

    Object.keys(allData).forEach((key) => {
      if (key.startsWith('conversation_')) {
        const conversation = allData[key];
        conversations.push(conversation);
        totalMessages += conversation.messages?.length || 0;
      }
    });

    // 动画显示数字
    animateValue('total-conversations', 0, conversations.length, 500);
    animateValue('total-messages', 0, totalMessages, 500);
  } catch (error) {
    console.error('[AI Chat Navigator] 加载统计失败:', error);
  }
}

/**
 * 数字动画
 */
function animateValue(elementId, start, end, duration) {
  const element = document.getElementById(elementId);
  const range = end - start;
  const increment = range / (duration / 16);
  let current = start;

  const timer = setInterval(() => {
    current += increment;
    if (current >= end) {
      element.textContent = end;
      clearInterval(timer);
    } else {
      element.textContent = Math.floor(current);
    }
  }, 16);
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

    // 更新统计显示
    document.getElementById('total-conversations').textContent = '0';
    document.getElementById('total-messages').textContent = '0';

    // 显示成功提示
    alert('数据已清除');
  } catch (error) {
    console.error('[AI Chat Navigator] 清除数据失败:', error);
    alert('清除数据失败，请重试');
  }
}
