import { execSync } from "child_process";
import { writeFileSync, renameSync, readFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// -- Constants --
const HOST_NAME = "com.tasify.claude.host";
const EXTENSION_ID = "jnheoacefagphgahkdcmlfehcbcfajbe";
const HOOKS_PORT = 28934;
const HOOKS_URL = `http://localhost:${HOOKS_PORT}/hooks`;

const PKG_ROOT = join(__dirname, "..");
const MANIFEST_PATH = join(PKG_ROOT, "com.tasify.claude.host.json");
const HOME_DIR = process.env.USERPROFILE || process.env.HOME;
const CLI_CONFIGS = [
  { dir: join(HOME_DIR, ".claude"), name: "Claude Code" },
  { dir: join(HOME_DIR, ".langcli"), name: "Lang CLI" },
];

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

const HOOKS_CONFIG = {
  hooks: {
    SessionStart: [
      {
        hooks: [
          {
            type: "http",
            url: HOOKS_URL,
            timeout: 10,
            headers: {
              "Content-Type": "application/json",
              "X-Source": "tasify",
            },
          },
        ],
      },
    ],
    UserPromptSubmit: [
      {
        hooks: [
          {
            type: "http",
            url: HOOKS_URL,
            timeout: 30,
          },
        ],
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
      fail(`Failed to parse ${settingsPath}.

  Please check the file for syntax errors and run again:
    npm install -g @tasify/host`);
    }
  } else {
    merged = HOOKS_CONFIG;
  }

  safeWrite(settingsPath, JSON.stringify(merged, null, 2));
  console.log(`    [${label}] → ${settingsPath}`);
}

// ---- Step 1: Platform check ----
if (process.platform !== "win32") {
  console.log("\n  [tasify] This package currently supports Windows only.");
  console.log("  Skipping installation.\n");
  process.exit(0);
}

// ---- Step 2: Generate Native Host Manifest ----
const manifest = {
  name: HOST_NAME,
  description: "Tasify Native Messaging Host",
  path: join(PKG_ROOT, "scripts", "run-host.bat"),
  type: "stdio",
  allowed_origins: [`chrome-extension://${EXTENSION_ID}/`],
};

// ---- Step 3: Safe Write Manifest ----
console.log(`\n  [tasify] Writing Native Host manifest...`);
safeWrite(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
console.log(`    → ${MANIFEST_PATH}`);

// ---- Step 4: Write registry ----
console.log(`  [tasify] Registering Native Messaging Host in registry...`);
const REG_PATH = `HKCU\\Software\\Google\\Chrome\\NativeMessagingHosts\\${HOST_NAME}`;
try {
  execSync(`reg add "${REG_PATH}" /ve /d "${MANIFEST_PATH}" /f`, { stdio: "pipe" });
  console.log(`    → ${REG_PATH}`);
} catch {
  fail(`Failed to write registry key.

  Please run Windows Terminal as Administrator and try again:
    reg add "${REG_PATH}" /ve /d "${MANIFEST_PATH}" /f`);
}

// ---- Step 5: Write hooks configs ----
console.log(`  [tasify] Configuring CLI hooks...`);
for (const { dir, name } of CLI_CONFIGS) {
  writeSettings(join(dir, "settings.json"), name);
}

// ---- Step 6: Print summary ----
console.log(`
  ┌─────────────────────────────────────────────────────────┐
  │  Tasify Native Host installed successfully!             │
  └─────────────────────────────────────────────────────────┘

  Host manifest:  ${MANIFEST_PATH}
  Hooks endpoint: ${HOOKS_URL}
  Extension ID:   ${EXTENSION_ID}

  Supported CLIs:
    - Claude Code (~/.claude/settings.json)
    - Lang CLI   (~/.langcli/settings.json)

  Next steps:
    1. Open chrome://extensions
    2. Reload the Tasify Extension
    3. Open the Tasify popup — you should see "Connected"

  To start the host manually:  tasify-host
  To uninstall:                npm uninstall -g @tasify/host
`);
