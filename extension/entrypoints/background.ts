import { defineBackground } from "wxt/sandbox";

export default defineBackground(() => {
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

      // Handle host connection commands directly
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

      // Forward to Native Host (if connected)
      if (nativePort) {
        nativePort.postMessage(m);
      }
    });

    port.onDisconnect.addListener(() => popupPorts.delete(port));
  });

  connectNative();

  // Keep Service Worker alive — chrome.alarms prevents MV3 idle shutdown
  chrome.alarms.create("tasify-keepalive", { periodInMinutes: 0.3 });
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "tasify-keepalive") {
      // NO-OP: just keep the SW alive
    }
  });
});
