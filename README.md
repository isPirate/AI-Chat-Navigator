# AI Chat Navigator

一款浏览器插件，帮助你在ChatGPT页面中快速导航和定位历史对话。

## 功能特性

- ✅ 只记录用户消息（不记录AI回复）
- 侧边栏导航面板，显示序号和消息摘要
- 快速定位到任意用户输入
- 搜索和过滤对话内容
- 快捷键操作
- 自动检测对话切换并重置
- 数据持久化存储

## 安装方法

### 开发模式安装

1. 克隆或下载此项目
2. 打开Chrome浏览器，进入 `chrome://extensions/`
3. 开启右上角的「开发者模式」
4. 点击「加载已解压的扩展程序」
5. 选择项目根目录
6. 插件安装完成

## 使用方法

### 基本使用

1. 访问 [ChatGPT](https://chat.openai.com/)
2. 插件会自动记录你的对话
3. 点击右侧的导航栏查看所有对话记录
4. 点击任意消息可快速定位到该位置

### 快捷键

- `Alt + N`: 切换导航栏显示/隐藏
- `Alt + S`: 聚焦搜索框

### 搜索功能

在导航栏的搜索框中输入关键词，可以实时过滤对话内容。

## 技术栈

- **Manifest V3**: 最新版Chrome扩展API
- **Vanilla JavaScript**: 无框架依赖
- **Chrome Storage API**: 数据持久化
- **MutationObserver**: 监听DOM变化

## 项目结构

```
ai-chat-navigator/
├── manifest.json              # 插件配置文件
├── src/
│   ├── content/
│   │   ├── index.js          # 注入脚本
│   │   └── style.css         # 注入样式
│   ├── background/
│   │   └── index.js          # 后台服务
│   ├── popup/
│   │   ├── index.html        # 弹出页面
│   │   ├── style.css         # 弹出页面样式
│   │   └── index.js          # 弹出页面逻辑
│   └── utils/
│       └── storage.js        # 存储工具（待实现）
└── icons/                    # 图标文件（待添加）
```

## 开发计划

- [X] 基础框架搭建
- [X] 消息捕获功能
- [X] 导航侧边栏
- [X] 搜索功能
- [ ] 添加插件图标
- [ ] 支持更多AI平台（Claude、Gemini等）
- [ ] 导出对话记录
- [ ] 深色/浅色主题切换
- [ ] 设置页面

## 常见问题

### 插件不工作？

1. 确保在ChatGPT页面使用
2. 刷新页面重试
3. 检查浏览器控制台是否有错误

### 如何清除数据？

点击插件图标，在弹出窗口中点击「清除数据」按钮。

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request！
