import { defineBackground } from "wxt/sandbox";

export default defineBackground(() => {
  const NATIVE_HOST_ID = "com.tasify.claude.host";
  const RECONNECT_DELAY = 3000;

  let nativePort: chrome.runtime.Port | null = null;
  const popupPorts = new Set<chrome.runtime.Port>();
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  // Latest state snapshot
  let latestState: Record<string, unknown> = { status: "DISCONNECTED" };

  // -- Broadcast to all connected Popups --
  function broadcast(msg: Record<string, unknown>) {
    for (const port of popupPorts) {
      try {
        port.postMessage(msg);
      } catch {
        popupPorts.delete(port);
      }
    }
  }

  // -- Schedule reconnect --
  function scheduleReconnect() {
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(() => connectNative(), RECONNECT_DELAY);
  }

  // -- Connect to Native Host --
  function connectNative() {
    try {
      nativePort = chrome.runtime.connectNative(NATIVE_HOST_ID);
    } catch {
      console.error("[background] connectNative threw");
      latestState = { ...latestState, status: "HOST_NOT_FOUND" };
      broadcast({ type: "STATUS_CHANGE", payload: { status: "HOST_NOT_FOUND" } });
      scheduleReconnect();
      return;
    }

    latestState = { ...latestState, status: "CONNECTING" };
    broadcast({ type: "STATUS_CHANGE", payload: { status: "CONNECTING" } });

    nativePort.onMessage.addListener((msg: unknown) => {
      const m = msg as Record<string, unknown>;
      // Update snapshot
      if (m.type === "CLAUDE_EVENT" || m.type === "CLAUDE_ERROR" || m.type === "CLAUDE_RESULT") {
        latestState = { ...latestState, ...m };
      }
      broadcast(m);
    });

    nativePort.onDisconnect.addListener(() => {
      const lastError = chrome.runtime.lastError;
      console.warn("[background] Native Host disconnected", lastError?.message);

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

  // -- Handle Popup connections --
  chrome.runtime.onConnect.addListener((port) => {
    if (port.name !== "popup-background") return;

    popupPorts.add(port);

    // Send snapshot immediately on connect
    port.postMessage({ type: "STATE_SNAPSHOT", payload: latestState });

    port.onMessage.addListener((msg: unknown) => {
      const m = msg as Record<string, unknown>;
      if (m.type === "EXEC_COMMAND" || m.type === "KILL_PROCESS") {
        nativePort?.postMessage(m);
      } else if (m.type === "GET_SNAPSHOT") {
        port.postMessage({ type: "STATE_SNAPSHOT", payload: latestState });
      }
    });

    port.onDisconnect.addListener(() => {
      popupPorts.delete(port);
    });
  });

  // -- Start --
  connectNative();
});
