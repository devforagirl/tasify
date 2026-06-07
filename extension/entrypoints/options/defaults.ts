/**
 * Shared default values for notification preferences and settings.
 * Imported by both options page and background script.
 */

export const DEFAULT_FONT_SIZE = 14;

export const FONT_SIZE_OPTIONS = [10, 12, 14, 16, 18, 20];

export const NOTIFY_EVENTS = [
  {
    key: "session_start",
    label: "SessionStart",
    desc: "Notify when a Claude Code session starts",
    match: { type: "CLAUDE_EVENT", eventName: "SessionStart" },
  },
  {
    key: "user_prompt",
    label: "UserPromptSubmit",
    desc: "Notify when the user submits a prompt to Claude",
    match: { type: "CLAUDE_EVENT", eventName: "UserPromptSubmit" },
  },
  {
    key: "pre_tool_use",
    label: "PreToolUse",
    desc: "Notify before executing Bash, edit, or write operations",
    match: { type: "CLAUDE_EVENT", eventName: "PreToolUse" },
  },
  {
    key: "post_tool_use",
    label: "PostToolUse",
    desc: "Notify after a tool finishes execution",
    match: { type: "CLAUDE_EVENT", eventName: "PostToolUse" },
  },
  {
    key: "stop",
    label: "Stop",
    desc: "Notify when the session is manually stopped",
    match: { type: "CLAUDE_EVENT", eventName: "Stop" },
  },
  {
    key: "session_end",
    label: "SessionEnd",
    desc: "Notify when the session ends normally",
    match: { type: "CLAUDE_EVENT", eventName: "SessionEnd" },
  },
  {
    key: "error",
    label: "CLAUDE_ERROR",
    desc: "Notify when an error occurs during execution",
    match: { type: "CLAUDE_ERROR" },
  },
  {
    key: "connection_change",
    label: "STATUS_CHANGE",
    desc: "Notify when the connection to Native Host is lost or re-established",
    match: { type: "STATUS_CHANGE" },
  },
] as const;

export type NotifyEventKey = (typeof NOTIFY_EVENTS)[number]["key"];

export const DEFAULT_NOTIFY_PREFS: Record<NotifyEventKey, boolean> = {
  session_start: true,
  user_prompt: false,
  pre_tool_use: false,
  post_tool_use: false,
  stop: false,
  session_end: true,
  error: true,
  connection_change: true,
};

export const STORAGE_KEYS = {
  FONT_SIZE: "tasify_font_size",
  NOTIFY_PREFS: "tasify_notify_prefs",
} as const;
