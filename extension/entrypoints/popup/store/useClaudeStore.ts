import { create } from "zustand";

const STATUS = {
  IDLE: "IDLE",
  THINKING: "THINKING",
  EXECUTING: "EXECUTING",
  HOOK_TRIGGERED: "HOOK_TRIGGERED",
  ERROR: "ERROR",
  // Extension-specific states
  CONNECTING: "CONNECTING",
  DISCONNECTED: "DISCONNECTED",
  HOST_NOT_FOUND: "HOST_NOT_FOUND",
} as const;

type Status = (typeof STATUS)[keyof typeof STATUS];

interface Task {
  id: string;
  name: string;
  progress: number;
  duration: string;
}

interface LogEvent {
  id: string;
  type: string;
  payload?: Record<string, unknown>;
  event_name?: string;
  severity?: string;
  timestamp?: number;
  details?: Record<string, unknown>;
}

interface MetricPoint {
  timestamp: number;
  value: number;
  label?: string;
}

interface ClaudeState {
  status: Status;
  currentTask: Task | null;
  events: LogEvent[];
  metrics: MetricPoint[];
  connectionStatus: string;
  error: string | null;
  STATUS: typeof STATUS;
}

interface ClaudeActions {
  setStatus: (status: Status) => void;
  setTask: (task: Task | null) => void;
  updateTaskProgress: (progress: number) => void;
  addEvent: (event: LogEvent) => void;
  addMetricPoint: (point: MetricPoint) => void;
  setConnectionStatus: (status: string) => void;
  setError: (error: string) => void;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  status: STATUS.IDLE,
  currentTask: null,
  events: [],
  metrics: [],
  connectionStatus: "disconnected",
  error: null,
};

const useClaudeStore = create<ClaudeState & ClaudeActions>((set) => ({
  ...initialState,
  STATUS,

  setStatus: (status) => set({ status }),

  setTask: (task) => set({ currentTask: task }),

  updateTaskProgress: (progress) =>
    set((state) => {
      if (!state.currentTask) return state;
      return { currentTask: { ...state.currentTask, progress } };
    }),

  addEvent: (event) =>
    set((state) => ({
      events: [...state.events.slice(-199), event],
    })),

  addMetricPoint: (point) =>
    set((state) => ({
      metrics: [...state.metrics.slice(-59), point],
    })),

  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),

  setError: (error) => set({ error, status: STATUS.ERROR }),

  clearError: () => set({ error: null }),

  reset: () => set(initialState as ClaudeState),
}));

export { STATUS };
export type { Status, Task, LogEvent, MetricPoint, ClaudeState };
export default useClaudeStore;
