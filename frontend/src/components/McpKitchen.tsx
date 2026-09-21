import React, { useState } from 'react';
import { apiUrl } from '../config/api';

interface McpKitchenProps {
  themeMode?: 'light' | 'dark';
}

const McpKitchenComponent: React.FC<McpKitchenProps> = ({ themeMode = 'light' }) => {
  const isDark = themeMode === 'dark';
  const [showRpcGuide, setShowRpcGuide] = useState(false);

  return (
    <div className="space-y-6">
      <div className={`p-6 space-y-4 transition-all duration-300 ${
        isDark
          ? 'rounded-3xl border-2 border-purple-500/40 bg-[#070e1e] shadow-[0_0_25px_rgba(168,85,247,0.12)] text-slate-100'
          : 'neo-card bg-white text-[#0b1f3a]'
      }`}>
        <div className={`flex items-center justify-between border-b-2 pb-3 ${
          isDark ? 'border-purple-500/20' : 'border-[#0b1f3a]/15'
        }`}>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{isDark ? '🧠' : '🔌'}</span>
            <div>
              <h2 className={`text-lg font-black tracking-tight ${
                isDark
                  ? 'text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-cyan-300 to-emerald-300'
                  : 'text-[#0b1f3a]'
              }`}>
                {isDark ? 'MCP Neural Terminal & Tool Protocol' : 'Model Context Protocol (MCP)'}
              </h2>
              <p className={`text-[11px] font-bold ${isDark ? 'text-slate-400' : 'text-[#0b1f3a]/65'}`}>
                {isDark ? 'cookie-mcp Standard Interoperability Bridge for AI Agents' : 'cookie-mcp Standard Bridge'}
              </p>
            </div>
          </div>
          <span className={`text-xs font-black px-2.5 py-1 rounded-full border-2 mono ${
            isDark
              ? 'bg-purple-950 text-purple-300 border-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
              : 'bg-[#d8f1ff] border-[#0b1f3a] text-[#0b1f3a] shadow-[0_2px_0_#0b1f3a]'
          }`}>
            {isDark ? 'PROTOCOL ONLINE' : 'MCP v1.0'}
          </span>
        </div>

        <p className={`text-xs font-medium leading-relaxed ${isDark ? 'text-slate-300' : 'text-[#0b1f3a]/80'}`}>
          Standardized tool interfaces ready for autonomous AI agents connecting via Claude Code, Codex, Antigravity, or custom agent frameworks on Cookie Chain SVM.
        </p>

        {/* Tool Cards */}
        <div className="space-y-2.5 pt-1">
          <div className={`p-3 rounded-xl border-2 transition ${
            isDark
              ? 'bg-[#050a16] border-purple-500/30 text-slate-200 hover:border-purple-400 hover:shadow-[0_0_12px_rgba(168,85,247,0.2)]'
              : 'bg-[#f8fafc] hover:bg-[#d8f1ff]/40 border-[#0b1f3a] shadow-[0_2px_0_#0b1f3a]'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-black mono ${isDark ? 'text-cyan-300' : 'text-[#0b1f3a]'}`}>
                cookie_get_network_stats
              </span>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded border mono ${
                isDark
                  ? 'bg-cyan-950 text-cyan-300 border-cyan-500'
                  : 'bg-blue-100 text-blue-800 border-[#0b1f3a]'
              }`}>
                READ
              </span>
            </div>
            <p className={`text-[11px] font-medium mt-1 ${isDark ? 'text-slate-400' : 'text-[#0b1f3a]/75'}`}>
              Queries current slot, block height and parallel RPC health status.
            </p>
          </div>

          <div className={`p-3 rounded-xl border-2 transition ${
            isDark
              ? 'bg-[#050a16] border-purple-500/30 text-slate-200 hover:border-purple-400 hover:shadow-[0_0_12px_rgba(168,85,247,0.2)]'
              : 'bg-[#f8fafc] hover:bg-[#d8f1ff]/40 border-[#0b1f3a] shadow-[0_2px_0_#0b1f3a]'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-black mono ${isDark ? 'text-cyan-300' : 'text-[#0b1f3a]'}`}>
                cookie_check_balance
              </span>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded border mono ${
                isDark
                  ? 'bg-cyan-950 text-cyan-300 border-cyan-500'
                  : 'bg-blue-100 text-blue-800 border-[#0b1f3a]'
              }`}>
                READ
              </span>
            </div>
            <p className={`text-[11px] font-medium mt-1 ${isDark ? 'text-slate-400' : 'text-[#0b1f3a]/75'}`}>
              Inspects real token and COOKIE balances for any SVM public key.
            </p>
          </div>

          <div className={`p-3 rounded-xl border-2 transition ${
            isDark
              ? 'bg-[#050a16] border-amber-500/30 text-slate-200 hover:border-amber-400 hover:shadow-[0_0_12px_rgba(245,158,11,0.2)]'
              : 'bg-[#f8fafc] hover:bg-[#d8f1ff]/40 border-[#0b1f3a] shadow-[0_2px_0_#0b1f3a]'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-black mono ${isDark ? 'text-amber-300' : 'text-[#0b1f3a]'}`}>
                cookie_simulate_agent_ping
              </span>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded border mono ${
                isDark
                  ? 'bg-amber-950 text-amber-300 border-amber-500'
                  : 'bg-amber-100 text-amber-900 border-[#0b1f3a]'
              }`}>
                WRITE / MEMO
              </span>
            </div>
            <p className={`text-[11px] font-medium mt-1 ${isDark ? 'text-slate-400' : 'text-[#0b1f3a]/75'}`}>
              Dispatches verifiable proof-of-work telemetry directly to Cookie Chain SVM.
            </p>
          </div>
        </div>

        <div className="pt-2 flex justify-between items-center text-xs">
          <a
            href={apiUrl('/api/v1/mcp/manifest')}
            target="_blank"
            rel="noreferrer"
            className={`font-black underline mono text-[11px] ${
              isDark ? 'text-purple-300 hover:text-cyan-300' : 'text-[#0b1f3a] hover:text-[#d97706]'
            }`}
          >
            📄 Raw Manifest JSON &rarr;
          </a>
          <button
            onClick={() => setShowRpcGuide(!showRpcGuide)}
            className={`font-black mono text-[11px] underline cursor-pointer ${
              isDark ? 'text-purple-300 hover:text-cyan-300' : 'text-[#0b1f3a] hover:text-[#d97706]'
            }`}
          >
            📋 {isDark ? 'Validator Parameters' : 'Network Parameters'}
          </button>
        </div>
      </div>

      {/* Collapsible RPC Parameters */}
      {showRpcGuide && (
        <div className={`p-5 rounded-3xl border-2 text-xs space-y-3 animate-in fade-in duration-150 ${
          isDark
            ? 'bg-[#091122] border-purple-500/50 text-slate-200 shadow-[0_0_20px_rgba(168,85,247,0.2)]'
            : 'neo-card border-[#0b1f3a]'
        }`}>
          <div className={`flex justify-between items-center pb-2 border-b-2 ${
            isDark ? 'border-purple-500/20' : 'border-[#0b1f3a]/15'
          }`}>
            <span className={`font-extrabold text-sm ${isDark ? 'text-purple-300' : 'text-[#0b1f3a]'}`}>
              Cookie Chain Network Configuration (For Nightly & Phantom)
            </span>
            <button
              onClick={() => setShowRpcGuide(false)}
              className={`text-lg font-black hover:opacity-70 cursor-pointer ${isDark ? 'text-purple-300' : 'text-[#0b1f3a]'}`}
            >
              &times;
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] mono">
            <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-[#050a16] border-purple-500/30' : 'bg-[#f8fafc] border-[#0b1f3a]'}`}>
              <span className={`font-bold block ${isDark ? 'text-slate-400' : 'text-[#0b1f3a]/60'}`}>
                Network Name:
              </span>
              <span className={`font-extrabold ${isDark ? 'text-white' : 'text-[#0b1f3a]'}`}>Cookie Chain</span>
            </div>
            <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-[#050a16] border-purple-500/30' : 'bg-[#f8fafc] border-[#0b1f3a]'}`}>
              <span className={`font-bold block ${isDark ? 'text-slate-400' : 'text-[#0b1f3a]/60'}`}>RPC URL:</span>
              <span className={`font-extrabold select-all ${isDark ? 'text-cyan-300' : 'text-[#0b1f3a]'}`}>https://rpc.cookiescan.io</span>
            </div>
            <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-[#050a16] border-purple-500/30' : 'bg-[#f8fafc] border-[#0b1f3a]'}`}>
              <span className={`font-bold block ${isDark ? 'text-slate-400' : 'text-[#0b1f3a]/60'}`}>
                Currency Symbol:
              </span>
              <span className="font-extrabold text-[#d97706]">COOKIE</span>
            </div>
            <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-[#050a16] border-purple-500/30' : 'bg-[#f8fafc] border-[#0b1f3a]'}`}>
              <span className={`font-bold block ${isDark ? 'text-slate-400' : 'text-[#0b1f3a]/60'}`}>
                Block Explorer:
              </span>
              <a
                href="https://cookiescan.io"
                target="_blank"
                rel="noreferrer"
                className={`font-extrabold underline ${isDark ? 'text-cyan-400' : 'text-[#0b1f3a]'}`}
              >
                https://cookiescan.io
              </a>
            </div>
            <div className={`p-2.5 rounded-xl border md:col-span-2 ${isDark ? 'bg-[#050a16] border-purple-500/30' : 'bg-[#f8fafc] border-[#0b1f3a]'}`}>
              <span className={`font-bold block ${isDark ? 'text-slate-400' : 'text-[#0b1f3a]/60'}`}>
                Canonical SPL Memo Program:
              </span>
              <span className={`font-bold select-all ${isDark ? 'text-amber-400' : 'text-[#0b1f3a]'}`}>
                MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const McpKitchen = React.memo(McpKitchenComponent);
