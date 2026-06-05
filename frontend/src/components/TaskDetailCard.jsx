import React from 'react';
import { Clock, FileText } from 'lucide-react';

function TaskDetailCard({ task }) {
  if (!task) {
    return (
      <div className="bg-claude-surface rounded-xl border border-claude-border p-4 h-full flex items-center justify-center">
        <p className="text-gray-500 text-sm">No active task</p>
      </div>
    );
  }

  return (
    <div className="bg-claude-surface rounded-xl border border-claude-border p-4 h-full">
      <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-3">
        Current Task
      </h3>
      <div className="flex items-start gap-3 mb-3">
        <FileText size={18} className="text-claude-accent mt-0.5 shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{task.name}</p>
          <p className="text-xs text-gray-500 font-mono mt-0.5">{task.id}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-400">Progress</span>
          <span className="font-mono text-claude-accent">{task.progress}%</span>
        </div>
        <div className="w-full h-2 bg-claude-bg rounded-full overflow-hidden">
          <div
            className="h-full bg-claude-accent rounded-full transition-all duration-500 ease-out"
            style={{ width: `${task.progress}%` }}
          />
        </div>
      </div>

      {/* Duration */}
      {task.duration && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Clock size={14} />
          <span className="font-mono">{task.duration}</span>
        </div>
      )}
    </div>
  );
}

export default TaskDetailCard;
