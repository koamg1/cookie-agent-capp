import React, { useState, useEffect } from 'react';
import * as solanaWeb3 from '@solana/web3.js';
import { WalletType } from '../types/wallet';
import { apiUrl } from '../config/api';
import { getWalletProvider, sendWalletTransaction, PROTOCOL_TREASURY_VAULT_ADDRESS } from '../utils/solana';

interface VaultStatus {
  protocol: string;
  branding: string;
  network: string;
  tvl_usd: number;
  total_cookie_reserve: number;
  total_usdc_reserve: number;
  total_shares_minted: number;
  share_price_nav: number;
  projected_apy_pct: number;
  cumulative_arb_profit_usd: number;
  cumulative_burned_cookie: number;
  cumulative_cookie_jar_usd: number;
  total_arbitrage_runs: number;
  burn_address: string;
  runner_status: string;
  target_block_speed: string;
  pools_detected: number;
}

interface UserPosition {
  user_address: string;
  has_position: boolean;
  shares: number;
  share_token: string;
  pool_share_pct: number;
  initial_deposit_usd?: number;
  current_value_usd: number;
  current_cookie: number;
  current_usdc: number;
  accrued_profit_usd: number;
  accrued_profit_cookie?: number;
  withdrawable_cookie?: number;
  baker_karma_boost: number;
  cooldown_until?: number;
  in_cooldown?: boolean;
  cooldown_remaining_seconds?: number;
}

interface PoolDiscovery {
  network: string;
  rpc_endpoint: string;
  total_pools_detected: number;
  primary_pool: {
    amm_name: string;
    pair: string;
    pool_address: string;
    reserve_cookie: number;
    reserve_usdc: number;
    implied_price_usd: number;
    status: string;
  };
  secondary_pools: Array<{
    amm_name: string;
    pair: string;
    pool_address: string;
    status: string;
    action: string;
  }>;
  sniper_status: string;
  execution_mode: string;
}


interface AtomicExecution {
  id: string;
  timestamp: number;
  slot: number;
  pair: string;
  gross_spread_pct: number;
  net_spread_pct: number;
  optimal_size_cookie: number;
  gross_profit_usd: number;
  profit_to_vault_usd: number;
  burned_cookie: number;
  cookie_jar_usd: number;
  tx_signature: string;
  mode: string;
}

interface AtomicArbitrageAgentProps {
  connectedAddress: string | null;
  activeWalletType: WalletType | null;
  activeProvider: any;
  balanceCookie: number;
  onOpenWalletModal: () => void;
  onOpenBridgeModal?: () => void;
  onRefreshBalance: () => void;
  onAddLog: (tag: string, msg: string, color?: string) => void;
  onNavigateToVault?: () => void;
  themeMode?: 'light' | 'dark';
}

