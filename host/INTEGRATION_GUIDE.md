# Tasify Native Messaging Host â€” Integration Guide

## Overview

The Tasify Native Host is a Node.js application that acts as a bridge between
Claude Code (CLI) and Chrome Extensions using Chrome's Native Messaging protocol.

## Architecture

Claude Code (HTTP POST) â†’ Native Host (Express) â†’ Chrome Extension (Stdio)
Chrome Extension (Stdio) â†’ Native Host (Shell Exec) â†’ Claude Code (CLI)

## Prerequisites

- Node.js 18+ (LTS recommended)
- npm
- Chrome/Chromium browser
- Claude Code CLI (for full integration)

## Installation

### 1. Install dependencies

```bash
cd host
npm install
```

### 2. Register the Native Messaging Host

On Windows (run as Administrator):

```powershell
# With auto-detected paths:
powershell -ExecutionPolicy Bypass -File scripts\install-host.ps1

# Or specify paths explicitly:
powershell -ExecutionPolicy Bypass -File scripts\install-host.ps1 -HostDir "C:\path\to\tasify\host" -ExtensionId "your-extension-id"
```

On macOS/Linux:
*(Scripts not yet provided for these platforms)*

### 3. Start the host

```bash
cd host
node src/index.js
```

The host will start on port 28934 by default. Override with TASIFY_PORT env var.

## Testing

### Test HTTPâ†’Stdio forwarding

```bash
curl -X POST http://localhost:28934/hooks \
  -H "Content-Type: application/json" \
  -d '{"event":"on_task_completed","payload":{"task_id":"t-1","status":"success"}}'
```

### Test Stdioâ†’Shell execution

```bash
node test-helpers/simulate-chrome.js status
```

This simulates a Chrome Extension sending an EXEC_COMMAND via stdin/stdout.

### Run test suite

```bash
cd host
npm test
```

## Configuration

| Env Variable | Default | Description |
|---|---|---|
| TASIFY_PORT | 28934 | HTTP listener port for Claude Code hooks |
| TASIFY_HOOK_TOKEN | (none) | Optional Bearer token for hook validation |
| TASIFY_CLI_PATH | npx claude-code | Path to claude-code binary |
| LOG_LEVEL | INFO | Log level (DEBUG, INFO, WARN, ERROR) |

## Protocol Details

### Message framing (Chrome Native Messaging)

All messages use the standard Chrome Native Messaging framing:
[4-byte Uint32BE length][UTF-8 JSON body]

This applies to both directions (Host â†’ Browser and Browser â†’ Host).

### Supported commands (Browser â†’ Host)

| type | Description |
|---|---|
| EXEC_COMMAND | Execute a claude-code subcommand (`command` field) |
| KILL_PROCESS | Terminate the currently running child process |

### Events emitted (Host â†’ Browser)

| type | Description |
|---|---|
| CLAUDE_EVENT | Forwarded from Claude Code HTTP hook |
| CLAUDE_OUTPUT | stdout/stderr stream from claude-code process |
| CLAUDE_RESULT | Final result with exit code, stdout, stderr |
| CLAUDE_ERROR | Error from spawning or running claude-code |

## Troubleshooting

### Common issues

1. **"Native host not found" in Chrome**
   - Verify the registry key exists at `HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.tasify.claude.host`
   - Verify the manifest JSON file at the path stored in registry
   - Check that `path` in manifest points to `src/index.js`

2. **Port 28934 already in use**
   - Set TASIFY_PORT to a different value: `$env:TASIFY_PORT=3001`

3. **Node.js process doesn't exit when Chrome closes**
   - The host monitors stdin for close events. If it doesn't exit,
     it may mean the Native Messaging connection wasn't properly established.

4. **Permission errors**
   - The host process inherits Chrome's permissions. If claude-code needs
     elevated access, you may need to run Chrome as Administrator.
