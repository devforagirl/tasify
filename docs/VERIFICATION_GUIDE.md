# Tasify — 从零开始的验证步骤指南

> 前提：已安装 Node.js (v18+) 和 Chrome 浏览器。
> 如果你开启了代理（如 127.0.0.1:30008），仅在 npm install 远程依赖时需要。本地运行服务不需要。

---

## 一、确认环境干净

```powershell
# 检查 3000 端口是否被占用（Native Host 默认端口）
netstat -ano | Select-String ":3000" | Select-String "LISTEN"

# 如果有 node 进程占用，查看详情
wmic process where "name='node.exe'" get processid,commandline

# 终止残留进程
Stop-Process -Id <PID> -Force
```

---

## 二、运行单元测试

```powershell
# Frontend tests (Phase 1)
cd frontend
npm test

# Host tests (Phase 2)
cd ../host
npm test
```

期望结果：**Frontend 22 个测试通过，Host 18 个测试通过**，合计 40 个。

---

## 三、链路 A：Phase 2 Native Host（核心桥梁）

### 3.1 启动 Host

```powershell
cd host
node src/index.js
```

正常输出：
```
{"t":"...","level":"INF","msg":"HTTP listener started","data":{"port":3000}}
{"t":"...","level":"INF","msg":"Tasify Native Host started","data":{...}}
```

启动后终端保持运行，不要关闭。

> **注意**：如果遇到端口占用错误（EADDRINUSE），可用以下命令切换端口：
> ```powershell
> $env:TASIFY_PORT=3001; node src/index.js
> ```

### 3.2 健康检查

新开一个终端，执行：

```powershell
curl.exe http://localhost:3000/api/health
```

期望结果：`{"status":"ok","uptime":<秒数>}`

### 3.3 HTTP -> Stdio（模拟 Claude Code 发 Hook）

```powershell
curl.exe -X POST http://localhost:3000/hooks ^
  -H "Content-Type: application/json" ^
  -d "{\"event\":\"on_task_completed\",\"payload\":{\"task_id\":\"t-1\",\"status\":\"success\"}}"
```

期望结果：
- HTTP 返回 200：`{"received":true}`
- Host 终端显示日志：`"hook received"`

### 3.4 Stdio -> Shell（模拟浏览器发指令）

```powershell
cd host
node test-helpers/simulate-chrome.js status
```

期望结果：输出类似 `{"action":"status","exitCode":0,...}` 的结果。

### 3.5 测试完毕

在 Host 终端按 Ctrl+C 关闭。检查是否有残留进程：
```powershell
wmic process where "name='node.exe'" get processid,commandline
```

---

## 四、链路 B：Phase 1 Web Dashboard（独立验证 UI）

### 4.1 启动 Mock Server

```powershell
cd server
npm run dev
```

### 4.2 启动 Dashboard

新开终端：
```powershell
cd frontend
npm run dev
```

### 4.3 浏览器打开

访问 `http://localhost:5173`

期望看到：
- 深色主题 Dashboard
- 状态指示器动态切换（IDLE / EXECUTING / ERROR）
- 任务卡片进度条增长
- 终端事件流自动滚动
- 折线图 Activity Trend 实时更新

### 4.4 点击操作按钮验证

| 按钮 | 预期效果 |
|------|----------|
| Stop | Mock Server 日志显示收到 STOP_TASK |
| Sync | 触发 SYNC_STATE 事件，状态刷新 |
| Mock Hook | 立即触发一次模拟 hook 事件出现在终端 |

### 4.5 测试完毕

两个终端分别按 Ctrl+C 关闭。

---

## 五、链路 C：Phase 3 Chrome Extension（最终集成）

架构示意：
```
Popup (React UI) --chrome.runtime.connect--> Background SW --connectNative--> Native Host
```

### 5.1 构建 Extension

```powershell
cd extension
npm run build
```

期望输出（约 340 kB）：
```
.output/chrome-mv3/
  manifest.json
  popup.html
  background.js
  chunks/popup-xxx.js
  assets/popup-xxx.css
  icons/icon.svg
```

### 5.2 启动 Native Host

这是全程最关键的一步 -- Host 必须在运行中，扩展才能连接。

```powershell
cd host
node src/index.js
```

保持此终端始终运行，不要关闭。

### 5.3 注册 Native Host（仅首次需要）

以管理员身份打开 PowerShell，执行：

```powershell
cd host
powershell -ExecutionPolicy Bypass -File scripts/install-host.ps1
```

期望输出：`Installation complete!`

### 5.4 在 Chrome 中加载插件

1. 打开 `chrome://extensions`
2. 开启右上角 **"开发者模式"**
3. 点击 **"加载已解压的扩展程序"**
4. 选择 `extension/.output/chrome-mv3/` 目录

期望结果：Tasify 图标出现在 Chrome 工具栏。

### 5.5 查看 Popup

点击 Chrome 工具栏的 Tasify 图标。

