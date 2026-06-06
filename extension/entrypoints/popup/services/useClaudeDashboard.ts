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

      if (m.type === "STATE_SNAPSHOT") {
        const snap = m.payload as Record<string, unknown> || {};
        if (snap.status) store.setConnectionStatus(String(snap.status));
        return;
      }

      if (m.type === "STATUS_CHANGE") {
        const payload = m.payload as Record<string, unknown> || {};
        const newStatus = payload.status as string;
        if (newStatus) {
          store.setConnectionStatus(newStatus);
          if (newStatus === "HOST_NOT_FOUND") {
            store.setError("Host not installed. Run: npm install -g @tasify/host");
          }
        }
        return;
      }

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

        store.addMetricPoint({
          timestamp: Date.now(),
          value: Math.random() * 100,
          label: String(data.event || m.type),
        });
      }
    });

    const unsubState = service.onStateChange((state: unknown) => {
      const s = state as Record<string, unknown>;
      if (s.status) {
        store.setStatus(s.status as Status);
        return;
      }
      const payload = (s.payload || {}) as Record<string, unknown>;
      if (payload.status) {
        store.setConnectionStatus(String(payload.status));
      }
    });

    return () => {
      unsubEvent();
      unsubState();
      service.destroy();
      serviceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    connectHost: () => serviceRef.current?.connectHost(),
    disconnectHost: () => serviceRef.current?.disconnectHost(),
    isConnected: store.connectionStatus === "connected",
  };
}
