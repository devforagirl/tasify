import { create } from 'zustand';

const STATUS = {
  IDLE: 'IDLE',
  THINKING: 'THINKING',
  EXECUTING: 'EXECUTING',
  HOOK_TRIGGERED: 'HOOK_TRIGGERED',
  ERROR: 'ERROR',
};

const initialState = {
  status: STATUS.IDLE,
  currentTask: null,
  events: [],
  metrics: [],       // time-series data points for chart
  connectionStatus: 'disconnected',
  error: null,
};

const useClaudeStore = create((set, get) => ({
  ...initialState,
  STATUS,

  // -- Actions --

  setStatus: (status) => set({ status }),

  setTask: (task) => set({ currentTask: task }),

  updateTaskProgress: (progress) =>
    set((state) => {
      if (!state.currentTask) return state;
      return {
        currentTask: { ...state.currentTask, progress },
      };
    }),

  addEvent: (event) =>
    set((state) => ({
      events: [...state.events.slice(-199), event], // keep last 200
    })),

  addMetricPoint: (point) =>
    set((state) => ({
      metrics: [...state.metrics.slice(-59), point], // keep last 60 points
    })),

  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),

  setError: (error) => set({ error, status: STATUS.ERROR }),

  clearError: () => set({ error: null }),

  reset: () => set(initialState),
}));

export { STATUS };
export default useClaudeStore;
