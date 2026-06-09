import { execSync } from "child_process";
import { writeFileSync, renameSync, readFileSync, existsSync, mkdirSync, chmodSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { platform, homedir } from "os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// -- Constants --
const HOST_NAME = "com.tasify.claude.host";
const EXTENSION_ID = "jnheoacefagphgahkdcmlfehcbcfajbe";
const HOOKS_PORT = 28934;
const HOOKS_URL = `http://localhost:${HOOKS_PORT}/hooks`;
const PKG_ROOT = join(__dirname, "..");

// -- Helpers --
function fail(msg) {
  console.error(`\n  Error: ${msg}`);
  process.exit(1);
}

function safeWrite(filePath, data) {
  const tmp = filePath + ".tmp";
  writeFileSync(tmp, data, "utf-8");
  renameSync(tmp, filePath);
}

// -- Hooks config (shared across all platforms) --
const HOOKS_CONFIG = {
  hooks: {
    SessionStart: [
      {
        hooks: [
          {
            type: "http",
            url: HOOKS_URL,
            timeout: 10,
            headers: { "Content-Type": "application/json", "X-Source": "tasify" },
          },
        ],
      },
    ],
    UserPromptSubmit: [
      {
        hooks: [{ type: "http", url: HOOKS_URL, timeout: 30 }],
      },
    ],
    PreToolUse: [
      {
        matcher: "Bash",
        hooks: [{ type: "http", url: HOOKS_URL, timeout: 10 }],
      },
      {
        matcher: "Edit|Write",
        hooks: [{ type: "http", url: HOOKS_URL, timeout: 10 }],
      },
    ],
    PostToolUse: [
      {
        hooks: [{ type: "http", url: HOOKS_URL, timeout: 10 }],
      },
    ],
    PermissionRequest: [
      {
        hooks: [{ type: "http", url: HOOKS_URL, timeout: 86400 }],
      },
    ],
    Stop: [
      {
        hooks: [{ type: "http", url: HOOKS_URL, timeout: 10 }],
      },
    ],
    SessionEnd: [
      {
        hooks: [{ type: "http", url: HOOKS_URL, timeout: 5 }],
      },
    ],
  },
};

function writeSettings(settingsPath, label) {
  if (!existsSync(dirname(settingsPath))) {
    mkdirSync(dirname(settingsPath), { recursive: true });
  }

  let merged;
  if (existsSync(settingsPath)) {
    try {
      const raw = readFileSync(settingsPath, "utf-8");
      const existing = JSON.parse(raw);
      merged = { ...existing, hooks: HOOKS_CONFIG.hooks };
    } catch {
      fail(`Failed to parse ${settingsPath}.`);
    }
  } else {
    merged = HOOKS_CONFIG;
  }

  safeWrite(settingsPath, JSON.stringify(merged, null, 2));
  console.log(`    [${label}] -> ${settingsPath}`);
}

function configureClaudeHooks() {
  console.log(`  [tasify] Configuring CLI hooks...`);
  const homeDir = homedir();
  const CLI_CONFIGS = [
    { dir: join(homeDir, ".claude"), name: "Claude Code" },
    { dir: join(homeDir, ".langcli"), name: "Lang CLI" },
  ];
  for (const { dir, name } of CLI_CONFIGS) {
    writeSettings(join(dir, "settings.json"), name);
  }
}

function printSummaryWindows(manifestPath) {
  console.log(`
  +- Tasify Native Host installed successfully! -+

  Host manifest:  ${manifestPath}
  Hooks endpoint: ${HOOKS_URL}
  Extension ID:   ${EXTENSION_ID}

  Supported CLIs:
    - Claude Code (~/.claude/settings.json)
    - Lang CLI   (~/.langcli/settings.json)

  Next steps:
    1. Open chrome://extensions
    2. Reload the Tasify Extension
    3. Open the Tasify popup - you should see "Connected"

  To uninstall: npm uninstall -g @tasify/host
`);
}

function printSummaryUnix(manifestPath) {
  console.log(`
  +- Tasify Native Host installed successfully! -+

  Host manifest:  ${manifestPath}
  Hooks endpoint: ${HOOKS_URL}
  Extension ID:   ${EXTENSION_ID}

  Supported CLIs:
    - Claude Code (~/.claude/settings.json)
    - Lang CLI   (~/.langcli/settings.json)

  Next steps:
    1. Open chrome://extensions
    2. Enable Developer mode
    3. Load unpacked extension from the extension/ directory
    4. Open the Tasify popup - you should see "Connected"

  To uninstall: npm uninstall -g @tasify/host
`);
}

// ---- Platform-specific installers ----

function installWindows() {
  const launcherPath = join(PKG_ROOT, "scripts", "run-host.bat");
  const manifestPath = join(PKG_ROOT, `${HOST_NAME}.json`);

  // Generate manifest
  const manifest = {
    name: HOST_NAME,
    description: "Tasify Native Messaging Host",
    path: launcherPath,
    type: "stdio",
    allowed_origins: [`chrome-extension://${EXTENSION_ID}/`],
  };

  console.log(`\n  [tasify] Writing Native Host manifest...`);
  safeWrite(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`    -> ${manifestPath}`);

  // Write registry
  console.log(`  [tasify] Registering Native Messaging Host in registry...`);
  const REG_PATH = `HKCU\\Software\\Google\\Chrome\\NativeMessagingHosts\\${HOST_NAME}`;
  try {
    execSync(`reg add "${REG_PATH}" /ve /d "${manifestPath}" /f`, { stdio: "pipe" });
    console.log(`    -> ${REG_PATH}`);
  } catch {
    fail(`Failed to write registry key. Please run as Administrator.`);
  }

  configureClaudeHooks();
  printSummaryWindows(manifestPath);
}

function installMacOS() {
  const homeDir = homedir();
  const manifestDir = join(homeDir, "Library/Application Support/Google/Chrome/NativeMessagingHosts");
  const launcherPath = join(PKG_ROOT, "scripts", "run-host.sh");
  const manifestPath = join(manifestDir, `${HOST_NAME}.json`);

  // Ensure run-host.sh is executable
  chmodSync(launcherPath, 0o755);

  // Generate manifest
  const manifest = {
    name: HOST_NAME,
    description: "Tasify Native Messaging Host",
    path: launcherPath,
    type: "stdio",
    allowed_origins: [`chrome-extension://${EXTENSION_ID}/`],
  };

  console.log(`\n  [tasify] Writing Native Host manifest...`);
  mkdirSync(manifestDir, { recursive: true });
  safeWrite(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`    -> ${manifestPath}`);

  configureClaudeHooks();
  printSummaryUnix(manifestPath);
}

function installLinux() {
  const homeDir = homedir();
  const manifestDir = join(homeDir, ".config/google-chrome/NativeMessagingHosts");
  const launcherPath = join(PKG_ROOT, "scripts", "run-host.sh");
  const manifestPath = join(manifestDir, `${HOST_NAME}.json`);

  // Ensure run-host.sh is executable
  chmodSync(launcherPath, 0o755);

  // Generate manifest
  const manifest = {
    name: HOST_NAME,
    description: "Tasify Native Messaging Host",
    path: launcherPath,
    type: "stdio",
    allowed_origins: [`chrome-extension://${EXTENSION_ID}/`],
  };

  console.log(`\n  [tasify] Writing Native Host manifest...`);
  mkdirSync(manifestDir, { recursive: true });
  safeWrite(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`    -> ${manifestPath}`);

  configureClaudeHooks();
  printSummaryUnix(manifestPath);
}

// ---- Entry point ----

const currentPlatform = platform();
console.log(`\n  [tasify] Installing for ${currentPlatform}...`);

switch (currentPlatform) {
  case "win32":
    installWindows();
    break;
  case "darwin":
    installMacOS();
    break;
  case "linux":
    installLinux();
    break;
  default:
    console.log(`\n  [tasify] Unsupported platform: ${currentPlatform}. Skipping installation.\n`);
    process.exit(0);
}
