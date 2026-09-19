import React from 'react';

export const HeroBanner: React.FC = () => {
  return (
    <div className="neo-card p-6 sm:p-8 bg-white relative overflow-hidden">
      {/* Floating decorative cookies */}
      <div className="absolute -right-6 -bottom-6 text-7xl opacity-20 pointer-events-none select-none animate-float-2">
        🍪
      </div>
      <div className="absolute right-32 -top-4 text-5xl opacity-15 pointer-events-none select-none animate-float-1">
        🍪
      </div>

      <div className="relative z-10 space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d8f1ff] border-2 border-[#0b1f3a] text-xs font-extrabold text-[#0b1f3a] shadow-[0_2px_0_#0b1f3a]">
          <span>✨</span> WE BAKE AI ON COOKIE CHAIN SVM <span>🧑‍🍳</span>
        </div>
        
        <h1 className="text-2xl sm:text-4xl font-black text-[#0b1f3a] tracking-tight leading-tight">
          Let Him Cook! Autonomous Agent Gateway & Sentinel
        </h1>

        <p className="text-xs sm:text-sm font-semibold text-[#0b1f3a]/80 max-w-3xl leading-relaxed">
          Broadcast cryptographic AI telemetry directly to Cookie Chain SVM, benchmark real-time node RPC latency, and equip autonomous agents with standard Model Context Protocol (MCP) tools. Production-ready SVM infrastructure for the Cookie ecosystem.
        </p>

        <div className="pt-2 flex flex-wrap items-center gap-2 text-[11px] font-bold">
          <span className="px-2.5 py-1 rounded-lg bg-[#ffe0a8] border border-[#0b1f3a]">
            SVM Finality &lt; 400ms
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-[#d8f1ff] border border-[#0b1f3a]">
            Nightly &bull; Phantom &bull; Solflare
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-[#bbf7d0] border border-[#0b1f3a] text-[#065f46]">
            SPL Memo Protocol
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-[#fed7aa] border border-[#0b1f3a] text-[#7c2d12]">
            React 18 + MCP v1.0
          </span>
        </div>
      </div>
    </div>
  );
};
