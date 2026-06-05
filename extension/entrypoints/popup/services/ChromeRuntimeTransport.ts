// -- ChromeRuntimeTransport --
// Implements the same interface as WebSocketTransport,
// but communicates with the Background SW via chrome.runtime.

type MessageHandler = (msg: unknown) => void;

const STATE_EVENT_TYPES = new Set(["STATE_SNAPSHOT", "STATUS_CHANGE"]);
const CLAUDE_EVENT_TYPES = new Set(["CLAUDE_EVENT", "CLAUDE_ERROR", "CLAUDE_OUTPUT", "CLAUDE_RESULT"]);

class ChromeRuntimeTransport {
  private port: chrome.runtime.Port | null = null;
  private listeners = new Map<string, Set<MessageHandler>>();
  private _connected = false;

  connect(): void {
    try {
      this.port = chrome.runtime.connect({ name: "popup-background" });

      this.port.onMessage.addListener((msg: unknown) => {
        const m = msg as Record<string, unknown>;
        const type = (m.type as string) || "";

        // Dispatch to type-specific handlers (e.g. on("CLAUDE_EVENT", ...))
        const typeHandlers = this.listeners.get(type);
        if (typeHandlers) {
          for (const fn of typeHandlers) fn(msg);
        }

        // Also dispatch to broad-category handlers
        if (STATE_EVENT_TYPES.has(type)) {
          const stateHandlers = this.listeners.get("STATE_CHANGE");
          if (stateHandlers) {
            for (const fn of stateHandlers) fn(msg);
          }
        }
        if (CLAUDE_EVENT_TYPES.has(type) && type !== "CLAUDE_EVENT") {
          // Only dispatch non-duplicate types to CLAUDE_EVENT handler
          const eventHandlers = this.listeners.get("CLAUDE_EVENT");
          if (eventHandlers) {
            for (const fn of eventHandlers) fn(msg);
          }
        }
      });

      this.port.onDisconnect.addListener(() => {
        this._connected = false;
      });

      this._connected = true;
    } catch {
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
      console.warn("[ChromeRuntimeTransport] cannot send - not connected");
    }
  }

  isConnected(): boolean {
    return this._connected;
  }
}

export default ChromeRuntimeTransport;
