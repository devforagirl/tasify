# Cross-Platform Support Design

> Adding Linux and macOS support to Tasify.
> Goal: `@tasify/host` installs and runs on all three platforms from a single npm package,
> auto-detecting the OS during postinstall and executing the correct setup path.

---

## 1. Current Windows-Specific Coupling

| Module | File | Windows-Specific Logic |
|---|---|---|
| Postinstall | `host/scripts/postinstall.js` | `reg add` for Native Messaging Host registry; hardcoded `run-host.bat` path |
| Uninstall | `host/scripts/uninstall.js` | `reg delete` for registry key removal |
| Install script | `host/scripts/install-host.ps1` | PowerShell + Registry |
| Uninstall script | `host/scripts/uninstall-host.ps1` | PowerShell + Registry |
| Launcher | `host/scripts/run-host.bat` | Windows Batch |
| Manifest target | `host/scripts/postinstall.js` | Writing manifest to package root (for Registry `path` pointer); other OSes write to Chrome config dirs |
| Hook config path | `host/scripts/postinstall.js` | `~/.claude/settings.json` and `~/.langcli/settings.json` are already cross-platform (uses `HOME`) |

**All runtime code** (stdio-bridge, http-listener, shell-executor, logger, config) is pure Node.js and already cross-platform. Zero runtime changes are needed.

---

## 2. Change Overview

### 2.1 New Files

```
host/scripts/
├── run-host.sh              # macOS / Linux launcher (replaces run-host.bat on Unix)
├── install-host.sh           # macOS / Linux manual install (replaces install-host.ps1)
├── uninstall-host.sh         # macOS / Linux manual uninstall (replaces uninstall-host.ps1)
├── install-host.ps1          # [keep] Windows only
├── uninstall-host.ps1        # [keep] Windows only
├── run-host.bat              # [keep] Windows only
├── run-host.js               # [keep] Cross-platform Node.js entry
├── postinstall.js            # [modify] Three-way platform dispatch
└── uninstall.js              # [modify] Three-way platform dispatch
```

### 2.2 Modified Files

| File | Change |
|---|---|
| `host/scripts/postinstall.js` | Dispatch on `process.platform` to win32 / darwin / linux branches |
| `host/scripts/uninstall.js` | Same dispatch for cleanup |
| `host/scripts/run-host.js` | Minor: resolve launcher path dynamically instead of assuming `.bat` |
| `host/src/config.js` | Add `nativeHostDir` getter that returns the OS-appropriate manifest directory |
| `host/package.json` | Add `run-host.sh` to `files` array |

---

## 3. Native Messaging Host Manifest Locations

Chrome (and Chromium-based browsers) look for the host manifest at OS-specific paths:

### Windows (existing)

```
Registry: HKCU\Software\Google\Chrome\NativeMessagingHosts\com.tasify.claude.host
  → (Default) = <package-root>\com.tasify.claude.host.json
```

### macOS

```
User level (recommended, no sudo):
  ~/Library/Application Support/Google/Chrome/NativeMessagingHosts/com.tasify.claude.host.json

System level (requires sudo):
  /Library/Google/Chrome/NativeMessagingHosts/com.tasify.claude.host.json
```

### Linux

```
User level (recommended, no sudo):
  ~/.config/google-chrome/NativeMessagingHosts/com.tasify.claude.host.json

System level (requires sudo):
  /etc/opt/chrome/native-messaging-hosts/com.tasify.claude.host.json
```

**Decision:** Install to user-level paths by default. No sudo needed. Offer a separate script for system-level installation.

---

## 4. Launcher Scripts

### macOS / Linux: `run-host.sh`

```bash
#!/usr/bin/env bash
# Tasify Native Messaging Host — Unix launcher
# Chrome spawns this process for stdio Native Messaging.
# We delegate to the Node.js runtime.

DIR="$(cd "$(dirname "$0")" && pwd)"
exec node "$DIR/../src/index.js"
```

### Manifest `path` field by platform

| OS | Manifest path value |
|---|---|
| Windows | `<pkg-root>/scripts/run-host.bat` |
| macOS | `<pkg-root>/scripts/run-host.sh` |
| Linux | `<pkg-root>/scripts/run-host.sh` |

---

