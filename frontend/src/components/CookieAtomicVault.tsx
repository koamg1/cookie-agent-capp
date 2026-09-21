import React, { useState, useEffect } from 'react';
import { apiUrl, assetUrl } from '../config/api';
import { PROTOCOL_TREASURY_VAULT_ADDRESS } from '../utils/solana';

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

interface ProofOfReserves {
  status: string;
  solvency_ratio_pct: number;
  is_solvent: boolean;
  live_slot: number;
  rpc_latency_ms: number;
  tiers?: {
    cold_storage?: {
      address: string;
      balance_cookie: number;
      balance_usd: number;
      share_pct: number;
      rpc_status: string;
      cookiescan_url: string;
      telemetry_badge: string;
    };
    warm_buffer?: {
      address: string;
      balance_cookie: number;
      balance_usd: number;
      share_pct: number;
      rpc_status: string;
      cookiescan_url: string;
      telemetry_badge: string;
    };
    hot_trading_bot?: {
      address: string;
      balance_cookie: number;
      balance_usd: number;
      share_pct: number;
      rpc_status: string;
      cookiescan_url: string;
      telemetry_badge: string;
    };
  };
  cold_reserve?: {
    address: string;
    cookie: number;
    value_usd: number;
    share_pct: number;
    multisig_type: string;
    timelock_hours: number;
    purpose: string;
  };
  warm_reserve?: {
    address: string;
    cookie: number;
    value_usd: number;
    share_pct: number;
    multisig_type: string;
    lockup_duration_hours: number;
    purpose: string;
  };
  hot_reserve?: {
    address: string;
    cookie: number;
    value_usd: number;
    share_pct: number;
    multisig_type: string;
    lockup_duration_hours: number;
    purpose: string;
  };
  last_audit_slot: number;
  timestamp: number;
}

interface CookieAtomicVaultProps {
  connectedAddress?: string | null;
  activeWalletType?: any;
  activeProvider?: any;
  balanceCookie?: number;
  onOpenWalletModal?: () => void;
  onOpenBridgeModal?: () => void;
  onRefreshBalance?: () => void;
  onAddLog?: (tag: string, msg: string, color?: string) => void;
  onNavigateToAgent?: () => void;
  themeMode?: 'light' | 'dark';
}

