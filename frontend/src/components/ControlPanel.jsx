import React from 'react';
import { Square, RefreshCw, Zap, Wifi, WifiOff } from 'lucide-react';

function ControlPanel({
  onStop,
  onSync,
  onTriggerMock,
  isConnected,
}) {
  return (
    <div className="bg-claude-surface rounded-xl border border-claude-border p-4">
      <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-3">
        Controls
      </h3>
      <div className="flex gap-3">
        <button
          onClick={onStop}
          disabled={!isConnected}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-claude-red/20 text-claude-red border border-claude-red/30 hover:bg-claude-red/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-sm font-medium"
          title="Stop / Interrupt current task"
        >
          <Square size={16} fill="currentColor" />
          Stop
        </button>

        <button
          onClick={onSync}
          disabled={!isConnected}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-claude-blue/20 text-claude-blue border border-claude-blue/30 hover:bg-claude-blue/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-sm font-medium"
          title="Sync / Refresh state"
        >
          <RefreshCw size={16} />
          Sync
        </button>

        <button
          onClick={onTriggerMock}
          disabled={!isConnected}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-claude-yellow/20 text-claude-yellow border border-claude-yellow/30 hover:bg-claude-yellow/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-sm font-medium"
          title="Trigger a mock Hook event"
        >
          <Zap size={16} />
          Mock Hook
        </button>
      </div>

      {/* Connection indicator */}
      <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
        {isConnected ? (
          <>
            <Wifi size={14} className="text-claude-green" />
            <span>Connected to server</span>
          </>
        ) : (
          <>
            <WifiOff size={14} className="text-claude-red" />
            <span>Disconnected</span>
          </>
        )}
      </div>
    </div>
  );
}

export default ControlPanel;
