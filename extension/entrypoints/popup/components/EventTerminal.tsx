import React, { useEffect, useRef } from "react";

const SEVERITY_STYLES: Record<string, string> = {
  INFO: "text-blue-400",
  SUCCESS: "text-green-400",
  WARNING: "text-yellow-400",
  ERROR: "text-red-400",
};

const SEVERITY_LABELS: Record<string, string> = {
  INFO: "INFO",
  SUCCESS: "OK",
  WARNING: "WARN",
  ERROR: "ERR",
};

interface LogEvent {
  id: string;
  type?: string;
  event_name?: string;
  severity?: string;
  timestamp?: number;
  details?: Record<string, unknown>;
  payload?: Record<string, unknown>;
}

interface Props {
  events?: LogEvent[];
}

function EventTerminal({ events = [] }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView?.({ behavior: "smooth" });
  }, [events.length]);

  if (events.length === 0) {
    return (
      <div className="bg-[#1a1b26] rounded-lg border border-[#2a2b3d] overflow-hidden h-full flex flex-col">
        <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-[#2a2b3d] bg-black/20">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
          <span className="text-[10px] text-gray-500 ml-1.5 font-mono uppercase">Events</span>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-600 text-xs italic">Waiting for events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1a1b26] rounded-lg border border-[#2a2b3d] overflow-hidden h-full flex flex-col">
      <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-[#2a2b3d] bg-black/20">
        <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
        <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
        <span className="text-[10px] text-gray-500 ml-1.5 font-mono uppercase">Events</span>
        <span className="text-[10px] text-gray-600 font-mono ml-auto">{events.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-2 font-mono text-[10px] leading-relaxed">
        {events.map((ev, i) => {
          const payload = ev.payload || ev;
          const severity = (payload.severity as string) || "INFO";
          const ts = payload.timestamp
            ? new Date((payload.timestamp as number) * 1000).toLocaleTimeString()
            : "";
          const eventName = payload.event_name || ev.event_name || ev.type || "event";
          const msg = payload.details?.message || (payload.details?.text as string);
          return (
            <div
              key={ev.id || i}
              className="py-0.5 hover:bg-white/5 rounded px-1 -mx-1"
            >
              {ts && <span className="text-gray-600">{ts} </span>}
              <span
                className={`font-bold ${
                  SEVERITY_STYLES[severity] || "text-gray-400"
                }`}
              >
                [{SEVERITY_LABELS[severity] || severity}]
              </span>{" "}
              <span className="text-gray-300">{eventName}</span>
              {msg && <span className="text-gray-500"> &mdash; {msg}</span>}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

export default EventTerminal;
