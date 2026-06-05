import WebSocketTransport from './transports/WebSocketTransport.js';

let instance = null;

class ClaudeService {
  constructor() {
    if (instance) return instance;

    this.transport = null;
    this._eventHandlers = new Map();
    instance = this;
  }

  /** Initialize the service with a transport implementation */
  init(transport) {
    this.transport = transport || new WebSocketTransport();
    this.transport.connect();

    this.transport.on('CLAUDE_EVENT', (event) => {
      const handlers = this._eventHandlers.get('CLAUDE_EVENT') || [];
      handlers.forEach((fn) => fn(event));
    });

    this.transport.on('STATE_CHANGE', (state) => {
      const handlers = this._eventHandlers.get('STATE_CHANGE') || [];
      handlers.forEach((fn) => fn(state));
    });
  }

  /** Register a listener for Claude events */
  onEvent(callback) {
    if (!this._eventHandlers.has('CLAUDE_EVENT')) {
      this._eventHandlers.set('CLAUDE_EVENT', []);
    }
    this._eventHandlers.get('CLAUDE_EVENT').push(callback);
    return () => {
      const arr = this._eventHandlers.get('CLAUDE_EVENT');
      if (arr) {
        const idx = arr.indexOf(callback);
        if (idx !== -1) arr.splice(idx, 1);
      }
    };
  }

  /** Register a listener for state changes */
  onStateChange(callback) {
    if (!this._eventHandlers.has('STATE_CHANGE')) {
      this._eventHandlers.set('STATE_CHANGE', []);
    }
    this._eventHandlers.get('STATE_CHANGE').push(callback);
    return () => {
      const arr = this._eventHandlers.get('STATE_CHANGE');
      if (arr) {
        const idx = arr.indexOf(callback);
        if (idx !== -1) arr.splice(idx, 1);
      }
    };
  }

  /** Send a command to the backend */
  sendCommand(actionType, params = {}) {
    const command = {
      command: 'EXECUTE_ACTION',
      params: {
        action_type: actionType,
        ...params,
      },
    };
    this.transport.send(command);
  }

  /** Stop the current task */
  stopTask() {
    this.sendCommand('STOP_TASK', { target_id: 'current' });
  }

  /** Refresh / sync state */
  refreshState() {
    this.sendCommand('SYNC_STATE');
  }

  /** Trigger a mock hook event */
  triggerMockHook(eventName = 'custom_event') {
    this.sendCommand('TRIGGER_MOCK_HOOK', { event_name: eventName });
  }

  /** Cleanup */
  destroy() {
    if (this.transport) {
      this.transport.disconnect();
    }
    this._eventHandlers.clear();
    instance = null;
  }

  /** Check connection status */
  isConnected() {
    return this.transport?.isConnected() ?? false;
  }
}

export default ClaudeService;
