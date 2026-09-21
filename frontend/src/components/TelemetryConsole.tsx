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
  themeMode?: 'light' | 'dark';
}

const TelemetryConsoleComponent: React.FC<TelemetryConsoleProps> = ({ logs, themeMode = 'light' }) => {
  const isDark = themeMode === 'dark';
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className={`p-5 space-y-3 transition-all duration-300 ${
      isDark
        ? 'rounded-3xl border-2 border-cyan-500/40 bg-[#070e1e] shadow-[0_0_20px_rgba(0,210,255,0.12)] text-slate-100'
        : 'neo-card bg-white text-[#0b1f3a]'
    }`}>
      <div className={`flex items-center justify-between border-b-2 pb-2.5 ${
        isDark ? 'border-cyan-500/20' : 'border-[#0b1f3a]/15'
      }`}>
        <div className="flex items-center gap-2">
          {/* Window arcade dots */}
          <div className="flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded-full border ${isDark ? 'bg-red-500 border-red-700 shadow-[0_0_6px_#ef4444]' : 'bg-red-400 border-[#0b1f3a]'}`}></span>
            <span className={`w-3 h-3 rounded-full border ${isDark ? 'bg-yellow-500 border-yellow-700 shadow-[0_0_6px_#eab308]' : 'bg-yellow-400 border-[#0b1f3a]'}`}></span>
            <span className={`w-3 h-3 rounded-full border ${isDark ? 'bg-emerald-500 border-emerald-700 shadow-[0_0_6px_#10b981]' : 'bg-green-400 border-[#0b1f3a]'}`}></span>
          </div>
          <h3 className={`text-xs sm:text-sm font-black ml-2 ${isDark ? 'text-cyan-300' : 'text-[#0b1f3a]'}`}>
            {isDark ? '📡 SVM Underworld Telemetry Console' : '📡 Live Gateway Telemetry Console'}
          </h3>
        </div>
        <span className={`text-[10px] font-bold mono ${isDark ? 'text-cyan-400/70' : 'text-[#0b1f3a]/60'}`}>
          {isDark ? 'Cryptographic Stream Active' : 'Polling every 5s'}
        </span>
      </div>

      <div
        ref={terminalRef}
        className={`h-40 rounded-2xl p-3.5 overflow-y-auto mono text-[11px] space-y-1.5 border-2 ${
          isDark
            ? 'bg-[#03060f] border-cyan-500/30 text-cyan-200 shadow-inner'
            : 'bg-[#071322] border-[#0b1f3a] text-gray-200 shadow-inner'
        }`}
      >
        {logs.map((log) => (
          <div key={log.id}>
            <span className={isDark ? 'text-slate-500' : 'text-gray-500'}>[{log.time}]</span>{' '}
            <span className={log.color}>[{log.tag}]</span>{' '}
            <span>{log.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const TelemetryConsole = React.memo(TelemetryConsoleComponent);
