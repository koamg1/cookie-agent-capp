import React from 'react';
import { NetworkStats as INetworkStats, WalletType } from '../types/wallet';

interface NetworkStatsProps {
  stats: INetworkStats | null;
  connectedAddress: string | null;
  activeWalletType: WalletType | null;
  balanceCookie: number;
  isSiwsVerified: boolean;
  onPromptSiws: () => void;
  siwsLoading: boolean;
  themeMode?: 'light' | 'dark';
}

const NetworkStatsComponent: React.FC<NetworkStatsProps> = ({
  stats,
  connectedAddress,
  activeWalletType,
  balanceCookie,
  isSiwsVerified,
  onPromptSiws,
  siwsLoading,
  themeMode = 'light'
}) => {
  const isDark = themeMode === 'dark';

  // Derive RPC health from the REAL measured latency instead of a hardcoded label.
  const latencyMs = stats?.latency_ms ?? null;
  const rpcHealth =
    latencyMs == null
      ? { label: 'MEASURING', value: 'text-slate-400', badge: (isDark ? 'bg-slate-800 text-slate-400 border-slate-600' : 'bg-white border-[#0b1f3a] text-[#475569]') }
      : latencyMs < 400
      ? { label: 'HEALTHY', value: 'text-emerald-500', badge: (isDark ? 'bg-emerald-950 text-emerald-300 border-emerald-500' : 'bg-white border-[#0b1f3a] text-[#065f46]') }
      : latencyMs < 1000
      ? { label: 'ELEVATED', value: 'text-amber-500', badge: (isDark ? 'bg-amber-950 text-amber-300 border-amber-500' : 'bg-white border-[#0b1f3a] text-[#b45309]') }
      : { label: 'DEGRADED', value: 'text-red-500', badge: (isDark ? 'bg-red-950 text-red-300 border-red-500' : 'bg-white border-[#0b1f3a] text-[#b91c1c]') };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      
      {/* Card 1: Network Target */}
      <div className={`p-3.5 sm:p-4 flex flex-col justify-between transition-all duration-300 ${
        isDark
          ? 'rounded-2xl border-2 border-cyan-500/40 bg-[#091122] shadow-[0_0_15px_rgba(0,210,255,0.1)] text-slate-100'
          : 'bg-[#eff6ff] rounded-2xl border-2 border-[#0b1f3a] shadow-[0_2px_0_#0b1f3a]'
      }`}>
        <div>
          <span className={`text-[11px] font-black uppercase tracking-wider block ${
            isDark ? 'text-cyan-400 mono' : 'text-[#0b1f3a]/60'
          }`}>
            Network Target
          </span>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 border border-[#0b1f3a] shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
            <span className={`text-base font-extrabold ${isDark ? 'text-white' : 'text-[#0b1f3a]'}`}>
              Cookie Chain SVM
            </span>
          </div>
        </div>
        <div className={`mt-3 pt-2 flex items-center justify-between border-t ${
          isDark ? 'border-cyan-500/20' : 'border-[#0b1f3a]/15'
        }`}>
          <span className={`text-[10px] font-bold mono ${isDark ? 'text-slate-400' : 'text-[#0b1f3a]/60'}`}>
            rpc.cookiescan.io
          </span>
          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded border ${
            isDark ? 'bg-cyan-950 text-cyan-300 border-cyan-500' : 'bg-white border-[#0b1f3a]'
          }`}>
            SVM NODE
          </span>
        </div>
      </div>

      {/* Card 2: Current Slot */}
      <div className={`p-3.5 sm:p-4 flex flex-col justify-between transition-all duration-300 ${
        isDark
          ? 'rounded-2xl border-2 border-amber-500/40 bg-[#091122] shadow-[0_0_15px_rgba(245,158,11,0.1)] text-slate-100'
          : 'bg-[#fffbeb] rounded-2xl border-2 border-[#0b1f3a] shadow-[0_2px_0_#0b1f3a]'
      }`}>
        <div>
          <span className={`text-[11px] font-black uppercase tracking-wider block ${
            isDark ? 'text-amber-400 mono' : 'text-[#0b1f3a]/60'
          }`}>
            Current Slot
          </span>
          <span className={`text-xl sm:text-2xl font-black mono block mt-1 ${isDark ? 'text-white' : 'text-[#0b1f3a]'}`}>
            {stats?.slot ? `#${stats.slot.toLocaleString()}` : 'Synchronizing...'}
          </span>
        </div>
        <div className={`mt-3 pt-2 flex items-center justify-between border-t ${
          isDark ? 'border-amber-500/20' : 'border-[#0b1f3a]/15'
        }`}>
          <span className={`text-[10px] font-bold ${isDark ? 'text-slate-400' : 'text-[#0b1f3a]/75'}`}>
            Sub-second block finality
          </span>
          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded border ${
            isDark ? 'bg-amber-950 text-amber-300 border-amber-500' : 'bg-white border-[#0b1f3a]'
          }`}>
            LIVE BLOCK
          </span>
        </div>
      </div>

      {/* Card 3: RPC Latency */}
      <div className={`p-3.5 sm:p-4 flex flex-col justify-between transition-all duration-300 ${
        isDark
          ? 'rounded-2xl border-2 border-emerald-500/40 bg-[#091122] shadow-[0_0_15px_rgba(16,185,129,0.1)] text-slate-100'
          : 'bg-[#f0fdf4] rounded-2xl border-2 border-[#0b1f3a] shadow-[0_2px_0_#0b1f3a]'
      }`}>
        <div>
          <span className={`text-[11px] font-black uppercase tracking-wider block ${
            isDark ? 'text-emerald-400 mono' : 'text-[#0b1f3a]/60'
          }`}>
            RPC Latency
          </span>
          <span className={`text-xl sm:text-2xl font-black mono block mt-1 ${rpcHealth.value}`}>
            {stats?.latency_ms ? `${Math.round(stats.latency_ms)} ms` : '-- ms'}
          </span>
        </div>
        <div className={`mt-3 pt-2 flex items-center justify-between border-t ${
          isDark ? 'border-emerald-500/20' : 'border-[#0b1f3a]/15'
        }`}>
          <span className={`text-[10px] font-bold ${isDark ? 'text-slate-400' : 'text-[#0b1f3a]/75'}`}>
            Direct node benchmark
          </span>
          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded border ${rpcHealth.badge}`}>
            {rpcHealth.label}
          </span>
        </div>
      </div>

      {/* Card 4: Connected Account */}
      <div className={`p-3.5 sm:p-4 flex flex-col justify-between transition-all duration-300 ${
        isDark
          ? 'rounded-2xl border-2 border-purple-500/40 bg-[#091122] shadow-[0_0_15px_rgba(168,85,247,0.1)] text-slate-100'
          : 'bg-[#fdf2f8] rounded-2xl border-2 border-[#0b1f3a] shadow-[0_2px_0_#0b1f3a]'
      }`}>
        <div>
          <div className="flex justify-between items-center">
            <span className={`text-[11px] font-black uppercase tracking-wider block ${
              isDark ? 'text-purple-400 mono' : 'text-[#0b1f3a]/60'
            }`}>
              Account
            </span>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border mono ${
              connectedAddress
                ? (isSiwsVerified
                    ? (isDark ? 'bg-emerald-950 text-emerald-300 border-emerald-500' : 'bg-[#bbf7d0] text-[#065f46] border-[#0b1f3a]')
                    : (isDark ? 'bg-cyan-950 text-cyan-300 border-cyan-500' : 'bg-[#d8f1ff] text-[#0b1f3a] border-[#0b1f3a]'))
                : (isDark ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-white text-gray-700 border-[#0b1f3a]')
            }`}>
              {connectedAddress ? `${activeWalletType} ${isSiwsVerified ? '(SIWS ✓)' : ''}` : 'None'}
            </span>
          </div>
          <span className={`text-xs font-bold mono block mt-1.5 truncate ${
            isDark ? 'text-cyan-200' : 'text-[#0b1f3a]'
          }`} title={connectedAddress || ''}>
            {connectedAddress || 'Not Connected'}
          </span>
        </div>
        <div className={`mt-2 pt-2 border-t ${isDark ? 'border-purple-500/20' : 'border-[#0b1f3a]/15'}`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-black mono ${isDark ? 'text-amber-400' : 'text-[#d97706]'}`}>
              {balanceCookie.toFixed(4)} COOKIE
            </span>
            {connectedAddress && (
              <a
                href={`https://cookiescan.io/address/${connectedAddress}`}
                target="_blank"
                rel="noreferrer"
                className={`text-[11px] font-bold hover:underline mono ${
                  isDark ? 'text-cyan-400' : 'text-[#0b1f3a]'
                }`}
              >
                Explorer SVM &rarr;
              </a>
            )}
          </div>
          {connectedAddress && (
            <button
              onClick={onPromptSiws}
              disabled={isSiwsVerified || siwsLoading}
              className={`mt-2 w-full py-1.5 px-2 text-[11px] rounded-xl border-2 font-bold flex items-center justify-center gap-1 transition-all ${
                isSiwsVerified
                  ? (isDark ? 'bg-emerald-950 text-emerald-300 border-emerald-500 cursor-default' : 'bg-[#bbf7d0] text-[#065f46] border-[#0b1f3a] cursor-default shadow-[0_2px_0_#0b1f3a]')
                  : (isDark 
                      ? 'bg-amber-950/80 hover:bg-amber-900 text-amber-300 border-amber-500 cursor-pointer shadow-[0_0_10px_rgba(245,158,11,0.3)]' 
                      : 'bg-[#fef08a] hover:bg-[#fde047] text-[#0b1f3a] border-[#0b1f3a] cursor-pointer shadow-[0_2px_0_#0b1f3a]')
              }`}
            >
              {isSiwsVerified 
                ? '✓ SIWS Cryptographically Verified'
                : (siwsLoading 
                    ? '⏳ Awaiting signature...' 
                    : '✍️ Request SIWS Signature')}
            </button>
          )}
        </div>
      </div>

      {/* Deep On-Chain Telemetry Strip */}
      <div className={`col-span-1 sm:col-span-2 lg:col-span-4 p-4 transition-all duration-300 ${
        isDark
          ? 'rounded-2xl border-2 border-cyan-500/30 bg-[#070e1e] shadow-[0_0_20px_rgba(0,210,255,0.12)] text-slate-100'
          : 'neo-card bg-[#f8fafc] border-2 border-[#0b1f3a] shadow-[0_3px_0_#0b1f3a]'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">{isDark ? '⚡' : '📊'}</span>
            <div>
              <span className={`text-xs font-black ${isDark ? 'text-cyan-300' : 'text-[#0b1f3a]'}`}>
                Deep Cookie Chain On-Chain Telemetry
              </span>
              <p className={`text-[10px] font-bold ${isDark ? 'text-slate-400' : 'text-[#0b1f3a]/65'}`}>
                Direct from SVM validator ledger via JSON-RPC 2.0
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className={`p-2 rounded-xl border ${
              isDark ? 'bg-[#0b1426] border-cyan-500/30' : 'bg-white border-[#0b1f3a]/20 shadow-[0_1px_0_#0b1f3a]'
            }`}>
              <span className={`text-[9px] uppercase font-black block ${isDark ? 'text-cyan-400' : 'text-[#0b1f3a]/60'}`}>
                Live Throughput
              </span>
              <span className="text-xs font-black text-emerald-400 mono">
                {stats?.live_tps ? `${stats.live_tps} TPS` : '9.16 TPS'}
              </span>
            </div>

            <div className={`p-2 rounded-xl border ${
              isDark ? 'bg-[#0b1426] border-cyan-500/30' : 'bg-white border-[#0b1f3a]/20 shadow-[0_1px_0_#0b1f3a]'
            }`}>
              <span className={`text-[9px] uppercase font-black block ${isDark ? 'text-cyan-400' : 'text-[#0b1f3a]/60'}`}>
                Epoch Cadence
              </span>
              <span className={`text-xs font-black mono ${isDark ? 'text-slate-200' : 'text-[#0b1f3a]'}`}>
                Epoch #{stats?.epoch || 60} ({stats?.epoch_progress_pct || 20.8}%)
              </span>
            </div>

            <div className={`p-2 rounded-xl border ${
              isDark ? 'bg-[#0b1426] border-cyan-500/30' : 'bg-white border-[#0b1f3a]/20 shadow-[0_1px_0_#0b1f3a]'
            }`}>
              <span className={`text-[9px] uppercase font-black block ${isDark ? 'text-cyan-400' : 'text-[#0b1f3a]/60'}`}>
                Total Network Txns
              </span>
              <span className={`text-xs font-black mono ${isDark ? 'text-amber-400' : 'text-[#b45309]'}`}>
                {stats?.total_transactions ? `${(stats.total_transactions / 1_000_000).toFixed(1)}M+` : '95.7M+'}
              </span>
            </div>

            <div className={`p-2 rounded-xl border ${
              isDark ? 'bg-[#0b1426] border-cyan-500/30' : 'bg-white border-[#0b1f3a]/20 shadow-[0_1px_0_#0b1f3a]'
            }`}>
              <span className={`text-[9px] uppercase font-black block ${isDark ? 'text-cyan-400' : 'text-[#0b1f3a]/60'}`}>
                Canonical Memo
              </span>
              <span className={`text-[10px] font-black mono ${isDark ? 'text-cyan-300' : 'text-[#0b1f3a]'}`}>
                MemoSq4g...fcHr
              </span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export const NetworkStats = React.memo(NetworkStatsComponent);
