# Phase 3 实现计划 — Tasify Chrome Extension (WXT)

## 1. 文件结构

```
extension/
├── package.json
├── wxt.config.ts
├── tsconfig.json
├── .env
├── entrypoints/
│   ├── popup/
│   │   ├── index.html             # Popup 入口 HTML
│   │   ├── main.tsx               # React 挂载点
│   │   ├── App.tsx                # 主布局 (从 Phase 1 App.jsx 迁移)
│   │   ├── components/            # 全部 UI 组件 (从 Phase 1 迁移，零改动)
│   │   │   ├── StatusIndicator.tsx
│   │   │   ├── TaskDetailCard.tsx
│   │   │   ├── EventTerminal.tsx
│   │   │   ├── ControlPanel.tsx
│   │   │   └── DataVisualization.tsx
│   │   ├── services/
│   │   │   └── ChromeRuntimeTransport.ts  # ★ 新增：替换 WebSocketTransport
│   │   └── store/
│   │       └── useClaudeStore.ts   # Zustand store (从 Phase 1 迁移)
│   └── background.ts              # ★ Background Service Worker (核心代码 ~80 行)
├── public/
│   └── icons/
│       └── icon.svg               # SVG 图标 (16/48/128 缩放)
└── dist/                          # wxt build 输出
```

## 2. 实现顺序

### Step 1: WXT 项目骨架
- 创建 package.json、wxt.config.ts、tsconfig.json、.env
- 声明 nativeMessaging + storage 权限
- 安装依赖 (wxt, react, zustand, chart.js, lucide)

### Step 2: Background Service Worker
- 维护与 Native Host 的 `chrome.runtime.connectNative` 长连接
- 管理 Popup 连接池 (chrome.runtime.onConnect)
- 状态快照缓存 + 广播
- 断开自动重连 (3s 间隔)

### Step 3: ChromeRuntimeTransport
- 实现与 WebSocketTransport 相同的接口 (connect/disconnect/on/send/isConnected)
- 通过 `chrome.runtime.connect` 连接到 Background
- 断线自动重连

### Step 4: Popup UI 迁移
- 从 Phase 1 复制所有组件，JSX → TSX
- 迁移 Zustand store，补充 CONNECTING/DISCONNECTED/HOST_NOT_FOUND 三态
- 修改 useClaudeDashboard hook：去掉本地模拟，改为从 Background 获取 STATE_SNAPSHOT
- 迁移 Tailwind 样式

### Step 5: SVG 图标 + 验证
- 生成简单 SVG 图标
- 验证 wxt build 通过
- 验证三个关键链路

## 3. 消息协议 (Popup ↔ Background)

| 方向 | type | 说明 |
|------|------|------|
| Popup→BG | `EXEC_COMMAND` | 执行 claude-code 指令 |
| Popup→BG | `KILL_PROCESS` | 终止当前进程 |
| Popup→BG | `GET_SNAPSHOT` | 请求当前状态快照 |
| BG→Popup | `STATE_SNAPSHOT` | 连接后的首次完整快照 |
| BG→Popup | `CLAUDE_EVENT` | 来自 Native Host 的事件转发 |
| BG→Popup | `CLAUDE_ERROR` | 错误推送 |
| BG→Popup | `CLAUDE_OUTPUT` | Shell stdout/stderr 流 |
| BG→Popup | `CLAUDE_RESULT` | 命令执行完毕 |
| BG→Popup | `STATUS_CHANGE` | 连接状态变更 |

## 4. 关键边界处理

| 场景 | 策略 |
|------|------|
| Native Host 未安装 | Background 检测 runtime.lastError，推送 HOST_NOT_FOUND |
| Popup 关闭时收到事件 | Background 缓存 latestState，下次打开立即恢复 |
| Native Host 崩溃 | onDisconnect → 自动重连 + 推送 DISCONNECTED |
| 快速连续点击按钮 | Background 单通道串行处理，每个指令唯一 msgId |

## 5. 验证清单

1. ✅ 构建通过: `npm run build` 生成 dist/ 无错误
2. ✅ 打包: `npm run zip` 生成 .zip
3. ✅ Popup 按钮 → Background → Native Host → Shell 完整链路
4. ✅ Native Host 断开 → 自动重连 → 状态恢复
5. ✅ 无 Native Host 时 → 显示引导提示