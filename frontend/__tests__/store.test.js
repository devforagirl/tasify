import { describe, it, expect, beforeEach } from 'vitest';
import useClaudeStore, { STATUS } from '../src/store/useClaudeStore.js';

beforeEach(() => {
  useClaudeStore.getState().reset();
});

describe('useClaudeStore', () => {
  it('should start with initial state', () => {
    const state = useClaudeStore.getState();
    expect(state.status).toBe(STATUS.IDLE);
    expect(state.currentTask).toBeNull();
    expect(state.events).toEqual([]);
    expect(state.metrics).toEqual([]);
    expect(state.connectionStatus).toBe('disconnected');
    expect(state.error).toBeNull();
  });

  it('should handle status transitions', () => {
    const store = useClaudeStore.getState();
    store.setStatus(STATUS.EXECUTING);
    expect(useClaudeStore.getState().status).toBe(STATUS.EXECUTING);

    store.setStatus(STATUS.ERROR);
    expect(useClaudeStore.getState().status).toBe(STATUS.ERROR);

    store.setStatus(STATUS.IDLE);
    expect(useClaudeStore.getState().status).toBe(STATUS.IDLE);
  });

  it('should manage task state', () => {
    const store = useClaudeStore.getState();
    const task = { id: 'test-1', name: 'Test Task', progress: 0 };

    store.setTask(task);
    expect(useClaudeStore.getState().currentTask).toEqual(task);

    store.updateTaskProgress(50);
    expect(useClaudeStore.getState().currentTask.progress).toBe(50);
  });

  it('should keep only last 200 events', () => {
    const store = useClaudeStore.getState();
    for (let i = 0; i < 250; i++) {
      store.addEvent({ id: `evt-${i}`, event_name: 'test' });
    }
    expect(useClaudeStore.getState().events.length).toBe(200);
    expect(useClaudeStore.getState().events[0].id).toBe('evt-50');
  });

  it('should keep only last 60 metric points', () => {
    const store = useClaudeStore.getState();
    for (let i = 0; i < 70; i++) {
      store.addMetricPoint({ timestamp: i, value: i });
    }
    expect(useClaudeStore.getState().metrics.length).toBe(60);
    expect(useClaudeStore.getState().metrics[0].timestamp).toBe(10);
  });

  it('should handle error state', () => {
    const store = useClaudeStore.getState();
    store.setError('Something went wrong');
    expect(useClaudeStore.getState().status).toBe(STATUS.ERROR);
    expect(useClaudeStore.getState().error).toBe('Something went wrong');

    store.clearError();
    expect(useClaudeStore.getState().error).toBeNull();
  });

  it('should reset to initial state', () => {
    const store = useClaudeStore.getState();
    store.setStatus(STATUS.EXECUTING);
    store.setTask({ id: 'x', name: 'x', progress: 50 });
    store.addEvent({ id: 'e1' });
    store.reset();

    const state = useClaudeStore.getState();
    expect(state.status).toBe(STATUS.IDLE);
    expect(state.currentTask).toBeNull();
    expect(state.events).toEqual([]);
  });
});
