import React from "react";
import { Play, Square } from "lucide-react";

interface Props {
  onStart?: () => void;
  onStop?: () => void;
  isConnected?: boolean;
}

function ControlPanel({ onStart, onStop, isConnected = false }: Props) {
  const btnClass =
    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed border";

  return (
    <div className="bg-[#1a1b26] rounded-lg border border-[#2a2b3d] p-3">
      <h3 className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">
        Controls
      </h3>
      <div className="flex gap-2">
        <button
          onClick={onStart}
          disabled={isConnected}
          className={`${btnClass} bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30`}
          title="Connect to Native Host"
        >
          <Play size={14} fill="currentColor" />
          Start
        </button>
        <button
          onClick={onStop}
          disabled={!isConnected}
          className={`${btnClass} bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30`}
          title="Disconnect Native Host"
        >
          <Square size={14} fill="currentColor" />
          Stop
        </button>
      </div>
    </div>
  );
}

export default ControlPanel;
