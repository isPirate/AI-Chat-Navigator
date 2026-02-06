/**
 * AI Chat Navigator - Background Service Worker
 * 后台服务，处理数据持久化和跨标签页通信
 */

// 插件安装时
chrome.runtime.onInstalled.addListener((details) => {
  console.log('[AI Chat Navigator] 插件已安装', details);

  if (details.reason === 'install') {
    // 首次安装，打开欢迎页面
    chrome.tabs.create({
      url: 'https://chat.openai.com/'
    });
  }
});

// 监听来自content script的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[AI Chat Navigator] 收到消息:', request);

  switch (request.action) {
    case 'saveData':
      saveConversationData(request.data)
        .then(() => sendResponse({ success: true }))
        .catch((error) => sendResponse({ success: false, error: error.message }));
      return true; // 保持消息通道开放

    case 'loadData':
      loadConversationData(request.conversationId)
        .then((data) => sendResponse({ success: true, data }))
        .catch((error) => sendResponse({ success: false, error: error.message }));
      return true;

    case 'clearData':
      clearConversationData(request.conversationId)
        .then(() => sendResponse({ success: true }))
        .catch((error) => sendResponse({ success: false, error: error.message }));
      return true;

    default:
      sendResponse({ success: false, error: '未知操作' });
  }
});

/**
 * 保存对话数据
 */
async function saveConversationData(data) {
  try {
    const { conversationId, messages } = data;
    await chrome.storage.local.set({
      [`conversation_${conversationId}`]: {
        messages,
        updatedAt: new Date().toISOString()
      }
    });
    console.log('[AI Chat Navigator] 数据已保存');
  } catch (error) {
    console.error('[AI Chat Navigator] 保存数据失败:', error);
    throw error;
  }
}

/**
 * 加载对话数据
 */
async function loadConversationData(conversationId) {
  try {
    const result = await chrome.storage.local.get(`conversation_${conversationId}`);
    return result[`conversation_${conversationId}`] || { messages: [] };
  } catch (error) {
    console.error('[AI Chat Navigator] 加载数据失败:', error);
    throw error;
  }
}

/**
 * 清除对话数据
 */
async function clearConversationData(conversationId) {
  try {
    await chrome.storage.local.remove(`conversation_${conversationId}`);
    console.log('[AI Chat Navigator] 数据已清除');
  } catch (error) {
    console.error('[AI Chat Navigator] 清除数据失败:', error);
    throw error;
  }
}

/**
 * 获取所有对话列表
 */
async function getAllConversations() {
  try {
    const allData = await chrome.storage.local.get();
    const conversations = [];

    Object.keys(allData).forEach((key) => {
      if (key.startsWith('conversation_')) {
        conversations.push({
          id: key.replace('conversation_', ''),
          ...allData[key]
        });
      }
    });

    return conversations;
  } catch (error) {
    console.error('[AI Chat Navigator] 获取对话列表失败:', error);
    throw error;
  }
}

/**
 * 清理旧数据（超过30天）
 */
async function cleanOldData() {
  try {
    const allData = await chrome.storage.local.get();
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

    Object.keys(allData).forEach((key) => {
      if (key.startsWith('conversation_')) {
        const conversation = allData[key];
        const updatedAt = new Date(conversation.updatedAt).getTime();

        if (updatedAt < thirtyDaysAgo) {
          chrome.storage.local.remove(key);
          console.log('[AI Chat Navigator] 清理旧数据:', key);
        }
      }
    });
  } catch (error) {
    console.error('[AI Chat Navigator] 清理旧数据失败:', error);
  }
}

// 每天清理一次旧数据
chrome.alarms.create('cleanOldData', { periodInMinutes: 1440 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'cleanOldData') {
    cleanOldData();
  }
});

// 插件启动时执行一次清理
cleanOldData();

// 当扩展重新加载时，通知所有ChatGPT页面刷新
chrome.runtime.onStartup.addListener(async () => {
  console.log('[AI Chat Navigator] 扩展启动，刷新ChatGPT页面');
  const tabs = await chrome.tabs.query({ url: ['https://chat.openai.com/*', 'https://chatgpt.com/*'] });
  tabs.forEach(tab => {
    chrome.tabs.reload(tab.id);
  });
});

console.log('[AI Chat Navigator] Background Service Worker 已启动');
