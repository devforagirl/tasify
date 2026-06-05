import React from 'react';
import { useClaudeDashboard } from './hooks/useClaudeDashboard.js';
import StatusIndicator from './components/StatusIndicator.jsx';
import TaskDetailCard from './components/TaskDetailCard.jsx';
import EventTerminal from './components/EventTerminal.jsx';
import ControlPanel from './components/ControlPanel.jsx';
import DataVisualization from './components/DataVisualization.jsx';

function App() {
  const {
    status,
    currentTask,
    events,
    metrics,
    connectionStatus,
    error,
    stopTask,
    refreshState,
    triggerMockHook,
    isConnected,
  } = useClaudeDashboard();

  return (
    <div className="min-h-screen bg-claude-bg flex flex-col">
      {/* Header */}
      <header className="border-b border-claude-border px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-claude-accent flex items-center justify-center text-white font-bold text-sm">
            T
          </div>
          <h1 className="text-lg font-semibold tracking-tight">Tasify</h1>
          <span className="text-[10px] uppercase tracking-widest text-gray-600 bg-claude-surface px-2 py-0.5 rounded">
            Claude Code Dashboard
          </span>
        </div>
        <StatusIndicator status={status} connectionStatus={connectionStatus} />
      </header>

      {/* Error banner */}
      {error && (
        <div className="mx-6 mt-4 bg-claude-red/10 border border-claude-red/30 rounded-lg px-4 py-3 flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-claude-red animate-pulse shrink-0" />
          <p className="text-sm text-claude-red font-medium">{error.message || error}</p>
        </div>
      )}

      {/* Main grid */}
      <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-3 gap-4 auto-rows-auto">
        {/* Top row spans full width on large screens */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
          <TaskDetailCard task={currentTask} />
          <ControlPanel
            onStop={stopTask}
            onSync={refreshState}
            onTriggerMock={triggerMockHook}
            isConnected={isConnected}
          />
          <DataVisualization metrics={metrics} />
        </div>

        {/* Terminal takes full width below */}
        <div className="lg:col-span-3 h-[400px]">
          <EventTerminal events={events} />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-claude-border px-6 py-3 text-[10px] text-gray-600 flex items-center justify-between">
        <span>Tasify v1.0.0 — Phase 1 Web Mock</span>
        <span>Built with React + Socket.io</span>
      </footer>
    </div>
  );
}

export default App;