期望看到：
- 弹出 480px 宽的深色主题窗口
- 状态指示器显示当前状态
- 如果显示 **"Host Not Found"** -- 见下方步骤 5.6

### 5.6 获取 Extension ID 并回填（关键步骤）

1. 在 `chrome://extensions` 中找到 Tasify 卡片
2. 复制显示的 **ID**（如 `abc123...`）
3. 打开 `host/manifest.json`，将 `allowed_origins` 中的占位符替换为真实 ID
4. 重新以管理员身份运行安装脚本：
   ```powershell
   cd host
   powershell -ExecutionPolicy Bypass -File scripts/install-host.ps1
   ```
5. 在 `chrome://extensions` 中点击 Tasify 的刷新按钮
6. 重新点击 Tasify 图标查看 Popup

### 5.7 全链路验证

| 步骤 | 操作 | 期望结果 |
|------|------|----------|
| 1 | 点击 Tasify 图标 | Popup 显示 **"Connected"** 状态 |
| 2 | 点击 **Stop** 按钮 | 终端出现新事件记录 |
| 3 | 点击 **Sync** 按钮 | 状态刷新 |
| 4 | 发送 curl POST /hooks | 事件实时出现在 Popup 终端中 |
| 5 | **关闭** Host（Ctrl+C） | 约 3 秒后 Popup 显示 **"Disconnected"** |
| 6 | **重新启动** Host | 约 3 秒后 Popup 自动恢复 **"Connected"** |

---

## 六、常见问题排查

| 问题 | 可能原因 | 解决方法 |
|------|----------|----------|
| Popup 显示 **"Host Not Found"** | Extension ID 不匹配或 Native Host 未注册 | 确认已运行 install-host.ps1；检查 manifest.json 中的 allowed_origins 是否包含真实 Extension ID |
| connectNative 报错 | 注册表路径不对 | 检查 HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.tasify.claude.host 是否存在，其默认值指向的 JSON 文件是否存在 |
| **端口 3000 被占用** | 之前启动的 Host 没关闭，变成了孤儿进程 | `wmic process where "name='node.exe'" get processid,commandline` 查看，然后 `Stop-Process -Id <PID> -Force` |
| **Host 关闭后 Popup 一直不更新** | Background SW 在 3 秒重连周期内 | 等待最多 3 秒即可自动更新状态 |
| **构建报错** | 依赖问题 | 确认 npm install 已成功执行 |
| npm 安装报 **EPERM** | npm 缓存锁 | `Remove-Item -Recurse -Force "$env:LOCALAPPDATA\npm-cache\_cacache\tmp\"` 后重试 |
| **npm install 超时** | 无法访问 registry | `$env:HTTP_PROXY="http://127.0.0.1:30008"`（仅远程请求时需要） |

---

## 七、一键安装流程（供参考）

```powershell
# 1. 构建
cd extension && npm install && npm run build

# 2. 注册 Native Host（管理员）
cd ../host && powershell -ExecutionPolicy Bypass -File scripts/install-host.ps1

# 3. 启动 Host（新窗口）
node src/index.js

# 4. 在 Chrome 中加载 .output/chrome-mv3/ 目录
# 5. 回填 Extension ID 后重新注册
```

## ??Windows ???????

### 8.1 Native Messaging ???(Byte Order)

Chrome Native Messaging ??? x86 Windows ??? **???(Little-Endian)** ?? 4 ????????????

```powershell
# ?????????:??????? Host
Invoke-WebRequest -Uri http://localhost:3000/hooks -Method POST -ContentType "application/json" `
  -Body '{"hook_event_name":"on_test","payload":{"message":"hello"}}'
```

??? Popup ????????,? Service Worker ?????:
```
nativePort.onDisconnect - Error when communicating with the native messaging host.
```

?? Host ?? stdout ????? Chrome ????????? `buffer-helper.js` ?? `writeUInt32LE`/`readUInt32LE`(?? `writeUInt32BE`/`readUInt32BE`)?

### 8.2 ???? ? ?? Host ??

? `chrome://extensions` ??? Tasify ?? **??** ?? Native Host ??????? Host ???????,?????? 3000????????,Chrome ?????? Host ??,?????????????? HTTP ????

???????:

```powershell
# 1. ?????? 3000 ???
netstat -ano | Select-String ":3000" | Select-String "LISTEN"

# 2. ????(?? <PID> ????? ID)
taskkill /F /PID <PID>

# 3. ???????
netstat -ano | Select-String ":3000"

# 4. ? chrome://extensions ??? Tasify
# 5. ?? Popup ???? "Connected"
```

### 8.3 ?? Popup ?? "Connected" ??????

1. ?? Service Worker ???:`chrome://extensions` ? Tasify ?? ? "Service Worker" ?? ? Console ??
2. ??????(? 8.1)
3. ?? Service Worker ???:
   - ?? `nativePort.onMessage` ? ????? Background,??? Popup ?
   - ?? `onDisconnect - Error when communicating` ? ???????????
   - ?????? ? Native Host ?????,?? Host ? HTTP ???
