import React, { useRef, useEffect } from 'react';

export interface LogEntry {
  id: string;
  time: string;
  tag: string;
  message: string;
  color: string;
}

interface TelemetryConsoleProps {
  logs: LogEntry[];
}

export const TelemetryConsole: React.FC<TelemetryConsoleProps> = ({ logs }) => {
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="neo-card p-5 space-y-3">
      <div className="flex items-center justify-between border-b-2 border-[#0b1f3a]/15 pb-2.5">
        <div className="flex items-center gap-2">
          {/* Window arcade dots */}
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-400 border border-[#0b1f3a]"></span>
            <span className="w-3 h-3 rounded-full bg-yellow-400 border border-[#0b1f3a]"></span>
            <span className="w-3 h-3 rounded-full bg-green-400 border border-[#0b1f3a]"></span>
          </div>
          <h3 className="text-xs sm:text-sm font-black text-[#0b1f3a] ml-2">
            📡 Live Gateway Telemetry Console
          </h3>
        </div>
        <span className="text-[10px] font-bold text-[#0b1f3a]/60 mono">Polling every 5s</span>
      </div>

      <div
        ref={terminalRef}
        className="h-40 bg-[#071322] rounded-2xl p-3.5 overflow-y-auto mono text-[11px] space-y-1.5 text-gray-200 border-2 border-[#0b1f3a] shadow-inner"
      >
        {logs.map((log) => (
          <div key={log.id}>
            <span className="text-gray-500">[{log.time}]</span>{' '}
            <span className={log.color}>[{log.tag}]</span>{' '}
            <span>{log.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
