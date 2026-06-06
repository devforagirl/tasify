import { defineConfig } from "wxt";

export default defineConfig({
  manifest: {
    name: "Tasify - Claude Code Controller",
    version: "1.0.0",
    permissions: ["nativeMessaging", "storage", "alarms"],
  },
  env: {
    NATIVE_HOST_ID: "com.tasify.claude.host",
  },
});
