let instance: ClaudeService | null = null;

interface Transport {
  connect: () => void;
  disconnect: () => void;
  on: (event: string, callback: (msg: unknown) => void) => () => void;
  send: (msg: unknown) => void;
  isConnected: () => boolean;
}

class ClaudeService {
  public transport: Transport | null = null;
  private _eventHandlers = new Map<string, Array<(msg: unknown) => void>>();
  private _unsubs: Array<() => void> = [];

  constructor() {
    if (instance) return instance;
    instance = this;
  }

  init(transport: Transport): void {
    this.transport = transport;
    this.transport.connect();

    this._unsubs.push(
      this.transport.on("CLAUDE_EVENT", (event) => {
        const handlers = this._eventHandlers.get("CLAUDE_EVENT") || [];
        handlers.forEach((fn) => fn(event));
      })
    );

    this._unsubs.push(
      this.transport.on("STATE_CHANGE", (state) => {
        const handlers = this._eventHandlers.get("STATE_CHANGE") || [];
        handlers.forEach((fn) => fn(state));
      })
    );
  }

  onEvent(callback: (msg: unknown) => void): () => void {
    if (!this._eventHandlers.has("CLAUDE_EVENT")) {
      this._eventHandlers.set("CLAUDE_EVENT", []);
    }
    this._eventHandlers.get("CLAUDE_EVENT")!.push(callback);
    return () => {
      const arr = this._eventHandlers.get("CLAUDE_EVENT");
      if (arr) {
        const idx = arr.indexOf(callback);
        if (idx !== -1) arr.splice(idx, 1);
      }
    };
  }

  onStateChange(callback: (msg: unknown) => void): () => void {
    if (!this._eventHandlers.has("STATE_CHANGE")) {
      this._eventHandlers.set("STATE_CHANGE", []);
    }
    this._eventHandlers.get("STATE_CHANGE")!.push(callback);
    return () => {
      const arr = this._eventHandlers.get("STATE_CHANGE");
      if (arr) {
        const idx = arr.indexOf(callback);
        if (idx !== -1) arr.splice(idx, 1);
      }
    };
  }

  sendCommand(actionType: string, params: Record<string, unknown> = {}): void {
    const command = {
      type: "EXEC_COMMAND",
      command: actionType.toLowerCase(),
      params: {
        action_type: actionType,
        ...params,
      },
    };
    this.transport?.send(command);
  }

  stopTask(): void {
    this.sendCommand("STOP_TASK", { target_id: "current" });
  }

  refreshState(): void {
    this.sendCommand("SYNC_STATE");
  }

  triggerMockHook(eventName = "custom_event"): void {
    this.sendCommand("TRIGGER_MOCK_HOOK", { event_name: eventName });
  }

  destroy(): void {
    if (this.transport) {
      this.transport.disconnect();
    }
    this._eventHandlers.clear();
    this._unsubs.forEach((fn) => fn());
    this._unsubs = [];
    instance = null;
  }

  isConnected(): boolean {
    return this.transport?.isConnected() ?? false;
  }
}

export default ClaudeService;
