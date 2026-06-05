import React from 'react';

const STATUS_CONFIG = {
  IDLE: { label: 'Idle', color: 'bg-claude-green', pulse: false },
  THINKING: { label: 'Thinking', color: 'bg-claude-blue', pulse: true },
  EXECUTING: { label: 'Executing', color: 'bg-claude-accent', pulse: true },
  HOOK_TRIGGERED: { label: 'Hook Triggered', color: 'bg-claude-yellow', pulse: true },
  ERROR: { label: 'Error', color: 'bg-claude-red', pulse: true },
};

function StatusIndicator({ status = 'IDLE', connectionStatus }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.IDLE;
  const isConnected = connectionStatus === 'connected';

  return (
    <div className="flex items-center gap-4">
      {/* Connection dot */}
      <div className="flex items-center gap-2">
        <span
          className={`inline-block w-2.5 h-2.5 rounded-full ${
            isConnected ? 'bg-claude-green' : 'bg-claude-red'
          }`}
        />
        <span className="text-xs text-gray-500 uppercase tracking-wider">
          {connectionStatus}
        </span>
      </div>

      {/* Status badge */}
      <div className="flex items-center gap-2 bg-claude-surface px-3 py-1.5 rounded-lg border border-claude-border">
        <span
          className={`inline-block w-3 h-3 rounded-full ${cfg.color} ${
            cfg.pulse ? 'animate-pulse' : ''
          }`}
        />
        <span className="text-sm font-semibold tracking-wide">{cfg.label}</span>
      </div>
    </div>
  );
}

export default StatusIndicator;
