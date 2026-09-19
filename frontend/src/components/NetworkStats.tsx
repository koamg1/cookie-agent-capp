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
}

export const NetworkStats: React.FC<NetworkStatsProps> = ({
  stats,
  connectedAddress,
  activeWalletType,
  balanceCookie,
  isSiwsVerified,
  onPromptSiws,
  siwsLoading
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      
      {/* Card 1: Network Target */}
      <div className="neo-card-sm p-4 flex flex-col justify-between">
        <div>
          <span className="text-[11px] font-black uppercase text-[#0b1f3a]/60 tracking-wider block">Network Target</span>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 border border-[#0b1f3a] animate-pulse"></span>
            <span className="text-base font-extrabold text-[#0b1f3a]">Cookie Chain</span>
          </div>
        </div>
        <div className="mt-3 pt-2 border-t border-[#0b1f3a]/15 flex items-center justify-between">
          <span className="text-[10px] font-bold text-[#0b1f3a]/60 mono">rpc.cookiescan.io</span>
          <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-[#d8f1ff] border border-[#0b1f3a]">SVM</span>
        </div>
      </div>

      {/* Card 2: Current Slot */}
      <div className="neo-card-sm p-4 flex flex-col justify-between">
        <div>
          <span className="text-[11px] font-black uppercase text-[#0b1f3a]/60 tracking-wider block">Current Slot</span>
          <span className="text-xl sm:text-2xl font-black text-[#0b1f3a] mono block mt-1">
            {stats?.slot ? `#${stats.slot.toLocaleString()}` : 'Fetching...'}
          </span>
        </div>
        <div className="mt-3 pt-2 border-t border-[#0b1f3a]/15 flex items-center justify-between">
          <span className="text-[10px] font-bold text-[#0b1f3a]/75">Sub-second finality</span>
          <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-[#ffe0a8] border border-[#0b1f3a]">LIVE</span>
        </div>
      </div>

      {/* Card 3: RPC Latency */}
      <div className="neo-card-sm p-4 flex flex-col justify-between">
        <div>
          <span className="text-[11px] font-black uppercase text-[#0b1f3a]/60 tracking-wider block">RPC Latency</span>
          <span className="text-xl sm:text-2xl font-black text-[#059669] mono block mt-1">
            {stats?.latency_ms ? `${Math.round(stats.latency_ms)} ms` : '-- ms'}
          </span>
        </div>
        <div className="mt-3 pt-2 border-t border-[#0b1f3a]/15 flex items-center justify-between">
          <span className="text-[10px] font-bold text-[#0b1f3a]/75">Direct node benchmark</span>
          <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-[#bbf7d0] border border-[#0b1f3a] text-[#065f46]">HEALTHY</span>
        </div>
      </div>

      {/* Card 4: Connected Account */}
      <div className="neo-card-sm p-4 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-black uppercase text-[#0b1f3a]/60 tracking-wider block">Account</span>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border border-[#0b1f3a] mono ${
              connectedAddress ? (isSiwsVerified ? 'bg-[#bbf7d0] text-[#065f46]' : 'bg-[#d8f1ff] text-[#0b1f3a]') : 'bg-gray-200 text-gray-700'
            }`}>
              {connectedAddress ? `${activeWalletType} ${isSiwsVerified ? '(SIWS ✓)' : ''}` : 'None'}
            </span>
          </div>
          <span className="text-xs font-bold text-[#0b1f3a] mono block mt-1.5 truncate" title={connectedAddress || ''}>
            {connectedAddress || 'Not Connected'}
          </span>
        </div>
        <div className="mt-2 pt-2 border-t border-[#0b1f3a]/15">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-[#d97706] mono">
              {balanceCookie.toFixed(4)} COOKIE
            </span>
            {connectedAddress && (
              <a
                href={`https://cookiescan.io/address/${connectedAddress}`}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-bold text-[#0b1f3a] hover:underline mono"
              >
                Explorer &rarr;
              </a>
            )}
          </div>
          {connectedAddress && (
            <button
              onClick={onPromptSiws}
              disabled={isSiwsVerified || siwsLoading}
              className={`mt-2 w-full py-1.5 px-2 text-[11px] rounded-xl border-2 border-[#0b1f3a] font-bold flex items-center justify-center gap-1 transition-all shadow-[0_2px_0_#0b1f3a] ${
                isSiwsVerified
                  ? 'bg-[#bbf7d0] text-[#065f46] cursor-default'
                  : 'bg-[#fef08a] hover:bg-[#fde047] text-[#0b1f3a] active:translate-y-0.5 cursor-pointer'
              }`}
            >
              {isSiwsVerified ? '✓ Autenticación SIWS Firmada' : (siwsLoading ? '⏳ Esperando firma...' : '✍️ Solicitar Firma SIWS')}
            </button>
          )}
        </div>
      </div>

    </div>
  );
};
