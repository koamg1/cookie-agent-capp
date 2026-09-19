import React, { useState } from 'react';
import { apiUrl } from '../config/api';

export const McpKitchen: React.FC = () => {
  const [showRpcGuide, setShowRpcGuide] = useState(false);

  return (
    <div className="space-y-6">
      <div className="neo-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b-2 border-[#0b1f3a]/15 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔌</span>
            <div>
              <h2 className="text-lg font-black text-[#0b1f3a]">Model Context Protocol</h2>
              <p className="text-[11px] font-bold text-[#0b1f3a]/65">cookie-mcp Standard Bridge</p>
            </div>
          </div>
          <span className="text-xs font-black px-2.5 py-1 rounded-full bg-[#d8f1ff] border-2 border-[#0b1f3a] text-[#0b1f3a] shadow-[0_2px_0_#0b1f3a]">
            MCP v1.0
          </span>
        </div>

        <p className="text-xs font-medium text-[#0b1f3a]/80 leading-relaxed">
          Standardized tool interfaces ready for autonomous AI agents connecting via Claude Code, Codex, Antigravity, or custom agent frameworks.
        </p>

        {/* Tool Cards */}
        <div className="space-y-2.5 pt-1">
          <div className="p-3 bg-[#f8fafc] hover:bg-[#d8f1ff]/40 rounded-xl border-2 border-[#0b1f3a] transition shadow-[0_2px_0_#0b1f3a]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-[#0b1f3a] mono">cookie_get_network_stats</span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-[#0b1f3a] mono">
                READ
              </span>
            </div>
            <p className="text-[11px] font-medium text-[#0b1f3a]/75 mt-1">
              Queries current slot, block height and parallel RPC health status.
            </p>
          </div>

          <div className="p-3 bg-[#f8fafc] hover:bg-[#d8f1ff]/40 rounded-xl border-2 border-[#0b1f3a] transition shadow-[0_2px_0_#0b1f3a]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-[#0b1f3a] mono">cookie_check_balance</span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-[#0b1f3a] mono">
                READ
              </span>
            </div>
            <p className="text-[11px] font-medium text-[#0b1f3a]/75 mt-1">
              Inspects real token and COOKIE balances for any SVM public key.
            </p>
          </div>

          <div className="p-3 bg-[#f8fafc] hover:bg-[#d8f1ff]/40 rounded-xl border-2 border-[#0b1f3a] transition shadow-[0_2px_0_#0b1f3a]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-[#0b1f3a] mono">cookie_simulate_agent_ping</span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-[#0b1f3a] mono">
                WRITE / MEMO
              </span>
            </div>
            <p className="text-[11px] font-medium text-[#0b1f3a]/75 mt-1">
              Dispatches verifiable proof-of-work telemetry to Cookie Chain SVM.
            </p>
          </div>
        </div>

        <div className="pt-2 flex justify-between items-center text-xs">
          <a
            href={apiUrl('/api/v1/mcp/manifest')}
            target="_blank"
            rel="noreferrer"
            className="font-black text-[#0b1f3a] hover:text-[#d97706] underline mono text-[11px]"
          >
            📄 Raw Manifest JSON &rarr;
          </a>
          <button
            onClick={() => setShowRpcGuide(!showRpcGuide)}
            className="font-black text-[#0b1f3a] hover:text-[#d97706] mono text-[11px] underline cursor-pointer"
          >
            📋 Network Parameters
          </button>
        </div>
      </div>

      {/* Collapsible RPC Parameters */}
      {showRpcGuide && (
        <div className="neo-card p-5 border-2 border-[#0b1f3a] text-xs space-y-3 animate-in fade-in duration-150">
          <div className="flex justify-between items-center pb-2 border-b-2 border-[#0b1f3a]/15">
            <span className="font-extrabold text-sm text-[#0b1f3a]">
              Cookie Chain Network Configuration (For Nightly & Phantom)
            </span>
            <button
              onClick={() => setShowRpcGuide(false)}
              className="text-lg font-black text-[#0b1f3a] hover:opacity-70 cursor-pointer"
            >
              &times;
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] mono">
            <div className="p-2.5 rounded-xl bg-[#f8fafc] border border-[#0b1f3a]">
              <span className="font-bold text-[#0b1f3a]/60 block">Network Name:</span>
              <span className="font-extrabold text-[#0b1f3a]">Cookie Chain</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#f8fafc] border border-[#0b1f3a]">
              <span className="font-bold text-[#0b1f3a]/60 block">RPC URL:</span>
              <span className="font-extrabold text-[#0b1f3a] select-all">https://rpc.cookiescan.io</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#f8fafc] border border-[#0b1f3a]">
              <span className="font-bold text-[#0b1f3a]/60 block">Currency Symbol:</span>
              <span className="font-extrabold text-[#d97706]">COOKIE</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#f8fafc] border border-[#0b1f3a]">
              <span className="font-bold text-[#0b1f3a]/60 block">Block Explorer:</span>
              <a
                href="https://cookiescan.io"
                target="_blank"
                rel="noreferrer"
                className="font-extrabold text-[#0b1f3a] underline"
              >
                https://cookiescan.io
              </a>
            </div>
            <div className="p-2.5 rounded-xl bg-[#f8fafc] border border-[#0b1f3a] md:col-span-2">
              <span className="font-bold text-[#0b1f3a]/60 block">Canonical SPL Memo Program:</span>
              <span className="font-bold text-[#0b1f3a] select-all">
                MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
