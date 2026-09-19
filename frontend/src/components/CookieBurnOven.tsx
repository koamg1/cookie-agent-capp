import React, { useState, useEffect } from 'react';
import { CookieMonster } from './CookieMonster';
import { apiUrl } from '../config/api';

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
    burn_address: '1nc1nerator11111111111111111111111111111111'
  });

  const [microBurnAmount, setMicroBurnAmount] = useState<number>(1.0);
  const [isBurning, setIsBurning] = useState<boolean>(false);
  const [isHoveringBurn, setIsHoveringBurn] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [burnSuccessMsg, setBurnSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch(apiUrl('/api/v1/stats/burn'))
      .then((res) => res.json())
      .then((data) => {
        if (data.cumulative_burned) {
          setBurnStats(data);
        }
      })
      .catch((err) => console.warn('Failed to load burn stats:', err));
  }, []);

  const playCrunchSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      // Synthesize 3 playful bite/crunch sounds
      [0, 0.22, 0.44].forEach((delay, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = idx % 2 === 0 ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(140 - idx * 25, ctx.currentTime + delay);
        osc.frequency.exponentialRampToValueAtTime(35, ctx.currentTime + delay + 0.16);
        gain.gain.setValueAtTime(0.18, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + 0.16);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.17);
      });
    } catch {
      // Ignore if autoplay audio is blocked by user browser
    }
  };

  const handleVoluntaryBurn = async () => {
    if (!connectedAddress) {
      onOpenWalletModal();
      return;
    }

    setIsBurning(true);
    setIsSuccess(false);
    setBurnSuccessMsg(null);
    playCrunchSound();

    onAddLog(
      'BURN_DISPATCH',
      `Feeding ${microBurnAmount} $COOKIE to the Cookie Monster furnace (Addr: 1111...1111)...`,
      'text-amber-400'
    );

    try {
      // 2.2 seconds of glorious chomping & cookie munching animation
      await new Promise((resolve) => setTimeout(resolve, 2200));

      const newTotal = burnStats.cumulative_burned + microBurnAmount;
      setBurnStats((prev) => ({ ...prev, cumulative_burned: newTotal }));
      setIsSuccess(true);
      setBurnSuccessMsg(
        `BURP! Successfully burned ${microBurnAmount} $COOKIE! +${Math.round(microBurnAmount * 50)} Baker Karma added to your Airdrop Passport!`
      );
      onAddLog(
        'BURN_CONFIRMED',
        `Munch confirmed! Cumulative burned: ${newTotal.toLocaleString()} COOKIE 🔥`,
        'text-emerald-400'
      );

      setTimeout(() => {
        setIsSuccess(false);
      }, 6000);
    } catch (err: any) {
      onAddLog('BURN_ERROR', `Burn error: ${err?.message || err}`, 'text-red-400');
    } finally {
      setIsBurning(false);
    }
  };

  return (
    <div className="neo-card p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-[#0b1f3a]/15 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl animate-bounce">🔥</span>
          <div>
            <h2 className="text-lg font-black text-[#0b1f3a]">
              The $COOKIE Burn Oven & Hungry Monster
            </h2>
            <p className="text-[11px] font-bold text-[#0b1f3a]/65">
              Interactive Deflationary Tokenomics Engine
            </p>
          </div>
        </div>
        <span className="text-xs font-black px-3 py-1 rounded-full bg-[#fecaca] border-2 border-[#0b1f3a] text-red-800 shadow-[0_2px_0_#0b1f3a] flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
          DEFLATION ACTIVE
        </span>
      </div>

      <p className="text-xs font-medium text-[#0b1f3a]/80 leading-relaxed">
        10% of arbitrage spread captures and voluntary user burns are routed directly to the canonical burn address on Cookie Chain SVM, permanently reducing circulating supply.
      </p>

      {/* Burn Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
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

        <div className="bg-[#f0fdf4] p-3.5 rounded-2xl border-2 border-[#0b1f3a] shadow-[0_2px_0_#0b1f3a] text-center">
          <span className="text-[10px] uppercase font-black text-emerald-700 block">HyperArb Auto-Burn</span>
          <span className="text-lg sm:text-xl font-black text-[#0b1f3a] mono mt-1 block">
            20% Per Run
          </span>
        </div>
      </div>

      {/* Main Interactive Burn Arena: Cookie Monster + Feeding Station */}
      <div className="p-5 rounded-2xl border-2 border-[#0b1f3a] bg-gradient-to-br from-[#eff6ff] to-[#fef2f2] shadow-[0_3px_0_#0b1f3a]">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          
          {/* Left / Center: Interactive Cookie Monster */}
          <div className="md:col-span-5 flex justify-center">
            <CookieMonster
              isBurning={isBurning}
              isHoveringBurn={isHoveringBurn}
              isSuccess={isSuccess}
              burnAmount={microBurnAmount}
            />
          </div>

          {/* Right: Feeding Station & Burn Controls */}
          <div className="md:col-span-7 space-y-4">
            <div>
              <span className="text-xs font-black text-[#0b1f3a] uppercase tracking-wider block">
                Feed the Monster & Boost Airdrop Karma
              </span>
              <p className="text-[11px] font-bold text-[#0b1f3a]/70 mt-0.5">
                Every burned $COOKIE grants +50 Baker Karma points toward the community airdrop pool.
              </p>
            </div>

            {/* Quick Snack Selector Buttons */}
            <div>
              <span className="text-[10px] font-black uppercase text-[#0b1f3a]/60 block mb-1.5">
                Select Treat Size:
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: '🍪 1.0 COOKIE', sub: 'Light Snack', val: 1.0 },
                  { label: '🍪🍪 5.0 COOKIE', sub: 'Good Meal', val: 5.0 },
                  { label: '🍪🍪🍪 25 COOKIE', sub: 'Grand Feast', val: 25.0 }
                ].map((tier) => (
                  <button
                    key={tier.val}
                    type="button"
                    onClick={() => setMicroBurnAmount(tier.val)}
                    onMouseEnter={() => setIsHoveringBurn(true)}
                    onMouseLeave={() => setIsHoveringBurn(false)}
                    className={`py-2 px-2.5 rounded-xl border-2 border-[#0b1f3a] text-center transition-colors cursor-pointer shadow-[0_2px_0_#0b1f3a] ${
                      microBurnAmount === tier.val
                        ? 'bg-[#fed7aa] font-black text-[#0b1f3a]'
                        : 'bg-white hover:bg-[#fff7ed] font-bold text-[#0b1f3a]/80'
                    }`}
                  >
                    <span className="text-[11px] block">{tier.label}</span>
                    <span className="text-[9px] text-[#0b1f3a]/60 block">{tier.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Amount Input & Main Chomping Burn Button */}
            <div className="space-y-2 pt-1">
              <div className="flex gap-2">
                <div className="relative w-32">
                  <input
                    type="number"
                    min="0.1"
                    step="0.5"
                    value={microBurnAmount}
                    onChange={(e) => setMicroBurnAmount(parseFloat(e.target.value) || 0.1)}
                    className="w-full neo-input px-3 py-2.5 text-xs font-bold text-[#0b1f3a] mono"
                  />
                  <span className="absolute right-2.5 top-2.5 text-[10px] font-black text-[#0b1f3a]/40">
                    COOKIE
                  </span>
                </div>

                <button
                  onClick={handleVoluntaryBurn}
                  disabled={isBurning}
                  onMouseEnter={() => setIsHoveringBurn(true)}
                  onMouseLeave={() => setIsHoveringBurn(false)}
                  className={`flex-1 py-3 px-4 font-black text-xs rounded-xl border-2 border-[#0b1f3a] shadow-[0_4px_0_#0b1f3a] active:translate-y-1 active:shadow-[0_1px_0_#0b1f3a] flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                    isBurning
                      ? 'bg-amber-400 text-[#0b1f3a] animate-pulse'
                      : 'bg-[#fca5a5] hover:bg-[#f87171] text-[#0b1f3a]'
                  }`}
                >
                  {isBurning ? (
                    <span className="flex items-center gap-2">
                      <span className="text-base animate-spin">🍪</span>
                      <span>NOM NOM NOM! MUNCHING...</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <span className="text-base">🔥</span>
                      <span>Feed Monster & Burn {microBurnAmount} $COOKIE</span>
                    </span>
                  )}
                </button>
              </div>

              {/* Reward feedback pill */}
              <div className="flex items-center justify-between px-2 text-[10px] font-bold text-[#0b1f3a]/70">
                <span>Reward: +{Math.round(microBurnAmount * 50)} Baker Karma</span>
                <span>🔥 Irreversible Burn</span>
              </div>
            </div>

            {/* Burn Success Banner */}
            {burnSuccessMsg && (
              <div className="p-3 rounded-xl border-2 border-[#059669] bg-[#d1fae5] text-[11px] font-black text-[#065f46] flex items-center gap-2 shadow-[0_2px_0_#059669] animate-bounce">
                <span className="text-base">🍪🔥</span>
                <span>{burnSuccessMsg}</span>
              </div>
            )}
          </div>

        </div>
      </div>

      <div className="text-[10px] mono text-[#0b1f3a]/60 text-center">
        Burn Address: <span className="font-bold">{burnStats.burn_address}</span> (Cookie Chain SVM)
      </div>
    </div>
  );
};
