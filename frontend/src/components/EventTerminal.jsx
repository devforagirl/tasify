import React, { useEffect, useRef } from 'react';

const SEVERITY_STYLES = {
  INFO: 'text-claude-blue',
  SUCCESS: 'text-claude-green',
  WARNING: 'text-claude-yellow',
  ERROR: 'text-claude-red',
};

const SEVERITY_LABELS = {
  INFO: 'INFO',
  SUCCESS: 'OK',
  WARNING: 'WARN',
  ERROR: 'ERR',
};

function EventTerminal({ events = [] }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView?.({ behavior: 'smooth' });
  }, [events.length]);

  return (
    <div className="bg-claude-surface rounded-xl border border-claude-border overflow-hidden h-full flex flex-col">
      {/* Terminal header */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-claude-border bg-claude-bg/50">
        <span className="w-3 h-3 rounded-full bg-claude-red" />
        <span className="w-3 h-3 rounded-full bg-claude-yellow" />
        <span className="w-3 h-3 rounded-full bg-claude-green" />
        <span className="text-xs text-gray-500 ml-2 font-mono uppercase tracking-wider">
          Event Stream
        </span>
        <span className="text-xs text-gray-600 font-mono ml-auto">
          {events.length} events
        </span>
      </div>

      {/* Terminal body */}
      <div className="flex-1 overflow-y-auto p-3 font-mono text-xs leading-relaxed">
        {events.length === 0 && (
          <p className="text-gray-600 italic">Waiting for events...</p>
        )}
        {events.map((ev, i) => {
          const payload = ev.payload || ev;
          const severity = payload.severity || 'INFO';
          const ts = payload.timestamp
            ? new Date(payload.timestamp * 1000).toLocaleTimeString()
            : '';
          return (
            <div key={payload.id || i} className="py-0.5 hover:bg-white/5 rounded px-1 -mx-1">
              <span className="text-gray-600">{ts}</span>{' '}
              <span className={`font-bold ${SEVERITY_STYLES[severity] || 'text-gray-400'}`}>
                [{SEVERITY_LABELS[severity] || severity}]
              </span>{' '}
              <span className="text-gray-300">{payload.event_name}</span>
              {payload.details?.message && (
                <span className="text-gray-500"> &mdash; {payload.details.message}</span>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

export default EventTerminal;