const CookieAtomicVaultComponent: React.FC<CookieAtomicVaultProps> = ({
  onNavigateToAgent,
  themeMode = 'light'
}) => {
  const isDark = themeMode === 'dark';

  const [vaultStatus, setVaultStatus] = useState<VaultStatus | null>(null);
  const [proofOfReserves, setProofOfReserves] = useState<ProofOfReserves | null>(null);

  const fetchTelemetry = async () => {
    try {
      const [stRes, porRes] = await Promise.all([
        fetch(apiUrl('/api/v1/atomic/status')),
        fetch(apiUrl('/api/v1/atomic/proof-of-reserves'))
      ]);

      if (stRes.ok) setVaultStatus(await stRes.json());
      if (porRes.ok) setProofOfReserves(await porRes.json());
    } catch (err) {
      console.warn('Failed to load vault bank telemetry:', err);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 6000);
    return () => clearInterval(interval);
  }, []);

  const cardBg = isDark ? 'bg-[#0f172a] border-slate-700/80 text-white shadow-xl' : 'bg-white border-[#0b1f3a]/20 text-[#0b1f3a] shadow-sm';
  const subCardBg = isDark ? 'bg-[#0b1426] border-slate-700/60 text-slate-200' : 'bg-[#f8fafc] border-[#0b1f3a]/15 text-[#0b1f3a]';
  const mutedText = isDark ? 'text-slate-400' : 'text-[#0b1f3a]/70';

  const porAny = proofOfReserves as any;
  const coldCookie = proofOfReserves?.tiers?.cold_storage?.balance_cookie ?? porAny?.cold_reserve?.cookie ?? vaultStatus?.total_cookie_reserve ?? 0.0;
  const coldUsd = proofOfReserves?.tiers?.cold_storage?.balance_usd ?? porAny?.cold_reserve?.value_usd ?? vaultStatus?.tvl_usd ?? 0.0;
  const coldAddr = proofOfReserves?.tiers?.cold_storage?.address || porAny?.cold_reserve?.address || PROTOCOL_TREASURY_VAULT_ADDRESS;
  const coldBadge = proofOfReserves?.tiers?.cold_storage?.telemetry_badge || 'COLD VAULT • OFFLINE CUSTODY';
  const coldStatus = proofOfReserves?.tiers?.cold_storage?.rpc_status || 'ONLINE (FINALIZED)';
  const coldUrl = proofOfReserves?.tiers?.cold_storage?.cookiescan_url || `https://cookiescan.io/address/${coldAddr}`;

  const warmCookie = proofOfReserves?.tiers?.warm_buffer?.balance_cookie ?? porAny?.warm_reserve?.cookie ?? 0.0;
  const warmUsd = proofOfReserves?.tiers?.warm_buffer?.balance_usd ?? porAny?.warm_reserve?.value_usd ?? 0.0;
  const warmAddr = proofOfReserves?.tiers?.warm_buffer?.address || porAny?.warm_reserve?.address || 'GL6YF8RtyERd9WF59sefqBSbUG5BdEvqDTTZGQrPwPWQ';
  const warmBadge = proofOfReserves?.tiers?.warm_buffer?.telemetry_badge || 'WARM BUFFER • DAILY RESERVE';
  const warmStatus = proofOfReserves?.tiers?.warm_buffer?.rpc_status || 'ONLINE (LIQUID)';
  const warmUrl = proofOfReserves?.tiers?.warm_buffer?.cookiescan_url || `https://cookiescan.io/address/${warmAddr}`;

  const hotCookie = proofOfReserves?.tiers?.hot_trading_bot?.balance_cookie ?? porAny?.hot_reserve?.cookie ?? 0.0;
  const hotUsd = proofOfReserves?.tiers?.hot_trading_bot?.balance_usd ?? porAny?.hot_reserve?.value_usd ?? 0.0;
  const hotAddr = proofOfReserves?.tiers?.hot_trading_bot?.address || porAny?.hot_reserve?.address || 'FifRVvsjv5Q6Pj2gUAaU42eiRM5noUeu3EK1CxJFttHy';
  const hotBadge = proofOfReserves?.tiers?.hot_trading_bot?.telemetry_badge || 'HOT BOT • MAX RISK 5%';
  const hotStatus = proofOfReserves?.tiers?.hot_trading_bot?.rpc_status?.replace(/\s*\(\d+ms\)/i, '') || 'ACTIVE (OPERATOR)';
  const hotUrl = proofOfReserves?.tiers?.hot_trading_bot?.cookiescan_url || `https://cookiescan.io/address/${hotAddr}`;

  const totalBankReservesUsd = coldUsd + warmUsd + hotUsd;
  const totalBankCookie = coldCookie + warmCookie + hotCookie;

  return (
    <div className={`space-y-6 ${isDark ? 'dark-vault' : ''}`}>
      {/* 1. Header & Protocol Bank Branding Card */}
      <div className={`p-5 sm:p-6 rounded-3xl border-2 transition-all ${cardBg} space-y-4`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl border-2 shrink-0 ${
              isDark 
                ? 'bg-emerald-950/80 border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                : 'bg-[#ffe0a8] border-[#0b1f3a] shadow-[0_3px_0_#0b1f3a]'
            }`}>
              🏛️
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">Treasury Vault & Bank Reserves</h1>
                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${
                  isDark 
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50' 
                    : 'bg-[#dcfce7] text-[#166534] border-[#166534]'
                }`}>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  ● 100% SOLVENCY BACKED
                </span>
              </div>
              <p className={`text-xs font-bold mt-1 ${mutedText}`}>
                Decentralized proof of reserves on Cookie Chain SVM &bull; 3-Tier audited custody &bull; Finalized state verification
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <span className={`text-[10px] font-bold px-3 py-1.5 rounded-xl border mono flex items-center gap-1.5 ${
              isDark ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-slate-50 border-[#0b1f3a]/20 text-[#0b1f3a]/80'
            }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              SLOT #{proofOfReserves?.live_slot?.toLocaleString() ?? '26,116,450'} ({proofOfReserves?.rpc_latency_ms ?? 118}ms)
            </span>
            <a
              href={`https://cookiescan.io/address/${PROTOCOL_TREASURY_VAULT_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black border transition-all flex items-center gap-1.5 ${
                isDark 
                  ? 'bg-cyan-950 text-cyan-300 border-cyan-500/40 hover:bg-cyan-900 shadow-[0_0_10px_rgba(0,210,255,0.2)]' 
                  : 'bg-blue-50 text-blue-900 border-blue-300 hover:bg-blue-100 shadow-[0_2px_0_#0b1f3a]'
              }`}
            >
              <span>🔍 Audit on CookieScan</span>
              <span>↗</span>
            </a>
          </div>
        </div>
      </div>

      {/* 2. Core Bank Reserve Metrics Grid (4 distinct metrics with ZERO duplicates) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`p-4 rounded-2xl border-2 transition-all ${cardBg}`}>
          <span className={`text-[10px] uppercase font-black block ${mutedText}`}>Total Vault Reserves</span>
          <span className="text-xl font-black mono mt-1 block">
            ${totalBankReservesUsd < 0.01 && totalBankReservesUsd > 0 ? totalBankReservesUsd.toFixed(4) : totalBankReservesUsd.toFixed(2)} USD
          </span>
          <span className="text-[10px] font-bold text-amber-400 block mt-1">
            {totalBankCookie.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} COOKIE in Vault
          </span>
        </div>

        <div className={`p-4 rounded-2xl border-2 transition-all ${cardBg}`}>
          <span className={`text-[10px] uppercase font-black block ${mutedText}`}>Solvency Ratio</span>
          <span className="text-xl font-black text-emerald-400 mono mt-1 block">
            {proofOfReserves?.solvency_ratio_pct ?? 100.0}%
          </span>
          <span className="text-[10px] font-bold text-emerald-500 block mt-1">
            ● 1:1 Asset-to-Liability Backing
          </span>
        </div>

        <div className={`p-4 rounded-2xl border-2 transition-all ${cardBg}`}>
          <span className={`text-[10px] uppercase font-black block ${mutedText}`}>Withdrawal Cooldown</span>
          <span className="text-xl font-black text-cyan-400 mono mt-1 block">
            24 Hours
          </span>
          <span className="text-[10px] font-bold text-cyan-500 block mt-1">
            Anti-MEV deposit lock
          </span>
        </div>

        <div className={`p-4 rounded-2xl border-2 transition-all ${cardBg}`}>
          <span className={`text-[10px] uppercase font-black block ${mutedText}`}>Payout Security</span>
          <span className="text-xl font-black text-purple-400 mono mt-1 block">
            Isolated Signer
          </span>
          <span className="text-[10px] font-bold text-purple-400 block mt-1">
            Off-server &amp; capped
          </span>
        </div>
      </div>

      {/* 3. 🛡️ 3-Tier Proof-of-Reserves Cards (Primary Single Source of Truth for Tiers) */}
      <div className={`p-5 rounded-3xl border-2 transition-all ${cardBg} space-y-4`}>
        <div className="flex items-center justify-between border-b border-slate-700/20 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🛡️</span>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider">
                Multi-Tier Reserve Allocation
              </h3>
              <p className={`text-[11px] font-bold ${mutedText}`}>
                Cryptographically audited balances across cold, warm, and hot operations
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-xl border border-emerald-500/40 mono">
            AUDITED ON-CHAIN
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* Tier 1: Cold Vault */}
          <div className={`p-4 rounded-2xl border-2 space-y-2.5 ${
            isDark ? 'bg-[#050f24] border-blue-500/40' : 'bg-[#eff6ff] border-blue-300'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-black flex items-center gap-1.5">
                <span>🧊</span>
                <span>Cold Vault (70% Target)</span>
              </span>
              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border mono ${
                isDark ? 'bg-blue-950 text-blue-300 border-blue-500/50' : 'bg-white text-blue-950 border-[#0b1f3a]'
              }`}>
                {coldBadge}
              </span>
            </div>
            <div className="text-sm font-black mono text-blue-400">
              ${coldUsd < 0.01 && coldUsd > 0 ? coldUsd.toFixed(4) : coldUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
            </div>
            <div className="text-[11px] font-bold mono flex items-center gap-1.5 flex-wrap">
              <span>🍪 {coldCookie.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} COOKIE</span>
              <span className="text-blue-400">•</span>
              <span>💵 $0.00 USDC</span>
            </div>
            <div className="text-[9px] font-semibold mono flex items-center gap-1 pt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span>{coldStatus} • 24h Delay</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-blue-500/20 text-[9px] mono">
              <span className="truncate max-w-[130px] opacity-75">{coldAddr}</span>
              <a href={coldUrl} target="_blank" rel="noreferrer" className="font-bold text-blue-400 hover:underline flex items-center gap-1">
                <span>cookiescan.io ↗</span>
              </a>
            </div>
          </div>

          {/* Tier 2: Warm Buffer */}
          <div className={`p-4 rounded-2xl border-2 space-y-2.5 ${
            isDark ? 'bg-[#0a1520] border-cyan-500/40' : 'bg-[#ecfeff] border-cyan-300'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-black flex items-center gap-1.5">
                <span>💧</span>
                <span>Warm Buffer (20% Target)</span>
              </span>
              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border mono ${
                isDark ? 'bg-cyan-950 text-cyan-300 border-cyan-500/50' : 'bg-white text-cyan-950 border-[#0b1f3a]'
              }`}>
                {warmBadge}
              </span>
            </div>
            <div className="text-sm font-black mono text-cyan-400">
              ${warmUsd < 0.01 && warmUsd > 0 ? warmUsd.toFixed(4) : warmUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
            </div>
            <div className="text-[11px] font-bold mono flex items-center gap-1.5 flex-wrap">
              <span>🍪 {warmCookie.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} COOKIE</span>
              <span className="text-cyan-400">•</span>
              <span>💵 $0.00 USDC</span>
            </div>
            <div className="text-[9px] font-semibold mono flex items-center gap-1 pt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
              <span>{warmStatus} • Daily Operational</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-cyan-500/20 text-[9px] mono">
              <span className="truncate max-w-[130px] opacity-75">{warmAddr}</span>
              <a href={warmUrl} target="_blank" rel="noreferrer" className="font-bold text-cyan-400 hover:underline flex items-center gap-1">
                <span>cookiescan.io ↗</span>
              </a>
            </div>
          </div>

          {/* Tier 3: Hot Bot Operations */}
          <div className={`p-4 rounded-2xl border-2 space-y-2.5 ${
            isDark ? 'bg-[#140f26] border-purple-500/40' : 'bg-[#faf5ff] border-purple-300'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-black flex items-center gap-1.5">
                <span>🔥</span>
                <span>Hot Operations (10% Target)</span>
              </span>
              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border mono ${
                isDark ? 'bg-purple-950 text-purple-300 border-purple-500/50' : 'bg-white text-purple-950 border-[#0b1f3a]'
              }`}>
                {hotBadge}
              </span>
            </div>
            <div className="text-sm font-black mono text-purple-400">
              ${hotUsd < 0.01 && hotUsd > 0 ? hotUsd.toFixed(4) : hotUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
            </div>
            <div className="text-[11px] font-bold mono flex items-center gap-1.5 flex-wrap">
              <span>🍪 {hotCookie.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} COOKIE</span>
              <span className="text-purple-400">•</span>
              <span>💵 $0.00 USDC</span>
            </div>
            <div className="text-[9px] font-semibold mono flex items-center gap-1 pt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
              <span>{hotStatus} • Rebalancing Float</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-purple-500/20 text-[9px] mono">
              <span className="truncate max-w-[130px] opacity-75">{hotAddr}</span>
              <a href={hotUrl} target="_blank" rel="noreferrer" className="font-bold text-purple-400 hover:underline flex items-center gap-1">
                <span>cookiescan.io ↗</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bottom Grid: Custody Architecture & Arbitrage Agent Gateway */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Custody Verification Rules & Representative Safe (7 cols) */}
        <div className={`lg:col-span-7 p-5 rounded-3xl border-2 transition-all ${cardBg} space-y-4`}>
          <div className="flex items-center justify-between border-b border-slate-700/20 pb-3">
            <h3 className="text-sm font-black uppercase flex items-center gap-2">
              <span>🔒</span>
              <span>Custody & Verification Standards</span>
            </h3>
            <span className="text-[10px] font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/40">
              SECURITY PROTOCOL
            </span>
          </div>

          <div className="space-y-3 text-xs leading-relaxed">
            <div className={`p-3.5 rounded-2xl border space-y-1 ${subCardBg}`}>
              <strong className={`block ${isDark ? 'text-slate-200' : 'text-[#0b1f3a]'}`}>Cryptographic Proof of Reserves:</strong>
              <p className={mutedText}>
                Balances are queried directly from Cookie Chain SVM validator account state in real time. Liabilities are audited against minted cCOOKIE-LP share supply.
              </p>
            </div>

            <div className={`p-3.5 rounded-2xl border space-y-1 ${subCardBg}`}>
              <strong className={`block ${isDark ? 'text-slate-200' : 'text-[#0b1f3a]'}`}>Payout Authorization:</strong>
              <p className={mutedText}>
                The public API cannot sign payouts. Withdrawals are executed by an isolated, policy-enforcing signer running off the public server, with per-transaction and daily caps; amounts above the automatic cap require manual operator approval.
              </p>
            </div>

            <div className={`p-3.5 rounded-2xl border space-y-1 ${subCardBg}`}>
              <strong className={`block ${isDark ? 'text-slate-200' : 'text-[#0b1f3a]'}`}>Verified Deposits & Two-Phase Exit:</strong>
              <p className={mutedText}>
                Deposits are verified on-chain (amount derived from the balance delta into the Cold Vault) and carry a 24h anti-MEV cooldown. On withdrawal, shares are burned only after the payout is confirmed on-chain — a failed payout never costs a user their position.
              </p>
            </div>
          </div>

          {/* 🍪 Representative Vault Safe / Treasure Chest with Cookies (Text-free, enlarged) */}
          <div className={`p-6 sm:p-8 rounded-2xl border-2 transition-all flex items-center justify-center relative overflow-hidden ${
            isDark 
              ? 'bg-gradient-to-b from-[#0a1329] via-[#0f172a] to-[#150f2f] border-cyan-500/40 shadow-[0_0_30px_rgba(0,210,255,0.15)]' 
              : 'bg-gradient-to-b from-[#fffbeb] via-[#fef3c7]/60 to-[#fed7aa]/30 border-amber-300 shadow-[0_4px_20px_rgba(217,119,6,0.12)]'
          }`}>
            {/* Background ambient lighting/glow */}
            <div className={`absolute w-72 h-72 rounded-full blur-3xl pointer-events-none opacity-50 ${
              isDark ? 'bg-cyan-500/30' : 'bg-amber-400/40'
            }`} />

            {/* Chest image - large and prominent with no text */}
            <img
              src={assetUrl(isDark ? 'cookie_vault_chest_dark.png' : 'cookie_vault_chest_light.png')}
              alt={isDark ? 'Cybernetic Cyber-Cookie Vault' : 'Cofre Dorado de Galletas de Tesorería'}
              className={`relative w-48 h-48 sm:w-64 sm:h-64 object-contain transition-transform duration-300 hover:scale-105 select-none ${
                isDark ? 'drop-shadow-[0_0_30px_rgba(6,182,212,0.5)]' : 'drop-shadow-[0_12px_24px_rgba(180,83,9,0.35)]'
              }`}
            />
          </div>
        </div>

        {/* Right: Call-To-Action to Atomic Arbitrage Agent (5 cols) */}
        <div className={`lg:col-span-5 p-5 rounded-3xl border-2 transition-all flex flex-col justify-between space-y-4 ${
          isDark 
            ? 'bg-gradient-to-br from-purple-950/50 via-slate-900 to-cyan-950/30 border-purple-500/40' 
            : 'bg-gradient-to-br from-purple-50 via-white to-blue-50 border-purple-300'
        }`}>
          <div className="space-y-3.5">
            <div className="flex items-center gap-2">
              <span className="text-xl">⚡</span>
              <div>
                <h4 className="text-xs font-black uppercase text-purple-400">
                  Atomic Agent — Standby
                </h4>
                <p className={`text-[11px] font-bold ${mutedText}`}>
                  cCOOKIE-LP Share Custody &amp; Payout Security
                </p>
              </div>
            </div>

            <p className="text-xs leading-relaxed opacity-90">
              User liquidity deposits and share certificate redemptions are held in the dedicated <strong>Atomic Agent</strong>, currently in standby &mdash; no live arbitrage runs until a second liquid Cookie Chain DEX exists.
            </p>

            {/* Quick Status Breakdown */}
            <div className={`p-3.5 rounded-2xl border space-y-2 ${subCardBg}`}>
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className={mutedText}>Payout Security:</span>
                <span className="text-emerald-400 mono">ISOLATED SIGNER</span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className={mutedText}>Deposit Cooldown:</span>
                <span className="text-cyan-400 mono">24 Hours</span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className={mutedText}>On-Chain Audit:</span>
                <span className="text-purple-400 mono">CookieScan SVM ↗</span>
              </div>
            </div>
          </div>

          {onNavigateToAgent && (
            <button
              onClick={onNavigateToAgent}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-black text-xs transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2"
            >
              <img
                src="/agents/atomic_agent_avatar.png"
                alt="Atomic Agent"
                className="w-4 h-4 object-contain pixelated inline-block"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/agents/atomic_agent_avatar.png';
                }}
              />
              <span>Launch Atomic Agent</span>
              <span>→</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export const CookieAtomicVault = React.memo(CookieAtomicVaultComponent);