## 5. Postinstall Logic Refactor

### Current (`host/scripts/postinstall.js`)

The entire script is Windows-only: it uses `execSync("reg add ...")`, references `run-host.bat`, and includes a `process.platform !== "win32"` early exit.

### Planned Dispatch

```javascript
import { platform } from "os";
import { join } from "path";

switch (platform()) {
  case "win32":
    await installWindows();
    break;
  case "darwin":
    await installMacOS();
    break;
  case "linux":
    await installLinux();
    break;
  default:
    console.log(`[tasify] Unsupported platform: ${platform()}`);
    process.exit(0);
}

// Shared helper — injects hooks into ~/.claude/settings.json and ~/.langcli/settings.json
await configureClaudeHooks();
```

### `installWindows()` — Existing Logic (extracted)

```
1. Write manifest JSON to <pkg-root>/com.tasify.claude.host.json
   (path points to run-host.bat)
2. reg add HKCU\Software\Google\Chrome\NativeMessagingHosts\...
3. Print next steps
```

### `installMacOS()` — New

```
1. Ensure manifest directory exists:
   mkdir -p ~/Library/Application Support/Google/Chrome/NativeMessagingHosts/

2. Write manifest JSON to that directory:
   {
     "name": "com.tasify.claude.host",
     "description": "Tasify Native Messaging Host",
     "path": "<pkg-root>/scripts/run-host.sh",
     "type": "stdio",
     "allowed_origins": ["chrome-extension://jnheoacefagphgahkdcmlfehcbcfajbe/"]
   }

3. chmod +x <pkg-root>/scripts/run-host.sh

4. Print success message with next steps
```

### `installLinux()` — New

```
1. Ensure manifest directory exists:
   mkdir -p ~/.config/google-chrome/NativeMessagingHosts/

2. Write manifest JSON (same structure as macOS, path to run-host.sh)

3. chmod +x <pkg-root>/scripts/run-host.sh

4. Print success message
```

### `uninstall.js` Refactor

```javascript
switch (platform()) {
  case "win32":
    execSync(`reg delete "HKCU\\Software\\Google\\Chrome\\NativeMessagingHosts\\${HOST_NAME}" /f`);
    break;
  case "darwin":
    fs.unlinkSync("~/Library/Application Support/Google/Chrome/NativeMessagingHosts/com.tasify.claude.host.json");
    break;
  case "linux":
    fs.unlinkSync("~/.config/google-chrome/NativeMessagingHosts/com.tasify.claude.host.json");
    break;
}
```

---

## 6. Multi-Browser Support

Users on Linux and macOS may use Chromium, Brave, Edge, or Vivaldi. Each has a different Native Messaging manifest path:

| Browser | macOS | Linux |
|---|---|---|
| Google Chrome | `~/Library/Application Support/Google/Chrome/...` | `~/.config/google-chrome/...` |
| Chromium | `~/Library/Application Support/Chromium/...` | `~/.config/chromium/...` |
| Brave | `~/Library/Application Support/BraveSoftware/Brave-Browser/...` | `~/.config/BraveSoftware/Brave-Browser/...` |
| Microsoft Edge | `~/Library/Application Support/Microsoft Edge/...` | `~/.config/microsoft-edge/...` |
| Vivaldi | `~/Library/Application Support/Vivaldi/...` | `~/.config/vivaldi/...` |

**Implementation plan:**

- **Default:** Register for Google Chrome only (safest, covers the majority of users)
- **Environment override:** `TASIFY_BROWSER=brave` or `TASIFY_BROWSER=chromium`
- **Batch registration:** A helper script `register-all-browsers.sh` that iterates over all known browser paths
- **Extension ID:** The same ID (`jnheoacefagphgahkdcmlfehcbcfajbe`) is used across all manifests

---

## 7. Impact on Existing Modules

### 7.1 `host/src/config.js` — Add `nativeHostDir`

```javascript
get nativeHostDir() {
  const home = process.env.HOME || process.env.USERPROFILE;
  switch (process.platform) {
    case "darwin":
      return join(home, "Library/Application Support/Google/Chrome/NativeMessagingHosts");
    case "linux":
      return join(home, ".config/google-chrome/NativeMessagingHosts");
    default:
      return null; // Windows uses Registry
  }
}
```

