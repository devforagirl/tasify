// -- ChromeRuntimeTransport --
// Implements the same interface as WebSocketTransport,
// but communicates with the Background SW via chrome.runtime.
//
// This is the only file that needs to change when switching
// between Web (Phase 1) and Extension (Phase 3).

type MessageHandler = (msg: unknown) => void;

class ChromeRuntimeTransport {
  private port: chrome.runtime.Port | null = null;
  private listeners = new Map<string, Set<MessageHandler>>();
  private _connected = false;

  connect(): void {
    try {
      this.port = chrome.runtime.connect({ name: "popup-background" });

      this.port.onMessage.addListener((msg: unknown) => {
        const m = msg as Record<string, unknown>;
        const type = (m.type as string) || "CLAUDE_EVENT";

        // Dispatch to type-specific handlers
        const handlers = this.listeners.get(type);
        if (handlers) {
          for (const fn of handlers) fn(msg);
        }

        // Also dispatch to generic CLAUDE_EVENT / STATE_CHANGE handlers
        if (type === "STATE_SNAPSHOT" || type === "STATUS_CHANGE") {
          const stateHandlers = this.listeners.get("STATE_CHANGE");
          if (stateHandlers) {
            for (const fn of stateHandlers) fn(msg);
          }
        }
        if (type === "CLAUDE_EVENT" || type === "CLAUDE_ERROR" || type === "CLAUDE_OUTPUT" || type === "CLAUDE_RESULT") {
          const eventHandlers = this.listeners.get("CLAUDE_EVENT");
          if (eventHandlers) {
            for (const fn of eventHandlers) fn(msg);
          }
        }
      });

      this.port.onDisconnect.addListener(() => {
        this._connected = false;
        console.warn("[ChromeRuntimeTransport] disconnected from Background");
      });

      this._connected = true;
    } catch (err) {
      console.error("[ChromeRuntimeTransport] connect failed:", err);
      this._connected = false;
    }
  }

  disconnect(): void {
    if (this.port) {
      this.port.disconnect();
      this.port = null;
    }
    this._connected = false;
    this.listeners.clear();
  }

  on(eventName: string, callback: MessageHandler): () => void {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }
    this.listeners.get(eventName)!.add(callback);
    return () => {
      const set = this.listeners.get(eventName);
      if (set) {
        set.delete(callback);
        if (set.size === 0) this.listeners.delete(eventName);
      }
    };
  }

  send(msg: unknown): void {
    if (this.port) {
      this.port.postMessage(msg);
    } else {
      console.warn("[ChromeRuntimeTransport] cannot send — not connected");
    }
  }

  isConnected(): boolean {
    return this._connected;
  }
}

export default ChromeRuntimeTransport;
