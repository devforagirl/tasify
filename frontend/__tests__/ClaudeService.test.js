import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ClaudeService from '../src/services/ClaudeService.js';

// Mock transport for testing
class MockTransport {
  constructor() {
    this.listeners = new Map();
    this._connected = false;
  }
  connect() { this._connected = true; }
  disconnect() { this._connected = false; }
  on(event, cb) {
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    this.listeners.get(event).push(cb);
    return () => {
      const arr = this.listeners.get(event);
      if (arr) { const idx = arr.indexOf(cb); if (idx !== -1) arr.splice(idx, 1); }
    };
  }
  send(cmd) { this._lastCommand = cmd; }
  isConnected() { return this._connected; }
  emit(event, data) {
    const handlers = this.listeners.get(event) || [];
    handlers.forEach(fn => fn(data));
  }
}

describe('ClaudeService', () => {
  let service;
  let transport;

  beforeEach(() => {
    // Reset singleton
    // We need to destroy any previous instance first
    const prev = new ClaudeService();
    prev.destroy();

    service = new ClaudeService();
    transport = new MockTransport();
    service.init(transport);
  });

  afterEach(() => {
    service.destroy();
  });

  it('should initialize with transport', () => {
    expect(service.isConnected()).toBe(true);
  });

  it('should forward events via onEvent', () => {
    const handler = vi.fn();
    service.onEvent(handler);

    const testEvent = { type: 'CLAUDE_EVENT', payload: { id: '1' } };
    transport.emit('CLAUDE_EVENT', testEvent);

    expect(handler).toHaveBeenCalledWith(testEvent);
  });

  it('should forward state changes via onStateChange', () => {
    const handler = vi.fn();
    service.onStateChange(handler);

    const state = { status: 'EXECUTING' };
    transport.emit('STATE_CHANGE', state);

    expect(handler).toHaveBeenCalledWith(state);
  });

  it('should send commands through transport', () => {
    service.stopTask();
    expect(transport._lastCommand).toEqual({
      command: 'EXECUTE_ACTION',
      params: { action_type: 'STOP_TASK', target_id: 'current' },
    });
  });

  it('should allow unsubscribe from events', () => {
    const handler = vi.fn();
    const unsub = service.onEvent(handler);
    unsub();

    transport.emit('CLAUDE_EVENT', { type: 'CLAUDE_EVENT', payload: {} });
    expect(handler).not.toHaveBeenCalled();
  });

  it('should cleanup on destroy', () => {
    service.destroy();
    expect(service.isConnected()).toBe(false);
  });
});
