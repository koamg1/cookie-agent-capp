import React, { useState, useEffect } from 'react';
import { CookieMonster } from './CookieMonster';
import { WalletType } from '../types/wallet';
import { apiUrl } from '../config/api';
import {
  executeCookieChainBurn,
  CANONICAL_BURN_ADDRESS,
  getWalletProvider
} from '../utils/solana';

interface CookieBurnOvenProps {
  connectedAddress: string | null;
  activeWalletType: WalletType | null;
  activeProvider: any;
  balanceCookie: number;
  onOpenWalletModal: () => void;
  onOpenBridgeModal: () => void;
  onRefreshBalance?: () => void;
  onAddLog: (tag: string, msg: string, color?: string) => void;
}

export const CookieBurnOven: React.FC<CookieBurnOvenProps> = ({
  connectedAddress,
  activeWalletType,
  activeProvider,
  balanceCookie,
  onOpenWalletModal,
  onOpenBridgeModal,
  onRefreshBalance,
  onAddLog
}) => {
  const [microBurnAmount, setMicroBurnAmount] = useState<number>(1.0);
  const [isBurning, setIsBurning] = useState<boolean>(false);
  const [burnStage, setBurnStage] = useState<'idle' | 'preparing' | 'signing' | 'confirming' | 'eating'>('idle');
  const [isHoveringBurn, setIsHoveringBurn] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [burnSuccessMsg, setBurnSuccessMsg] = useState<string | null>(null);
  const [burnTxSignature, setBurnTxSignature] = useState<string | null>(null);
  const [burnExplorerUrl, setBurnExplorerUrl] = useState<string | null>(null);
  const [burnError, setBurnError] = useState<string | null>(null);

  // Real on-chain burn counter accumulated specifically by this app
  const [appBurnedTotal, setAppBurnedTotal] = useState<number>(0.0);
  const [burnEventsCount, setBurnEventsCount] = useState<number>(0);

  const fetchAppBurnTotal = () => {
    fetch(apiUrl('/api/v1/burn/app-total'))
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.total_burned_by_app === 'number') {
          setAppBurnedTotal(data.total_burned_by_app);
          setBurnEventsCount(data.total_burn_events || 0);
        }
      })
      .catch((err) => console.warn('Failed to load app burn total:', err));
  };

  useEffect(() => {
    fetchAppBurnTotal();
    const interval = setInterval(fetchAppBurnTotal, 8000);
    return () => clearInterval(interval);
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
    const provider = activeProvider || (activeWalletType ? getWalletProvider(activeWalletType) : null);

    if (!connectedAddress || !provider || !activeWalletType) {
      onOpenWalletModal();
      return;
    }

    setBurnError(null);
    setBurnTxSignature(null);
    setBurnExplorerUrl(null);
    setBurnSuccessMsg(null);
    setIsBurning(true);
    setBurnStage('preparing');

    try {
      if (balanceCookie < microBurnAmount) {
        throw new Error(
          `Insufficient $COOKIE balance on Cookie Chain (${balanceCookie.toFixed(4)} COOKIE available, ${microBurnAmount} requested). Please acquire or bridge $COOKIE to Cookie Chain first!`
        );
      }

      onAddLog(
        'BURN_START',
        `Initializing verifiable burn transfer of ${microBurnAmount} COOKIE to 1nc1nerator on Cookie Chain SVM...`,
        'text-amber-400'
      );

      const txSig = await executeCookieChainBurn(
        activeWalletType,
        provider,
        connectedAddress,
        microBurnAmount,
        onAddLog,
        setBurnStage
      );

      const explorerUrl = `https://cookiescan.io/tx/${txSig}`;
      onAddLog('BURN_CONFIRMED', `Burn confirmed on Cookie Chain SVM! Tx: ${txSig}`, 'text-emerald-400');

      // Record this real burn in the app's persistent SQLite registry
      fetch(apiUrl('/api/v1/burn/record'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_address: connectedAddress,
          amount_cookie: microBurnAmount,
          tx_signature: txSig,
          source: 'user_oven'
        })
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.app_totals) {
            setAppBurnedTotal(data.app_totals.total_burned_by_app);
            setBurnEventsCount(data.app_totals.total_burn_events);
          }
        })
        .catch((e) => console.warn('Burn record err:', e));

      setBurnStage('eating');
      playCrunchSound();
      setBurnTxSignature(txSig);
      setBurnExplorerUrl(explorerUrl);
      setIsSuccess(true);

      const karmaBonus = Math.round(microBurnAmount * 50);
      setBurnSuccessMsg(
        `BURP! Successfully burned ${microBurnAmount} $COOKIE on Cookie Chain SVM! +${karmaBonus} Baker Karma points added to your Airdrop Passport!`
      );

      // Optimistically increment the local burn total
      setAppBurnedTotal((prev) => Number((prev + microBurnAmount).toFixed(4)));
      setBurnEventsCount((prev) => prev + 1);

      if (onRefreshBalance) onRefreshBalance();

      setTimeout(() => {
        setIsSuccess(false);
      }, 9000);

    } catch (err: any) {
      const errMsg = err?.message || String(err);
      if (errMsg.includes('reject') || errMsg.includes('cancel') || errMsg.includes('User rejected')) {
        setBurnError('Transaction signature was cancelled in your wallet.');
        onAddLog('BURN_CANCELLED', 'Burn transaction rejected by user in wallet.', 'text-amber-400');
      } else {
        setBurnError(errMsg);
        onAddLog('BURN_ERROR', `Burn execution failed: ${errMsg}`, 'text-red-400');
      }
    } finally {
      setIsBurning(false);
      setBurnStage('idle');
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
              Deflationary Furnace &bull; Permanent Supply Reduction on Cookie Chain (SVM)
            </p>
          </div>
        </div>
        <span className="text-xs font-black px-3 py-1 rounded-full bg-[#fecaca] border-2 border-[#0b1f3a] text-red-800 shadow-[0_2px_0_#0b1f3a] flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
          DEFLATION ACTIVE
        </span>
      </div>

      <p className="text-xs font-medium text-[#0b1f3a]/80 leading-relaxed">
        10% of arbitrage spread captures and voluntary user burns are routed directly to the canonical burn program (<code className="text-[11px] mono font-bold text-[#0b1f3a]">1nc1nerator...</code>) on Cookie Chain, permanently reducing circulating supply.
      </p>

      {/* Real App-Burned Cumulative Counter Badge */}
      <div className="p-3.5 rounded-2xl border-2 border-[#0b1f3a] bg-gradient-to-r from-[#fff1f2] via-[#fffbeb] to-[#fef2f2] shadow-[0_3px_0_#0b1f3a] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#fed7aa] border-2 border-[#0b1f3a] shadow-[0_2px_0_#0b1f3a] flex items-center justify-center text-xl animate-pulse">
            🔥
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-black text-red-700 tracking-wider">
                Quemado Real Acumulado por esta App
              </span>
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-red-100 text-red-800 border border-red-300 mono">
                {burnEventsCount} {burnEventsCount === 1 ? 'quema' : 'quemas'}
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl sm:text-2xl font-black mono text-[#0b1f3a]">
                {appBurnedTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
              </span>
              <span className="text-xs font-black text-[#d97706]">$COOKIE</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:items-end">
          <span className="text-[10px] font-bold text-[#0b1f3a]/60">
            Destino Canónico: 1nc1nerator...1111
          </span>
          <span className="text-[10px] font-black text-emerald-700 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Registro Persistente Monotónico
          </span>
        </div>
      </div>

      {/* Network & Live Wallet Balance Banner */}
      <div className="p-3.5 rounded-2xl border-2 border-[#0b1f3a] bg-[#eff6ff] shadow-[0_2px_0_#0b1f3a] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#c7d2fe] border-2 border-[#0b1f3a] flex items-center justify-center text-lg shadow-[0_1px_0_#0b1f3a]">
            🍪
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-[#0b1f3a]">Cookie Chain (SVM)</span>
              <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                ONLINE (400ms)
              </span>
            </div>
            <p className="text-[11px] font-bold text-[#0b1f3a]/70">
              Your $COOKIE Balance:{' '}
              <strong className="mono text-[#0b1f3a] text-xs font-black">
                {balanceCookie.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} COOKIE
              </strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`https://cookiescan.io/address/${CANONICAL_BURN_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            title="Inspect 1nc1nerator contract on CookieScan"
            className="text-[10px] font-bold mono text-[#0284c7] hover:text-[#0369a1] hover:underline flex items-center gap-1 bg-white px-2.5 py-1.5 rounded-xl border border-[#0b1f3a]/20 shadow-[0_1px_0_#0b1f3a]/10"
          >
            <span>🔥 1nc1nerator...1111</span>
            <span>↗</span>
          </a>
          {balanceCookie <= 0.001 && (
            <button
              type="button"
              onClick={onOpenBridgeModal}
              className="text-[10px] font-black px-3 py-1.5 rounded-xl bg-[#ffe0a8] hover:bg-[#fed388] text-[#0b1f3a] border-2 border-[#0b1f3a] shadow-[0_1px_0_#0b1f3a] cursor-pointer"
            >
              🌉 Bridge $COOKIE
            </button>
          )}
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
                Every burned $COOKIE permanently destroys supply on-chain and grants +50 Baker Karma points to your wallet.
              </p>
            </div>

            {/* Quick Snack Selector Buttons */}
            <div>
              <span className="text-[10px] font-black uppercase text-[#0b1f3a]/60 block mb-1.5">
                Select Treat Size:
              </span>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: '🍪 1.0', sub: 'Light Snack', val: 1.0 },
                  { label: '🍪 5.0', sub: 'Good Meal', val: 5.0 },
                  { label: '🍪 25.0', sub: 'Grand Feast', val: 25.0 },
                  {
                    label: '⚡ MAX',
                    sub: `${balanceCookie > 0 ? balanceCookie.toFixed(1) : '0.0'}`,
                    val: balanceCookie > 0 ? Math.max(0.1, Number((balanceCookie * 0.99).toFixed(2))) : 1.0
                  }
                ].map((tier) => (
                  <button
                    key={tier.label}
                    type="button"
                    onClick={() => setMicroBurnAmount(tier.val)}
                    onMouseEnter={() => setIsHoveringBurn(true)}
                    onMouseLeave={() => setIsHoveringBurn(false)}
                    className={`py-2 px-2 rounded-xl border-2 border-[#0b1f3a] text-center transition-colors cursor-pointer shadow-[0_2px_0_#0b1f3a] ${
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
                      <span>
                        {burnStage === 'signing'
                          ? `CHECK ${activeWalletType?.toUpperCase() || 'WALLET'} TO APPROVE...`
                          : burnStage === 'confirming'
                          ? 'CONFIRMING ON COOKIE CHAIN (~1s)...'
                          : burnStage === 'eating'
                          ? 'NOM NOM NOM! MUNCHING...'
                          : 'PREPARING ON-CHAIN TX...'}
                      </span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <span className="text-base">🔥</span>
                      <span>
                        Feed Monster & Burn {microBurnAmount} $COOKIE on Cookie Chain
                      </span>
                    </span>
                  )}
                </button>
              </div>

              {/* Live Burning Progress Stage Banner */}
              {isBurning && (
                <div className="p-3 rounded-xl border-2 border-amber-500 bg-amber-50 text-[11px] font-bold text-amber-900 flex items-center gap-2.5 shadow-[0_2px_0_#d97706] animate-pulse">
                  <span className="text-base">
                    {burnStage === 'signing' ? '👛' : burnStage === 'confirming' ? '📡' : '⚡'}
                  </span>
                  <span>
                    {burnStage === 'signing'
                      ? `Please check your ${activeWalletType || 'wallet'} extension window to sign the burn transaction.`
                      : burnStage === 'confirming'
                      ? 'Transaction signed and broadcast! Confirming block finality on Cookie Chain SVM (~400ms)...'
                      : 'Connecting to Cookie Chain RPC and fetching latest blockhash...'}
                  </span>
                </div>
              )}

              {/* Reward feedback pill */}
              <div className="flex items-center justify-between px-2 text-[10px] font-bold text-[#0b1f3a]/70">
                <span>Reward: +{Math.round(microBurnAmount * 50)} Baker Karma</span>
                <span>🔥 Real Irreversible Burn</span>
              </div>
            </div>

            {/* Error Notification */}
            {burnError && (
              <div className="p-3 rounded-xl border-2 border-red-500 bg-red-50 text-[11px] font-black text-red-700 flex items-center gap-2 shadow-[0_2px_0_#dc2626]">
                <span>⚠️</span>
                <span>{burnError}</span>
              </div>
            )}

            {/* Verified On-Chain Burn Receipt */}
            {burnTxSignature && (
              <div className="p-3.5 rounded-xl border-2 border-[#059669] bg-[#d1fae5] space-y-2 shadow-[0_2px_0_#059669] animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-[#065f46] flex items-center gap-1.5">
                    <span>🔥 ON-CHAIN BURN CONFIRMED!</span>
                  </span>
                  {burnExplorerUrl && (
                    <a
                      href={burnExplorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-white border border-[#059669] text-[#065f46] hover:bg-[#ecfdf5] transition-colors inline-flex items-center gap-1 shadow-[0_1px_0_#059669]"
                    >
                      <span>View on CookieScan</span>
                      <span>↗</span>
                    </a>
                  )}
                </div>
                <div className="text-[10px] mono text-[#065f46]/90 break-all bg-white/70 p-2 rounded-lg border border-[#059669]/30">
                  Signature: {burnTxSignature}
                </div>
                {burnSuccessMsg && (
                  <div className="text-[11px] font-bold text-[#065f46]">
                    {burnSuccessMsg}
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>

      <div className="text-[10px] mono text-[#0b1f3a]/60 text-center">
        Burn Target: <span className="font-bold">{CANONICAL_BURN_ADDRESS} (Cookie Chain SVM)</span>
      </div>
    </div>
  );
};
