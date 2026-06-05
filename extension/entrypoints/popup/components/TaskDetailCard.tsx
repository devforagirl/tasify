import React from "react";
import { Clock, FileText } from "lucide-react";

interface Task {
  id: string;
  name: string;
  progress: number;
  duration: string;
}

interface Props {
  task: Task | null;
}

function TaskDetailCard({ task }: Props) {
  if (!task) {
    return (
      <div className="bg-[#1a1b26] rounded-lg border border-[#2a2b3d] p-3 h-full flex items-center justify-center">
        <p className="text-gray-500 text-xs">No active task</p>
      </div>
    );
  }

  return (
    <div className="bg-[#1a1b26] rounded-lg border border-[#2a2b3d] p-3 h-full">
      <h3 className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">
        Current Task
      </h3>
      <div className="flex items-start gap-2 mb-2">
        <FileText size={16} className="text-purple-400 mt-0.5 shrink-0" />
        <div className="min-w-0">
          <p className="text-xs font-medium truncate">{task.name}</p>
          <p className="text-[10px] text-gray-500 font-mono mt-0.5">{task.id}</p>
        </div>
      </div>
      <div className="mb-2">
        <div className="flex justify-between text-[10px] mb-0.5">
          <span className="text-gray-400">Progress</span>
          <span className="font-mono text-purple-400">{task.progress}%</span>
        </div>
        <div className="w-full h-1.5 bg-[#0f1117] rounded-full overflow-hidden">
          <div
            className="h-full bg-purple-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${task.progress}%` }}
          />
        </div>
      </div>
      {task.duration && (
        <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
          <Clock size={12} />
          <span className="font-mono">{task.duration}</span>
        </div>
      )}
    </div>
  );
}

export default TaskDetailCard;
