import { defineBackground } from "wxt/sandbox";
import { NOTIFY_EVENTS, DEFAULT_NOTIFY_PREFS, STORAGE_KEYS, type NotifyEventKey } from "./options/defaults";

const NOTIFICATION_ICON = "/icons/48.png";

function getEventName(msg: Record<string, unknown>): string | null {
  const type = msg.type as string;
  if (type === "CLAUDE_ERROR") return "CLAUDE_ERROR";
  if (type === "STATUS_CHANGE" || type === "STATE_SNAPSHOT") return "STATUS_CHANGE";
  if (type === "CLAUDE_EVENT") {
    const data = (msg.data || msg.payload || {}) as Record<string, unknown>;
    return (data.event as string) || (data.hook_event_name as string) || null;
  }
  return null;
}

function matchNotifyKey(eventName: string, notifyDefs: typeof NOTIFY_EVENTS): NotifyEventKey | null {
  for (const ev of notifyDefs) {
    const m = ev.match;
    if (m.type === "CLAUDE_ERROR" && eventName === "CLAUDE_ERROR") return ev.key;
    if (m.type === "STATUS_CHANGE" && eventName === "STATUS_CHANGE") return ev.key;
    if (m.type === "CLAUDE_EVENT" && m.eventName && eventName === m.eventName) return ev.key;
  }
  return null;
}

function makeNotificationTitle(msg: Record<string, unknown>): string {
  const type = msg.type as string;
  if (type === "CLAUDE_ERROR") return "Error";
  if (type === "STATUS_CHANGE") {
    const payload = (msg.payload || {}) as Record<string, unknown>;
    return String(payload.status || "Connection Changed");
  }
  const data = (msg.data || msg.payload || {}) as Record<string, unknown>;
  return String(data.event || data.hook_event_name || type);
}

function makeNotificationMessage(msg: Record<string, unknown>): string {
  const type = msg.type as string;

  if (type === "CLAUDE_ERROR") {
    const data = (msg.data || {}) as Record<string, unknown>;
    return (data.message as string) || (data.text as string) || "An error occurred";
  }

  if (type === "CLAUDE_RESULT") {
    const data = (msg.data || {}) as Record<string, unknown>;
    const exitCode = data.exitCode;
    return `Command completed with exit code ${exitCode ?? "unknown"}`;
  }

  if (type === "STATUS_CHANGE") {
    const payload = (msg.payload || {}) as Record<string, unknown>;
    return `Connection: ${String(payload.status || "changed")}`;
  }

  // CLAUDE_EVENT — extract details from payload
  const data = (msg.data || msg.payload || {}) as Record<string, unknown>;
  const payload = data.payload as Record<string, unknown> | undefined;
  const detail =
    (payload?.message as string) ||
    (payload?.text as string) ||
    (payload?.reason as string) ||
    (payload?.tool_use as string) ||
    (payload?.command as string) ||
    (payload?.prompt as string) ||
    (payload?.error as string) ||
    "(no details)";
  return detail;
}

