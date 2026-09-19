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
}

export const TelemetryOven: React.FC<TelemetryOvenProps> = ({
  connectedAddress,
  activeWalletType,
  onOpenWalletModal,
  onBroadcastMemo,
  broadcastResult,
  isBroadcasting
}) => {
  const [agentId, setAgentId] = useState('CookieSentinel-Oracle Santiago');
  const [memoPayload, setMemoPayload] = useState('heartbeat:healthy | latency:12ms | tps:840');

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
            <span>⏳ Abriendo billetera para firmar...</span>
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
                      Ver en CookieScan ({broadcastResult.txSignature.slice(0, 12)}...) &rarr;
                    </a>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="text-[#d97706] font-black flex items-center gap-1.5 text-sm">
                <span>⚠️</span> Notificación de Transacción / Validación
              </div>
              <div className="text-[#0b1f3a]/85 break-all text-[11px] leading-relaxed pt-1">
                <strong>Signer:</strong> {connectedAddress} ({activeWalletType})<br />
                <strong>Target Network:</strong> Cookie Chain SVM (<a href={`https://cookiescan.io/address/${connectedAddress}`} target="_blank" rel="noreferrer" className="text-[#0b1f3a] underline font-bold">Ver dirección en CookieScan</a>)<br />
                <strong>Detalle:</strong> <span className="text-[#b45309] font-bold">{broadcastResult.details}</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
