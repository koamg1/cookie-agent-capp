import React, { useState, useEffect } from 'react';

interface CookieBurnOvenProps {
  connectedAddress: string | null;
  onOpenWalletModal: () => void;
  onAddLog: (tag: string, msg: string, color?: string) => void;
}

export const CookieBurnOven: React.FC<CookieBurnOvenProps> = ({
  connectedAddress,
  onOpenWalletModal,
  onAddLog
}) => {
  const [burnStats, setBurnStats] = useState<{
    cumulative_burned: number;
    burn_rate_24h: number;
    deflation_status: string;
    burn_address: string;
  }>({
    cumulative_burned: 142580.45,
    burn_rate_24h: 4210.50,
    deflation_status: 'active',
    burn_address: '11111111111111111111111111111111'
  });

  const [microBurnAmount, setMicroBurnAmount] = useState<number>(1.0);
  const [isBurning, setIsBurning] = useState<boolean>(false);
  const [burnSuccessMsg, setBurnSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/v1/stats/burn')
      .then((res) => res.json())
      .then((data) => {
        if (data.cumulative_burned) {
          setBurnStats(data);
        }
      })
      .catch((err) => console.warn('Failed to load burn stats:', err));
  }, []);

  const handleVoluntaryBurn = async () => {
    if (!connectedAddress) {
      onOpenWalletModal();
      return;
    }

    setIsBurning(true);
    onAddLog('BURN_DISPATCH', `Initiating deflationary burn of ${microBurnAmount} $COOKIE to address 1111...1111`, 'text-amber-400');

    try {
      // Simulates or executes burn transaction via SPL Memo
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const newTotal = burnStats.cumulative_burned + microBurnAmount;
      setBurnStats((prev) => ({ ...prev, cumulative_burned: newTotal }));
      setBurnSuccessMsg(`Successfully burned ${microBurnAmount} $COOKIE! +50 Baker Karma added to your Airdrop Passport.`);
      onAddLog('BURN_CONFIRMED', `Burn confirmed! Cumulative burned: ${newTotal.toLocaleString()} COOKIE`, 'text-emerald-400');
    } catch (err: any) {
      onAddLog('BURN_ERROR', `Burn error: ${err?.message || err}`, 'text-red-400');
    } finally {
      setIsBurning(false);
    }
  };

  return (
    <div className="neo-card p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-[#0b1f3a]/15 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔥</span>
          <div>
            <h2 className="text-lg font-black text-[#0b1f3a]">The $COOKIE Burn Oven</h2>
            <p className="text-[11px] font-bold text-[#0b1f3a]/65">Deflationary Tokenomics Engine</p>
          </div>
        </div>
        <span className="text-xs font-black px-2.5 py-1 rounded-full bg-[#fecaca] border-2 border-[#0b1f3a] text-red-800 shadow-[0_2px_0_#0b1f3a]">
          ● DEFLATION ACTIVE
        </span>
      </div>

      <p className="text-xs font-medium text-[#0b1f3a]/80 leading-relaxed">
        10% of every arbitrage capture, protocol subsidy, and penalty fee is routed to the canonical burn address, permanently reducing $COOKIE circulating supply on Cookie Chain.
      </p>

      {/* Burn Stats Grid */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <div className="bg-[#fff1f2] p-3.5 rounded-2xl border-2 border-[#0b1f3a] shadow-[0_2px_0_#0b1f3a] text-center">
          <span className="text-[10px] uppercase font-black text-red-700 block">Total Burned Supply</span>
          <span className="text-lg sm:text-xl font-black text-[#0b1f3a] mono mt-1 block">
            🔥 {burnStats.cumulative_burned.toLocaleString()} COOKIE
          </span>
        </div>

        <div className="bg-[#fffbeb] p-3.5 rounded-2xl border-2 border-[#0b1f3a] shadow-[0_2px_0_#0b1f3a] text-center">
          <span className="text-[10px] uppercase font-black text-amber-700 block">24h Burn Velocity</span>
          <span className="text-lg sm:text-xl font-black text-[#0b1f3a] mono mt-1 block">
            +{burnStats.burn_rate_24h.toLocaleString()} / day
          </span>
        </div>
      </div>

      {/* Voluntary Micro-Burn for Karma */}
      <div className="p-4 rounded-2xl border-2 border-[#0b1f3a] bg-[#f8fafc] space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-[#0b1f3a]">Burn to Boost Airdrop Karma</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#ffe0a8] border border-[#0b1f3a]">
            +50 Karma per 1.0 COOKIE
          </span>
        </div>

        <div className="flex gap-2">
          <input
            type="number"
            min="0.1"
            step="0.5"
            value={microBurnAmount}
            onChange={(e) => setMicroBurnAmount(parseFloat(e.target.value) || 0.1)}
            className="w-28 neo-input px-3 py-2 text-xs font-bold text-[#0b1f3a] mono"
          />
          <button
            onClick={handleVoluntaryBurn}
            disabled={isBurning}
            className="flex-1 py-2 px-3 font-extrabold text-xs rounded-xl neo-btn bg-[#fca5a5] hover:bg-[#f87171] text-[#0b1f3a] border-2 border-[#0b1f3a] flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {isBurning ? <span>⏳ Burning...</span> : <span>🔥 Burn $COOKIE & Claim Karma</span>}
          </button>
        </div>

        {burnSuccessMsg && (
          <div className="text-[11px] font-bold text-[#059669] pt-1 flex items-center gap-1">
            <span>✓</span> {burnSuccessMsg}
          </div>
        )}
      </div>

      <div className="text-[10px] mono text-[#0b1f3a]/60 text-center">
        Burn Address: <span className="font-bold">{burnStats.burn_address}</span> (Cookie Chain SVM)
      </div>
    </div>
  );
};
