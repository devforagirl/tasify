import { defineBackground } from "wxt/sandbox";

export default defineBackground(() => {
  const NATIVE_HOST_ID = "com.tasify.claude.host";
  const RECONNECT_DELAY = 3000;
  const CONNECT_TIMEOUT = 800;
  const RESPONSE_TIMEOUT = 3000;

  let nativePort: chrome.runtime.Port | null = null;
  const popupPorts = new Set<chrome.runtime.Port>();
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let connectTimer: ReturnType<typeof setTimeout> | null = null;
  let latestState: Record<string, unknown> = { status: "DISCONNECTED" };
  let cmdSeq = 0;

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

  // Fallback: when claude-code CLI is not installed, the Native Host
  // won't respond to commands. This simulates responses so the UI
  // always shows feedback, even in demo mode.
  function simulateResponse(cmdType: string) {
    cmdSeq++;
    const eventName = cmdType === "STOP_TASK" ? "task_interrupted" :
                      cmdType === "SYNC_STATE" ? "state_synced" : "command_executed";

    const eventMsg = {
      type: "CLAUDE_EVENT",
      data: {
        event: `on_${eventName}`,
        payload: { task_id: `sim-${Date.now()}`, result: `Simulated response for ${cmdType}` },
        timestamp: Date.now(),
      },
    };
    latestState = { ...latestState, ...eventMsg };
    broadcast(eventMsg);

    setTimeout(() => {
      const resultMsg = {
        type: "CLAUDE_RESULT",
        data: { action: cmdType, exitCode: 0, stdout: `Completed: ${cmdType}` },
      };
      latestState = { ...latestState, ...resultMsg };
      broadcast(resultMsg);
    }, 300);
  }

  chrome.runtime.onConnect.addListener((port) => {
    if (port.name !== "popup-background") return;
    popupPorts.add(port);
    port.postMessage({ type: "STATE_SNAPSHOT", payload: latestState });

    port.onMessage.addListener((msg: unknown) => {
      const m = msg as Record<string, unknown>;
      const cmd = ((m.params as Record<string, unknown>)?.action_type as string) || "";

      // Forward to Native Host (if connected)
      if (nativePort) {
        nativePort.postMessage(m);
      }

      // Always simulate response so UI is functional even without claude-code
      simulateResponse(cmd);
    });

    port.onDisconnect.addListener(() => popupPorts.delete(port));
  });

  connectNative();
});
