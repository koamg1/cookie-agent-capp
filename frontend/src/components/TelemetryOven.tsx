import React, { useState } from 'react';

interface TelemetryOvenProps {
  connectedAddress: string | null;
  activeWalletType: string | null;
  onOpenWalletModal: () => void;
  onBroadcastMemo: (agentId: string, payload: string) => Promise<any>;
  broadcastResult: {
    status: 'idle' | 'success' | 'error';
    txSignature?: string;
    details?: string;
    simulated?: boolean;
    proofId?: string;
  };
  isBroadcasting: boolean;
  selectedAgent?: { id: string; name: string; telemetry_sample: string } | null;
  balanceCookie?: number;
  onOpenBridgeModal?: () => void;
  onNavigateToBurn?: () => void;
  onNavigateToVault?: () => void;
  themeMode?: 'light' | 'dark';
}

export const TelemetryOven: React.FC<TelemetryOvenProps> = ({
  connectedAddress,
  activeWalletType,
  onOpenWalletModal,
  onBroadcastMemo,
  broadcastResult,
  isBroadcasting,
  selectedAgent,
  balanceCookie = 0,
  onOpenBridgeModal,
  onNavigateToBurn,
  onNavigateToVault,
  themeMode = 'light'
}) => {
  const isDark = themeMode === 'dark';
  const [agentId, setAgentId] = useState('Sentinel Prime Orchestrator');
  const [memoPayload, setMemoPayload] = useState('prime:swarm_heartbeat | agents_synced:50/50 | network:operational');

  React.useEffect(() => {
    if (selectedAgent) {
      setAgentId(selectedAgent.name);
      setMemoPayload(selectedAgent.telemetry_sample);
    }
  }, [selectedAgent]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectedAddress) {
      onOpenWalletModal();
      return;
    }
    onBroadcastMemo(agentId, memoPayload);
  };

  return (
    <div className={`p-6 space-y-4 transition-all duration-300 ${
      isDark
        ? 'rounded-3xl border-2 border-amber-500/40 bg-[#070e1e] shadow-[0_0_25px_rgba(245,158,11,0.12)] text-slate-100'
        : 'neo-card bg-white text-[#0b1f3a]'
    }`}>
      <div className={`flex items-center justify-between border-b-2 pb-3 ${
        isDark ? 'border-amber-500/20' : 'border-[#0b1f3a]/15'
      }`}>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{isDark ? '⚡' : '🔥'}</span>
          <div>
            <h2 className={`text-lg font-black tracking-tight ${
              isDark
                ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-300 to-red-400'
                : 'text-[#0b1f3a]'
            }`}>
              {isDark ? 'SVM Telemetry Reactor' : 'The SVM Oven'}
            </h2>
            <p className={`text-[11px] font-bold ${isDark ? 'text-slate-400' : 'text-[#0b1f3a]/65'}`}>
              On-Chain Agent Telemetry Broadcaster
            </p>
          </div>
        </div>
        <span className={`text-xs font-black px-2.5 py-1 rounded-full border-2 mono ${
          isDark
            ? 'bg-amber-950 text-amber-300 border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
            : 'bg-[#ffe0a8] border-[#0b1f3a] text-[#0b1f3a] shadow-[0_2px_0_#0b1f3a]'
        }`}>
          SPL MEMO
        </span>
      </div>

      <p className={`text-xs font-medium leading-relaxed ${isDark ? 'text-slate-300' : 'text-[#0b1f3a]/80'}`}>
        Broadcast immutable cryptographic telemetry directly into Cookie Chain SVM blocks. Requires a signature from your connected Web3 wallet (Nightly, Phantom, Solflare) or state proof attestation.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3 pt-1">
        <div>
          <label className={`text-xs font-bold block mb-1 ${isDark ? 'text-amber-300' : 'text-[#0b1f3a]'}`}>
            Agent Identifier
          </label>
          <input
            type="text"
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
            className={`w-full px-3.5 py-2.5 text-xs transition-all ${
              isDark
                ? 'bg-[#050a16] border-2 border-amber-500/40 text-amber-200 rounded-xl focus:border-amber-300 outline-none mono'
                : 'neo-input text-[#0b1f3a]'
            }`}
            required
          />
        </div>

        <div>
          <label className={`text-xs font-bold block mb-1 ${isDark ? 'text-amber-300' : 'text-[#0b1f3a]'}`}>
            Telemetry Payload / State Proof
          </label>
          <input
            type="text"
            value={memoPayload}
            onChange={(e) => setMemoPayload(e.target.value)}
            className={`w-full px-3.5 py-2.5 text-xs transition-all ${
              isDark
                ? 'bg-[#050a16] border-2 border-amber-500/40 text-amber-200 rounded-xl focus:border-amber-300 outline-none mono'
                : 'neo-input text-[#0b1f3a]'
            }`}
            required
          />
        </div>

        {/* Zero-Balance Gas Warning & Direct Faucet Access */}
        {connectedAddress && balanceCookie <= 0.0001 && (
          <div className={`p-3.5 rounded-2xl border-2 text-xs space-y-2 ${
            isDark
              ? 'bg-amber-950/60 border-amber-500/80 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
              : 'bg-[#fef3c7] border-[#b45309] text-[#0b1f3a] shadow-[0_2px_0_#b45309]'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-base">⛽</span>
                <span className={`font-black ${isDark ? 'text-amber-300' : 'text-[#92400e]'}`}>
                  Wallet Balance: 0.0000 $COOKIE (Insufficient Gas)
                </span>
              </div>
              {onOpenBridgeModal && (
                <button
                  type="button"
                  onClick={onOpenBridgeModal}
                  className={`px-3 py-1.5 rounded-xl font-black text-xs border cursor-pointer whitespace-nowrap ${
                    isDark
                      ? 'bg-amber-900 hover:bg-amber-800 text-amber-200 border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                      : 'bg-[#ffe0a8] hover:bg-[#fed388] text-[#0b1f3a] border-[#0b1f3a] shadow-[0_1px_0_#0b1f3a]'
                  }`}
                >
                  🪐 Buy / Bridge $COOKIE &rarr;
                </button>
              )}
            </div>
            <p className={`text-[11px] font-medium leading-relaxed ${isDark ? 'text-slate-300' : 'text-[#0b1f3a]/80'}`}>
              Broadcasting a real on-chain SPL memo requires a tiny fraction of $COOKIE for network gas. With a zero balance, the app instead records a <strong>simulated</strong> Gateway proof (clearly labelled, no on-chain transaction) so you can preview the flow.
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={isBroadcasting}
          className={`w-full py-3 font-extrabold text-sm rounded-2xl flex items-center justify-center gap-2 mt-2 transition-all cursor-pointer ${
            isDark
              ? 'bg-gradient-to-r from-amber-600 via-orange-600 to-amber-500 hover:from-amber-500 hover:to-orange-400 text-white border-2 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)] active:scale-95'
              : (connectedAddress
                  ? 'neo-btn bg-[#86efac] hover:bg-[#4ade80] text-[#0b1f3a]'
                  : 'neo-btn bg-[#ffe0a8] hover:bg-[#fed388] text-[#0b1f3a]')
          }`}
        >
          {isBroadcasting ? (
            <span>⏳ Opening wallet to sign...</span>
          ) : connectedAddress ? (
            <span>🚀 Sign & Broadcast to Cookie Chain SVM</span>
          ) : (
            <span>⚡ Connect Wallet to Broadcast On-Chain</span>
          )}
        </button>
      </form>

      {/* Result Box */}
      {broadcastResult.status !== 'idle' && (
        <div className={`p-4 rounded-2xl border-2 text-xs mono space-y-1.5 mt-3 ${
          isDark
            ? 'bg-[#050a16] border-cyan-500/40 text-slate-200 shadow-[0_0_15px_rgba(0,210,255,0.15)]'
            : 'bg-[#f8fafc] border-[#0b1f3a] text-[#0b1f3a] shadow-[0_3px_0_#0b1f3a]'
        }`}>
          {broadcastResult.status === 'success' && broadcastResult.simulated ? (
            <>
              <div className="text-amber-400 font-black flex items-center gap-1.5 text-sm">
                <span>🧪</span> Simulated proof — no on-chain transaction
              </div>
              <div className="break-all text-[11px] leading-relaxed pt-1">
                <strong>Signer:</strong> {connectedAddress} ({activeWalletType})<br />
                <strong>Mode:</strong> <span className="text-amber-400 font-bold">SIMULATION (Gateway proof, not broadcast to chain)</span><br />
                {broadcastResult.proofId && (
                  <><strong>Proof ID:</strong> <span className="font-bold">{broadcastResult.proofId}</span><br /></>
                )}
                <span className="opacity-80">{broadcastResult.details}</span>
              </div>
            </>
          ) : broadcastResult.status === 'success' ? (
            <>
              <div className="text-emerald-400 font-black flex items-center gap-1.5 text-sm">
                <span>✓</span> Confirmed on Cookie Chain SVM
              </div>
              <div className="break-all text-[11px] leading-relaxed pt-1">
                <strong>Signer:</strong> {connectedAddress} ({activeWalletType})<br />
                <strong>Canonical Program:</strong> <span className="text-amber-400 font-bold">MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr</span><br />
                {broadcastResult.txSignature && (
                  <>
                    <strong>Transaction Hash:</strong>{' '}
                    <a
                      href={`https://cookiescan.io/tx/${broadcastResult.txSignature}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-400 underline font-black"
                    >
                      View on CookieScan ({broadcastResult.txSignature.slice(0, 12)}...) &rarr;
                    </a>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="text-amber-400 font-black flex items-center gap-1.5 text-sm">
                <span>⚠️</span> Transaction Notice / Validation
              </div>
              <div className="break-all text-[11px] leading-relaxed pt-1">
                <strong>Signer:</strong> {connectedAddress} ({activeWalletType})<br />
                <strong>Target Network:</strong> Cookie Chain SVM (<a href={`https://cookiescan.io/address/${connectedAddress}`} target="_blank" rel="noreferrer" className="underline font-bold text-cyan-400">View on CookieScan</a>)<br />
                <strong>Details:</strong> <span className="text-amber-400 font-bold">{broadcastResult.details}</span>
              </div>
            </>
          )}
        </div>
      )}

      {(onNavigateToVault || onNavigateToBurn) && (
        <div className={`pt-2 border-t flex flex-wrap items-center justify-between gap-2 ${
          isDark ? 'border-amber-500/20' : 'border-[#0b1f3a]/10'
        }`}>
          <span className={`text-xs font-bold flex items-center gap-1.5 ${
            isDark ? 'text-slate-400' : 'text-[#0b1f3a]/75'
          }`}>
            <span>{isDark ? '👾' : '🍪'}</span>
            <span>Explore other protocol modules:</span>
          </span>
          <div className="flex items-center gap-2">
            {onNavigateToVault && (
              <button
                type="button"
                onClick={onNavigateToVault}
                className={`text-xs font-black px-2.5 py-1 rounded-full border cursor-pointer flex items-center gap-1 transition-all ${
                  isDark
                    ? 'bg-amber-950 text-amber-300 border-amber-500 hover:bg-amber-900 shadow-[0_0_8px_rgba(245,158,11,0.25)]'
                    : 'bg-[#fef08a] hover:bg-[#fde047] text-[#854d0e] border-[#0b1f3a] shadow-[0_1px_0_#0b1f3a]'
                }`}
              >
                <span>⚡ Atomic Vault</span>
                <span>&rarr;</span>
              </button>
            )}
            {onNavigateToBurn && (
              <button
                type="button"
                onClick={onNavigateToBurn}
                className={`text-xs font-black px-2.5 py-1 rounded-full border cursor-pointer flex items-center gap-1 transition-all ${
                  isDark
                    ? 'bg-red-950 text-red-300 border-red-500 hover:bg-red-900 shadow-[0_0_8px_rgba(239,68,68,0.25)]'
                    : 'bg-[#fed7aa] hover:bg-[#fca5a5] text-[#991b1b] border-[#0b1f3a] shadow-[0_1px_0_#0b1f3a]'
                }`}
              >
                <span>🔥 Burn Oven</span>
                <span>&rarr;</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
