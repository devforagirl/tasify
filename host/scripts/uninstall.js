import { execSync } from "child_process";
import { unlinkSync, existsSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { platform, homedir } from "os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const HOST_NAME = "com.tasify.claude.host";
const PKG_ROOT = join(__dirname, "..");

// ---- Platform-specific uninstallers ----

function uninstallWindows() {
  const REG_PATH = `HKCU\\Software\\Google\\Chrome\\NativeMessagingHosts\\${HOST_NAME}`;
  try {
    execSync(`reg delete "${REG_PATH}" /f`, { stdio: "pipe" });
    console.log(`\n  [tasify] Registry key removed: ${REG_PATH}\n`);
  } catch {
    // Key might not exist, fine
  }
}

function uninstallMacOS() {
  const homeDir = homedir();
  const manifestPath = join(homeDir, "Library/Application Support/Google/Chrome/NativeMessagingHosts", `${HOST_NAME}.json`);
  if (existsSync(manifestPath)) {
    unlinkSync(manifestPath);
    console.log(`\n  [tasify] Manifest removed: ${manifestPath}\n`);
  }
}

function uninstallLinux() {
  const homeDir = homedir();
  const manifestPath = join(homeDir, ".config/google-chrome/NativeMessagingHosts", `${HOST_NAME}.json`);
  if (existsSync(manifestPath)) {
    unlinkSync(manifestPath);
    console.log(`\n  [tasify] Manifest removed: ${manifestPath}\n`);
  }
}

// ---- Entry point ----

const currentPlatform = platform();
console.log(`\n  [tasify] Uninstalling for ${currentPlatform}...`);

switch (currentPlatform) {
  case "win32":
    uninstallWindows();
    break;
  case "darwin":
    uninstallMacOS();
    break;
  case "linux":
    uninstallLinux();
    break;
  default:
    console.log(`\n  [tasify] Nothing to clean up for ${currentPlatform}.\n`);
}
