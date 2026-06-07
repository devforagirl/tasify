import { defineConfig } from "wxt";

export default defineConfig({
  manifest: {
    name: "Tasify",
    version: "1.0.0",
    permissions: ["nativeMessaging", "storage", "alarms", "notifications"],
    action: {
      default_title: "Tasify",
      default_popup: "popup.html",
      default_icon: {
        16: "/icons/16.png",
        48: "/icons/48.png",
        128: "/icons/128.png",
      },
    },
  },
  env: {
    NATIVE_HOST_ID: "com.tasify.claude.host",
  },
});