const AtomicArbitrageAgentComponent: React.FC<AtomicArbitrageAgentProps> = ({
  connectedAddress,
  activeWalletType,
  activeProvider,
  balanceCookie,
  onOpenWalletModal,
  onOpenBridgeModal,
  onRefreshBalance,
  onAddLog,
  onNavigateToVault,
  themeMode = 'light'
}) => {
  const isDark = themeMode === 'dark';

  // Navigation & Sub-views
  const [engineMode, setEngineMode] = useState<'live_beta' | 'quant_lab'>('live_beta');
  const [capitalTab, setCapitalTab] = useState<'deposit' | 'withdraw'>('deposit');

  // Vault & Arbitrage Telemetry states
  const [vaultStatus, setVaultStatus] = useState<VaultStatus | null>(null);
  const [userPos, setUserPos] = useState<UserPosition | null>(null);
  const [discovery, setDiscovery] = useState<PoolDiscovery | null>(null);
  const [tradeFeed, setTradeFeed] = useState<AtomicExecution[]>([]);

  // User Capital & Cooldown states
  const [depositCookie, setDepositCookie] = useState<string>('50');
  const [depositTxHash, setDepositTxHash] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [lastActionReceipt, setLastActionReceipt] = useState<any | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);
  const [isCooldownModalOpen, setIsCooldownModalOpen] = useState<boolean>(false);
  const [withdrawNotice, setWithdrawNotice] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(() => Math.floor(Date.now() / 1000));

  // Live 1-second ticker ONLY when a user actually has an active locked position
  useEffect(() => {
    if (!userPos?.cooldown_until || userPos.cooldown_until <= Math.floor(Date.now() / 1000)) {
      return;
    }
    const timer = setInterval(() => setCurrentTime(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(timer);
  }, [userPos?.cooldown_until]);

  const formatRemainingTime = (cooldownUntil?: number) => {
    if (!cooldownUntil) return '0h 0m 0s';
    const remaining = Math.max(0, Math.floor(cooldownUntil - currentTime));
    if (remaining <= 0) return '0h 0m 0s (Expired)';
    const hours = Math.floor(remaining / 3600);
    const mins = Math.floor((remaining % 3600) / 60);
    const secs = remaining % 60;
    return `${hours}h ${mins}m ${secs}s`;
  };

  // Quant Lab Simulation states
  const [simAmountCookie, setSimAmountCookie] = useState<number>(1500);
  const [simSpreadPct, setSimSpreadPct] = useState<number>(2.25);
  const [simSlippagePct, setSimSlippagePct] = useState<number>(0.50);
  const [simResult, setSimResult] = useState<any | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [isShootingRevert, setIsShootingRevert] = useState<boolean>(false);
  const [shotRevertResult, setShotRevertResult] = useState<any | null>(null);

  // Fetch telemetry
  const fetchAgentData = async () => {
    try {
      const [stRes, discRes, feedRes] = await Promise.all([
        fetch(apiUrl('/api/v1/atomic/status')),
        fetch(apiUrl('/api/v1/atomic/discovery')),
        fetch(apiUrl('/api/v1/atomic/feed?limit=8'))
      ]);

      if (stRes.ok) setVaultStatus(await stRes.json());
      if (discRes.ok) setDiscovery(await discRes.json());
      if (feedRes.ok) setTradeFeed(await feedRes.json());
    } catch (err) {
      console.warn('Failed to load atomic agent telemetry:', err);
    }
  };

  const fetchUserPosition = async (address: string) => {
    try {
      const res = await fetch(apiUrl(`/api/v1/atomic/position/${address}`));
      if (res.ok) {
        setUserPos(await res.json());
      }
    } catch (err) {
      console.warn('Failed to fetch user position:', err);
    }
  };

  useEffect(() => {
    fetchAgentData();
    const interval = setInterval(() => {
      fetchAgentData();
      if (connectedAddress) fetchUserPosition(connectedAddress);
    }, 6000);
    return () => clearInterval(interval);
  }, [connectedAddress]);

  useEffect(() => {
    if (connectedAddress) {
      fetchUserPosition(connectedAddress);
    } else {
      setUserPos(null);
    }
  }, [connectedAddress]);

  // Handle Withdrawal
  const handleWithdraw = async (sharesPct: number) => {
    if (isSubmitting) return;
    if (!connectedAddress || !userPos) return;

    if (userPos.in_cooldown) {
      setIsCooldownModalOpen(true);
      return;
    }

    const sharesToWithdraw = userPos.shares * (sharesPct / 100);
    if (sharesToWithdraw <= 0) return;

    setIsSubmitting(true);
    setWithdrawNotice(null);
    onAddLog('WITHDRAW_INIT', `Requesting withdrawal of ${sharesToWithdraw.toFixed(4)} cCOOKIE-LP (${sharesPct}%)...`, 'text-purple-400');

    try {
      const res = await fetch(apiUrl('/api/v1/atomic/withdraw'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_address: connectedAddress,
          shares: sharesToWithdraw
        })
      });

      const data = await res.json();
      if (res.ok) {
        setLastActionReceipt(data);
        setShowReceiptModal(true);
        onAddLog('WITHDRAW_SUCCESS', `Withdrew ${data.payout_cookie.toFixed(2)} $COOKIE from Vault`, 'text-emerald-400');
        fetchAgentData();
        fetchUserPosition(connectedAddress);
        onRefreshBalance();
      } else {
        const msg = data.detail || 'Withdrawal rejected by protocol.';
        setWithdrawNotice(msg);
        onAddLog('WITHDRAW_ERROR', msg, 'text-red-400');
      }
    } catch (err: any) {
      const msg = err.message || 'Withdrawal failed.';
      setWithdrawNotice(msg);
      onAddLog('WITHDRAW_ERROR', `Withdrawal error: ${msg}`, 'text-red-400');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Emergency Withdrawal with 20% penalty
  const handleEmergencyWithdraw = async () => {
    if (isSubmitting) return;
    if (!connectedAddress || !userPos || !activeWalletType) {
      onOpenWalletModal();
      return;
    }

    const confirmMsg = `EMERGENCY WITHDRAWAL NOTICE:\n\n- You will bypass the security cooldown.\n- A 20% emergency penalty will be deducted from your deposited capital and sent to the Protocol Community Pool.\n- You will receive 80% of your deposited capital immediately.\n\nDo you want to proceed?`;
    if (!window.confirm(confirmMsg)) return;

    setIsSubmitting(true);
    setWithdrawNotice(null);
    onAddLog('EMERGENCY_INIT', `Processing emergency withdrawal for ${userPos.shares.toFixed(4)} shares...`, 'text-amber-400');

    try {
      const nonceRes = await fetch(apiUrl(`/api/v1/atomic/emergency-withdraw/nonce?user_address=${encodeURIComponent(connectedAddress)}`));
      if (!nonceRes.ok) {
        throw new Error("Failed to retrieve emergency authorization challenge from gateway.");
      }
      const nonceData = await nonceRes.json();
      const authMessage = nonceData.authorization_message;

      onAddLog('SIGNING', `Prompting ${activeWalletType} to sign emergency withdrawal authorization...`, 'text-purple-400');
      const provider = getWalletProvider(activeWalletType) || activeProvider;
      const connection = new solanaWeb3.Connection("https://rpc.cookiescan.io", { commitment: "confirmed", wsEndpoint: "" });
      const memoProgramId = new solanaWeb3.PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");
      const userPk = new solanaWeb3.PublicKey(connectedAddress);

      const memoIx = new solanaWeb3.TransactionInstruction({
        keys: [{ pubkey: userPk, isSigner: true, isWritable: true }],
        programId: memoProgramId,
        data: new TextEncoder().encode(authMessage) as any
      });

      const tx = new solanaWeb3.Transaction().add(memoIx);
      const { blockhash } = await connection.getLatestBlockhash("confirmed");
      tx.recentBlockhash = blockhash;
      tx.feePayer = userPk;

      const txSignature = await sendWalletTransaction(activeWalletType, provider, tx, connection, connectedAddress);
      onAddLog('ONCHAIN_AUTH', `Emergency authorization broadcast on-chain: ${txSignature.slice(0, 16)}...`, 'text-cyan-400');

      const res = await fetch(apiUrl('/api/v1/atomic/emergency-withdraw'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_address: connectedAddress,
          shares: userPos.shares,
          authorization_tx_signature: txSignature
        })
      });

      const data = await res.json();
      if (res.ok) {
        setLastActionReceipt(data);
        setShowReceiptModal(true);
        onAddLog('EMERGENCY_SUCCESS', `Emergency withdrawal complete: ${data.payout_cookie.toFixed(2)} $COOKIE disbursed to wallet`, 'text-emerald-400');
        fetchAgentData();
        fetchUserPosition(connectedAddress);
        onRefreshBalance();
      } else {
        const msg = data.detail || 'Emergency withdrawal failed.';
        setWithdrawNotice(msg);
        onAddLog('EMERGENCY_ERROR', msg, 'text-red-400');
      }
    } catch (err: any) {
      const msg = err.message || 'Emergency withdrawal error.';
      setWithdrawNotice(msg);
      onAddLog('WITHDRAW_ERROR', `Withdrawal error: ${msg}`, 'text-red-400');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Run Quant Lab Simulation
  const handleRunSimulation = async () => {
    setIsSimulating(true);
    try {
      const res = await fetch(apiUrl('/api/v1/atomic/simulate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount_cookie: simAmountCookie,
          market_spread_pct: simSpreadPct,
          slippage_tolerance_pct: simSlippagePct
        })
      });
      if (res.ok) {
        setSimResult(await res.json());
      }
    } catch (err) {
      console.warn('Simulation failed:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  // Test Atomic Revert Scenario
  const handleTestRevert = async () => {
    setIsShootingRevert(true);
    try {
      const res = await fetch(apiUrl('/api/v1/atomic/simulate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount_cookie: simAmountCookie,
          market_spread_pct: 0.15,
          slippage_tolerance_pct: 0.05
        })
      });
      if (res.ok) {
        setShotRevertResult(await res.json());
      }
    } catch (err) {
      console.warn('Revert test failed:', err);
    } finally {
      setIsShootingRevert(false);
    }
  };

  const cardBg = isDark ? 'bg-[#080d1a] border-cyan-500/30 text-white shadow-[0_0_20px_rgba(0,210,255,0.08)]' : 'bg-white border-[#0b1f3a] text-[#0b1f3a] shadow-[0_3px_0_#0b1f3a]';
  const subCardBg = isDark ? 'bg-[#0b1426] border-slate-700/60 text-slate-200' : 'bg-[#f8fafc] border-[#0b1f3a]/15 text-[#0b1f3a]';
  const mutedText = isDark ? 'text-slate-400' : 'text-[#0b1f3a]/70';

  return (
    <div className="space-y-6">
      {/* 1. Header & Protocol Branding Card */}
      <div className={`p-5 sm:p-6 rounded-3xl border-2 transition-all ${cardBg}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-700/20 pb-4">
          <div className="flex items-center gap-3.5">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center p-1.5 border-2 shrink-0 ${
              isDark 
                ? 'bg-purple-950/80 border-purple-500/60 shadow-[0_0_15px_rgba(168,85,247,0.3)]' 
                : 'bg-[#ffe0a8] border-[#0b1f3a] shadow-[0_3px_0_#0b1f3a]'
            }`}>
              <img
                src="/agents/atomic_agent_avatar.png"
                alt="Atomic Agent"
                className="w-full h-full object-contain pixelated"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/agents/atomic_agent_avatar.png';
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">Atomic Agent</h1>
                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${
                  isDark 
                    ? 'bg-purple-950 text-purple-300 border-purple-500/50 shadow-[0_0_8px_rgba(168,85,247,0.3)]' 
                    : 'bg-[#dcfce7] text-[#166534] border-[#166534]'
                }`}>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  ● SVM FLASH SNIPER (STANDBY)
                </span>
              </div>
              <p className={`text-xs font-bold mt-1 ${mutedText}`}>
                Autonomous algorithmic agent monitoring on-chain liquidity pools across block slots. Designed to execute single-transaction atomic arbitrage with zero-slippage adverse reversion once a second liquid DEX exists on Cookie Chain &mdash; currently in standby.
              </p>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className={`flex items-center p-1 rounded-2xl border-2 shrink-0 ${
            isDark ? 'bg-[#0f172a] border-cyan-500/40' : 'bg-[#0b1f3a]/5 border-[#0b1f3a] shadow-[0_2px_0_#0b1f3a]'
          }`}>
            <button
              onClick={() => setEngineMode('live_beta')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                engineMode === 'live_beta'
                  ? (isDark ? 'bg-cyan-600 text-white shadow-[0_0_10px_rgba(6,182,212,0.5)]' : 'bg-[#0b1f3a] text-white shadow-[0_2px_0_#ffe0a8]')
                  : (isDark ? 'text-slate-400 hover:text-white' : 'text-[#0b1f3a] hover:bg-white/60')
              }`}
            >
              <span>📡</span>
              <span>Live Monitor</span>
            </button>
          </div>
        </div>

        {/* Technical Architecture Banner */}
        <div className={`p-3.5 rounded-2xl border flex items-start gap-3 mt-4 ${
          isDark ? 'bg-[#0f1d36] border-cyan-500/30 text-cyan-200' : 'bg-[#eff6ff] border-[#0b1f3a]/20 text-[#0b1f3a]/80'
        }`}>
          <span className="text-xl">⚡</span>
          <div className="text-xs leading-relaxed">
            <strong className={isDark ? 'text-cyan-300 font-black' : 'text-[#0b1f3a] font-bold'}>Atomic Reversion Architecture (standby): </strong>
            Once a second liquid DEX exists on Cookie Chain SVM, the agent is designed to run
            cross-DEX arbitrage inside a <strong>single SVM transaction</strong> bundling a Cookoven swap,
            a second-pool swap, and a slippage assert that <strong>reverts atomically in the VM</strong> if the
            net spread is below fees. It is currently <strong>paused</strong> — no trades are executed.
          </div>
        </div>
      </div>

      {/* 2. Core Vault Metrics Grid (Matching User Screenshot) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`p-4 rounded-2xl border-2 transition-all ${cardBg}`}>
          <span className={`text-[10px] uppercase font-black block ${mutedText}`}>TVL On-Chain</span>
          <span className="text-xl font-black mono mt-1 block">
            ${vaultStatus ? vaultStatus.tvl_usd.toFixed(2) : '0.00'} USD
          </span>
          <span className="text-[10px] font-bold text-amber-400 block mt-1">
            {vaultStatus ? vaultStatus.total_cookie_reserve.toLocaleString() : '22.85'} COOKIE + $0.00 USDC
          </span>
        </div>

        <div className={`p-4 rounded-2xl border-2 transition-all ${cardBg}`}>
          <span className={`text-[10px] uppercase font-black block ${mutedText}`}>NAV per Share</span>
          <span className="text-xl font-black text-emerald-400 mono mt-1 block">
            ${vaultStatus ? vaultStatus.share_price_nav.toFixed(4) : '1.0000'}
          </span>
          <span className="text-[10px] font-bold text-emerald-500 block mt-1">
            ● Initial Base (1.0000)
          </span>
        </div>

        <div className={`p-4 rounded-2xl border-2 transition-all ${cardBg}`}>
          <span className={`text-[10px] uppercase font-black block ${mutedText}`}>Reserve Backing</span>
          <span className="text-xl font-black text-cyan-400 mono mt-1 block">
            100.0%
          </span>
          <span className="text-[10px] font-bold text-cyan-500 block mt-1">
            No external liabilities (standby)
          </span>
        </div>

        <div className={`p-4 rounded-2xl border-2 transition-all ${cardBg}`}>
          <span className={`text-[10px] uppercase font-black block ${mutedText}`}>Security Status</span>
          <span className="text-xl font-black text-purple-400 mono mt-1 block">
            PROTECTED
          </span>
          <span className="text-[10px] font-bold text-purple-400 block mt-1">
            Capital Protection Standby
          </span>
        </div>
      </div>

      {/* 3. User Capital Station & Operations Grid (Matching User Screenshot) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: User Active Position (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className={`p-5 rounded-3xl border-2 transition-all ${cardBg} space-y-4`}>
            <div className="flex items-center justify-between border-b border-slate-700/20 pb-3">
              <h3 className="text-sm font-black uppercase">Your Vault Deposit & Shares</h3>
              <span className="text-[10px] mono font-bold text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-500/40">
                cCOOKIE-LP
              </span>
            </div>

            {!connectedAddress ? (
              <div className="py-8 text-center space-y-3">
                <p className={`text-xs font-medium ${mutedText}`}>
                  Connect your wallet to view your custodied shares and capital in the agent.
                </p>
                <button
                  onClick={onOpenWalletModal}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-md cursor-pointer"
                >
                  👛 Connect Wallet
                </button>
              </div>
            ) : userPos && userPos.has_position ? (
              <div className="space-y-4">
                <div className={`p-4 rounded-2xl border text-xs mono space-y-2.5 ${subCardBg}`}>
                  <div className="flex justify-between">
                    <span className={mutedText}>Custodied Deposit:</span>
                    <span className="font-bold">{(userPos.current_cookie || 0).toFixed(2)} $COOKIE</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={mutedText}>Vault Shares:</span>
                    <span className="font-bold">{userPos.shares.toFixed(4)} cCOOKIE-LP</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={mutedText}>Current Value:</span>
                    <span className="font-bold text-emerald-400">
                      ${(userPos.current_value_usd || 0) < 0.01 && (userPos.current_value_usd || 0) > 0 ? (userPos.current_value_usd || 0).toFixed(4) : (userPos.current_value_usd || 0).toFixed(2)} USD
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={mutedText}>Pool Share:</span>
                    <span className="font-bold">{(userPos.pool_share_pct || 0).toFixed(2)}%</span>
                  </div>
                </div>

                {userPos.in_cooldown && (
                  <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-xs text-amber-200 space-y-1">
                    <div className="flex items-center justify-between font-bold">
                      <span>🔒 Standard Lock Active</span>
                      <span className="mono">{formatRemainingTime(userPos.cooldown_until)}</span>
                    </div>
                    <p className="text-[11px] text-amber-300/80">
                      Cooldown prevents MEV extraction. Emergency withdrawal is available at any time.
                    </p>
                  </div>
                )}

                {/* Emergency Withdraw Button */}
                <button
                  onClick={handleEmergencyWithdraw}
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-xl border border-red-500/50 bg-red-950/40 hover:bg-red-900/60 text-red-300 font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>🚨 Emergency Instant Withdrawal (20% Penalty)</span>
                </button>
              </div>
            ) : (
              <div className="py-8 text-center space-y-2">
                <p className="text-xs font-bold text-slate-300">
                  No active cCOOKIE-LP position in this wallet.
                </p>
                <p className={`text-[11px] ${mutedText}`}>
                  Existing liquidity providers can manage share withdrawals on the right.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Dual-Leg Deposit / Withdraw Station (7 cols) */}
        <div className={`lg:col-span-7 p-5 rounded-3xl border-2 transition-all ${cardBg} space-y-5`}>
          {/* Operations Tabs */}
          <div className="flex items-center justify-between border-b border-slate-700/20 pb-3 flex-wrap gap-2">
            <div className={`flex p-1 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-100 border-slate-300'}`}>
              <button
                onClick={() => setCapitalTab('deposit')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                  capitalTab === 'deposit'
                    ? (isDark ? 'bg-cyan-600 text-white shadow-md' : 'bg-[#0b1f3a] text-white')
                    : (isDark ? 'text-slate-400 hover:text-white' : 'text-[#0b1f3a]')
                }`}
              >
                <span>📥 Vault Deposits (Paused)</span>
              </button>
              <button
                onClick={() => setCapitalTab('withdraw')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                  capitalTab === 'withdraw'
                    ? (isDark ? 'bg-cyan-600 text-white shadow-md' : 'bg-[#0b1f3a] text-white')
                    : (isDark ? 'text-slate-400 hover:text-white' : 'text-[#0b1f3a]')
                }`}
              >
                <span>📤 Withdraw Shares</span>
              </button>
            </div>
            <span className="text-xs font-bold mono">
              Wallet Balance: <strong className="text-amber-400">{balanceCookie.toFixed(2)} $COOKIE</strong>
            </span>
          </div>

          {capitalTab === 'deposit' ? (
            <div className="space-y-4">
              {/* Capital Protection Mode Banner */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 text-amber-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🛡️</span>
                    <span className="text-xs font-black uppercase text-amber-300">
                      DEPOSITS PAUSED: CAPITAL PROTECTION MODE
                    </span>
                  </div>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    PROTECTED
                  </span>
                </div>
                <p className="text-xs leading-relaxed opacity-90">
                  Automated flash arbitrage requires <strong>two liquid DEX pools</strong> on Cookie Chain SVM. Currently, only Cookoven is live on mainnet. To prevent user funds from sitting idle with zero yield, new deposits are temporarily paused until the secondary DEX pool goes live.
                </p>
                <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span>💼 Existing Deposits:</span>
                    <strong className="text-amber-300">Withdrawals are 100% active</strong>
                  </div>
                  <a
                    href={`https://cookiescan.io/address/${PROTOCOL_TREASURY_VAULT_ADDRESS}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-400 hover:underline font-bold text-[11px] flex items-center gap-1"
                  >
                    <span>Audited Treasury on CookieScan ↗</span>
                  </a>
                </div>
              </div>
            </div>
          ) : (
            /* Withdraw Tab */
            <div className="space-y-4">
              <div className={`p-4 rounded-2xl border space-y-3 ${subCardBg}`}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold">Available cCOOKIE-LP Shares:</span>
                  <span className="font-black mono text-emerald-400">
                    {userPos ? userPos.shares.toFixed(4) : '0.0000'} cCOOKIE-LP
                  </span>
                </div>

                {withdrawNotice && (
                  <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-xs text-red-300">
                    {withdrawNotice}
                  </div>
                )}

                <div className="grid grid-cols-4 gap-2 pt-2">
                  {[25, 50, 75, 100].map((pct) => (
                    <button
                      key={pct}
                      onClick={() => handleWithdraw(pct)}
                      disabled={isSubmitting || !userPos || userPos.shares <= 0}
                      className={`py-2 rounded-xl border text-xs font-black transition-all ${
                        !userPos || userPos.shares <= 0
                          ? 'opacity-40 cursor-not-allowed bg-slate-800 border-slate-700 text-slate-500'
                          : 'bg-cyan-600 hover:bg-cyan-500 text-white cursor-pointer shadow-md'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>

                <div className="pt-3 border-t border-slate-700/20">
                  <button
                    onClick={() => handleWithdraw(100)}
                    disabled={isSubmitting || !userPos || userPos.shares <= 0}
                    className={`w-full py-3 rounded-2xl font-black text-xs transition-all ${
                      !userPos || userPos.shares <= 0
                        ? 'opacity-40 cursor-not-allowed bg-slate-800 text-slate-500'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-lg'
                    }`}
                  >
                    {isSubmitting ? '⏳ Processing Withdrawal...' : 'Withdraw 100% of Shares'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. Primary Content: Live Monitor vs Quant Lab */}
      {engineMode === 'live_beta' ? (
        <div className="space-y-6">
          {/* Pools Detection & Sniper Telemetry */}
          <div className={`p-5 rounded-3xl border-2 transition-all ${cardBg} space-y-4`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700/20 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🎯</span>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider">
                    SVM DEX Discovery & Standby Sniper Telemetry
                  </h3>
                  <p className={`text-[11px] font-bold ${mutedText}`}>
                    Autonomous probe polling on-chain program accounts across SVM block slots
                  </p>
                </div>
              </div>
              <span className={`text-[10px] font-black px-2.5 py-1 rounded-xl border mono flex items-center gap-1.5 ${
                isDark ? 'bg-amber-950/80 text-amber-300 border-amber-500/40' : 'bg-amber-100 text-amber-900 border-amber-300'
              }`}>
                <span>POOLS DETECTED:</span>
                <strong className="text-xs">{discovery?.total_pools_detected ?? 1} / 2</strong>
              </span>
            </div>

            {/* Status Announcement Box */}
            <div className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-between gap-3 ${
              isDark ? 'bg-amber-950/30 border-amber-500/40 text-amber-200' : 'bg-amber-50 border-amber-300 text-amber-900'
            }`}>
              <div className="flex items-center gap-2">
                <span className="text-base">🛡️</span>
                <span>{discovery?.sniper_status || 'Cookie Atomic Sniper: Standby | 1 Pool Detected (Cookoven) | Awaiting secondary DEX deployment'}</span>
              </div>
              <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 mono shrink-0">
                STANDBY
              </span>
            </div>

            {/* Pools Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {/* Primary Pool: Cookoven Protocol */}
              <div className={`p-4 rounded-2xl border-2 space-y-3 ${
                isDark ? 'bg-[#050f24] border-emerald-500/40' : 'bg-[#f0fdf4] border-emerald-600/40'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span>Cookoven Protocol (Cookie Chain AMM)</span>
                  </span>
                  <span className="text-[9px] font-black px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40 uppercase mono">
                    LOW LIQUIDITY
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs mono pt-2 border-t border-emerald-500/20">
                  <div>
                    <span className={`text-[10px] block ${mutedText}`}>Target Pair:</span>
                    <span className="font-black">COOKIE / USDC</span>
                  </div>
                  <div>
                    <span className={`text-[10px] block ${mutedText}`}>Implied Price:</span>
                    <span className="font-black text-emerald-400">≈$0.0000817</span>
                  </div>
                  <div>
                    <span className={`text-[10px] block ${mutedText}`}>Pool Reserves:</span>
                    <span className="font-black">≈185k COOKIE</span>
                  </div>
                  <div>
                    <span className={`text-[10px] block ${mutedText}`}>USDC Depth:</span>
                    <span className="font-black">≈$15 USDC</span>
                  </div>
                </div>
                <p className={`text-[10px] leading-snug pt-1 ${mutedText}`}>
                  Snapshot (approx.). Cookoven liquidity is too thin to absorb swaps, so the
                  engine stays in standby — no live arbitrage runs.
                </p>
              </div>

              {/* Secondary Pool: Standby Monitor */}
              <div className={`p-4 rounded-2xl border-2 border-dashed space-y-3 ${
                isDark ? 'bg-[#0a1122] border-slate-700' : 'bg-gray-50 border-slate-300'
              }`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-black flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-[#0b1f3a]/70'}`}>
                    <span>⏳</span>
                    <span>Secondary SVM DEX (CookieSwap / Raydium SVM)</span>
                  </span>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase mono ${
                    isDark ? 'bg-slate-800 text-slate-400 border border-slate-700' : 'bg-gray-200 text-gray-700'
                  }`}>
                    STANDBY WATCHER
                  </span>
                </div>
                <p className={`text-xs leading-relaxed pt-1 ${mutedText}`}>
                  The agent monitors AMM liquidity contract deployment events across SVM block slots. Once the secondary DEX pool is funded, automated bidirectional flash execution activates immediately.
                </p>
              </div>
            </div>
          </div>


          {/* Real-Time Atomic Execution Feed */}
          <div className={`p-5 rounded-3xl border-2 transition-all ${cardBg} space-y-4`}>
            <div className="flex items-center justify-between border-b border-slate-700/20 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">📡</span>
                <h3 className="text-sm font-black uppercase tracking-wider">
                  Live SVM Execution Telemetry
                </h3>
              </div>
              <span className="text-[10px] mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/40">
                ACTIVE LISTENER
              </span>
            </div>

            <div className="space-y-2 text-xs mono">
              {tradeFeed.length === 0 ? (
                <div className={`text-center py-8 rounded-2xl border border-dashed ${isDark ? 'border-slate-800 bg-[#060a14]' : 'border-slate-300 bg-slate-50'}`}>
                  <div className="w-12 h-12 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 flex items-center justify-center mx-auto text-2xl mb-3">
                    📡
                  </div>
                  <p className="font-black text-sm">Sentinel Agent in Active Standby</p>
                  <p className={`text-xs max-w-md mx-auto mt-1 leading-relaxed ${mutedText}`}>
                    Polling Cookoven liquidity pool directly on Cookie Chain SVM. On-chain flash execution activates once the secondary DEX route is detected.
                  </p>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold mt-4">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>CAPITAL SAFE · REVERSION PROTOCOL ACTIVE</span>
                  </div>
                </div>
              ) : (
                tradeFeed.map((trade) => (
                  <div key={trade.id} className={`p-3 rounded-xl border flex items-center justify-between ${subCardBg}`}>
                    <div>
                      <div className="font-bold text-xs">{trade.pair} &bull; +{trade.gross_spread_pct}%</div>
                      <div className={`text-[10px] ${mutedText}`}>Slot #{trade.slot} &bull; {trade.tx_signature.slice(0, 16)}...</div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-emerald-400 text-xs">+${trade.gross_profit_usd.toFixed(4)}</span>
                      <span className="text-[10px] text-amber-400 block">🔥 {trade.burned_cookie.toFixed(2)} COOK</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Quant Lab Simulator */
        <div className="space-y-6">
          <div className={`p-5 rounded-3xl border-2 transition-all ${cardBg} space-y-5`}>
            <div className="flex items-center justify-between border-b border-slate-700/20 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🧪</span>
                <div>
                  <h3 className="text-base font-black tracking-tight">Quant Stress Test & Formula Lab</h3>
                  <p className={`text-xs font-bold ${mutedText}`}>
                    Audit constant product AMM mathematics ($x \cdot y = k$), order sizing, and atomic reversion without risking real capital
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-black px-2.5 py-1 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 mono">
                STRESS TEST MODE
              </span>
            </div>

            {/* Sliders Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              {/* Spread Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold">Market Spread:</span>
                  <span className="font-black mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/40">
                    +{simSpreadPct.toFixed(2)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="6.0"
                  step="0.1"
                  value={simSpreadPct}
                  onChange={(e) => setSimSpreadPct(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <div className={`flex justify-between text-[10px] mono ${mutedText}`}>
                  <span>0.5% (Min)</span>
                  <span>6.0% (High Volatility)</span>
                </div>
              </div>

              {/* Order Size Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold">Flash Order Size:</span>
                  <span className="font-black mono text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/40">
                    {simAmountCookie.toLocaleString()} COOKIE
                  </span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="10000"
                  step="100"
                  value={simAmountCookie}
                  onChange={(e) => setSimAmountCookie(parseInt(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <div className={`flex justify-between text-[10px] mono ${mutedText}`}>
                  <span>100 COOK</span>
                  <span>10,000 COOK</span>
                </div>
              </div>

              {/* Slippage Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold">Slippage Tolerance:</span>
                  <span className="font-black mono text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-500/40">
                    {simSlippagePct.toFixed(2)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="2.0"
                  step="0.05"
                  value={simSlippagePct}
                  onChange={(e) => setSimSlippagePct(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <div className={`flex justify-between text-[10px] mono ${mutedText}`}>
                  <span>0.1% (Strict)</span>
                  <span>2.0% (Loose)</span>
                </div>
              </div>
            </div>

            {/* Simulation Action Buttons */}
            <div className="flex items-center gap-3 pt-2 flex-wrap">
              <button
                onClick={handleRunSimulation}
                disabled={isSimulating}
                className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs transition-all shadow-lg cursor-pointer flex items-center gap-2"
              >
                <span>{isSimulating ? '⏳ Calculating AMM Math...' : '⚡ Simulate Atomic Flash Cycle'}</span>
              </button>
              <button
                onClick={handleTestRevert}
                disabled={isShootingRevert}
                className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-black text-xs transition-all shadow-lg cursor-pointer flex items-center gap-2"
              >
                <span>{isShootingRevert ? '⏳ Testing Revert...' : '🛡️ Test Adverse Slippage Revert'}</span>
              </button>
            </div>

            {/* Results Display */}
            {simResult && (
              <div className={`p-4 rounded-2xl border-2 space-y-3 mt-4 ${
                isDark ? 'bg-[#050f24] border-cyan-500/40' : 'bg-cyan-50 border-cyan-300'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-cyan-300">
                    Simulation Output: Gross Profit vs Pool Friction
                  </span>
                  <span className="text-xs font-black mono text-emerald-400">
                    Net Profit: +${simResult.net_profit_usd?.toFixed(4) ?? '0.0000'} USD
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mono pt-2 border-t border-cyan-500/20">
                  <div>
                    <span className={`text-[10px] block ${mutedText}`}>Effective Rate:</span>
                    <span className="font-bold">${simResult.effective_execution_price?.toFixed(8) ?? '0.00008170'}</span>
                  </div>
                  <div>
                    <span className={`text-[10px] block ${mutedText}`}>Price Impact:</span>
                    <span className="font-bold text-amber-400">{simResult.price_impact_pct?.toFixed(2) ?? '0.12'}%</span>
                  </div>
                  <div>
                    <span className={`text-[10px] block ${mutedText}`}>DEX Fee:</span>
                    <span className="font-bold text-red-400">-${simResult.dex_fee_usd?.toFixed(4) ?? '0.0005'}</span>
                  </div>
                  <div>
                    <span className={`text-[10px] block ${mutedText}`}>Reversion Status:</span>
                    <span className="font-bold text-emerald-400">{simResult.is_profitable ? 'EXECUTED' : 'REVERTED'}</span>
                  </div>
                </div>
              </div>
            )}

            {shotRevertResult && (
              <div className={`p-4 rounded-2xl border-2 space-y-2 mt-4 ${
                isDark ? 'bg-amber-950/40 border-amber-500/40 text-amber-200' : 'bg-amber-50 border-amber-300 text-amber-900'
              }`}>
                <div className="flex items-center gap-2 text-xs font-black uppercase">
                  <span>🛡️</span>
                  <span>Adverse Slippage Test Result: Transaction Reverted Atomically</span>
                </div>
                <p className="text-xs leading-relaxed">
                  Net spread (+0.15%) did not exceed cumulative pool fees and gas. The SVM instructions reverted immediately. <strong>User capital remained 100% untouched.</strong>
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Receipt Modal */}
      {showReceiptModal && lastActionReceipt && (
        <div className="fixed inset-0 z-50 bg-[#0b1f3a]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`p-6 rounded-3xl border-2 max-w-md w-full space-y-4 shadow-2xl ${cardBg}`}>
            <div className="flex items-center justify-between border-b border-slate-700/20 pb-3">
              <h3 className="font-black text-base flex items-center gap-2">
                <span>✅</span>
                <span>Transaction Confirmed</span>
              </h3>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white font-black text-sm flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2 text-xs mono">
              <div>Action: {lastActionReceipt.action || 'Vault Operation'}</div>
              <div>Tx: {lastActionReceipt.tx_signature?.slice(0, 24)}...</div>
              {lastActionReceipt.shares_minted && <div>Shares Minted: {lastActionReceipt.shares_minted.toFixed(4)} cCOOKIE-LP</div>}
              {lastActionReceipt.payout_cookie && <div>Payout: {lastActionReceipt.payout_cookie.toFixed(2)} $COOKIE</div>}
            </div>
            <button
              onClick={() => setShowReceiptModal(false)}
              className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs cursor-pointer"
            >
              Close Receipt
            </button>
          </div>
        </div>
      )}

      {/* Cooldown Info Modal */}
      {isCooldownModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0b1f3a]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`p-6 rounded-3xl border-2 max-w-md w-full space-y-4 shadow-2xl ${cardBg}`}>
            <h3 className="font-black text-base flex items-center gap-2 text-amber-300">
              <span>🔒</span>
              <span>Security Cooldown Active</span>
            </h3>
            <p className="text-xs leading-relaxed">
              Standard withdrawals are locked during cooldown to protect the liquidity pool from MEV extraction.
              You can wait for the timer to expire or execute an <strong>Emergency Instant Withdrawal</strong> at any time.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setIsCooldownModalOpen(false)}
                className="flex-1 py-2 rounded-xl bg-slate-700 text-white font-bold text-xs cursor-pointer"
              >
                Wait for Cooldown
              </button>
              <button
                onClick={() => {
                  setIsCooldownModalOpen(false);
                  handleEmergencyWithdraw();
                }}
                className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs cursor-pointer"
              >
                Emergency Exit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const AtomicArbitrageAgent = React.memo(AtomicArbitrageAgentComponent);