### 7.2 Runtime modules — No changes needed

| Module | Reason |
|---|---|
| `stdio-bridge.js` | Pure Node.js stdin/stdout, already portable |
| `http-listener.js` | Express + http module, already portable |
| `shell-executor.js` | `shell: true` + `windowsHide: true` — `windowsHide` is ignored on Unix, no-op |
| `logger.js` | `process.stderr.write`, already portable |
| `buffer-helper.js` | Buffer API, already portable |

### 7.3 Extension + Frontend — No changes needed

Chrome extension code (`extension/`) and dashboard (`frontend/`) contain no OS-specific logic.

---

## 8. `package.json` Changes

```json
{
  "name": "@tasify/host",
  "version": "1.1.0",
  "files": [
    "src/",
    "scripts/",
    "package.json",
    "com.tasify.claude.host.json"
  ]
}
```

- `"os"` field is intentionally omitted — the package can be installed on any OS; unsupported platforms just skip registration silently
- `com.tasify.claude.host.json` stays in the package root for Windows (Registry path pointer); macOS/Linux write their own manifests to Chrome config dirs

---

## 9. Implementation Steps

### Phase 1 — Core Installation (estimated 2-3 days)

1. Create `host/scripts/run-host.sh` with execute permission
2. Refactor `postinstall.js`: extract Windows logic into `installWindows()`, implement `installMacOS()` and `installLinux()`
3. Refactor `uninstall.js`: same three-way dispatch
4. Add `nativeHostDir` to `config.js`
5. Update `package.json` `files` array
6. Test on Windows (regression), macOS Intel, macOS Apple Silicon, Linux (Ubuntu + Fedora)

### Phase 2 — Multi-Browser Support (estimated 1 day)

1. Create `host/scripts/register-all-browsers.sh`
2. Support `TASIFY_BROWSER` env var in `postinstall.js`
3. Add browser lookup table mapping browser name → manifest directory per OS

### Phase 3 — Headless / CI Support (estimated 0.5 day)

1. Detect `DISPLAY` (Linux) or `CI` env vars
2. Skip browser-related steps in non-graphical environments, still configure Claude Code hooks

### Phase 4 — Testing & Docs (estimated 1 day)

1. Manual testing on macOS (Intel + Apple Silicon)
2. Manual testing on Linux (Ubuntu, Fedora)
3. Update README FAQ — replace "Currently Windows only" with platform-specific guidance
4. Add Linux/macOS installation notes to Quick Start

---

## 10. Risks and Mitigations

| Risk | Mitigation |
|---|---|
| macOS `~/Library/Application Support/` contains spaces | Always quote paths in shell scripts and JavaScript |
| Linux distro variations (Snap/Flatpak Chrome paths) | Probe `which google-chrome` / `which google-chrome-stable`; fall back to standard path; document Snap workaround |
| macOS Gatekeeper / SIP | Scripts run under Node.js, not as standalone binaries; avoid SIP-protected directories (use user-level paths) |
| `~/.claude/` directory may not exist | `postinstall.js` already uses `mkdirSync(dirname(settingsPath), { recursive: true })` — safe |
| Permission denied writing to Chrome config dir | Create directory with `{ recursive: true }` — `~/Library/Application Support/` is user-writable by default |
| Users on non-Chrome browsers (e.g., Arc, Opera) | Document how to find the manifest path for their browser; accept PRs for new browsers |

---

## 11. Backward Compatibility

- Windows Registry path and manifest location are unchanged
- `run-host.bat` is retained — existing Windows installations are unaffected
- `install-host.ps1` and `uninstall-host.ps1` retained for users who need standalone registry management
- The manifest JSON schema (`name`, `description`, `path`, `type`, `allowed_origins`) is unchanged across all platforms
- The hook injection logic (`configureClaudeHooks()`) is extracted as a shared function, keeping the same JSON structure for `~/.claude/settings.json`

---

## Summary

The cross-platform implementation touches only the install/uninstall layer (3 files modified, 3 new shell scripts) and leaves all runtime code untouched. A single `postinstall.js` dispatch function routes to the appropriate OS handler, keeping the Windows path fully backward-compatible while adding macOS and Linux support in one minor version bump.
