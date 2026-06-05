# Claude Code + Tasify 全链路配置指南

## 前置确认

在开始前，请确认以下项目均已完成：

- [ ] Chrome Extension 已加载（chrome://extensions 中有 Tasify）
- [ ] Popup 显示 "Connected" 状态
- [ ] Native Host 已注册（install-host.ps1 成功执行）
- [ ] .claude/settings.local.json 文件已创建

---

## 第一步：安装 Claude Code CLI

打开 PowerShell，执行：

`powershell
npm install -g @anthropic-ai/claude-code
`

安装完成后验证：

`powershell
claude --version
`

> 如果 claude 命令找不到，关闭并重新打开 PowerShell 再试。

---

## 第二步：确认配置文件

文件已创建在 D:\GitHub\Tasify\.claude\settings.local.json。

> 因为 .local.json 结尾，它会被 .gitignore 忽略，不会误提交到仓库。

用以下命令查看文件内容：

`powershell
type D:\GitHub\Tasify\.claude\settings.local.json
`

---

## 第三步：启动 Native Host

打开一个终端（保持运行，不要关闭）：

`powershell
cd D:\GitHub\Tasify\host
node src/index.js
`

看到以下输出表示启动成功：

`
[tasify] HTTP listener ready on port 3000
[tasify] ready
`

---

## 第四步：启动 Claude Code

新开一个终端，在 Tasify 项目根目录启动（这样才能加载项目级的 Hook 配置）：

`powershell
cd D:\GitHub\Tasify
claude
`

等待 Claude Code 加载完成。

---

## 第五步：验证连接

### 自动触发的事件

Claude Code 启动后会自动触发 SessionStart 事件。

### 手动验证

在 Claude Code 中输入任意问题，比如：

`
What is this project about?
`

### 观察 Popup

查看 Tasify Popup 的 Events 终端，应该能看到事件记录。

---

## 常见问题排查

| 问题 | 原因 | 解决方法 |
|------|------|----------|
| Popup 显示 "Disconnected" | Native Host 没有运行 | cd host && node src/index.js 启动 |
| 没有看到任何事件 | Claude Code 和 Tasify 不在同一目录 | 确认 claude 在 D:\GitHub\Tasify 下运行 |
| Claude Code 报连接被拒绝 | 3000 端口被占用 | netstat -ano 查看并释放端口 |
| 切换到其他目录了 | Hook 配置只在 .claude/ 所在目录生效 | 每次都在 D:\GitHub\Tasify 运行 claude |

---

## 完整验证清单

- [ ] claude --version 输出正常
- [ ] node src/index.js 显示 "ready"
- [ ] Chrome Extension 显示 "Connected"
- [ ] 在 Tasify 目录下运行 claude
- [ ] Popup Events 终端出现事件
- [ ] 在 Host 终端能看到 "hook received" 日志

全部通过后，Tasify 全链路即正式跑通！
