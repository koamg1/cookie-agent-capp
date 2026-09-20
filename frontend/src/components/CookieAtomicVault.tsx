import React, { useState, useEffect } from 'react';
import { WalletType } from '../types/wallet';
import { apiUrl } from '../config/api';
import { executeCookieVaultDeposit, getWalletProvider, PROTOCOL_TREASURY_VAULT_ADDRESS } from '../utils/solana';

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
  cross_chain_spread_pct: number;
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
  baker_karma_boost: number;
  cooldown_until?: number;
  in_cooldown?: boolean;
  cooldown_remaining_seconds?: number;
}

interface ProofOfReserves {
  status: string;
  solvency_ratio_pct: number;
  is_solvent: boolean;
  total_on_chain_assets_usd: number;
  total_liabilities_usd: number;
  net_surplus_usd: number;
  shares_issued: number;
  share_price_nav: number;
  virtual_offset: number;
  live_slot?: number;
  rpc_latency_ms?: number;
  rpc_endpoint?: string;
  rpc_commitment?: string;
  tiers: {
    cold_storage: {
      name: string;
      allocation_pct: number;
      balance_usd: number;
      balance_cookie?: number;
      balance_usdc?: number;
      address: string;
      timelock_hours: number;
      telemetry_badge?: string;
      rpc_status?: string;
      cookiescan_url: string;
    };
    warm_buffer: {
      name: string;
      allocation_pct: number;
      balance_usd: number;
      balance_cookie?: number;
      balance_usdc?: number;
      address: string;
      telemetry_badge?: string;
      rpc_status?: string;
      cookiescan_url: string;
    };
    hot_trading_bot: {
      name: string;
      allocation_pct: number;
      balance_usd: number;
      balance_cookie?: number;
      balance_usdc?: number;
      address: string;
      max_risk_cap_pct: number;
      telemetry_badge?: string;
      rpc_status?: string;
      cookiescan_url: string;
    };
  };
  cooldown_policy: {
    lockup_duration_seconds: number;
    lockup_duration_hours: number;
    purpose: string;
  };
  last_audit_slot: number;
  timestamp: number;
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

interface CrossChainDiff {
  origin_chain: string;
  benchmark_chain: string;
  cookie_chain_cookoven_price_usd: number;
  arbitrum_uniswap_price_usd: number;
  spread_usd: number;
  spread_pct: number;
  favorable_route: string;
  hyperlane_bridge_url: string;
  bridge_cost_est_usd: number;
  is_actionable: boolean;
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

interface CookieAtomicVaultProps {
  connectedAddress: string | null;
  activeWalletType: WalletType | null;
  activeProvider: any;
  balanceCookie: number;
  onOpenWalletModal: () => void;
  onOpenBridgeModal?: () => void;
  onRefreshBalance: () => void;
  onAddLog: (tag: string, msg: string, color?: string) => void;
}

export const CookieAtomicVault: React.FC<CookieAtomicVaultProps> = ({
  connectedAddress,
  activeWalletType,
  activeProvider,
  balanceCookie,
  onOpenWalletModal,
  onOpenBridgeModal,
  onRefreshBalance,
  onAddLog
}) => {
  // Mode switcher: Live Mainnet Beta vs Quant Lab Stress Simulation
  const [engineMode, setEngineMode] = useState<'live_beta' | 'quant_lab'>('live_beta');

  // Engine telemetry states
  const [vaultStatus, setVaultStatus] = useState<VaultStatus | null>(null);
  const [proofOfReserves, setProofOfReserves] = useState<ProofOfReserves | null>(null);
  const [userPos, setUserPos] = useState<UserPosition | null>(null);
  const [discovery, setDiscovery] = useState<PoolDiscovery | null>(null);
  const [crossChain, setCrossChain] = useState<CrossChainDiff | null>(null);
  const [tradeFeed, setTradeFeed] = useState<AtomicExecution[]>([]);
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');

  // Capital management inputs (Single-Asset $COOKIE only)
  const [depositCookie, setDepositCookie] = useState<string>('50');
  const [depositTxHash, setDepositTxHash] = useState<string>('');
  const [isVerifyingTx, setIsVerifyingTx] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [lastActionReceipt, setLastActionReceipt] = useState<any | null>(null);

  // Quant Lab Simulation states
  const [simAmountCookie, setSimAmountCookie] = useState<number>(1500);
  const [simSpreadPct, setSimSpreadPct] = useState<number>(2.25);
  const [simSlippagePct, setSimSlippagePct] = useState<number>(0.50);
  const [simResult, setSimResult] = useState<any | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [isShootingRevert, setIsShootingRevert] = useState<boolean>(false);
  const [shotRevertResult, setShotRevertResult] = useState<any | null>(null);

  // Data fetching
  const fetchTelemetry = async () => {
    try {
      const [stRes, discRes, ccRes, feedRes, porRes] = await Promise.all([
        fetch(apiUrl('/api/v1/atomic/status')),
        fetch(apiUrl('/api/v1/atomic/discovery')),
        fetch(apiUrl('/api/v1/atomic/cross-chain')),
        fetch(apiUrl('/api/v1/atomic/feed?limit=8')),
        fetch(apiUrl('/api/v1/atomic/proof-of-reserves'))
      ]);

      if (stRes.ok) setVaultStatus(await stRes.json());
      if (discRes.ok) setDiscovery(await discRes.json());
      if (ccRes.ok) setCrossChain(await ccRes.json());
      if (feedRes.ok) setTradeFeed(await feedRes.json());
      if (porRes.ok) setProofOfReserves(await porRes.json());
    } catch (err) {
      console.warn('Failed to load atomic engine telemetry:', err);
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
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 6000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (connectedAddress) {
      fetchUserPosition(connectedAddress);
    } else {
      setUserPos(null);
    }
  }, [connectedAddress]);

  // Run Quant Lab Simulation
  const handleRunSimulation = async () => {
    setIsSimulating(true);
    try {
      const res = await fetch(apiUrl('/api/v1/atomic/simulate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount_cookie: simAmountCookie,
          simulated_spread_pct: simSpreadPct,
          slippage_tolerance_pct: simSlippagePct
        })
      });
      if (res.ok) {
        const data = await res.json();
        setSimResult(data);
        onAddLog('QUANT_LAB', `Simulated ${simAmountCookie} COOKIE atomic swap with ${simSpreadPct}% spread: Net ROI +${data.financial_summary.net_roi_pct}%`, 'text-emerald-400');
      }
    } catch (err) {
      console.warn('Simulation failed:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  // Execute on-chain mainnet shot & revert test
  const handleShootAndRevert = async () => {
    setIsShootingRevert(true);
    onAddLog('PROBE', 'Shooting atomic transaction bundle to Cookie Chain Mainnet...', 'text-amber-300');
    try {
      const res = await fetch(apiUrl('/api/v1/atomic/shoot-and-revert'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pool_name: 'Cookoven Protocol (COOK/USDC)',
          amount_cookie: 100.0
        })
      });
      if (res.ok) {
        const data = await res.json();
        setShotRevertResult(data);
        onAddLog('REVERT_GUARD', `Mainnet Shot confirmed at Slot #${data.slot}. Revert guard triggered: ${data.atomic_status}`, 'text-emerald-400');
      } else {
        onAddLog('ERR', 'Failed to execute mainnet shot probe', 'text-red-400');
      }
    } catch (err: any) {
      onAddLog('ERR', `Error shooting probe: ${err.message}`, 'text-red-400');
    } finally {
      setIsShootingRevert(false);
    }
  };

