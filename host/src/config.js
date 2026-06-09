// -- Configuration --
// All settings can be overridden via environment variables.
// Some computed properties depend on the current platform.

import { homedir, platform } from "os";
import { join } from "path";

export const config = {
  /** Port for the Express HTTP hooks listener */
  port: parseInt(process.env.TASIFY_PORT || "28934", 10),

  /** Optional shared secret for hook payload validation */
  hookToken: process.env.TASIFY_HOOK_TOKEN || null,

  /** Path to the claude-code CLI binary */
  cliPath: process.env.TASIFY_CLI_PATH || "npx claude-code",

  /** Native Messaging manifest identity */
  hostName: "com.tasify.claude.host",
};

/**
 * Returns the OS-appropriate directory for the Native Messaging Host manifest.
 * - Windows uses the Registry instead; returns null.
 * - macOS: ~/Library/Application Support/Google/Chrome/NativeMessagingHosts/
 * - Linux:  ~/.config/google-chrome/NativeMessagingHosts/
 */
export function getNativeHostDir() {
  const home = homedir();
  switch (platform()) {
    case "darwin":
      return join(home, "Library/Application Support/Google/Chrome/NativeMessagingHosts");
    case "linux":
      return join(home, ".config/google-chrome/NativeMessagingHosts");
    default:
      return null;
  }
}
