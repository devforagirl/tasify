import React, { useEffect, useRef } from "react";

const SEVERITY_CONFIG: Record<string, { label: string; bgClass: string; textClass: string }> = {
  INFO: { label: "INFO", bgClass: "bg-severity-info", textClass: "text-severity-info" },
  SUCCESS: { label: "OK", bgClass: "bg-severity-success", textClass: "text-severity-success" },
  WARNING: { label: "WARN", bgClass: "bg-severity-warning", textClass: "text-severity-warning" },
  ERROR: { label: "ERR", bgClass: "bg-severity-error", textClass: "text-severity-error" },
};

function formatTime(ts: number): string {
  const d = new Date(ts * 1000);
  return String(d.getHours()).padStart(2, "0") + ":" +
    String(d.getMinutes()).padStart(2, "0") + ":" +
    String(d.getSeconds()).padStart(2, "0");
}

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

  return (
    <div className="terminal">
      <div className="terminal-header">
        <span className="terminal-dot terminal-dot-red" />
        <span className="terminal-dot terminal-dot-yellow" />
        <span className="terminal-dot terminal-dot-green" />
        <span className="terminal-label">Events</span>
      </div>

      {events.length === 0 ? (
        <div className="terminal-empty">Waiting for events...</div>
      ) : (
        <div className="terminal-body">
          {events.map((ev, i) => {
            const payload = ev.payload || ev;
            const severity = (payload.severity as string) || "INFO";
            const cfg = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.INFO;
            const ts = payload.timestamp
              ? formatTime(payload.timestamp as number)
              : "";
            const eventName = payload.event_name || ev.event_name || ev.type || "event";
            const msg = payload.details?.message || (payload.details?.text as string);

            return (
              <div key={ev.id || i} className="event-row">
                {ts && <span className="event-time">{ts}</span>}
                <span className={`event-severity ${cfg.bgClass} ${cfg.textClass}`}>
                  {cfg.label}
                </span>
                <span className="event-name">{eventName}</span>
                {msg && <span className="event-msg">{msg}</span>}
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}

export default EventTerminal;
