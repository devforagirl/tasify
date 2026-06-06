import React from "react";
import { useClaudeDashboard } from "./services/useClaudeDashboard";
import StatusIndicator from "./components/StatusIndicator";
import TaskDetailCard from "./components/TaskDetailCard";
import EventTerminal from "./components/EventTerminal";
import ControlPanel from "./components/ControlPanel";
import DataVisualization from "./components/DataVisualization";

function App() {
  const {
    status,
    currentTask,
    events,
    metrics,
    connectionStatus,
    error,
    stopTask,
    connectHost,
    disconnectHost,
    isConnected,
  } = useClaudeDashboard();

  return (
    <div className="flex flex-col min-h-screen bg-[#0f1117]">
      {/* Header */}
      <header className="flex items-center justify-between px-3 py-2 border-b border-[#2a2b3d]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-purple-500 flex items-center justify-center text-white font-bold text-[10px]">
            T
          </div>
          <span className="text-sm font-semibold">Tasify</span>
        </div>
        <StatusIndicator status={status} connectionStatus={connectionStatus} />
      </header>

      {/* Error banner */}
      {error && (
        <div className="mx-3 mt-2 bg-red-500/20 border border-red-500/30 rounded-md px-3 py-2 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
          <p className="text-xs text-red-400 font-medium">{error}</p>
        </div>
      )}

      {/* Main grid */}
      <main className="flex-1 p-3 grid grid-cols-1 gap-2">
        {/* Top row: three columns when enough space */}
        <div className="grid grid-cols-3 gap-2">
          <TaskDetailCard task={currentTask} />
          <ControlPanel
            onStart={connectHost}
            onStop={disconnectHost}
            isConnected={isConnected}
          />
          <DataVisualization metrics={metrics} />
        </div>

        {/* Terminal */}
        <div className="h-48">
          <EventTerminal events={events} />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#2a2b3d] px-3 py-1.5 text-[10px] text-gray-600 flex items-center justify-between">
        <span>Tasify v1.0.0</span>
        <span>Claude Code Controller</span>
      </footer>
    </div>
  );
}

export default App;
