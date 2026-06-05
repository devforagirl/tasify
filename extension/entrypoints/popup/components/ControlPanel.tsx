import React from "react";
import { Square, RefreshCw, Zap, Wifi, WifiOff } from "lucide-react";

interface Props {
  onStop?: () => void;
  onSync?: () => void;
  onTriggerMock?: () => void;
  isConnected?: boolean;
}

function ControlPanel({ onStop, onSync, onTriggerMock, isConnected = false }: Props) {
  const btnClass =
    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed border";

  return (
    <div className="bg-[#1a1b26] rounded-lg border border-[#2a2b3d] p-3">
      <h3 className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">
        Controls
      </h3>
      <div className="flex gap-2">
        <button
          onClick={onStop}
          disabled={!isConnected}
          className={`${btnClass} bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30`}
          title="Stop current task"
        >
          <Square size={14} fill="currentColor" />
          Stop
        </button>
        <button
          onClick={onSync}
          disabled={!isConnected}
          className={`${btnClass} bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30`}
          title="Refresh state"
        >
          <RefreshCw size={14} />
          Sync
        </button>
        <button
          onClick={onTriggerMock}
          disabled={!isConnected}
          className={`${btnClass} bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30`}
          title="Trigger mock hook"
        >
          <Zap size={14} />
          Hook
        </button>
      </div>
      <div className="mt-2 flex items-center gap-1.5 text-[10px] text-gray-500">
        {isConnected ? (
          <>
            <Wifi size={12} className="text-green-400" />
            <span>Connected</span>
          </>
        ) : (
          <>
            <WifiOff size={12} className="text-red-400" />
            <span>Disconnected</span>
          </>
        )}
      </div>
    </div>
  );
}

export default ControlPanel;
