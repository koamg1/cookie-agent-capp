import React from 'react';
import { WalletType } from '../types/wallet';

export type NavTab = 'fleet' | 'burn';

interface NavbarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  connectedAddress: string | null;
  activeWalletType: WalletType | null;
  onOpenWalletModal: () => void;
  onDisconnect: () => void;
  onOpenBridgeModal?: () => void;
  onOpenAirdropModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  connectedAddress,
  activeWalletType,
  onOpenWalletModal,
  onDisconnect,
  onOpenBridgeModal,
  onOpenAirdropModal
}) => {
  const shortAddr = connectedAddress
    ? `${connectedAddress.slice(0, 4)}...${connectedAddress.slice(-4)}`
    : null;

  return (
    <header className="w-full px-3 sm:px-6 pt-3 sm:pt-4 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto neo-pill px-4 sm:px-5 py-2.5 sm:py-3 backdrop-blur-md bg-[#d8f1ff]/95 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Brand Logo */}
        <div 
          onClick={() => onSelectTab('fleet')}
          className="flex items-center space-x-2.5 sm:space-x-3 cursor-pointer group select-none shrink-0"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#ffe0a8] border-2 border-[#0b1f3a] flex items-center justify-center text-lg sm:text-xl shadow-[0_2px_0_#0b1f3a] animate-float-1 group-hover:scale-105 transition-transform">
            🍪
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-sm sm:text-lg font-extrabold text-[#0b1f3a] tracking-tight">CookieAgent</span>
              <span className="text-[10px] sm:text-[11px] font-black px-1.5 sm:px-2 py-0.5 rounded-full bg-[#ffe0a8] border border-[#0b1f3a] text-[#0b1f3a] uppercase">cApp</span>
            </div>
            <p className="text-[10px] sm:text-[11px] font-bold text-[#0b1f3a]/75 hidden lg:block">Autonomous SVM Gateway &bull; Cookie Chain</p>
          </div>
        </div>

        {/* Submenu Tabs & Links */}
        <div className="flex items-center space-x-1.5 sm:space-x-2.5">
          {/* Main Submenu Selector (Fleet Swarm vs Burn Oven) */}
          <div className="flex items-center bg-[#cae9ff] p-0.5 sm:p-1 rounded-full border-2 border-[#0b1f3a] shadow-[0_2px_0_#0b1f3a]">
            <button
              onClick={() => onSelectTab('fleet')}
              className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-xs font-black transition-all flex items-center gap-1 sm:gap-1.5 cursor-pointer ${
                activeTab === 'fleet'
                  ? 'bg-[#ffe0a8] text-[#0b1f3a] border border-[#0b1f3a] shadow-[0_1px_0_#0b1f3a]'
                  : 'text-[#0b1f3a]/75 hover:text-[#0b1f3a] hover:bg-white/50 border border-transparent'
              }`}
            >
              <span>🛸</span>
              <span className="hidden sm:inline">Fleet & Swarm</span>
              <span className="sm:hidden">Fleet</span>
            </button>

            <button
              onClick={() => onSelectTab('burn')}
              className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-xs font-black transition-all flex items-center gap-1 sm:gap-1.5 cursor-pointer ${
                activeTab === 'burn'
                  ? 'bg-gradient-to-r from-[#fed7aa] to-[#fca5a5] text-[#991b1b] border border-[#0b1f3a] shadow-[0_1px_0_#0b1f3a]'
                  : 'text-[#0b1f3a]/75 hover:text-[#991b1b] hover:bg-[#fee2e2]/60 border border-transparent'
              }`}
            >
              <span className="animate-pulse">🔥</span>
              <span>Burn Oven</span>
              <span className="hidden md:inline text-[9px] bg-[#ef4444] text-white px-1.5 py-0.2 rounded-full font-black uppercase">Real</span>
            </button>
          </div>

          {onOpenBridgeModal && (
            <button
              onClick={onOpenBridgeModal}
              className="hidden md:inline-flex items-center gap-1.5 text-xs font-black text-[#0b1f3a] bg-[#ffe0a8] hover:bg-[#fed388] border border-[#0b1f3a] px-2.5 py-1.5 rounded-full shadow-[0_1px_0_#0b1f3a] cursor-pointer"
            >
              <span>🚰 Faucet & Bridge</span>
            </button>
          )}

          {onOpenAirdropModal && (
            <button
              onClick={onOpenAirdropModal}
              className="inline-flex items-center gap-1.5 text-xs font-black text-[#0b1f3a] bg-[#d8b4fe] hover:bg-[#c084fc] border border-[#0b1f3a] px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full shadow-[0_1px_0_#0b1f3a] cursor-pointer animate-pulse"
            >
              <span>🎁</span>
              <span className="hidden sm:inline">Airdrop Passport</span>
              <span className="sm:hidden">Airdrop</span>
            </button>
          )}

          <a
            href="https://cookiescan.io"
            target="_blank"
            rel="noreferrer"
            className="hidden xl:inline-flex items-center gap-1 text-xs font-bold text-[#0b1f3a] hover:text-[#d97706] transition px-2.5 py-1 rounded-full hover:bg-white/60"
          >
            <span>🔍 Explorer</span>
          </a>
          <a
            href="https://docs.cookiechain.wtf"
            target="_blank"
            rel="noreferrer"
            className="hidden xl:inline-flex items-center gap-1 text-xs font-bold text-[#0b1f3a] hover:text-[#d97706] transition px-2.5 py-1 rounded-full hover:bg-white/60"
          >
            <span>📖 Docs</span>
          </a>
          <a
            href="/docs"
            target="_blank"
            rel="noreferrer"
            className="hidden lg:inline-flex items-center gap-1 text-xs font-bold text-[#0b1f3a] hover:text-[#d97706] transition px-2.5 py-1 rounded-full hover:bg-white/60 mono"
          >
            <span>[API]</span>
          </a>

          {connectedAddress ? (
            <button
              onClick={onOpenWalletModal}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-[#86efac] hover:bg-[#4ade80] text-[#0b1f3a] font-extrabold text-xs sm:text-sm rounded-full neo-btn flex items-center gap-1.5 sm:gap-2"
            >
              <span>🍪 {shortAddr} ({activeWalletType})</span>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  onDisconnect();
                }}
                className="text-xs text-red-600 hover:underline ml-1 font-black"
              >
                [X]
              </span>
            </button>
          ) : (
            <button
              onClick={onOpenWalletModal}
              className="px-3.5 sm:px-5 py-1.5 sm:py-2 bg-[#ffe0a8] hover:bg-[#fed388] text-[#0b1f3a] font-extrabold text-xs sm:text-sm rounded-full neo-btn flex items-center gap-1.5 sm:gap-2 cursor-pointer"
            >
              <span>⚡ Connect</span>
              <span className="hidden sm:inline">Wallet</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
};

