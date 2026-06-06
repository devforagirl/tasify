// -- Configuration --
// All settings can be overridden via environment variables.

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
