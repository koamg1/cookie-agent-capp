import React from 'react';
import { WalletType } from '../types/wallet';
import { assetUrl } from '../config/api';

interface TopBarProps {
  onOpenMobileSidebar: () => void;
  connectedAddress: string | null;
  activeWalletType: WalletType | null;
  onOpenWalletModal: () => void;
  onDisconnect: () => void;
  onOpenBridgeModal?: () => void;
  onOpenAirdropModal?: () => void;
  onOpenDocsModal?: () => void;
  themeMode?: 'light' | 'dark';
  onToggleTheme?: () => void;
  onSetTheme?: (mode: 'light' | 'dark') => void;
  balanceCookie?: number;
}

const TopBarComponent: React.FC<TopBarProps> = ({
  onOpenMobileSidebar,
  connectedAddress,
  activeWalletType,
  onOpenWalletModal,
  onDisconnect,
  onOpenBridgeModal,
  onOpenAirdropModal,
  onOpenDocsModal,
  themeMode = 'light',
  onToggleTheme,
  onSetTheme,
  balanceCookie = 0
}) => {
  const isDark = themeMode === 'dark';

  const shortAddr = connectedAddress 
    ? `${connectedAddress.slice(0, 4)}...${connectedAddress.slice(-4)}`
    : null;

  return (
    <header className={`sticky top-0 z-20 border-b select-none ${
      isDark 
        ? 'bg-[#050914]/95 border-slate-800/80 text-slate-200 shadow-md' 
        : 'bg-white/95 border-[#0b1f3a]/15 text-[#0b1f3a] shadow-sm'
    }`}>
      <div className="px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        
        {/* Left: Mobile Toggle & Quick Search / Telemetry Ticker (Jupiter style) */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile Cyber Cookie Menu Toggle */}
          <button
            onClick={onOpenMobileSidebar}
            type="button"
            className={`md:hidden flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl border-2 cursor-pointer shrink-0 transition-all active:scale-95 ${
              isDark 
                ? 'bg-[#0f172a] border-cyan-500/50 text-cyan-300 shadow-[0_0_10px_rgba(0,210,255,0.3)]' 
                : 'bg-white border-[#0b1f3a] text-[#0b1f3a] shadow-[0_2px_0_#0b1f3a]'
            }`}
            aria-label="Open menu"
            title="Open navigation menu"
          >
            <img
              src={assetUrl('/agents/cyber_cookie_bitten.png')}
              alt="Cyber Cookie"
              className="w-5 h-5 object-contain pixelated"
            />
            <span className="text-xs font-black">Menu</span>
          </button>

          {/* Jupiter-Style Live Telemetry & Price Ticker */}
          <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar py-0.5">
            {/* Network Slot Ticker */}
            <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold shrink-0 border ${
              isDark 
                ? 'bg-[#0b1328] border-slate-800 text-slate-300 mono' 
                : 'bg-slate-100 border-[#0b1f3a]/20 text-[#0b1f3a]'
            }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Cookie Chain SVM</span>
              <span className="text-[10px] text-slate-400 font-normal">
                Live
              </span>
            </div>

            {/* Bridge Shortcut */}
            {onOpenBridgeModal && (
              <button
                onClick={onOpenBridgeModal}
                className={`hidden lg:inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 border ${
                  isDark
                    ? 'bg-slate-900 hover:bg-slate-800 text-amber-300 border-amber-500/30'
                    : 'bg-[#fffbeb] hover:bg-[#fef3c7] text-[#854d0e] border-[#0b1f3a]/20'
                }`}
              >
                <span>🚰</span>
                <span>Bridge</span>
              </button>
            )}
          </div>
        </div>

        {/* Right: Theme Mode Switcher + Connect Wallet */}
        <div className="flex items-center space-x-2 shrink-0">
          
          {/* Karma Quick Badge / Modal Trigger */}
          {onOpenAirdropModal && (
            <button
              onClick={onOpenAirdropModal}
              className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 border ${
                isDark
                  ? 'bg-[#101b33] border-purple-500/40 text-purple-300 hover:bg-purple-950/50 shadow-[0_0_10px_rgba(168,85,247,0.2)]'
                  : 'bg-[#f3e8ff] border-[#0b1f3a] text-[#6b21a8] shadow-[0_1px_0_#0b1f3a]'
              }`}
              title="Baker Karma & Ranking On-Chain"
            >
              <span>⭐</span>
              <span className="hidden md:inline">Karma</span>
            </button>
          )}

          {/* Docs & Roadmap Guide Button */}
          {onOpenDocsModal && (
            <button
              onClick={onOpenDocsModal}
              className={`hidden md:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 border ${
                isDark
                  ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/60 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                  : 'bg-white border-[#0b1f3a] text-[#0b1f3a] hover:bg-[#ffe0a8] shadow-[0_1px_0_#0b1f3a]'
              }`}
              title="Documentation & Project Roadmap"
            >
              <span>📖</span>
              <span>Docs</span>
            </button>
          )}

          {/* Clear Segmented Theme Selector (☀️ Sol / 🌙 Noche) */}
          {(onToggleTheme || onSetTheme) && (
            <div 
              className={`flex items-center p-0.5 rounded-xl border-2 transition-all select-none ${
                isDark 
                  ? 'bg-[#080d1a] border-cyan-500/40 shadow-[0_0_10px_rgba(0,210,255,0.25)]' 
                  : 'bg-slate-100 border-[#0b1f3a] shadow-[0_2px_0_#0b1f3a]'
              }`}
              title={isDark ? "Modo actual: Noche (Centinela 3D). Clic en Sol para Come Galletas." : "Modo actual: Sol (Come Galletas). Clic en Noche para Centinela 3D."}
            >
              <button
                type="button"
                onClick={() => onSetTheme ? onSetTheme('light') : (!isDark ? null : onToggleTheme?.())}
                aria-label="Modo Sol (Día) - Come Galletas"
                className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  !isDark
                    ? 'bg-amber-300 text-[#0b1f3a] border-2 border-[#0b1f3a] shadow-[0_1px_0_#0b1f3a]'
                    : 'text-slate-400 hover:text-amber-300 opacity-60 hover:opacity-100'
                }`}
              >
                <span>☀️</span>
                <span className="hidden sm:inline">Sol</span>
              </button>
              <button
                type="button"
                onClick={() => onSetTheme ? onSetTheme('dark') : (isDark ? null : onToggleTheme?.())}
                aria-label="Modo Noche (Oscuro) - Centinela 3D"
                className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  isDark
                    ? 'bg-cyan-500 text-[#050914] border border-cyan-300 shadow-[0_0_10px_rgba(0,210,255,0.6)] font-extrabold'
                    : 'text-[#0b1f3a]/60 hover:text-[#0b1f3a] opacity-60 hover:opacity-100'
                }`}
              >
                <span>🌙</span>
                <span className="hidden sm:inline">Noche</span>
              </button>
            </div>
          )}

          {/* Wallet Connect Button & Sibling Disconnect Button */}
          {connectedAddress ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={onOpenWalletModal}
                type="button"
                className={`px-2.5 sm:px-3 py-1.5 font-extrabold text-xs sm:text-sm rounded-xl flex items-center gap-1.5 cursor-pointer shrink-0 transition-all ${
                  isDark
                    ? 'bg-emerald-950/80 hover:bg-emerald-900 border-2 border-emerald-500 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.35)]'
                    : 'bg-[#86efac] hover:bg-[#4ade80] text-[#0b1f3a] border-2 border-[#0b1f3a] shadow-[0_2px_0_#0b1f3a]'
                }`}
                title="Wallet details"
              >
                <span>👛</span>
                <span className="mono">{shortAddr}</span>
                {balanceCookie > 0 && (
                  <span className={`hidden md:inline text-[10px] font-black px-1.5 py-0.2 rounded border mono ${
                    isDark ? 'bg-emerald-900/60 border-emerald-600 text-emerald-200' : 'bg-white/80 border-[#0b1f3a]/30 text-[#0b1f3a]'
                  }`}>
                    {balanceCookie.toFixed(2)} $COOKIE
                  </span>
                )}
              </button>
              <button
                onClick={onDisconnect}
                type="button"
                className={`w-8 h-8 rounded-xl border-2 font-black text-xs flex items-center justify-center cursor-pointer transition-all shrink-0 active:scale-95 ${
                  isDark
                    ? 'bg-red-950/70 border-red-500/70 text-red-300 hover:bg-red-900'
                    : 'bg-[#fee2e2] border-[#0b1f3a] text-red-700 hover:bg-[#fca5a5] shadow-[0_1px_0_#0b1f3a]'
                }`}
                aria-label="Disconnect wallet"
                title="Disconnect wallet"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenWalletModal}
              className={`px-3.5 sm:px-4 py-1.5 sm:py-2 font-black text-xs sm:text-sm rounded-xl flex items-center gap-1.5 sm:gap-2 cursor-pointer transition-all active:scale-95 shrink-0 ${
                isDark
                  ? 'bg-gradient-to-r from-[#00D2FF] to-[#00f0ff] hover:brightness-110 text-[#04101e] border border-cyan-300 shadow-[0_0_20px_rgba(0,210,255,0.6)]'
                  : 'bg-white hover:bg-[#fff7ed] text-[#0b1f3a] border-2 border-[#0b1f3a] shadow-[0_2px_0_#0b1f3a]'
              }`}
            >
              <span>👛</span>
              <span>Connect</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
};

export const TopBar = React.memo(TopBarComponent);