export default defineBackground(() => {
  let notifyPrefs: Record<NotifyEventKey, boolean> = { ...DEFAULT_NOTIFY_PREFS };

  chrome.storage.sync.get(STORAGE_KEYS.NOTIFY_PREFS).then((result) => {
    if (result[STORAGE_KEYS.NOTIFY_PREFS]) {
      notifyPrefs = { ...DEFAULT_NOTIFY_PREFS, ...(result[STORAGE_KEYS.NOTIFY_PREFS] as Partial<Record<NotifyEventKey, boolean>>) };
    }
  });

  chrome.storage.onChanged.addListener((changes) => {
    if (changes[STORAGE_KEYS.NOTIFY_PREFS]) {
      notifyPrefs = { ...DEFAULT_NOTIFY_PREFS, ...(changes[STORAGE_KEYS.NOTIFY_PREFS].newValue as Partial<Record<NotifyEventKey, boolean>>) };
    }
  });

  function tryNotify(msg: Record<string, unknown>) {
    const eventName = getEventName(msg);
    if (!eventName) return;

    const key = matchNotifyKey(eventName, NOTIFY_EVENTS);
    if (!key || !notifyPrefs[key]) return;

    const title = makeNotificationTitle(msg);
    const message = makeNotificationMessage(msg);

    chrome.notifications.create(
      `tasify-${Date.now()}`,
      {
        type: "basic",
        iconUrl: NOTIFICATION_ICON,
        title,
        message: message.slice(0, 250),
        buttons: [{ title: "Settings" }],
      }
    );
  }

  chrome.notifications.onClicked.addListener((notificationId) => {
    if (notificationId.startsWith("tasify-")) {
      chrome.action.openPopup();
    }
  });

  chrome.notifications.onButtonClicked.addListener((notificationId) => {
    if (notificationId.startsWith("tasify-")) {
      chrome.tabs.create({ url: chrome.runtime.getURL("options.html") });
    }
  });

  // ---- Original background logic ----
  const NATIVE_HOST_ID = "com.tasify.claude.host";
  const RECONNECT_DELAY = 3000;
  const CONNECT_TIMEOUT = 800;

  let nativePort: chrome.runtime.Port | null = null;
  const popupPorts = new Set<chrome.runtime.Port>();
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let connectTimer: ReturnType<typeof setTimeout> | null = null;
  let latestState: Record<string, unknown> = { status: "DISCONNECTED" };

  function broadcast(msg: Record<string, unknown>) {
    for (const port of popupPorts) {
      try { port.postMessage(msg); } catch { popupPorts.delete(port); }
    }
    tryNotify(msg);
  }

  function scheduleReconnect() {
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(() => connectNative(), RECONNECT_DELAY);
  }

  function connectNative() {
    try {
      nativePort = chrome.runtime.connectNative(NATIVE_HOST_ID);
    } catch {
      latestState = { ...latestState, status: "HOST_NOT_FOUND" };
      broadcast({ type: "STATUS_CHANGE", payload: { status: "HOST_NOT_FOUND" } });
      scheduleReconnect();
      return;
    }

    latestState = { ...latestState, status: "CONNECTING" };
    broadcast({ type: "STATUS_CHANGE", payload: { status: "CONNECTING" } });

    if (connectTimer) clearTimeout(connectTimer);
    connectTimer = setTimeout(() => {
      if (nativePort) {
        latestState = { ...latestState, status: "connected" };
        broadcast({ type: "STATUS_CHANGE", payload: { status: "connected" } });
        broadcast({ type: "STATE_SNAPSHOT", payload: latestState });
      }
    }, CONNECT_TIMEOUT);

    nativePort.onMessage.addListener((msg: unknown) => {
      const m = msg as Record<string, unknown>;
      const type = m.type as string;
      if (type === "CLAUDE_EVENT" || type === "CLAUDE_ERROR" || type === "CLAUDE_RESULT") {
        latestState = { ...latestState, ...m };
      }
      broadcast(m);
    });

    nativePort.onDisconnect.addListener(() => {
      const lastError = chrome.runtime.lastError;
      if (connectTimer) clearTimeout(connectTimer);
      if (lastError?.message?.includes("Native host has exited")) {
        latestState = { ...latestState, status: "HOST_NOT_FOUND" };
      } else {
        latestState = { ...latestState, status: "DISCONNECTED" };
      }
      broadcast({ type: "STATUS_CHANGE", payload: { status: latestState.status } });
      nativePort = null;
      scheduleReconnect();
    });
  }

  chrome.runtime.onConnect.addListener((port) => {
    if (port.name !== "popup-background") return;
    popupPorts.add(port);
    port.postMessage({ type: "STATE_SNAPSHOT", payload: latestState });

    port.onMessage.addListener((msg: unknown) => {
      const m = msg as Record<string, unknown>;

      if (m.type === "CONNECT_HOST") {
        connectNative();
        return;
      }
      if (m.type === "DISCONNECT_HOST") {
        if (nativePort) {
          nativePort.disconnect();
          nativePort = null;
        }
        latestState = { ...latestState, status: "DISCONNECTED" };
        broadcast({ type: "STATUS_CHANGE", payload: { status: "DISCONNECTED" } });
        return;
      }

      if (nativePort) {
        nativePort.postMessage(m);
      }
    });

    port.onDisconnect.addListener(() => popupPorts.delete(port));
  });

  connectNative();

  chrome.alarms.create("tasify-keepalive", { periodInMinutes: 0.3 });
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "tasify-keepalive") {
      // NO-OP: keep the SW alive
    }
  });
});
