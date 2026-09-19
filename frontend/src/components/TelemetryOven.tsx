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
  };
  isBroadcasting: boolean;
  selectedAgent?: { id: string; name: string; telemetry_sample: string } | null;
  balanceCookie?: number;
  onOpenBridgeModal?: () => void;
  onNavigateToBurn?: () => void;
  onNavigateToVault?: () => void;
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
  onNavigateToVault
}) => {
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
    <div className="neo-card p-6 space-y-4">
      <div className="flex items-center justify-between border-b-2 border-[#0b1f3a]/15 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔥</span>
          <div>
            <h2 className="text-lg font-black text-[#0b1f3a]">The SVM Oven</h2>
            <p className="text-[11px] font-bold text-[#0b1f3a]/65">On-Chain Agent Telemetry Broadcaster</p>
          </div>
        </div>
        <span className="text-xs font-black px-2.5 py-1 rounded-full bg-[#ffe0a8] border-2 border-[#0b1f3a] text-[#0b1f3a] shadow-[0_2px_0_#0b1f3a]">
          SPL MEMO
        </span>
      </div>

      <p className="text-xs font-medium text-[#0b1f3a]/80 leading-relaxed">
        Bake verifiable AI Agent telemetry directly into Cookie Chain SVM blocks. Requires a genuine Web3 signature (Nightly, Phantom, Solflare) or an instant in-browser Session Key.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3 pt-1">
        <div>
          <label className="text-xs font-bold text-[#0b1f3a] block mb-1">Agent Identifier</label>
          <input
            type="text"
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
            className="w-full neo-input px-3.5 py-2.5 text-xs text-[#0b1f3a]"
            required
          />
        </div>

        <div>
          <label className="text-xs font-bold text-[#0b1f3a] block mb-1">Telemetry Payload / State Proof</label>
          <input
            type="text"
            value={memoPayload}
            onChange={(e) => setMemoPayload(e.target.value)}
            className="w-full neo-input px-3.5 py-2.5 text-xs text-[#0b1f3a]"
            required
          />
        </div>

        {/* Zero-Balance Gas Warning & Direct Faucet Access */}
        {connectedAddress && balanceCookie <= 0.0001 && (
          <div className="p-3.5 bg-[#fef3c7] border-2 border-[#b45309] rounded-2xl text-xs text-[#0b1f3a] space-y-2 shadow-[0_2px_0_#b45309]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-base">⛽</span>
                <span className="font-black text-[#92400e]">Wallet Balance: 0.0000 $COOKIE (No Gas)</span>
              </div>
              {onOpenBridgeModal && (
                <button
                  type="button"
                  onClick={onOpenBridgeModal}
                  className="px-3 py-1.5 rounded-xl bg-[#ffe0a8] hover:bg-[#fed388] text-[#0b1f3a] font-black text-xs border border-[#0b1f3a] shadow-[0_1px_0_#0b1f3a] cursor-pointer whitespace-nowrap"
                >
                  🚰 Get Free Testnet $COOKIE &rarr;
                </button>
              )}
            </div>
            <p className="text-[11px] font-medium text-[#0b1f3a]/80 leading-relaxed">
              Broadcasting an on-chain SPL memo requires a tiny fraction of $COOKIE for network gas. If your wallet has 0 funds, the transaction will automatically fall back to an authentic Gateway proof. Use the faucet or bridge to test full SVM execution!
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={isBroadcasting}
          className={`w-full py-3 font-extrabold text-sm rounded-2xl neo-btn flex items-center justify-center gap-2 mt-2 transition-all cursor-pointer ${
            connectedAddress
              ? 'bg-[#86efac] hover:bg-[#4ade80] text-[#0b1f3a]'
              : 'bg-[#ffe0a8] hover:bg-[#fed388] text-[#0b1f3a]'
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
        <div className="p-4 rounded-2xl bg-[#f8fafc] border-2 border-[#0b1f3a] shadow-[0_3px_0_#0b1f3a] text-xs mono space-y-1.5 mt-3">
          {broadcastResult.status === 'success' ? (
            <>
              <div className="text-[#059669] font-black flex items-center gap-1.5 text-sm">
                <span>✓</span> Confirmed on Cookie Chain SVM
              </div>
              <div className="text-[#0b1f3a]/85 break-all text-[11px] leading-relaxed pt-1">
                <strong>Signer:</strong> {connectedAddress} ({activeWalletType})<br />
                <strong>Canonical Program:</strong> <span className="text-[#b45309] font-bold">MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr</span><br />
                {broadcastResult.txSignature && (
                  <>
                    <strong>Transaction Hash:</strong>{' '}
                    <a
                      href={`https://cookiescan.io/tx/${broadcastResult.txSignature}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#059669] underline font-black"
                    >
                      View on CookieScan ({broadcastResult.txSignature.slice(0, 12)}...) &rarr;
                    </a>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="text-[#d97706] font-black flex items-center gap-1.5 text-sm">
                <span>⚠️</span> Transaction Notice / Validation
              </div>
              <div className="text-[#0b1f3a]/85 break-all text-[11px] leading-relaxed pt-1">
                <strong>Signer:</strong> {connectedAddress} ({activeWalletType})<br />
                <strong>Target Network:</strong> Cookie Chain SVM (<a href={`https://cookiescan.io/address/${connectedAddress}`} target="_blank" rel="noreferrer" className="text-[#0b1f3a] underline font-bold">View address on CookieScan</a>)<br />
                <strong>Details:</strong> <span className="text-[#b45309] font-bold">{broadcastResult.details}</span>
              </div>
            </>
          )}
        </div>
      )}

      {(onNavigateToVault || onNavigateToBurn) && (
        <div className="pt-2 border-t border-[#0b1f3a]/10 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold text-[#0b1f3a]/75 flex items-center gap-1.5">
            <span>🍪</span>
            <span>Explore other protocol submenus:</span>
          </span>
          <div className="flex items-center gap-2">
            {onNavigateToVault && (
              <button
                type="button"
                onClick={onNavigateToVault}
                className="text-xs font-black text-[#854d0e] bg-[#fef08a] hover:bg-[#fde047] px-2.5 py-1 rounded-full border border-[#0b1f3a] shadow-[0_1px_0_#0b1f3a] cursor-pointer flex items-center gap-1 hover:translate-y-[-1px] transition-transform"
              >
                <span>⚡ HyperArb Vault</span>
                <span>&rarr;</span>
              </button>
            )}
            {onNavigateToBurn && (
              <button
                type="button"
                onClick={onNavigateToBurn}
                className="text-xs font-black text-[#991b1b] bg-[#fed7aa] hover:bg-[#fca5a5] px-2.5 py-1 rounded-full border border-[#0b1f3a] shadow-[0_1px_0_#0b1f3a] cursor-pointer flex items-center gap-1 hover:translate-y-[-1px] transition-transform"
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