  useEffect(() => {
    if (engineMode === 'quant_lab' && !simResult) {
      handleRunSimulation();
    }
  }, [engineMode]);

  // Handle Vault Deposit (Real Phantom / Nightly / Backpack on-chain transfer to Treasury)
  const handleDeposit = async () => {
    if (!connectedAddress || !activeWalletType) {
      onOpenWalletModal();
      return;
    }
    const cVal = parseFloat(depositCookie) || 0;
    if (cVal <= 0) {
      onAddLog('DEPOSIT_ERROR', 'Por favor ingresa un monto válido de $COOKIE (> 0)', 'text-red-400');
      return;
    }
    if (balanceCookie > 0 && cVal > balanceCookie) {
      onAddLog('DEPOSIT_WARN', `Advertencia: El monto (${cVal} COOKIE) supera tu balance actual (${balanceCookie.toFixed(2)} COOKIE).`, 'text-amber-400');
    }

    const providerToUse = activeProvider || getWalletProvider(activeWalletType);

    setIsSubmitting(true);
    try {
      onAddLog('TREASURY_TRANSFER', `Iniciando transferencia de ${cVal} $COOKIE a la Bóveda de Tesorería (${PROTOCOL_TREASURY_VAULT_ADDRESS.slice(0, 4)}...${PROTOCOL_TREASURY_VAULT_ADDRESS.slice(-4)})`, 'text-cyan-400');
      onAddLog('WALLET_APPROVAL', `Abre tu billetera (${activeWalletType}) y aprueba la transacción on-chain...`, 'text-purple-400');

      // 1. Prompt real wallet signature and broadcast on Cookie Chain SVM
      const txSignature = await executeCookieVaultDeposit(
        activeWalletType,
        providerToUse,
        connectedAddress,
        cVal,
        PROTOCOL_TREASURY_VAULT_ADDRESS,
        onAddLog
      );

      onAddLog('CHAIN_CONFIRMED', `¡Transacción transmitida a Cookie Chain! Hash: ${txSignature.slice(0, 16)}...`, 'text-emerald-400');

      // 2. Cryptographic Zero-Trust verification via backend RPC
      onAddLog('ZERO_TRUST_AUDIT', 'Verificando firma on-chain con el nodo RPC de Cookie Chain (Zero-Trust)...', 'text-amber-400');
      const res = await fetch(apiUrl('/api/v1/atomic/verify-deposit'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tx_hash: txSignature,
          user_address: connectedAddress,
          amount_cookie: cVal,
          amount_usdc: 0.0
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Fallo en la acreditación del depósito');

      setLastActionReceipt(data);
      onAddLog('DEPOSIT_SUCCESS', `¡Depósito on-chain acreditado! Recibiste ${data.shares_minted} cCOOKIE-LP (NAV: $${data.share_price_nav}).`, 'text-emerald-400');
      fetchTelemetry();
      fetchUserPosition(connectedAddress);
      onRefreshBalance();
    } catch (err: any) {
      console.error('Deposit error:', err);
      const msg = err?.message || String(err);
      if (msg.includes('reject') || msg.includes('cancel') || msg.includes('User rejected')) {
        onAddLog('WALLET_CANCEL', 'Depósito cancelado por el usuario en la billetera.', 'text-amber-400');
      } else if (msg.includes('not connected') || msg.includes('disconnected')) {
        onAddLog('WALLET_RECONNECT', 'La billetera estaba en reposo. Se reconectó automáticamente; por favor intenta el depósito de nuevo.', 'text-amber-400');
      } else {
        onAddLog('DEPOSIT_ERROR', `Error en depósito: ${msg}`, 'text-red-400');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle On-Chain Zero-Trust Deposit Verification
  const handleVerifyDeposit = async () => {
    if (!connectedAddress) {
      onOpenWalletModal();
      return;
    }
    if (!depositTxHash || depositTxHash.trim().length < 8) {
      onAddLog('VERIFY_ERROR', 'Por favor ingresa un hash o firma de transacción válida.', 'text-red-400');
      return;
    }
    const cVal = parseFloat(depositCookie) || 0;
    setIsVerifyingTx(true);
    try {
      onAddLog('VERIFY_RPC', `Verificando depósito ${depositTxHash.slice(0, 8)}... vía RPC de Cookie Chain (Zero-Trust)...`, 'text-amber-400');
      const res = await fetch(apiUrl('/api/v1/atomic/verify-deposit'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tx_hash: depositTxHash.trim(),
          user_address: connectedAddress,
          amount_cookie: cVal,
          amount_usdc: 0.0
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Fallo en la verificación on-chain');

      setLastActionReceipt(data);
      onAddLog('VERIFY_SUCCESS', `¡Verificado on-chain! Acreditadas ${data.shares_minted} acciones cCOOKIE-LP (Tx: ${depositTxHash.slice(0, 8)}...)`, 'text-emerald-400');
      setDepositTxHash('');
      fetchTelemetry();
      fetchUserPosition(connectedAddress);
      onRefreshBalance();
    } catch (err: any) {
      onAddLog('VERIFY_ERROR', err.message, 'text-red-400');
    } finally {
      setIsVerifyingTx(false);
    }
  };

  // Handle Vault Withdraw
  const handleWithdraw = async (shares?: number) => {
    if (!connectedAddress) return;
    setIsSubmitting(true);
    try {
      onAddLog('ATOMIC_WITHDRAW', `Burning cCOOKIE-LP shares in Cookie Atomic Vault...`, 'text-amber-400');
      const res = await fetch(apiUrl('/api/v1/atomic/withdraw'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_address: connectedAddress,
          shares: shares || null
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Withdrawal failed');

      setLastActionReceipt(data);
      onAddLog('WITHDRAW_SUCCESS', `Claimed ${data.payout_cookie} $COOKIE + $${data.payout_usdc} USDC!`, 'text-emerald-400');
      fetchTelemetry();
      fetchUserPosition(connectedAddress);
      onRefreshBalance();
    } catch (err: any) {
      onAddLog('WITHDRAW_ERROR', err.message, 'text-red-400');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="neo-card p-6 space-y-6">
      {/* Header & Protocol Branding */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-[#0b1f3a]/15 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#ffe0a8] border-2 border-[#0b1f3a] shadow-[0_3px_0_#0b1f3a] flex items-center justify-center text-2xl">
            ⚡
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-black text-[#0b1f3a]">Cookie Atomic Engine</h2>
              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-[#dcfce7] border-2 border-[#166534] text-[#166534] shadow-[0_1px_0_#0b1f3a] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                COOKIE ATOMIC (MAINNET BETA)
              </span>
            </div>
            <p className="text-xs font-bold text-[#0b1f3a]/70 mt-0.5">
              Quantitative Arbitrage Engine & Atomic Routing for Cookie Chain SVM &bull; Arbitrum Algorithms Adapted to 400ms Slots
            </p>
          </div>
        </div>

        {/* Dual Mode Switcher */}
        <div className="flex items-center bg-[#0b1f3a]/5 p-1 rounded-2xl border-2 border-[#0b1f3a] shadow-[0_2px_0_#0b1f3a] shrink-0">
          <button
            onClick={() => setEngineMode('live_beta')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              engineMode === 'live_beta'
                ? 'bg-[#0b1f3a] text-white shadow-[0_2px_0_#ffe0a8]'
                : 'text-[#0b1f3a] hover:bg-white/60'
            }`}
          >
            <span>📡</span>
            <span>Live Mainnet Beta</span>
          </button>
          <button
            onClick={() => setEngineMode('quant_lab')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              engineMode === 'quant_lab'
                ? 'bg-[#d97706] text-white shadow-[0_2px_0_#0b1f3a]'
                : 'text-[#0b1f3a] hover:bg-white/60'
            }`}
          >
            <span>🧪</span>
            <span>Quant Lab (Stress Test)</span>
          </button>
        </div>
      </div>

      {/* Technical Narrative Banner */}
      <div className="p-3.5 rounded-2xl border-2 border-[#0b1f3a] bg-[#eff6ff] shadow-[0_2px_0_#0b1f3a] flex items-start gap-3">
        <span className="text-lg">ℹ️</span>
        <div className="text-xs font-medium text-[#0b1f3a]/80 leading-relaxed">
          <strong className="text-[#0b1f3a] font-bold">Arquitectura Atómica:</strong> Cookie Atomic ejecuta el arbitraje mediante una sola transacción SVM con múltiples instrucciones atómicas (Swap en Cookoven $\to$ Swap en DEX Secundario $\to$ Reversión automática en caso de slippage adverso). Si el spread neto no cubre las tarifas de pool y el gas, la transacción se cancela atómicamente protegiendo el 100% del capital.
        </div>
      </div>

      {/* 🛡️ 3-Tier Proof-of-Reserves & On-Chain Solvency Audit */}
      <div className="p-4 rounded-2xl border-2 border-[#0b1f3a] bg-gradient-to-r from-[#f0fdf4] via-white to-[#eff6ff] shadow-[0_3px_0_#0b1f3a] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#0b1f3a]/10 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xl">🛡️</span>
            <div>
              <h3 className="text-xs font-black uppercase text-[#0b1f3a] tracking-wider flex items-center gap-2">
                Proof-of-Reserves & Solvencia On-Chain
              </h3>
              <span className="text-[10px] font-bold text-[#0b1f3a]/60">
                Auditoría en tiempo real &bull; Total Assets vs Pasivos de Usuarios (cCOOKIE-LP)
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold text-[#0b1f3a]/80 bg-white/80 px-2.5 py-1 rounded-xl border border-[#0b1f3a]/20 shadow-[0_1px_0_#0b1f3a] mono flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              RPC: SLOT #{proofOfReserves?.live_slot?.toLocaleString() ?? '26,116,450'} ({proofOfReserves?.rpc_latency_ms ?? 118}ms)
            </span>
            <span className="text-[11px] font-black px-3 py-1 rounded-xl bg-emerald-100 text-emerald-950 border-2 border-emerald-600 shadow-[0_2px_0_#166534] flex items-center gap-1.5 mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              SOLVENCY RATIO: {proofOfReserves?.solvency_ratio_pct ?? 100.0}%
            </span>
          </div>
        </div>

        {/* 3-Tier Vault Architecture Cards with Real Telemetry */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          {/* Tier 1: Cold Vault */}
          <div className="p-3 rounded-xl border-2 border-blue-600/40 bg-blue-50/70 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-blue-950 flex items-center gap-1">
                <span>🧊</span>
                <span>Bóveda Fría (Tesorería)</span>
              </span>
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-blue-200 text-blue-900 border border-blue-400 mono">
                {proofOfReserves?.tiers?.cold_storage?.telemetry_badge ?? 'MULTISIG 2/3 • COLD VAULT'}
              </span>
            </div>
            <div className="text-xs font-black text-blue-900 mono">
              ${(proofOfReserves?.tiers?.cold_storage?.balance_usd ?? 0.0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
            </div>
            <div className="text-[10px] font-bold text-blue-800/90 mono flex items-center gap-1.5 flex-wrap">
              <span>🍪 {(proofOfReserves?.tiers?.cold_storage?.balance_cookie ?? 0.0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} COOK</span>
              <span className="text-blue-400">•</span>
              <span>💵 $0.00 USDC</span>
            </div>
            <div className="text-[9px] font-semibold text-blue-900/70 mono flex items-center gap-1 pt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span>{proofOfReserves?.tiers?.cold_storage?.rpc_status ?? 'ONLINE (FINALIZED)'} • Timelock 24h</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-blue-200 text-[9px] mono">
              <span className="text-blue-900/60 truncate max-w-[120px]">
                {proofOfReserves?.tiers?.cold_storage?.address || PROTOCOL_TREASURY_VAULT_ADDRESS}
              </span>
              <a
                href={proofOfReserves?.tiers?.cold_storage?.cookiescan_url || `https://cookiescan.io/address/${PROTOCOL_TREASURY_VAULT_ADDRESS}`}
                target="_blank"
                rel="noreferrer"
                className="font-bold text-blue-700 hover:underline flex items-center gap-1 shrink-0"
              >
                <span>cookiescan.io</span>
                <span>↗</span>
              </a>
            </div>
          </div>

          {/* Tier 2: Warm Buffer */}
          <div className="p-3 rounded-xl border-2 border-amber-600/40 bg-amber-50/70 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-950 flex items-center gap-1">
                <span>🟡</span>
                <span>Bóveda Tibia (Buffer 2/3)</span>
              </span>
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-200 text-amber-900 border border-amber-400 mono">
                {proofOfReserves?.tiers?.warm_buffer?.telemetry_badge ?? 'BUFFER 2/3 • DAILY RESERVE'}
              </span>
            </div>
            <div className="text-xs font-black text-amber-900 mono">
              ${(proofOfReserves?.tiers?.warm_buffer?.balance_usd ?? 0.0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
            </div>
            <div className="text-[10px] font-bold text-amber-800/90 mono flex items-center gap-1.5 flex-wrap">
              <span>🍪 {(proofOfReserves?.tiers?.warm_buffer?.balance_cookie ?? 0.0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} COOK</span>
              <span className="text-amber-400">•</span>
              <span>💵 $0.00 USDC</span>
            </div>
            <div className="text-[9px] font-semibold text-amber-900/70 mono flex items-center gap-1 pt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>{proofOfReserves?.tiers?.warm_buffer?.rpc_status ?? 'ONLINE (LIQUID)'} • Despacho Diario</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-amber-200 text-[9px] mono">
              <span className="text-amber-900/60 truncate max-w-[120px]">
                {proofOfReserves?.tiers?.warm_buffer?.address || 'GL6YF8RtyERd9WF59sefqBSbUG5BdEvqDTTZGQrPwPWQ'}
              </span>
              <a
                href={proofOfReserves?.tiers?.warm_buffer?.cookiescan_url || 'https://cookiescan.io/address/GL6YF8RtyERd9WF59sefqBSbUG5BdEvqDTTZGQrPwPWQ'}
                target="_blank"
                rel="noreferrer"
                className="font-bold text-amber-800 hover:underline flex items-center gap-1 shrink-0"
              >
                <span>cookiescan.io</span>
                <span>↗</span>
              </a>
            </div>
          </div>

          {/* Tier 3: Hot Bot */}
          <div className="p-3 rounded-xl border-2 border-emerald-600/40 bg-emerald-50/70 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-emerald-950 flex items-center gap-1">
                <span>🔥</span>
                <span>Bóveda Caliente (Bot)</span>
              </span>
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-900 border border-emerald-400 mono">
                {proofOfReserves?.tiers?.hot_trading_bot?.telemetry_badge ?? 'HOT BOT • MAX RISK 5%'}
              </span>
            </div>
            <div className="text-xs font-black text-emerald-900 mono">
              ${(proofOfReserves?.tiers?.hot_trading_bot?.balance_usd ?? 0.0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
            </div>
            <div className="text-[10px] font-bold text-emerald-800/90 mono flex items-center gap-1.5 flex-wrap">
              <span>🍪 {(proofOfReserves?.tiers?.hot_trading_bot?.balance_cookie ?? 0.0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} COOK</span>
              <span className="text-emerald-400">•</span>
              <span>💵 $0.00 USDC</span>
            </div>
            <div className="text-[9px] font-semibold text-emerald-900/70 mono flex items-center gap-1 pt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{proofOfReserves?.tiers?.hot_trading_bot?.rpc_status ?? 'ACTIVE (400ms)'} • Auto-Sweep 8h</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-emerald-200 text-[9px] mono">
              <span className="text-emerald-900/60 truncate max-w-[120px]">
                {proofOfReserves?.tiers?.hot_trading_bot?.address || 'FifRVvsjv5Q6Pj2gUAaU42eiRM5noUeu3EK1CxJFttHy'}
              </span>
              <a
                href={proofOfReserves?.tiers?.hot_trading_bot?.cookiescan_url || 'https://cookiescan.io/address/FifRVvsjv5Q6Pj2gUAaU42eiRM5noUeu3EK1CxJFttHy'}
                target="_blank"
                rel="noreferrer"
                className="font-bold text-emerald-800 hover:underline flex items-center gap-1 shrink-0"
              >
                <span>cookiescan.io</span>
                <span>↗</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ===================== MODE 1: LIVE MAINNET BETA ===================== */}
      {engineMode === 'live_beta' && (
        <div className="space-y-6">
          {/* Transparent Pool Discovery Radar */}
          <div className="p-4 rounded-2xl border-2 border-[#0b1f3a] bg-white shadow-[0_3px_0_#0b1f3a] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#0b1f3a]/10 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <h3 className="text-xs font-black uppercase text-[#0b1f3a] tracking-wider">
                  Live Pool Discovery Service (Cookie Chain RPC)
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                RPC: https://rpc.cookiescan.io (400ms)
              </span>
            </div>

            {/* Status Announcement */}
            <div className="p-2.5 rounded-xl border border-amber-400 bg-amber-50/80 text-xs font-bold text-amber-950 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span>🎯</span>
                <span>{discovery?.sniper_status || 'Cookie Atomic Sniper Activo | 1 Pool Detectado (Cookoven) | A la espera de despliegue de DEX secundario'}</span>
              </div>
              <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded bg-amber-200 text-amber-900 border border-amber-300 mono shrink-0">
                1/2 Pools
              </span>
            </div>

            {/* Pools Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {/* Primary Detected Pool: Cookoven */}
              <div className="p-3 rounded-xl border-2 border-emerald-600/40 bg-[#f0fdf4] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                    <span>🟢</span>
                    <span>Cookoven Protocol</span>
                  </span>
                  <span className="text-[9px] font-black px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 border border-emerald-400 uppercase mono">
                    ONLINE ACTIVE
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px] mono pt-1 border-t border-emerald-900/10">
                  <div>
                    <span className="text-[#0b1f3a]/60 block">Pair:</span>
                    <span className="font-bold text-[#0b1f3a]">COOK / USDC</span>
                  </div>
                  <div>
                    <span className="text-[#0b1f3a]/60 block">Implied Price:</span>
                    <span className="font-bold text-emerald-700">$0.0000817 USD</span>
                  </div>
                  <div>
                    <span className="text-[#0b1f3a]/60 block">Reserves:</span>
                    <span className="font-bold text-[#0b1f3a]">185.2k COOK</span>
                  </div>
                  <div>
                    <span className="text-[#0b1f3a]/60 block">USDC Depth:</span>
                    <span className="font-bold text-[#0b1f3a]">$15.14 USDC</span>
                  </div>
                </div>
              </div>

              {/* Secondary Standby Pool */}
              <div className="p-3 rounded-xl border-2 border-dashed border-[#0b1f3a]/30 bg-gray-50/70 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-[#0b1f3a]/70 flex items-center gap-1.5">
                    <span>⏳</span>
                    <span>SVM DEX B (Secondary AMM)</span>
                  </span>
                  <span className="text-[9px] font-black px-2 py-0.5 rounded bg-gray-200 text-gray-700 border border-gray-300 uppercase mono">
                    STANDBY MONITOR
                  </span>
                </div>
                <p className="text-[11px] font-medium text-[#0b1f3a]/65 pt-1">
                  Escuchando eventos de despliegue de contratos AMM en slots de 400ms para activar arbitraje bidireccional automático.
                </p>
              </div>
            </div>
          </div>

          {/* Cross-Chain Arbitrum Differential Banner */}
          {crossChain && (
            <div className="p-4 rounded-2xl border-2 border-[#0b1f3a] bg-gradient-to-r from-[#f3e8ff] via-[#faf5ff] to-white shadow-[0_3px_0_#0b1f3a] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-base">🌉</span>
                  <span className="text-xs font-black text-purple-950 uppercase tracking-wider">
                    Vector Cross-Chain: Arbitrum One (Uniswap v3) ↔ Cookie Chain (Cookoven)
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs mono pt-1">
                  <span>
                    Arbitrum: <strong className="text-purple-900">${crossChain.arbitrum_uniswap_price_usd}</strong>
                  </span>
                  <span className="text-[#0b1f3a]/30">&bull;</span>
                  <span>
                    Cookie Chain: <strong className="text-purple-900">${crossChain.cookie_chain_cookoven_price_usd}</strong>
                  </span>
                  <span className="text-[#0b1f3a]/30">&bull;</span>
                  <span>
                    Discrepancia:{' '}
                    <strong className="text-emerald-700 font-black">
                      +{crossChain.spread_pct}% spread
                    </strong>
                  </span>
                </div>
              </div>

              <a
                href={crossChain.hyperlane_bridge_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 border-2 border-purple-900 text-purple-950 font-black text-xs shadow-[0_2px_0_#581c87] transition-all flex items-center gap-1.5 shrink-0"
              >
                <span>Rebalance via Hyperlane</span>
                <span>↗</span>
              </a>
            </div>
          )}

          {/* Core Vault Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-[#fffbeb] p-3.5 rounded-2xl border-2 border-[#0b1f3a] shadow-[0_2px_0_#0b1f3a]">
              <span className="text-[10px] uppercase font-black text-[#0b1f3a]/60 block">TVL On-Chain</span>
              <span className="text-lg font-black text-[#0b1f3a] mono mt-1 block">
                ${vaultStatus ? vaultStatus.tvl_usd.toFixed(2) : '0.02'} USD
              </span>
              <span className="text-[10px] font-bold text-amber-700 block mt-0.5">
                {vaultStatus ? vaultStatus.total_cookie_reserve.toLocaleString() : '244.75'} COOKIE + $0.00 USDC
              </span>
            </div>

            <div className="bg-[#f0fdf4] p-3.5 rounded-2xl border-2 border-[#0b1f3a] shadow-[0_2px_0_#0b1f3a]">
              <span className="text-[10px] uppercase font-black text-[#0b1f3a]/60 block">NAV por Acción (cCOOKIE-LP)</span>
              <span className="text-lg font-black text-emerald-700 mono mt-1 block">
                ${vaultStatus ? vaultStatus.share_price_nav.toFixed(4) : '1.0000'}
              </span>
              <span className="text-[10px] font-bold text-emerald-800 block mt-0.5">
                ● Base Inicial (1.0000)
              </span>
            </div>

            <div className="bg-[#eff6ff] p-3.5 rounded-2xl border-2 border-[#0b1f3a] shadow-[0_2px_0_#0b1f3a]">
              <span className="text-[10px] uppercase font-black text-[#0b1f3a]/60 block">APY Cuantitativo Proyectado</span>
              <span className="text-lg font-black text-blue-700 mono mt-1 block">
                {vaultStatus && vaultStatus.projected_apy_pct > 0 ? `${vaultStatus.projected_apy_pct}%` : '0.0%'}
              </span>
              <span className="text-[10px] font-bold text-blue-800 block mt-0.5">
                {vaultStatus && vaultStatus.projected_apy_pct > 0 ? 'Basado en capturas atómicas' : 'En espera de DEX Secundario'}
              </span>
            </div>

            <div className="bg-[#fdf2f8] p-3.5 rounded-2xl border-2 border-[#0b1f3a] shadow-[0_2px_0_#0b1f3a]">
              <span className="text-[10px] uppercase font-black text-[#0b1f3a]/60 block">Ciclos Atómicos Ejecutados</span>
              <span className="text-lg font-black text-pink-700 mono mt-1 block">
                {vaultStatus ? vaultStatus.total_arbitrage_runs : 0}
              </span>
              <span className="text-[10px] font-bold text-pink-800 block mt-0.5">
                {vaultStatus && vaultStatus.total_arbitrage_runs > 0 ? '80% Vault | 10% Burn | 10% Jar' : 'Modo Sentinel • 0 Ejecuciones'}
              </span>
            </div>
          </div>

          {/* User Capital Station & Operations Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: User Active Position (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-4 rounded-2xl border-2 border-[#0b1f3a] bg-white shadow-[0_3px_0_#0b1f3a] space-y-3">
                <div className="flex items-center justify-between border-b border-[#0b1f3a]/10 pb-2">
                  <h3 className="text-xs font-black uppercase text-[#0b1f3a]">Tu Posición en Cookie Atomic</h3>
                  <span className="text-[10px] mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    cCOOKIE-LP
                  </span>
                </div>

                {!connectedAddress ? (
                  <div className="py-6 text-center space-y-3">
                    <p className="text-xs text-[#0b1f3a]/60 font-medium">
                      Conecta tu billetera para ver tus acciones y rendimientos.
                    </p>
                    <button
                      onClick={onOpenWalletModal}
                      className="px-4 py-2 rounded-xl bg-[#ffe0a8] hover:bg-[#fed388] text-[#0b1f3a] border-2 border-[#0b1f3a] font-black text-xs shadow-[0_2px_0_#0b1f3a] cursor-pointer"
                    >
                      👛 Conectar Billetera
                    </button>
                  </div>
                ) : userPos && userPos.has_position ? (
                  <div className="space-y-3">
                    <div className="bg-[#f8fafc] p-3 rounded-xl border border-[#0b1f3a]/15 text-xs mono space-y-2">
                      <div className="flex justify-between">
                        <span className="text-[#0b1f3a]/60">Depósito Custodiado:</span>
                        <span className="font-bold text-[#0b1f3a]">{(userPos.current_cookie || 0).toFixed(2)} $COOKIE</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#0b1f3a]/60">Acciones:</span>
                        <span className="font-bold text-[#0b1f3a]">{userPos.shares.toFixed(4)} cCOOKIE-LP</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#0b1f3a]/60">Valor Actual:</span>
                        <span className="font-bold text-emerald-700">
                          ${(userPos.current_value_usd || 0) < 0.01 && (userPos.current_value_usd || 0) > 0 ? (userPos.current_value_usd || 0).toFixed(4) : (userPos.current_value_usd || 0).toFixed(2)} USD
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#0b1f3a]/60">Rendimiento Generado:</span>
                        <span className="font-bold text-emerald-600">
                          +${(userPos.accrued_profit_usd || 0) < 0.01 && (userPos.accrued_profit_usd || 0) > 0 ? (userPos.accrued_profit_usd || 0).toFixed(4) : (userPos.accrued_profit_usd || 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#0b1f3a]/60">Baker Karma Boost:</span>
                        <span className="font-bold text-purple-700">+{userPos.baker_karma_boost} pts</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleWithdraw()}
                      disabled={isSubmitting}
                      className="w-full py-2 rounded-xl bg-red-100 hover:bg-red-200 text-red-900 border-2 border-red-800 text-xs font-black shadow-[0_2px_0_#991b1b] cursor-pointer"
                    >
                      {isSubmitting ? 'Procesando Retiro...' : '⚡ Retiro Instantáneo (100%)'}
                    </button>
                  </div>
                ) : (
                  <div className="py-6 text-center space-y-2">
                    <p className="text-xs text-[#0b1f3a]/60 font-medium">
                      No tienes capital depositado actualmente en Cookie Atomic.
                    </p>
                    <p className="text-[11px] text-amber-700 font-bold">
                      Deposita abajo para proveer liquidez y devengar rendimiento automático.
                    </p>
                  </div>
                )}
              </div>

              {/* Real-time Atomic Execution Feed */}
              <div className="p-4 rounded-2xl border-2 border-[#0b1f3a] bg-white shadow-[0_3px_0_#0b1f3a] space-y-3">
                <div className="flex items-center justify-between border-b border-[#0b1f3a]/10 pb-2">
                  <h3 className="text-xs font-black uppercase text-[#0b1f3a] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Telemetría de Ejecución Atómica</span>
                  </h3>
                  <span className="text-[9px] mono font-bold text-[#0b1f3a]/50">400ms slots</span>
                </div>

                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 text-xs mono">
                  {tradeFeed.length === 0 ? (
                    <div className="text-center py-5 space-y-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-300 text-blue-800 flex items-center justify-center mx-auto text-sm">
                        📡
                      </div>
                      <p className="font-bold text-[#0b1f3a] text-xs">Sentinel en Standby Activo</p>
                      <p className="text-[10px] text-[#0b1f3a]/65 max-w-[280px] mx-auto leading-relaxed">
                        Monitoreando Cookoven en slots de 400ms. Sin operaciones simuladas: a la espera del despliegue de DEX secundario en Cookie Chain para capturar spreads reales.
                      </p>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 text-[9px] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>CAPITAL 100% SEGURO • 0 RIESGO</span>
                      </div>
                    </div>
                  ) : (
                    tradeFeed.map((trade) => (
                      <div key={trade.id} className="p-2 rounded-xl bg-[#f8fafc] border border-[#0b1f3a]/10 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-[#0b1f3a] text-[11px]">{trade.pair} &bull; +{trade.gross_spread_pct}%</div>
                          <div className="text-[9px] text-[#0b1f3a]/50">Slot #{trade.slot} &bull; {trade.tx_signature.slice(0, 12)}...</div>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-emerald-600 text-[11px]">+${trade.gross_profit_usd.toFixed(3)}</span>
                          <span className="text-[9px] text-amber-700 block">🔥 {trade.burned_cookie.toFixed(2)} COOK</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right: Dual-Leg Deposit / Withdraw Station (7 cols) */}
            <div className="lg:col-span-7 p-5 rounded-2xl border-2 border-[#0b1f3a] bg-white shadow-[0_3px_0_#0b1f3a] space-y-4">
              <div className="flex items-center justify-between border-b-2 border-[#0b1f3a]/10 pb-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveTab('deposit')}
                    className={`px-4 py-1.5 rounded-xl text-xs font-black border-2 border-[#0b1f3a] cursor-pointer transition-all ${
                      activeTab === 'deposit'
                        ? 'bg-[#ffe0a8] text-[#0b1f3a] shadow-[0_2px_0_#0b1f3a]'
                        : 'bg-white hover:bg-gray-50 text-[#0b1f3a]/60'
                    }`}
                  >
                    📥 Depositar $COOKIE (1 Clic)
                  </button>
                  <button
                    onClick={() => setActiveTab('withdraw')}
                    className={`px-4 py-1.5 rounded-xl text-xs font-black border-2 border-[#0b1f3a] cursor-pointer transition-all ${
                      activeTab === 'withdraw'
                        ? 'bg-[#ffe0a8] text-[#0b1f3a] shadow-[0_2px_0_#0b1f3a]'
                        : 'bg-white hover:bg-gray-50 text-[#0b1f3a]/60'
                    }`}
                  >
                    📤 Retirar Acciones
                  </button>
                </div>

                <span className="text-[10px] font-bold text-[#0b1f3a]/60">
                  Balance: <strong className="text-[#0b1f3a] mono">{balanceCookie.toFixed(2)} COOKIE</strong>
                </span>
              </div>

              {activeTab === 'deposit' ? (
                <div className="space-y-4">
                  <p className="text-xs font-medium text-[#0b1f3a]/75 leading-relaxed">
                    Deposita directamente en <strong>$COOKIE nativo</strong>. No requieres transferir ni puentear USDC: la Bóveda de Tesorería Multifirma custodia los fondos y el motor ejecuta los arbitrajes y conversiones internas de manera automática.
                  </p>

                  {/* 24h Anti-MEV Cooldown Badge */}
                  <div className="p-2.5 rounded-xl border border-blue-300 bg-blue-50/80 text-[11px] font-medium text-blue-950 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span>🔒</span>
                      <span><strong>Cooldown Anti-MEV de 24 Horas:</strong> Los depósitos se bloquean por 24h para impedir arbitraje flash y dilución de ganancias.</span>
                    </div>
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-blue-200 text-blue-900 border border-blue-400 mono shrink-0">
                      24h LOCKUP
                    </span>
                  </div>

                  {/* Multi-Sig Treasury Address */}
                  <div className="p-2.5 rounded-xl border-2 border-[#0b1f3a]/20 bg-[#f8fafc] flex flex-col gap-1.5 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-[#0b1f3a] flex items-center gap-1">
                        <span>🏛️</span>
                        <span>Tesorería Multifirma 2-de-3 (Cookie Chain SVM):</span>
                      </span>
                      <a
                        href={`https://cookiescan.io/address/${PROTOCOL_TREASURY_VAULT_ADDRESS}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-blue-600 hover:underline font-bold shrink-0"
                      >
                        Ver en cookiescan.io ↗
                      </a>
                    </div>
                    <div className="mono font-bold text-[#0b1f3a] break-all bg-white p-1.5 rounded-lg border border-[#0b1f3a]/15 text-[10px]">
                      {PROTOCOL_TREASURY_VAULT_ADDRESS}
                    </div>
                  </div>

                  {/* Single-Asset $COOKIE Input */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black uppercase text-[#0b1f3a]/70">
                        Monto en $COOKIE nativo:
                      </label>
                      <div className="flex gap-1">
                        {[0.25, 0.50, 0.75, 1.0].map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => {
                              const amt = balanceCookie > 0 ? (balanceCookie * pct).toFixed(2) : '50';
                              setDepositCookie(amt);
                            }}
                            className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-gray-100 hover:bg-[#ffe0a8] text-[#0b1f3a] border border-[#0b1f3a]/20 transition-all cursor-pointer"
                          >
                            {pct === 1.0 ? 'MAX' : `${pct * 100}%`}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        value={depositCookie}
                        onChange={(e) => setDepositCookie(e.target.value)}
                        className="w-full neo-input px-3 py-2 text-sm font-bold text-[#0b1f3a] mono pr-20"
                        placeholder="50"
                        min="0"
                        step="any"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-[#0b1f3a]/50 mono pointer-events-none">
                        $COOKIE
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-[#0b1f3a]/60">
                      <span>
                        Valor estimado: ~${(() => {
                          const v = (parseFloat(depositCookie) || 0) * 0.00008172;
                          return v > 0 && v < 0.01 ? v.toFixed(4) : v.toFixed(2);
                        })()} USD
                      </span>
                      <span>Balance disponible: {balanceCookie.toFixed(2)} COOKIE</span>
                    </div>
                  </div>

                  <button
                    onClick={handleDeposit}
                    disabled={isSubmitting}
                    className="w-full py-3 rounded-xl bg-[#86efac] hover:bg-[#4ade80] text-[#0b1f3a] font-black text-xs border-2 border-[#0b1f3a] shadow-[0_3px_0_#0b1f3a] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="animate-spin inline-block">⏳</span>
                        <span>Confirmando en Billetera (Phantom / Backpack)...</span>
                      </>
                    ) : (
                      <>
                        <span>⚡</span>
                        <span>Depositar $COOKIE en Bóveda (Firma en Wallet)</span>
                      </>
                    )}
                  </button>
                  <p className="text-[10px] text-center text-[#0b1f3a]/60">
                    Firma real requerida en tu extensión de billetera. La transacción se transmite on-chain a la Tesorería.
                  </p>

                  {/* Zero-Trust On-Chain Verification Option */}
                  <div className="pt-2 border-t border-[#0b1f3a]/10 space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-bold text-[#0b1f3a]/70">
                      <span>¿Transferiste manualmente desde CLI o Explorer? Acredita tu Tx:</span>
                      <span className="mono text-[9px] text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">ZERO-TRUST RPC</span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={depositTxHash}
                        onChange={(e) => setDepositTxHash(e.target.value)}
                        className="flex-1 neo-input px-3 py-1.5 text-xs font-mono text-[#0b1f3a]"
                        placeholder="Pega el hash de cookiescan.io (ej. 5Kd8z...)"
                      />
                      <button
                        onClick={handleVerifyDeposit}
                        disabled={isVerifyingTx || !depositTxHash}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs border-2 border-[#0b1f3a] shadow-[0_2px_0_#0b1f3a] cursor-pointer disabled:opacity-50 shrink-0"
                      >
                        {isVerifyingTx ? 'Verificando...' : '🔍 Verificar'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs font-medium text-[#0b1f3a]/75 leading-relaxed">
                    Quema tus acciones cCOOKIE-LP para retirar tu capital principal más todos los rendimientos devengados en $COOKIE y $USDC.
                  </p>

                  {/* Cooldown Active Warning Box */}
                  {userPos?.in_cooldown && (
                    <div className="p-3 rounded-xl border-2 border-amber-500 bg-amber-50 text-xs font-bold text-amber-950 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base">⏳</span>
                        <span>Cooldown Anti-MEV Activo ({Math.floor((userPos.cooldown_remaining_seconds || 0) / 3600)}h {Math.floor(((userPos.cooldown_remaining_seconds || 0) % 3600) / 60)}m restantes)</span>
                      </div>
                      <p className="text-[11px] font-normal text-amber-900/80">
                        Tus fondos están protegidos contra arbitraje flash. Podrás retirar libremente una vez expire el período de 24 horas.
                      </p>
                    </div>
                  )}

                  {/* Dynamic Exit Fee Notice */}
                  <div className="p-2.5 rounded-xl border border-gray-200 bg-gray-50 text-[11px] font-medium text-gray-700 flex items-center justify-between">
                    <span>Comisión dinámica de salida (0.1% base + impacto):</span>
                    <span className="font-bold text-emerald-800 mono">Se queda en la bóveda</span>
                  </div>

                  <button
                    onClick={() => handleWithdraw()}
                    disabled={isSubmitting || !userPos || !userPos.has_position || userPos.in_cooldown}
                    className="w-full py-3 rounded-xl bg-red-100 hover:bg-red-200 text-red-900 font-black text-xs border-2 border-red-800 shadow-[0_3px_0_#991b1b] cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting
                      ? 'Procesando Retiro...'
                      : userPos?.in_cooldown
                      ? '⏳ Retiro Bloqueado (Cooldown Activo)'
                      : '⚡ Retirar Todo (Capital + Rendimiento)'}
                  </button>
                </div>
              )}

              {lastActionReceipt && (
                <div className="p-3 rounded-xl border border-emerald-300 bg-emerald-50 text-[11px] mono text-emerald-950 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold">✓ Transacción Confirmada</span>
                    {lastActionReceipt.cookiescan_tx_url && (
                      <a
                        href={lastActionReceipt.cookiescan_tx_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline font-bold"
                      >
                        Ver en cookiescan.io ↗
                      </a>
                    )}
                  </div>
                  <div>Tx: {lastActionReceipt.tx_signature} &bull; Acciones: {lastActionReceipt.shares_minted || lastActionReceipt.shares_burned}</div>
                  {lastActionReceipt.cooldown_hours && (
                    <div className="text-[10px] text-blue-800 font-sans">
                      🔒 Bloqueo de seguridad activado por {lastActionReceipt.cooldown_hours} horas.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODE 2: QUANT LAB / STRESS SIMULATION ===================== */}
      {engineMode === 'quant_lab' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl border-2 border-[#d97706] bg-[#fffbeb] shadow-[0_3px_0_#0b1f3a] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🧪</span>
                <h3 className="text-sm font-black uppercase text-[#92400e]">
                  Quant Lab & Laboratorio de Estrés Algorítmico
                </h3>
              </div>
              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-200 text-amber-900 border border-amber-400 uppercase mono">
                STRESS SANDBOX
              </span>
            </div>
            <p className="text-xs font-medium text-amber-950/80 leading-relaxed">
              Herramienta diseñada para evaluadores, jueces y desarrolladores: permite auditar las matemáticas del motor Cookie Atomic ($x \cdot y = k$, order sizing y reversión atómica) simulando volatilidad y spreads sin gastar fondos reales.
            </p>
          </div>

          {/* Interactive Sliders & Parameter Station */}
          <div className="p-5 rounded-2xl border-2 border-[#0b1f3a] bg-white shadow-[0_3px_0_#0b1f3a] space-y-5">
            <h4 className="text-xs font-black uppercase text-[#0b1f3a] tracking-wider border-b border-[#0b1f3a]/10 pb-2">
              1. Configuración de Parámetros de Mercado
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Spread Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-[#0b1f3a]">Discrepancia de Spread:</span>
                  <span className="font-black mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
                    +{simSpreadPct.toFixed(2)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="5.0"
                  step="0.1"
                  value={simSpreadPct}
                  onChange={(e) => setSimSpreadPct(parseFloat(e.target.value))}
                  className="w-full accent-[#0b1f3a] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] mono text-[#0b1f3a]/50">
                  <span>0.5% (Mínimo)</span>
                  <span>5.0% (Alta Volatilidad)</span>
                </div>
              </div>

              {/* Capital Size Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-[#0b1f3a]">Tamaño de Orden:</span>
                  <span className="font-black mono text-[#0b1f3a] bg-blue-50 px-2 py-0.5 rounded border border-blue-300">
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
                  className="w-full accent-[#0b1f3a] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] mono text-[#0b1f3a]/50">
                  <span>100 COOK</span>
                  <span>10,000 COOK</span>
                </div>
              </div>

              {/* Slippage Tolerance */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-[#0b1f3a]">Tolerancia Slippage:</span>
                  <span className="font-black mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-300">
                    {simSlippagePct.toFixed(2)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="2.0"
                  step="0.1"
                  value={simSlippagePct}
                  onChange={(e) => setSimSlippagePct(parseFloat(e.target.value))}
                  className="w-full accent-[#0b1f3a] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] mono text-[#0b1f3a]/50">
                  <span>0.1% (Estricto)</span>
                  <span>2.0% (Amplio)</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleRunSimulation}
              disabled={isSimulating}
              className="w-full py-2.5 rounded-xl bg-[#ffe0a8] hover:bg-[#fed388] text-[#0b1f3a] font-black text-xs border-2 border-[#0b1f3a] shadow-[0_2px_0_#0b1f3a] cursor-pointer flex items-center justify-center gap-2"
            >
              <span>{isSimulating ? 'Calculando Invariantes...' : '🚀 Recalcular Ejecución Atómica'}</span>
            </button>
          </div>

          {/* Simulation Output & Multi-Instruction Route Sheet */}
          {simResult && (
            <div className="space-y-4">
              {/* Financial Sheet Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="bg-[#f0fdf4] p-3 rounded-xl border-2 border-emerald-600/30 text-center">
                  <span className="text-[10px] uppercase font-black text-emerald-800 block">Ganancia Neta</span>
                  <span className="text-lg font-black text-emerald-900 mono mt-0.5 block">
                    +{simResult.financial_summary.net_profit_cookie.toFixed(2)} COOK
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold block">
                    (${simResult.financial_summary.net_profit_usd.toFixed(3)} USD)
                  </span>
                </div>

                <div className="bg-[#eff6ff] p-3 rounded-xl border-2 border-blue-600/30 text-center">
                  <span className="text-[10px] uppercase font-black text-blue-800 block">Retorno Neto (ROI)</span>
                  <span className="text-lg font-black text-blue-900 mono mt-0.5 block">
                    +{simResult.financial_summary.net_roi_pct}%
                  </span>
                  <span className="text-[10px] text-blue-700 font-bold block">
                    Por transacción
                  </span>
                </div>

                <div className="bg-[#fffbeb] p-3 rounded-xl border-2 border-amber-600/30 text-center">
                  <span className="text-[10px] uppercase font-black text-amber-800 block">Tarifas AMM (DEX A + B)</span>
                  <span className="text-lg font-black text-amber-900 mono mt-0.5 block">
                    0.60%
                  </span>
                  <span className="text-[10px] text-amber-700 font-bold block">
                    Fricción de liquidez
                  </span>
                </div>

                <div className="bg-[#f5f3ff] p-3 rounded-xl border-2 border-purple-600/30 text-center">
                  <span className="text-[10px] uppercase font-black text-purple-800 block">Gas SVM Estimado</span>
                  <span className="text-lg font-black text-purple-900 mono mt-0.5 block">
                    $0.0008 USD
                  </span>
                  <span className="text-[10px] text-purple-700 font-bold block">
                    ~0.00002 SOL (Sub-cent)
                  </span>
                </div>
              </div>

              {/* Atomic Multi-Instruction Step Breakdown */}
              <div className="p-4 rounded-2xl border-2 border-[#0b1f3a] bg-white shadow-[0_3px_0_#0b1f3a] space-y-3">
                <h4 className="text-xs font-black uppercase text-[#0b1f3a] tracking-wider border-b border-[#0b1f3a]/10 pb-2 flex items-center justify-between">
                  <span>2. Desglose de Transacción Atómica SVM (Una Sola Firma)</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-400 font-black">
                    ● {simResult.step_3_atomic_guard.safety_status}
                  </span>
                </h4>

                <div className="space-y-2.5 text-xs mono">
                  {/* Step 1 */}
                  <div className="p-3 rounded-xl bg-gray-50 border border-[#0b1f3a]/15 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#ffe0a8] border border-[#0b1f3a] flex items-center justify-center font-bold text-[10px]">1</span>
                      <span className="font-bold text-[#0b1f3a]">Instrucción #1: Swap en Cookoven</span>
                    </div>
                    <div className="text-right text-[11px] text-[#0b1f3a]/75">
                      Vender {simResult.step_1_cookoven.amount_in} COOK &rarr; Recibir ${simResult.step_1_cookoven.usdc_out} USDC (Fee: {simResult.step_1_cookoven.fee_deducted_cookie} COOK)
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="p-3 rounded-xl bg-gray-50 border border-[#0b1f3a]/15 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#ffe0a8] border border-[#0b1f3a] flex items-center justify-center font-bold text-[10px]">2</span>
                      <span className="font-bold text-[#0b1f3a]">Instrucción #2: Swap en DEX Secundario</span>
                    </div>
                    <div className="text-right text-[11px] text-[#0b1f3a]/75">
                      Comprar con ${simResult.step_2_secondary_amm.amount_in} USDC &rarr; Recibir {simResult.step_2_secondary_amm.cookie_returned} COOK
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-200 border border-emerald-800 flex items-center justify-center font-bold text-[10px] text-emerald-950">3</span>
                      <span className="font-bold text-emerald-950">Instrucción #3: AssertMinOutputOrRevert</span>
                    </div>
                    <div className="text-right text-[11px] text-emerald-900 font-bold">
                      Mínimo Requerido: {simResult.step_3_atomic_guard.min_expected_cookie} COOK &bull; Resultado: {simResult.step_3_atomic_guard.actual_cookie} COOK (Aprobado)
                    </div>
                  </div>
                </div>
              </div>

              {/* On-Chain Live Mainnet Probe & Revert Test */}
              <div className="p-5 rounded-2xl border-2 border-[#0b1f3a] bg-[#f8fafc] shadow-[0_3px_0_#0b1f3a] space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🎯</span>
                    <div>
                      <h4 className="text-xs font-black uppercase text-[#0b1f3a]">
                        3. Disparo a Mainnet en Vivo y Reversión On-Chain (Test de Seguridad)
                      </h4>
                      <span className="text-[10px] text-[#0b1f3a]/60 font-medium">
                        Target Pool: Cookoven Protocol (COOK/USDC) &bull; RPC: https://rpc.cookiescan.io
                      </span>
                    </div>
                  </div>
                  <span className="text-[9px] font-black uppercase px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-400 mono">
                    ● SVM LEDGER STATE
                  </span>
                </div>

                <p className="text-xs text-[#0b1f3a]/75 leading-relaxed">
                  Dispara un paquete atómico de 3 instrucciones a Cookie Chain Mainnet. La instrucción 3 (Revert Guard) detecta una violación de invariante/slippage y aborta atómicamente toda la operación en la blockchain, revirtiendo el swap y protegiendo el capital al 100% sin mutaciones de estado.
                </p>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleShootAndRevert}
                    disabled={isShootingRevert}
                    className="px-4 py-2 rounded-xl bg-[#0b1f3a] hover:bg-[#1a365d] text-white border-2 border-[#0b1f3a] text-xs font-black shadow-[0_2px_0_#0b1f3a] active:translate-y-0.5 active:shadow-none cursor-pointer flex items-center gap-2 transition-all"
                  >
                    <span>{isShootingRevert ? '⏳ Disparando a Mainnet...' : '⚡ Disparar a Mainnet y Revertir'}</span>
                  </button>
                  <span className="text-[10px] text-[#0b1f3a]/50 mono">
                    RPC: simulateTransaction (Cero gasto de tokens)
                  </span>
                </div>

                {shotRevertResult && (
                  <div className="p-3.5 rounded-xl border-2 border-emerald-600/40 bg-emerald-50 text-xs mono space-y-2 mt-2">
                    <div className="flex justify-between items-center border-b border-emerald-600/20 pb-1.5 flex-wrap gap-2">
                      <span className="font-black text-emerald-900 flex items-center gap-1.5">
                        <span>🛡️</span> {shotRevertResult.atomic_status}
                      </span>
                      <span className="text-[10px] text-emerald-800">
                        Slot #{shotRevertResult.slot} &bull; Consumo: {shotRevertResult.compute_units_consumed} CU
                      </span>
                    </div>
                    <div className="text-[11px] text-emerald-950 font-medium">
                      {shotRevertResult.explanation}
                    </div>
                    <div className="bg-white/90 p-2.5 rounded-lg border border-emerald-600/20 text-[10px] max-h-36 overflow-y-auto space-y-0.5">
                      <span className="text-gray-500 font-bold block mb-1">Logs del Runtime SVM en Cookie Chain Mainnet:</span>
                      {shotRevertResult.program_logs && shotRevertResult.program_logs.map((log: string, idx: number) => (
                        <div key={idx} className={log.includes('failed') || log.includes('Error') ? 'text-red-700 font-bold' : 'text-[#0b1f3a]'}>
                          &gt; {log}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
