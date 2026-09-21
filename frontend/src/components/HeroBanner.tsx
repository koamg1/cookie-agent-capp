import React from 'react';

interface HeroBannerProps {
  themeMode?: 'light' | 'dark';
}

export const HeroBanner: React.FC<HeroBannerProps> = React.memo(({ themeMode = 'light' }) => {
  const isDark = themeMode === 'dark';

  return (
    <div className={`relative overflow-hidden transition-all duration-300 ${
      isDark
        ? 'p-6 sm:p-8 rounded-3xl border-2 border-cyan-500/40 bg-[#070e1e] shadow-[0_0_25px_rgba(0,210,255,0.12)] text-slate-100'
        : 'p-6 sm:p-7 rounded-2xl border-2 border-[#0b1f3a] bg-white shadow-[0_3px_0_#0b1f3a] text-[#0b1f3a]'
    }`}>
      <div className="relative z-10 space-y-3">
        {/* Duality Badge */}
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold border-2 ${
          isDark
            ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(0,210,255,0.3)]'
            : 'bg-[#d8f1ff] border-[#0b1f3a] text-[#0b1f3a] shadow-[0_2px_0_#0b1f3a]'
        }`}>
          <span>{isDark ? '⚡' : '✨'}</span>
          <span>{isDark ? 'CYBER-INDUSTRIAL MATRIX ONLINE • SVM RUNTIME' : 'WE BAKE AI ON COOKIE CHAIN SVM'}</span>
          <span>{isDark ? '👾' : '🧑‍🍳'}</span>
        </div>
        
        {/* Duality Heading */}
        <h1 className={`text-2xl sm:text-4xl font-black tracking-tight leading-tight ${
          isDark
            ? 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-amber-300 to-emerald-300'
            : 'text-[#0b1f3a]'
        }`}>
          {isDark
            ? 'CookieAgent Underworld: Autonomous Sentinels & SVM Engine'
            : 'Let Him Cook! Autonomous Agent Gateway & Sentinel'}
        </h1>

        {/* Duality Subtitle */}
        <p className={`text-xs sm:text-sm font-semibold max-w-3xl leading-relaxed ${
          isDark ? 'text-slate-300' : 'text-[#0b1f3a]/85'
        }`}>
          {isDark
            ? 'Direct access to the Cookie Chain SVM engine room. Distributed cryptographic telemetry, sub-second node latency probes, and standardized MCP tools for autonomous agents operating on-chain.'
            : 'Broadcast cryptographic AI telemetry directly to Cookie Chain SVM, benchmark real-time node RPC latency, and equip autonomous agents with standard Model Context Protocol (MCP) tools. Production-ready SVM infrastructure for the Cookie ecosystem.'}
        </p>

        {/* Feature Pills */}
        <div className="pt-2 flex flex-wrap items-center gap-2.5 text-[11px] font-bold">
          <span className={`px-3 py-1 rounded-lg border-2 ${
            isDark
              ? 'bg-[#0b1426] border-cyan-500/50 text-cyan-300'
              : 'bg-[#ffe0a8] border-[#0b1f3a] text-[#0b1f3a] shadow-[0_2px_0_#0b1f3a]'
          }`}>
            ⚡ Sub-Second SVM Finality
          </span>
          <span className={`px-3 py-1 rounded-lg border-2 ${
            isDark
              ? 'bg-[#0b1426] border-amber-500/50 text-amber-300'
              : 'bg-[#d8f1ff] border-[#0b1f3a] text-[#0b1f3a] shadow-[0_2px_0_#0b1f3a]'
          }`}>
            🛡️ Operators: Nightly • Phantom • Solflare
          </span>
          <span className={`px-3 py-1 rounded-lg border-2 ${
            isDark
              ? 'bg-[#0b1426] border-emerald-500/50 text-emerald-300'
              : 'bg-[#bbf7d0] border-[#0b1f3a] text-[#065f46] shadow-[0_2px_0_#0b1f3a]'
          }`}>
            📜 SPL Memo Protocol
          </span>
          <span className={`px-3 py-1 rounded-lg border-2 ${
            isDark
              ? 'bg-[#0b1426] border-purple-500/50 text-purple-300'
              : 'bg-[#fed7aa] border-[#0b1f3a] text-[#7c2d12] shadow-[0_2px_0_#0b1f3a]'
          }`}>
            🧠 React 18 + MCP v1.0
          </span>
        </div>
      </div>
    </div>
  );
});
