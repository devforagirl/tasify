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

interface LogEvent {
  id: string;
  type: string;
  payload?: Record<string, unknown>;
  event_name?: string;
  severity?: string;
  timestamp?: number;
  details?: Record<string, unknown>;
}

interface ClaudeState {
  status: Status;
  events: LogEvent[];
  connectionStatus: string;
  error: string | null;
  STATUS: typeof STATUS;
}

interface ClaudeActions {
  setStatus: (status: Status) => void;
  addEvent: (event: LogEvent) => void;
  setConnectionStatus: (status: string) => void;
  setError: (error: string) => void;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  status: STATUS.IDLE,
  events: [],
  connectionStatus: "disconnected",
  error: null,
};

const useClaudeStore = create<ClaudeState & ClaudeActions>((set) => ({
  ...initialState,
  STATUS,

  setStatus: (status) => set({ status }),

  addEvent: (event) =>
    set((state) => ({
      events: [...state.events.slice(-199), event],
    })),

  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),

  setError: (error) => set({ error, status: STATUS.ERROR }),

  clearError: () => set({ error: null }),

  reset: () => set(initialState as ClaudeState),
}));

export { STATUS };
export type { Status, LogEvent, ClaudeState };
export default useClaudeStore;
