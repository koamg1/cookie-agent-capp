import React, { useState, useEffect } from 'react';
import { CookieMonster } from './CookieMonster';
import { apiUrl } from '../config/api';
import { WalletType } from '../types/wallet';
import {
  executeSolanaMainnetBurn,
  executeCookieChainBurn,
  COOKIE_MAINNET_MINT,
  CANONICAL_BURN_ADDRESS
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
  const [burnStats, setBurnStats] = useState<{
    cumulative_burned: number;
    burn_rate_24h: number;
    deflation_status: string;
    burn_address: string;
  }>({
    cumulative_burned: 142580.45,
    burn_rate_24h: 4210.50,
    deflation_status: 'active',
    burn_address: CANONICAL_BURN_ADDRESS
  });

  const [selectedNetwork, setSelectedNetwork] = useState<'solana_mainnet' | 'cookie_chain'>('solana_mainnet');
  const [mainnetData, setMainnetData] = useState<{
    has_tokens: boolean;
    amount_ui: number;
    token_account?: string;
  } | null>(null);
  const [isFetchingMainnet, setIsFetchingMainnet] = useState<boolean>(false);

  const [microBurnAmount, setMicroBurnAmount] = useState<number>(1.0);
  const [isBurning, setIsBurning] = useState<boolean>(false);
  const [isHoveringBurn, setIsHoveringBurn] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [burnSuccessMsg, setBurnSuccessMsg] = useState<string | null>(null);
  const [burnTxSignature, setBurnTxSignature] = useState<string | null>(null);
  const [burnExplorerUrl, setBurnExplorerUrl] = useState<string | null>(null);
  const [burnError, setBurnError] = useState<string | null>(null);

  // Fetch live network burn stats
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

  // Fetch user's wallet mainnet token balance when connected
  const refreshMainnetTokens = () => {
    if (!connectedAddress) {
      setMainnetData(null);
      return;
    }
    setIsFetchingMainnet(true);
    fetch(apiUrl(`/api/v1/wallet/${connectedAddress}`))
      .then((r) => r.json())
      .then((data) => {
        if (data.mainnet_cookie) {
          setMainnetData(data.mainnet_cookie);
          if (data.mainnet_cookie.amount_ui > 0) {
            setSelectedNetwork('solana_mainnet');
          } else if (balanceCookie > 0) {
            setSelectedNetwork('cookie_chain');
          }
        }
      })
      .catch((err) => console.warn('Failed to query mainnet cookie balance:', err))
      .finally(() => setIsFetchingMainnet(false));
  };

  useEffect(() => {
    refreshMainnetTokens();
  }, [connectedAddress, balanceCookie]);

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
    if (!connectedAddress || !activeProvider || !activeWalletType) {
      onOpenWalletModal();
      return;
    }

    setBurnError(null);
    setBurnTxSignature(null);
    setBurnExplorerUrl(null);
    setBurnSuccessMsg(null);
    setIsBurning(true);

    try {
      let txSig = '';
      let explorerUrl = '';

      if (selectedNetwork === 'solana_mainnet') {
        const available = mainnetData?.amount_ui ?? 0;
        if (available < microBurnAmount) {
          throw new Error(
            `Insufficient $COOKIE balance on Solana Mainnet (${available.toFixed(2)} COOK available, ${microBurnAmount} requested).`
          );
        }

        onAddLog(
          'BURN_START',
          `Initializing verifiable Token-2022 burn of ${microBurnAmount} $COOKIE on Solana Mainnet...`,
          'text-amber-400'
        );

        txSig = await executeSolanaMainnetBurn(
          activeWalletType,
          activeProvider,
          connectedAddress,
          microBurnAmount,
          onAddLog
        );

        explorerUrl = `https://solscan.io/tx/${txSig}`;
        onAddLog('BURN_CONFIRMED', `Burn confirmed on Solana Mainnet! Tx: ${txSig}`, 'text-emerald-400');

      } else {
        // Cookie Chain Testnet
        if (balanceCookie < microBurnAmount) {
          throw new Error(
            `Insufficient testnet $COOKIE on Cookie Chain (${balanceCookie.toFixed(4)} COOKIE available, ${microBurnAmount} requested). Get free tokens via Faucet & Bridge!`
          );
        }

        onAddLog(
          'BURN_START',
          `Initializing verifiable burn transfer of ${microBurnAmount} COOKIE to Incinerator on Cookie Chain...`,
          'text-amber-400'
        );

        txSig = await executeCookieChainBurn(
          activeWalletType,
          activeProvider,
          connectedAddress,
          microBurnAmount,
          onAddLog
        );

        explorerUrl = `https://cookiescan.io/tx/${txSig}`;
        onAddLog('BURN_CONFIRMED', `Burn confirmed on Cookie Chain SVM! Tx: ${txSig}`, 'text-emerald-400');
      }

      // Play bite audio and trigger chomping animations
      playCrunchSound();
      setBurnTxSignature(txSig);
      setBurnExplorerUrl(explorerUrl);
      setIsSuccess(true);

      const karmaBonus = Math.round(microBurnAmount * 50);
      setBurnSuccessMsg(
        `BURP! Successfully burned ${microBurnAmount} $COOKIE on-chain! +${karmaBonus} Baker Karma points added to your Airdrop Passport!`
      );

      const newTotal = burnStats.cumulative_burned + microBurnAmount;
      setBurnStats((prev) => ({ ...prev, cumulative_burned: newTotal }));

      if (onRefreshBalance) onRefreshBalance();
      refreshMainnetTokens();

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
              Interactive Deflationary Tokenomics & Real On-Chain Furnace
            </p>
          </div>
        </div>
        <span className="text-xs font-black px-3 py-1 rounded-full bg-[#fecaca] border-2 border-[#0b1f3a] text-red-800 shadow-[0_2px_0_#0b1f3a] flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
          DEFLATION ACTIVE
        </span>
      </div>

      <p className="text-xs font-medium text-[#0b1f3a]/80 leading-relaxed">
        10% of arbitrage spread captures and voluntary user burns are routed directly to the canonical burn program, permanently reducing circulating supply.
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

      {/* Dual-Network Target Selector */}
      <div className="p-3.5 rounded-2xl border-2 border-[#0b1f3a] bg-white/90 shadow-[0_3px_0_#0b1f3a] space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-xs font-black text-[#0b1f3a] uppercase flex items-center gap-1.5">
            <span>🌐 Select Burning Network:</span>
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setSelectedNetwork('solana_mainnet'); setBurnError(null); }}
              className={`px-3 py-1.5 rounded-xl border-2 border-[#0b1f3a] text-xs font-black transition-all cursor-pointer ${
                selectedNetwork === 'solana_mainnet'
                  ? 'bg-[#fed7aa] text-[#0b1f3a] shadow-[0_2px_0_#0b1f3a]'
                  : 'bg-white hover:bg-gray-50 text-[#0b1f3a]/70'
              }`}
            >
              ⚡ Solana Mainnet {mainnetData && mainnetData.amount_ui > 0 ? `(${mainnetData.amount_ui.toLocaleString()} COOK)` : ''}
            </button>
            <button
              type="button"
              onClick={() => { setSelectedNetwork('cookie_chain'); setBurnError(null); }}
              className={`px-3 py-1.5 rounded-xl border-2 border-[#0b1f3a] text-xs font-black transition-all cursor-pointer ${
                selectedNetwork === 'cookie_chain'
                  ? 'bg-[#c7d2fe] text-[#0b1f3a] shadow-[0_2px_0_#0b1f3a]'
                  : 'bg-white hover:bg-gray-50 text-[#0b1f3a]/70'
              }`}
            >
              🍪 Cookie Chain ({balanceCookie.toFixed(2)} COOKIE)
            </button>
          </div>
        </div>

        {/* Network-specific Live Balance Details */}
        {selectedNetwork === 'solana_mainnet' ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3 py-2 rounded-xl border border-emerald-800/20 bg-[#ecfdf5] text-[11px] font-bold text-emerald-950">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                Mainnet $COOKIE Balance:{' '}
                <strong className="mono text-emerald-900 text-xs">
                  {isFetchingMainnet ? 'Querying...' : mainnetData ? `${mainnetData.amount_ui.toLocaleString()} COOK` : '0.00 COOK'}
                </strong>
              </span>
            </div>
            <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 border border-emerald-400">
              Token-2022 (Mint: 36ZrtQ...9e1)
            </span>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3 py-2 rounded-xl border border-blue-800/20 bg-[#eff6ff] text-[11px] font-bold text-blue-950">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span>
                Cookie Chain Balance:{' '}
                <strong className="mono text-blue-900 text-xs">{balanceCookie.toFixed(4)} COOKIE</strong>
              </span>
            </div>
            {balanceCookie <= 0.001 ? (
              <button
                type="button"
                onClick={onOpenBridgeModal}
                className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-amber-300 hover:bg-amber-400 text-[#0b1f3a] border border-[#0b1f3a] cursor-pointer shadow-[0_1px_0_#0b1f3a]"
              >
                🚰 Get Free Testnet $COOKIE (Faucet)
              </button>
            ) : (
              <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-blue-200 text-blue-900 border border-blue-400">
                Native Gas Token
              </span>
            )}
          </div>
        )}
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
                      <span>NOM NOM NOM! MUNCHING ON-CHAIN...</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <span className="text-base">🔥</span>
                      <span>
                        Feed Monster & Burn {microBurnAmount} $COOKIE on {selectedNetwork === 'solana_mainnet' ? 'Mainnet' : 'Testnet'}
                      </span>
                    </span>
                  )}
                </button>
              </div>

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
                      <span>View on Explorer</span>
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
        Burn Target: <span className="font-bold">{selectedNetwork === 'solana_mainnet' ? 'Token-2022 Burn Program (Solana Mainnet)' : `${burnStats.burn_address} (Cookie Chain SVM)`}</span>
      </div>
    </div>
  );
};
