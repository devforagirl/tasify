import { useEffect, useRef } from 'react';
import useClaudeStore, { STATUS } from '../store/useClaudeStore.js';
import ClaudeService from '../services/ClaudeService.js';

const TASK_NAMES = [
  'Refactor Auth Module',
  'Optimize Database Queries',
  'Update API Documentation',
  'Fix Memory Leak in Event Loop',
  'Add Unit Tests for Payment Flow',
  'Migrate Legacy Config to YAML',
  'Implement Rate Limiting Middleware',
  'Review Pull Request #1423',
];

const EVENT_NAMES = [
  { event_name: 'task_started', severity: 'INFO' },
  { event_name: 'file_edited', severity: 'INFO' },
  { event_name: 'task_progress', severity: 'INFO' },
  { event_name: 'task_completed', severity: 'SUCCESS' },
  { event_name: 'warning_raised', severity: 'WARNING' },
  { event_name: 'error_occurred', severity: 'ERROR' },
  { event_name: 'hook_triggered', severity: 'INFO' },
  { event_name: 'state_synced', severity: 'SUCCESS' },
];

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

let eventCounter = 0;

export function useClaudeDashboard() {
  const store = useClaudeStore();
  const serviceRef = useRef(null);
  const intervalRef = useRef(null);
  const progressIntervalRef = useRef(null);

  useEffect(() => {
    const service = new ClaudeService();
    serviceRef.current = service;
    service.init();

    store.setConnectionStatus('connecting');

    // Simulate connected after short delay
    const connectTimer = setTimeout(() => {
      store.setConnectionStatus('connected');

      // Start simulation
      startSimulation();
    }, 500);

    // Listen for events from the real transport layer
    const unsubEvent = service.onEvent((event) => {
      store.addEvent(event);

      // Derive status from event
      if (event.event_name === 'task_started') {
        store.setStatus(STATUS.EXECUTING);
        store.setTask({
          id: event.id,
          name: event.details?.task_name || 'Unknown Task',
          progress: 0,
          duration: event.details?.duration || '0s',
        });
      } else if (event.event_name === 'task_completed') {
        store.setStatus(STATUS.IDLE);
        store.updateTaskProgress(100);
      } else if (event.event_name === 'error_occurred') {
        store.setStatus(STATUS.ERROR);
        store.setError(event.details?.message || 'An error occurred');
      } else if (event.event_name === 'hook_triggered') {
        store.setStatus(STATUS.HOOK_TRIGGERED);
      }
    });

    const unsubState = service.onStateChange((state) => {
      if (state.status) store.setStatus(state.status);
    });

    return () => {
      clearTimeout(connectTimer);
      stopSimulation();
      unsubEvent();
      unsubState();
      service.destroy();
      serviceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startSimulation() {
    // Push a new event every 2-4 seconds
    intervalRef.current = setInterval(() => {
      eventCounter++;
      const ev = randomItem(EVENT_NAMES);
      const event = {
        type: 'CLAUDE_EVENT',
        payload: {
          id: crypto.randomUUID(),
          event_name: ev.event_name,
          timestamp: Math.floor(Date.now() / 1000),
          severity: ev.severity,
          details: {
            task_name: randomItem(TASK_NAMES),
            message: `${ev.event_name} � event #${eventCounter}`,
          },
        },
      };
      store.addEvent(event);

      // Derive status changes (same logic as above for store updates)
      if (ev.event_name === 'task_started') {
        store.setStatus(STATUS.EXECUTING);
        store.setTask({
          id: crypto.randomUUID(),
          name: event.payload.details.task_name,
          progress: 0,
          duration: '0s',
        });
        startProgressUpdates();
      } else if (ev.event_name === 'task_completed') {
        store.setStatus(STATUS.IDLE);
        store.updateTaskProgress(100);
        stopProgressUpdates();
      } else if (ev.event_name === 'error_occurred') {
        store.setStatus(STATUS.ERROR);
        store.setError(event.payload.details.message || 'An error occurred');
      } else if (ev.event_name === 'hook_triggered') {
        store.setStatus(STATUS.HOOK_TRIGGERED);
      }

      // Add metric point for chart
      store.addMetricPoint({
        timestamp: Date.now(),
        value: randomInt(20, 100),
        label: ev.event_name,
      });
    }, 2500);
  }

  function startProgressUpdates() {
    stopProgressUpdates();
    let progress = 0;
    progressIntervalRef.current = setInterval(() => {
      progress = Math.min(progress + randomInt(5, 15), 100);
      store.updateTaskProgress(progress);
      if (progress >= 100) stopProgressUpdates();
    }, 1000);
  }

  function stopProgressUpdates() {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }

  function stopSimulation() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    stopProgressUpdates();
  }

  return {
    status: store.status,
    currentTask: store.currentTask,
    events: store.events,
    metrics: store.metrics,
    connectionStatus: store.connectionStatus,
    error: store.error,
    sendCommand: (actionType, params) =>
      serviceRef.current?.sendCommand(actionType, params),
    stopTask: () => serviceRef.current?.stopTask(),
    refreshState: () => serviceRef.current?.refreshState(),
    triggerMockHook: (name) => serviceRef.current?.triggerMockHook(name),
    isConnected: store.connectionStatus === 'connected',
  };
}
