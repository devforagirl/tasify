import React from "react";
import { Play, Square, Settings } from "lucide-react";

interface Props {
  onStart?: () => void;
  onStop?: () => void;
  isConnected?: boolean;
}

function ControlPanel({ onStart, onStop, isConnected = false }: Props) {
  return (
    <div className="topbar">
      <div className="topbar-brand">
        <img src="/icons/16.png" alt="Tasify" />
        <span>Tasify</span>
      </div>
      <div className="topbar-actions">
        <button
          onClick={() => chrome.tabs.create({ url: chrome.runtime.getURL("options.html") })}
          className="btn btn-gear"
          title="Settings"
        >
          <Settings size={14} />
        </button>
        {isConnected ? (
          <button
            onClick={onStop}
            className="btn btn-stop"
            title="Disconnect Native Host"
          >
            <Square size={14} fill="currentColor" />
            Stop
          </button>
        ) : (
          <button
            onClick={onStart}
            className="btn btn-start"
            title="Connect to Native Host"
          >
            <Play size={14} fill="currentColor" />
            Start
          </button>
        )}
      </div>
    </div>
  );
}

export default ControlPanel;
