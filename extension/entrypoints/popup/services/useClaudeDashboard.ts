import { useEffect, useRef } from "react";
import useClaudeStore, { STATUS, type Status } from "../store/useClaudeStore";
import ClaudeService from "./ClaudeService";
import ChromeRuntimeTransport from "./ChromeRuntimeTransport";

export function useClaudeDashboard() {
  const store = useClaudeStore();
  const serviceRef = useRef<ClaudeService | null>(null);

  useEffect(() => {
    const service = new ClaudeService();
    const transport = new ChromeRuntimeTransport();
    service.init(transport);

    serviceRef.current = service;

    store.setConnectionStatus("connecting");

    // Listen for events from transport
    const unsubEvent = service.onEvent((msg: unknown) => {
      const m = msg as Record<string, unknown>;
      const data = (m.data || m.payload || {}) as Record<string, unknown>;
      const event = m as {
        type?: string;
        event_name?: string;
        severity?: string;
        timestamp?: number;
        details?: Record<string, unknown>;
      };

      // STATE_SNAPSHOT — bulk update
      if (m.type === "STATE_SNAPSHOT") {
        const snap = m.payload as Record<string, unknown> || {};
        if (snap.status) store.setConnectionStatus(String(snap.status));
        return;
      }

      // STATUS_CHANGE
      if (m.type === "STATUS_CHANGE") {
        const payload = m.payload as Record<string, unknown> || {};
        const newStatus = payload.status as string;
        if (newStatus) {
          store.setConnectionStatus(newStatus);
          if (newStatus === "HOST_NOT_FOUND") {
            store.setError("Native Host not found. Please install the Tasify host.");
          }
        }
        return;
      }

      // CLAUDE_EVENT — push to event log and derive status
      if (m.type === "CLAUDE_EVENT" || m.type === "CLAUDE_OUTPUT" || m.type === "CLAUDE_RESULT" || m.type === "CLAUDE_ERROR") {
        const logEvent = {
          id: String(Date.now()),
          type: String(m.type),
          event_name: String(data.event || event.event_name || m.type),
          severity: m.type === "CLAUDE_ERROR" ? "ERROR" : "INFO",
          timestamp: Math.floor(Date.now() / 1000),
          details: data as Record<string, unknown>,
        };
        store.addEvent(logEvent);

        // Derive status changes
        if (m.type === "CLAUDE_ERROR") {
          store.setStatus(STATUS.ERROR);
          const errMsg = (data.message as string) || "An error occurred";
          store.setError(errMsg);
        } else if (m.type === "CLAUDE_RESULT") {
          const exitCode = data.exitCode as number;
          if (exitCode === 0) {
            store.setStatus(STATUS.IDLE);
          }
        }

        // Add metric
        store.addMetricPoint({
          timestamp: Date.now(),
          value: Math.random() * 100,
          label: String(data.event || m.type),
        });
      }
    });

    const unsubState = service.onStateChange((state: unknown) => {
      const s = state as Record<string, unknown>;
      if (s.status) store.setStatus(s.status as Status);
    });

    return () => {
      unsubEvent();
      unsubState();
      service.destroy();
      serviceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Map connectionStatus to the old-style status for mock compat
  const extStatus = store.connectionStatus as string;
  let realStatus = store.status;
  if (extStatus === "DISCONNECTED" || extStatus === "HOST_NOT_FOUND" || extStatus === "CONNECTING") {
    // Use the connection status as the display status when disconnected
  }

  return {
    status: store.status,
    currentTask: store.currentTask,
    events: store.events,
    metrics: store.metrics,
    connectionStatus: store.connectionStatus,
    error: store.error,
    sendCommand: (actionType: string, params?: Record<string, unknown>) =>
      serviceRef.current?.sendCommand(actionType, params),
    stopTask: () => serviceRef.current?.stopTask(),
    refreshState: () => serviceRef.current?.refreshState(),
    triggerMockHook: (name?: string) => serviceRef.current?.triggerMockHook(name),
    isConnected: store.connectionStatus === "connected",
  };
}
