import React, { useState, useEffect } from 'react';

interface AirdropPassportModalProps {
  isOpen: boolean;
  onClose: () => void;
  connectedAddress: string | null;
  activeWalletType: string | null;
  onAddLog: (tag: string, msg: string, color?: string) => void;
}

export const AirdropPassportModal: React.FC<AirdropPassportModalProps> = ({
  isOpen,
  onClose,
  connectedAddress,
  activeWalletType,
  onAddLog
}) => {
  const [karmaData, setKarmaData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [certifying, setCertifying] = useState<boolean>(false);
  const [certHash, setCertHash] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !connectedAddress) {
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`/api/v1/airdrop/karma/${connectedAddress}`)
      .then((res) => res.json())
      .then((data) => setKarmaData(data))
      .catch((err) => console.warn('Failed to load karma data:', err))
      .finally(() => setLoading(false));
  }, [isOpen, connectedAddress]);

  if (!isOpen) return null;

  const handleCertifyOnChain = async () => {
    if (!connectedAddress) return;
    setCertifying(true);
    onAddLog('AIRDROP_CERT', `Baking on-chain Airdrop Certification for ${connectedAddress}...`, 'text-purple-400');

    try {
      const res = await fetch('/api/v1/agent/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: `Passport-AirdropCert-${activeWalletType}`,
          memo: `[CookieChain DAO Airdrop Passport] Holder:${connectedAddress} Tier:${karmaData?.airdrop_tier} Karma:${karmaData?.baker_karma_score} Multiplier:${karmaData?.airdrop_multiplier}`
        })
      });

      if (res.ok) {
        const data = await res.json();
        setCertHash(data.proof_nonce);
        onAddLog('CERT_CONFIRMED', `Airdrop Passport certified on Cookie Chain! Nonce: ${data.proof_nonce}`, 'text-emerald-400');
      }
    } catch (err: any) {
      onAddLog('CERT_ERROR', `Certification error: ${err?.message || err}`, 'text-red-400');
    } finally {
      setCertifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0b1f3a]/60 backdrop-blur-sm animate-fade-in">
      <div className="neo-card bg-white max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-[#0b1f3a]/15 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎁</span>
            <div>
              <h3 className="text-base font-black text-[#0b1f3a]">Baker Karma & Airdrop Passport</h3>
              <p className="text-[11px] font-bold text-[#0b1f3a]/65">Cookie Chain Ecosystem Grant & Airdrop Qualification</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border-2 border-[#0b1f3a] bg-[#fee2e2] text-[#0b1f3a] font-black text-sm flex items-center justify-center hover:bg-[#fca5a5] cursor-pointer"
          >
            ✕
          </button>
        </div>

        {!connectedAddress ? (
          <div className="py-8 text-center space-y-3">
            <p className="text-xs font-bold text-[#0b1f3a]/75">
              Connect your Nightly or Phantom wallet to check your Baker Karma and Airdrop Tier.
            </p>
          </div>
        ) : loading ? (
          <div className="py-8 text-center text-xs font-bold text-[#0b1f3a]/60 animate-pulse">
            Auditing on-chain telemetry and Baker Karma for {connectedAddress.slice(0, 8)}...
          </div>
        ) : (
          <div className="space-y-4">
            {/* Tier Banner */}
            <div className="p-4 rounded-2xl bg-[#ffe0a8] border-2 border-[#0b1f3a] shadow-[0_3px_0_#0b1f3a] flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-black text-[#0b1f3a]/70 block">Current Qualification Tier</span>
                <span className="text-lg font-black text-[#0b1f3a] flex items-center gap-1.5 mt-0.5">
                  ⭐ {karmaData?.airdrop_tier}
                </span>
                <span className="text-[11px] font-bold text-[#059669]">
                  Airdrop Multiplier: {karmaData?.airdrop_multiplier}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-black text-[#0b1f3a]/70 block">Baker Karma</span>
                <span className="text-2xl font-black text-[#0b1f3a] mono">
                  {karmaData?.baker_karma_score}
                </span>
                <span className="text-[10px] block font-bold text-[#0b1f3a]/60">pts</span>
              </div>
            </div>

            {/* Metrics Breakdown */}
            <div className="grid grid-cols-2 gap-2.5 text-xs mono">
              <div className="p-3 rounded-xl border border-[#0b1f3a]/20 bg-[#f8fafc]">
                <span className="text-[#0b1f3a]/60 block text-[10px]">Telemetry Baked</span>
                <span className="font-black text-sm text-[#0b1f3a]">
                  {karmaData?.telemetry_memos_baked} Proofs
                </span>
              </div>

              <div className="p-3 rounded-xl border border-[#0b1f3a]/20 bg-[#f8fafc]">
                <span className="text-[#0b1f3a]/60 block text-[10px]">Crumbs Eaten (Arb)</span>
                <span className="font-black text-sm text-amber-700">
                  {karmaData?.arbitrage_crumbs_eaten} Spreads
                </span>
              </div>

              <div className="p-3 rounded-xl border border-[#0b1f3a]/20 bg-[#f8fafc]">
                <span className="text-[#0b1f3a]/60 block text-[10px]">DAO Grant Status</span>
                <span className="font-black text-xs text-emerald-700">
                  {karmaData?.dao_grant_eligibility}
                </span>
              </div>

              <div className="p-3 rounded-xl border border-[#0b1f3a]/20 bg-[#f8fafc]">
                <span className="text-[#0b1f3a]/60 block text-[10px]">Active Wallet</span>
                <span className="font-black text-xs text-[#0b1f3a] truncate block">
                  {activeWalletType}
                </span>
              </div>
            </div>

            {/* Proposal Note */}
            <div className="bg-[#ecfdf5] p-3 rounded-2xl border border-emerald-600/30 text-[11px] text-emerald-900 leading-relaxed">
              <strong>Ecosystem Alignment:</strong> By participating in the Cookie Sentinel Swarm and eating arbitrage crumbs, this wallet qualifies for community airdrop allocations and grant distributions from Cookie Chain DAO.
            </div>

            {/* Certify Button */}
            <button
              onClick={handleCertifyOnChain}
              disabled={certifying}
              className="w-full py-3 rounded-xl neo-btn bg-[#86efac] hover:bg-[#4ade80] text-[#0b1f3a] font-extrabold text-xs flex items-center justify-center gap-2 border-2 border-[#0b1f3a] cursor-pointer"
            >
              {certifying ? (
                <span>⏳ Baking Attestation on Cookie Chain...</span>
              ) : (
                <span>📜 Certify Airdrop Passport On-Chain</span>
              )}
            </button>

            {certHash && (
              <div className="p-3 rounded-xl bg-[#f8fafc] border border-[#0b1f3a]/30 text-xs mono text-[#059669] font-bold text-center">
                ✓ On-Chain Proof Certified: {certHash}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
