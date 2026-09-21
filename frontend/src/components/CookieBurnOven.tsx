import React, { useState, useEffect, useRef } from 'react';
import { CookieMonster } from './CookieMonster';
import { Sentinel3DIncinerator } from './Sentinel3DIncinerator';
import { WalletType } from '../types/wallet';
import { apiUrl, assetUrl } from '../config/api';
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
  themeMode?: 'light' | 'dark';
}

interface UnderworldAgent {
  id: string;
  name: string;
  tag: string;
  role: string;
  avatar: string;
  color: string;
  borderGlow: string;
  status: string;
  metric: string;
  speech: string;
}

const CookieBurnOvenComponent: React.FC<CookieBurnOvenProps> = ({
  connectedAddress,
  activeWalletType,
  activeProvider,
  balanceCookie,
  onOpenWalletModal,
  onOpenBridgeModal,
  onRefreshBalance,
  onAddLog,
  themeMode: propThemeMode
}) => {
  // Theme Mode controlled globally by the navbar toggle
  const isDark = (propThemeMode ?? (typeof localStorage !== 'undefined' ? localStorage.getItem('cookie_burn_theme') : null) ?? 'light') === 'dark';
  const themeMode = isDark ? 'dark' : 'light';

  const isDemo = typeof window !== 'undefined' && (window.location.hash.includes('demo') || window.location.search.includes('demo'));
  const [microBurnAmount, setMicroBurnAmount] = useState<number>(1.0);
  const [isBurning, setIsBurning] = useState<boolean>(isDemo);
  const [burnStage, setBurnStage] = useState<'idle' | 'preparing' | 'signing' | 'confirming' | 'eating'>(isDemo ? 'signing' : 'idle');
  const [isHoveringBurn, setIsHoveringBurn] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [burnSuccessMsg, setBurnSuccessMsg] = useState<string | null>(null);
  const [burnTxSignature, setBurnTxSignature] = useState<string | null>(null);
  const [burnExplorerUrl, setBurnExplorerUrl] = useState<string | null>(null);
  const [burnError, setBurnError] = useState<string | null>(null);
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    };
  }, []);

  // Real on-chain burn counter accumulated specifically by this app
  const [appBurnedTotal, setAppBurnedTotal] = useState<number>(0.0);
  const [burnEventsCount, setBurnEventsCount] = useState<number>(0);
  const [isSyncingOnChain, setIsSyncingOnChain] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  const fetchAppBurnTotal = () => {
    fetch(apiUrl('/api/v1/burn/app-total'))
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.total_burned_by_app === 'number') {
          // Guard: never let a DB poll regress the counter (race condition protection)
          setAppBurnedTotal((prev) =>
            data.total_burned_by_app >= prev ? data.total_burned_by_app : prev
          );
          setBurnEventsCount((prev) =>
            (data.total_burn_events || 0) >= prev ? (data.total_burn_events || 0) : prev
          );
        }
      })
      .catch((err) => console.warn('Failed to load app burn total:', err));
  };

  const syncUserBurnsOnChain = async (address?: string | null) => {
    const targetAddr = address || connectedAddress;
    if (!targetAddr) {
      fetchAppBurnTotal();
      return;
    }
    setIsSyncingOnChain(true);
    try {
      const res = await fetch(apiUrl(`/api/v1/burn/sync/${targetAddr}`), { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.app_totals && typeof data.app_totals.total_burned_by_app === 'number') {
          setAppBurnedTotal(data.app_totals.total_burned_by_app);
          setBurnEventsCount(data.app_totals.total_burn_events);
        }
        setLastSyncTime(new Date().toLocaleTimeString());
      } else {
        fetchAppBurnTotal();
      }
    } catch (e) {
      console.warn('Sync on-chain burns warning:', e);
      fetchAppBurnTotal();
    } finally {
      setIsSyncingOnChain(false);
    }
  };

  useEffect(() => {
    fetchAppBurnTotal();
    if (connectedAddress) {
      syncUserBurnsOnChain(connectedAddress);
    }
    const interval = setInterval(() => {
      if (!document.hidden) {
        fetchAppBurnTotal();
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [connectedAddress]);

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
      setTimeout(() => {
        try {
          ctx.close();
        } catch {}
      }, 750);
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
      let currentBalance = balanceCookie;
      // If cached balance is lower than microBurnAmount, verify live on-chain balance immediately
      if (currentBalance < microBurnAmount) {
        try {
          const res = await fetch(apiUrl(`/api/v1/wallet/${connectedAddress}/balance`));
          if (res.ok) {
            const data = await res.json();
            const liveBal = Number(data.balance_cookie || 0);
            if (liveBal > currentBalance) {
              currentBalance = liveBal;
            }
            if (onRefreshBalance) onRefreshBalance();
          }
        } catch (e) {
          console.warn("Live balance query warning:", e);
        }
      }

      if (currentBalance < microBurnAmount) {
        throw new Error(
          `Insufficient $COOKIE balance on Cookie Chain (${currentBalance.toFixed(4)} COOKIE available, ${microBurnAmount} requested). Please acquire or bridge $COOKIE to Cookie Chain first!`
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

      setBurnStage('eating');
      playCrunchSound();
      setBurnTxSignature(txSig);
      setBurnExplorerUrl(explorerUrl);

      // Record this real burn in the app's persistent SQLite registry (awaited).
      // The backend retries on-chain verification up to 3 times (2s apart) to handle
      // SVM propagation delay, so this may take 2–6s in worst case.
      try {
        const recRes = await fetch(apiUrl('/api/v1/burn/record'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_address: connectedAddress,
            amount_cookie: microBurnAmount,
            tx_signature: txSig,
            source: 'user_oven'
          })
        });
        const recData = await recRes.json().catch(() => ({}));
        if (!recRes.ok) {
          console.warn('Burn record backend error:', recData);
          onAddLog('BURN_WARN', `Burn executed on-chain but backend registration pending: ${recData.detail || recRes.status}`, 'text-amber-400');
          // Optimistic fallback only if backend fails — will self-correct on next poll
          setAppBurnedTotal((prev) => Number((prev + microBurnAmount).toFixed(4)));
          setBurnEventsCount((prev) => prev + 1);
        } else {
          // Use authoritative totals from DB — no optimistic guessing
          if (recData.app_totals) {
            setAppBurnedTotal(recData.app_totals.total_burned_by_app);
            setBurnEventsCount(recData.app_totals.total_burn_events);
          } else if (typeof recData.total_burned_by_app === 'number') {
            setAppBurnedTotal(recData.total_burned_by_app);
            setBurnEventsCount(recData.total_burn_events || 0);
          }
        }
      } catch (recErr) {
        console.warn('Burn record network error:', recErr);
        onAddLog('BURN_WARN', 'Burn executed on-chain but could not reach backend to register. It will sync on next poll.', 'text-amber-400');
        // Optimistic fallback for network failures
        setAppBurnedTotal((prev) => Number((prev + microBurnAmount).toFixed(4)));
        setBurnEventsCount((prev) => prev + 1);
      }

      setIsSuccess(true);

      const karmaBonus = Math.round(microBurnAmount * 10);
      setBurnSuccessMsg(
        `BURP! Successfully burned ${microBurnAmount} $COOKIE on Cookie Chain SVM! +${karmaBonus} Baker Karma points added to your wallet!`
      );

      if (onRefreshBalance) onRefreshBalance();
      if (connectedAddress) syncUserBurnsOnChain(connectedAddress);


      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
      successTimeoutRef.current = setTimeout(() => {
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
    <div 
      className={`relative transition-all duration-500 ${
        isDark
          ? 'bg-[#060a14] border-2 border-[#00D2FF]/60 shadow-[0_0_35px_rgba(0,210,255,0.2),0_6px_0_#002b3d] text-slate-100 p-6 space-y-6 bg-circuit-grid rounded-3xl overflow-hidden'
          : 'space-y-6 text-[#0b1f3a]'
      }`}
    >
      {/* Visual Mode Atmospheric Background Effects (Underworld Mode) */}
      {isDark && (
        <>
          {/* Subtle Ambient Glowing Plasma Nebulas */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          
          {/* Circuit Scanlines */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/[0.02] to-transparent pointer-events-none animate-pulse" style={{ animationDuration: '6s' }} />
        </>
      )}

      {/* Header & Description Card */}
      <div className={`transition-all duration-300 ${
        isDark
          ? 'space-y-3'
          : 'p-5 sm:p-6 rounded-2xl border-2 border-[#0b1f3a] bg-white shadow-[0_3px_0_#0b1f3a] space-y-3'
      }`}>
        {/* Header & Theme Mode Switcher */}
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b-2 transition-colors duration-300 ${
          isDark ? 'border-[#00D2FF]/20' : 'border-[#0b1f3a]/15'
        }`}>
          <div className="flex items-center gap-2.5">
            <span className="text-2xl animate-bounce">🔥</span>
            <div>
              <h2 className={`text-lg font-black tracking-tight ${isDark ? 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-amber-300 to-red-400' : 'text-[#0b1f3a]'}`}>
                {isDark ? 'The Underworld Incinerator & Sentinel Fleet' : 'The $COOKIE Burn Oven & Hungry Monster'}
              </h2>
              <p className={`text-[11px] font-bold ${isDark ? 'text-cyan-300/70 mono' : 'text-[#0b1f3a]/65'}`}>
                {isDark 
                  ? 'Subterranean Boiler Deck • Gas Pipelines & Canonical SVM Deflation Matrix' 
                  : 'Deflationary Furnace • Permanent Supply Reduction on Cookie Chain (SVM)'}
              </p>
            </div>
          </div>

          {/* Action Controls: Deflation Tag */}
          <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
            {/* Active Deflation Status Pill */}
            <span className={`text-xs font-black px-3 py-1 rounded-full border-2 flex items-center gap-1.5 ${
              isDark
                ? 'bg-red-950/80 border-red-500 text-red-300 shadow-[0_0_12px_rgba(239,68,68,0.5)]'
                : 'bg-[#fecaca] border-[#0b1f3a] text-red-800 shadow-[0_2px_0_#0b1f3a]'
            }`}>
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              DEFLATION ACTIVE
            </span>
          </div>
        </div>

        {/* Description */}
        <p className={`text-xs font-medium leading-relaxed ${isDark ? 'text-slate-300' : 'text-[#0b1f3a]/80'}`}>
          10% of arbitrage spread captures and voluntary user burns are routed directly to the canonical burn program (<code className={`text-[11px] mono font-bold ${isDark ? 'text-cyan-400 bg-cyan-950/50 px-1 py-0.5 rounded border border-cyan-800' : 'text-[#0b1f3a]'}`}>1nc1nerator...</code>) on Cookie Chain, permanently reducing circulating supply.
        </p>
      </div>



      {/* Stat Banners: Side-by-side Pastel Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Real App-Burned Cumulative Counter Badge */}
        <div className={`p-3.5 sm:p-4 rounded-2xl border-2 transition-all duration-300 flex flex-col justify-between gap-3 ${
          isDark
            ? 'bg-[#0a0f1d] border-red-500/70 shadow-[0_0_20px_rgba(239,68,68,0.25)]'
            : 'border-[#0b1f3a] bg-[#fff1f2] shadow-[0_2px_0_#0b1f3a]'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl border-2 flex items-center justify-center text-xl animate-pulse ${
              isDark
                ? 'bg-red-950 border-red-500 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.5)]'
                : 'bg-[#fed7aa] border-[#0b1f3a] shadow-[0_2px_0_#0b1f3a]'
            }`}>
              🔥
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] uppercase font-black tracking-wider ${
                  isDark ? 'text-red-400 mono' : 'text-red-700'
                }`}>
                  Real Cumulative Burns by this cApp
                </span>
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded mono border ${
                  isDark 
                    ? 'bg-red-950 text-red-300 border-red-600' 
                    : 'bg-white text-red-800 border-red-300'
                }`}>
                  {burnEventsCount} {burnEventsCount === 1 ? 'burn' : 'burns'}
                </span>
              </div>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className={`text-xl sm:text-2xl font-black mono ${
                  isDark ? 'text-white drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]' : 'text-[#0b1f3a]'
                }`}>
                  {appBurnedTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                </span>
                <span className={`text-xs font-black ${isDark ? 'text-amber-400 mono' : 'text-[#d97706]'}`}>
                  $COOKIE
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#0b1f3a]/10">
            <span className={`text-[10px] font-bold mono ${isDark ? 'text-slate-400' : 'text-[#0b1f3a]/60'}`}>
              Dest: 1nc1nerator...1111
            </span>
            <button
              onClick={() => syncUserBurnsOnChain()}
              disabled={isSyncingOnChain}
              className={`text-[10px] font-black px-2 py-0.5 rounded mono flex items-center gap-1 transition-all ${
                isDark
                  ? 'bg-red-950/60 hover:bg-red-900 border border-red-500/40 text-red-300'
                  : 'bg-white hover:bg-red-50 border border-red-200 text-red-700 shadow-sm'
              }`}
              title="Reconcile all verified on-chain burns for this address"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isSyncingOnChain ? 'bg-amber-400 animate-spin' : 'bg-emerald-500 animate-pulse'}`} />
              {isSyncingOnChain ? 'Syncing...' : lastSyncTime ? `Synced ${lastSyncTime}` : 'Sync On-Chain'}
            </button>
          </div>
        </div>

        {/* Network & Live Wallet Balance Banner */}
        <div className={`p-3.5 sm:p-4 rounded-2xl border-2 transition-all duration-300 flex flex-col justify-between gap-3 ${
          isDark
            ? 'bg-[#091122] border-[#00D2FF]/50 shadow-[0_0_15px_rgba(0,210,255,0.15)]'
            : 'border-[#0b1f3a] bg-[#eff6ff] shadow-[0_2px_0_#0b1f3a]'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-10 h-10 rounded-2xl border-2 flex items-center justify-center text-xl ${
              isDark
                ? 'bg-[#030712] border-cyan-400 text-cyan-300 shadow-[0_0_8px_rgba(0,210,255,0.4)]'
                : 'bg-[#c7d2fe] border-[#0b1f3a] shadow-[0_1px_0_#0b1f3a]'
            }`}>
              🍪
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-black ${isDark ? 'text-cyan-300 mono' : 'text-[#0b1f3a]'}`}>
                  Cookie Chain (SVM)
                </span>
                <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-500 flex items-center gap-1 mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  ONLINE (FINALIZED)
                </span>
              </div>
              <p className={`text-[11px] font-bold ${isDark ? 'text-slate-300' : 'text-[#0b1f3a]/70'}`}>
                Your $COOKIE Balance:{' '}
                <strong className={`mono text-xs font-black ${isDark ? 'text-amber-400' : 'text-[#0b1f3a]'}`}>
                  {balanceCookie.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} COOKIE
                </strong>
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#0b1f3a]/10">
            <a
              href={`https://cookiescan.io/address/${CANONICAL_BURN_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Inspect 1nc1nerator contract on CookieScan"
              className={`text-[10px] font-bold mono flex items-center gap-1 px-2 py-1 rounded-lg border transition-colors ${
                isDark
                  ? 'bg-[#030712] border-cyan-500/50 text-cyan-300 hover:bg-cyan-950 hover:border-cyan-400'
                  : 'bg-white border-[#0b1f3a]/20 text-[#0284c7] hover:text-[#0369a1] shadow-[0_1px_0_#0b1f3a]/10'
              }`}
            >
              <span>🔥 1nc1nerator...1111</span>
              <span>↗</span>
            </a>
            {balanceCookie <= 0.001 && (
              <button
                type="button"
                onClick={onOpenBridgeModal}
                className={`text-[10px] font-black px-2.5 py-1 rounded-lg border-2 transition-all cursor-pointer ${
                  isDark
                    ? 'bg-amber-400 text-black border-amber-300 hover:bg-amber-300'
                    : 'bg-[#ffe0a8] hover:bg-[#fed388] text-[#0b1f3a] border-[#0b1f3a] shadow-[0_1px_0_#0b1f3a]'
                }`}
              >
                🌉 Bridge $COOKIE
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Interactive Burn Arena: Cookie Monster + Feeding Station */}
      <div className={`p-5 rounded-2xl border-2 transition-all duration-300 relative ${
        isDark
          ? 'bg-[#070c18] border-[#00D2FF]/60 shadow-[0_0_25px_rgba(0,210,255,0.2)]'
          : 'bg-white border-[#0b1f3a] shadow-[0_3px_0_#0b1f3a]'
      }`}>
        {/* Living Arena Canvas Overlay */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left / Center: Interactive Visual (Sentinel 3D in Dark Mode / Cookie Monster in Light Mode) */}
          <div className="lg:col-span-5 flex justify-center w-full">
            {isDark ? (
              <div className="w-full">
                <Sentinel3DIncinerator
                  isBurning={isBurning}
                  burnStage={burnStage}
                  isSuccess={isSuccess}
                  burnAmount={microBurnAmount}
                  themeMode={themeMode}
                  height="360px"
                  className="w-full"
                />
              </div>
            ) : (
              <CookieMonster
                isBurning={isBurning}
                isHoveringBurn={isHoveringBurn}
                isSuccess={isSuccess}
                burnAmount={microBurnAmount}
                themeMode={themeMode}
              />
            )}
          </div>

          {/* Interactive Feeding Console Controls Column */}
          <div className="lg:col-span-7 space-y-4">
            <div>
              <h3 className={`text-sm font-black uppercase tracking-wider ${isDark ? 'text-amber-400 mono' : 'text-[#0b1f3a]'}`}>
                {isDark ? '⚡ TOKEN INJECTION INTO INCINERATION CORE' : 'Feed the Monster & Boost Baker Karma'}
              </h3>
              <p className={`text-xs font-medium mt-0.5 ${isDark ? 'text-slate-300' : 'text-[#0b1f3a]/70'}`}>
                {isDark 
                  ? 'Every $COOKIE token burned is irreversibly incinerated on SVM, reducing supply in real time.'
                  : 'Every burned $COOKIE permanently destroys supply on-chain and grants +50 Baker Karma points to your wallet.'}
              </p>
            </div>

            {/* Quick Amount Selector Pills */}
            <div className="space-y-1.5">
              <span className={`text-[10px] font-black uppercase tracking-wider block ${isDark ? 'text-cyan-400' : 'text-[#0b1f3a]/60'}`}>
                {isDark ? 'SELECT TREAT SIZE:' : 'Select Treat Size:'}
              </span>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: '🍪 1.0', sub: 'Light Snack', val: 1.0, bgLight: 'bg-[#fffbeb]' },
                  { label: '🍪 5.0', sub: 'Good Meal', val: 5.0, bgLight: 'bg-[#eff6ff]' },
                  { label: '🍪 25.0', sub: 'Grand Feast', val: 25.0, bgLight: 'bg-[#f0fdf4]' },
                  {
                    label: '⚡ MAX',
                    sub: `${balanceCookie > 0 ? balanceCookie.toFixed(1) : '0.0'}`,
                    val: balanceCookie > 0 ? Math.max(0.1, Number((balanceCookie * 0.99).toFixed(2))) : 1.0,
                    bgLight: 'bg-[#fdf2f8]'
                  }
                ].map((tier) => (
                  <button
                    key={tier.label}
                    type="button"
                    onClick={() => setMicroBurnAmount(tier.val)}
                    onMouseEnter={() => setIsHoveringBurn(true)}
                    onMouseLeave={() => setIsHoveringBurn(false)}
                    className={`py-2 px-2 rounded-xl border-2 text-center transition-all cursor-pointer ${
                      isDark
                        ? microBurnAmount === tier.val
                          ? 'bg-[#00D2FF]/20 border-[#00D2FF] text-[#00D2FF] shadow-[0_0_15px_rgba(0,210,255,0.5)] font-black'
                          : 'bg-[#0a0f1d] border-slate-700 hover:border-cyan-500/50 text-slate-300 font-bold'
                        : microBurnAmount === tier.val
                          ? `${tier.bgLight} border-[#0b1f3a] font-black text-[#0b1f3a] shadow-[0_3px_0_#0b1f3a] -translate-y-0.5`
                          : `${tier.bgLight}/70 border-[#0b1f3a] hover:${tier.bgLight} font-bold text-[#0b1f3a]/80 shadow-[0_2px_0_#0b1f3a]`
                    }`}
                  >
                    <span className="text-[11px] block mono">{tier.label}</span>
                    <span className={`text-[9px] block ${isDark ? 'text-slate-400' : 'text-[#0b1f3a]/60'}`}>
                      {tier.sub}
                    </span>
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
                    className={`w-full px-3 py-2.5 text-xs font-bold mono rounded-xl outline-none transition-all ${
                      isDark
                        ? 'bg-[#0a0f1d] border-2 border-[#00D2FF]/70 text-[#00D2FF] shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] focus:border-[#00D2FF]'
                        : 'neo-input border-2 border-[#0b1f3a] text-[#0b1f3a]'
                    }`}
                  />
                  <span className={`absolute right-2.5 top-2.5 text-[10px] font-black mono ${
                    isDark ? 'text-cyan-400/50' : 'text-[#0b1f3a]/40'
                  }`}>
                    COOKIE
                  </span>
                </div>

                <button
                  onClick={handleVoluntaryBurn}
                  disabled={isBurning}
                  onMouseEnter={() => setIsHoveringBurn(true)}
                  onMouseLeave={() => setIsHoveringBurn(false)}
                  className={`flex-1 py-3 px-4 font-black text-xs rounded-xl border-2 flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    isDark
                      ? isBurning
                        ? 'bg-amber-400 text-black border-amber-300 animate-pulse shadow-[0_0_25px_rgba(245,158,11,0.8)]'
                        : 'bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.6)] active:scale-98'
                      : isBurning
                        ? 'bg-amber-400 text-[#0b1f3a] border-[#0b1f3a] animate-pulse shadow-[0_4px_0_#0b1f3a]'
                        : 'bg-[#fca5a5] hover:bg-[#f87171] text-[#0b1f3a] border-[#0b1f3a] shadow-[0_4px_0_#0b1f3a] active:translate-y-1 active:shadow-[0_1px_0_#0b1f3a]'
                  }`}
                >
                  {isBurning ? (
                    <span className="flex items-center gap-2">
                      <span className="text-base animate-spin">🍪</span>
                      <span className="mono">
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
                    <span className="flex items-center gap-1.5 mono">
                      <span className="text-base">🔥</span>
                      <span>
                        {isDark ? 'IGNITE & BURN ' : 'Feed Monster & Burn '}
                        {microBurnAmount} $COOKIE {isDark ? 'ON-CHAIN' : 'on Cookie Chain'}
                      </span>
                    </span>
                  )}
                </button>
              </div>

              {/* Live Burning Progress Stage Banner */}
              {isBurning && (
                <div className={`p-3 rounded-xl border-2 text-[11px] font-bold flex items-center justify-between gap-2.5 animate-pulse ${
                  isDark
                    ? 'bg-amber-950/80 border-amber-500 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                    : 'bg-amber-50 border-amber-500 text-amber-900 shadow-[0_2px_0_#d97706]'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className="text-base">
                      {burnStage === 'signing' ? '👛' : burnStage === 'confirming' ? '📡' : '⚡'}
                    </span>
                    <span className="mono">
                      {burnStage === 'signing'
                        ? `Please check your ${activeWalletType || 'wallet'} extension window to sign the burn transaction.`
                        : burnStage === 'confirming'
                        ? 'Transaction signed and broadcast! Confirming block finality on Cookie Chain SVM...'
                        : 'Connecting to Cookie Chain RPC and fetching latest blockhash...'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsBurning(false);
                      setBurnStage('idle');
                      setBurnError('Transaction signing cancelled by user.');
                      onAddLog('BURN_CANCELLED', 'Burn operation reset by user.', 'text-amber-400');
                    }}
                    className={`text-[10px] font-black px-2.5 py-1 rounded-lg border mono uppercase transition cursor-pointer flex-shrink-0 ${
                      isDark
                        ? 'bg-red-950 hover:bg-red-900 border-red-500 text-red-300'
                        : 'bg-white hover:bg-red-50 border-red-400 text-red-700 shadow-sm'
                    }`}
                  >
                    ✕ Cancel
                  </button>
                </div>
              )}

              {/* Reward feedback pill */}
              <div className={`flex items-center justify-between px-2 text-[10px] font-bold ${
                isDark ? 'text-slate-400 mono' : 'text-[#0b1f3a]/70'
              }`}>
                <span>Reward: +{Math.round(microBurnAmount * 50)} Baker Karma</span>
                <span>🔥 Real Irreversible Burn</span>
              </div>
            </div>

            {/* Error Notification */}
            {burnError && (
              <div className={`p-3 rounded-xl border-2 text-[11px] font-black flex items-center gap-2 ${
                isDark
                  ? 'bg-red-950/90 border-red-500 text-red-200 shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                  : 'bg-red-50 border-red-500 text-red-700 shadow-[0_2px_0_#dc2626]'
              }`}>
                <span>⚠️</span>
                <span>{burnError}</span>
              </div>
            )}

            {/* Verified On-Chain Burn Receipt */}
            {burnTxSignature && (
              <div className={`p-3.5 rounded-xl border-2 space-y-2 animate-fade-in ${
                isDark
                  ? 'bg-[#064e3b]/30 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                  : 'bg-[#d1fae5] border-[#059669] shadow-[0_2px_0_#059669]'
              }`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-black flex items-center gap-1.5 mono ${
                    isDark ? 'text-emerald-300' : 'text-[#065f46]'
                  }`}>
                    <span>🔥 ON-CHAIN BURN CONFIRMED!</span>
                  </span>
                  {burnExplorerUrl && (
                    <a
                      href={burnExplorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`text-[10px] font-black px-2.5 py-1 rounded-lg border transition-colors inline-flex items-center gap-1 mono ${
                        isDark
                          ? 'bg-emerald-950 border-emerald-400 text-emerald-300 hover:bg-emerald-900 shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                          : 'bg-white border-[#059669] text-[#065f46] hover:bg-[#ecfdf5] shadow-[0_1px_0_#059669]'
                      }`}
                    >
                      <span>View on CookieScan</span>
                      <span>↗</span>
                    </a>
                  )}
                </div>
                <div className={`text-[10px] mono break-all p-2 rounded-lg border ${
                  isDark
                    ? 'bg-[#030712]/80 border-emerald-500/40 text-emerald-300'
                    : 'bg-white/70 border-[#059669]/30 text-[#065f46]/90'
                }`}>
                  Signature: {burnTxSignature}
                </div>
                {burnSuccessMsg && (
                  <div className={`text-[11px] font-bold ${isDark ? 'text-emerald-300' : 'text-[#065f46]'}`}>
                    {burnSuccessMsg}
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Target Address Footer */}
      <div className={`text-[10px] mono text-center ${isDark ? 'text-slate-500' : 'text-[#0b1f3a]/60'}`}>
        Burn Target: <span className="font-bold">{CANONICAL_BURN_ADDRESS} (Cookie Chain SVM)</span>
      </div>
    </div>
  );
};

export const CookieBurnOven = React.memo(CookieBurnOvenComponent);
