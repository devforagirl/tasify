import React from "react";

const STATUS_CONFIG: Record<string, { label: string; color: string; pulse: boolean }> = {
  IDLE: { label: "Idle", color: "bg-green-500", pulse: false },
  THINKING: { label: "Thinking", color: "bg-blue-500", pulse: true },
  EXECUTING: { label: "Executing", color: "bg-purple-500", pulse: true },
  HOOK_TRIGGERED: { label: "Hook Triggered", color: "bg-yellow-500", pulse: true },
  ERROR: { label: "Error", color: "bg-red-500", pulse: true },
  CONNECTING: { label: "Connecting", color: "bg-blue-400", pulse: true },
  DISCONNECTED: { label: "Disconnected", color: "bg-gray-500", pulse: false },
  HOST_NOT_FOUND: { label: "Host Not Found", color: "bg-red-500", pulse: false },
};

interface Props {
  status?: string;
  connectionStatus?: string;
}

function StatusIndicator({ status = "IDLE", connectionStatus }: Props) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.IDLE;
  const isConnected = connectionStatus === "connected";

  return (
    <div className="flex items-center gap-3">
      {connectionStatus && (
        <div className="flex items-center gap-1.5">
          <span
            className={`inline-block w-2 h-2 rounded-full ${
              isConnected ? "bg-green-500" : "bg-red-500"
            }`}
          />
          <span className="text-[10px] text-gray-500 uppercase">{connectionStatus}</span>
        </div>
      )}
      <div className="flex items-center gap-1.5 bg-[#1a1b26] px-2.5 py-1 rounded-md border border-[#2a2b3d]">
        <span
          className={`inline-block w-2.5 h-2.5 rounded-full ${cfg.color} ${
            cfg.pulse ? "animate-pulse" : ""
          }`}
        />
        <span className="text-xs font-semibold">{cfg.label}</span>
      </div>
    </div>
  );
}

export default StatusIndicator;
