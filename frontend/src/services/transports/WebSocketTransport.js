import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3001';

class WebSocketTransport {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect() {
    this.socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('[WebSocketTransport] connected');
    });

    this.socket.on('disconnect', () => {
      console.log('[WebSocketTransport] disconnected');
    });

    this.socket.on('CLAUDE_EVENT', (event) => {
      const handlers = this.listeners.get('CLAUDE_EVENT') || [];
      handlers.forEach((fn) => fn(event));
    });

    this.socket.on('STATE_CHANGE', (state) => {
      const handlers = this.listeners.get('STATE_CHANGE') || [];
      handlers.forEach((fn) => fn(state));
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(eventName, callback) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }
    this.listeners.get(eventName).push(callback);
    return () => {
      const arr = this.listeners.get(eventName);
      if (arr) {
        const idx = arr.indexOf(callback);
        if (idx !== -1) arr.splice(idx, 1);
      }
    };
  }

  send(command) {
    if (this.socket?.connected) {
      this.socket.emit('COMMAND', command);
    } else {
      console.warn('[WebSocketTransport] cannot send — not connected');
    }
  }

  isConnected() {
    return this.socket?.connected ?? false;
  }
}

export default WebSocketTransport;
