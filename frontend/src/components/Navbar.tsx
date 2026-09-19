import React from 'react';
import { WalletType } from '../types/wallet';

export type NavTab = 'fleet' | 'vault' | 'burn';

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
    <header className="w-full px-2.5 sm:px-6 pt-2.5 sm:pt-4 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto neo-pill px-3 sm:px-5 py-2 backdrop-blur-md bg-[#d8f1ff]/95 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Left: Brand Logo & Title (matches Baked Bazaar logo placement) */}
        <div 
          onClick={() => onSelectTab('fleet')}
          className="flex items-center space-x-2 sm:space-x-2.5 cursor-pointer group select-none shrink-0"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#ffe0a8] border-2 border-[#0b1f3a] flex items-center justify-center text-base sm:text-lg shadow-[0_2px_0_#0b1f3a] animate-float-1 group-hover:scale-105 transition-transform">
            🍪
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm sm:text-base md:text-lg font-black text-[#0b1f3a] tracking-tight">CookieAgent</span>
            <span className="text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded-full bg-[#ffe0a8] border border-[#0b1f3a] text-[#0b1f3a] uppercase">cApp</span>
          </div>
        </div>

        {/* Center: Unified Horizontal Navigation (matches Baked Bazaar tabs + badges) */}
        <nav 
          className="flex items-center gap-1 sm:gap-1.5 md:gap-2 overflow-x-auto no-scrollbar py-0.5"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {/* Tab 1: Fleet */}
          <button
            onClick={() => onSelectTab('fleet')}
            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0 ${
              activeTab === 'fleet'
                ? 'bg-[#ffe0a8] text-[#0b1f3a] border-2 border-[#0b1f3a] shadow-[0_2px_0_#0b1f3a]'
                : 'text-[#0b1f3a]/75 hover:text-[#0b1f3a] hover:bg-white/60 border border-transparent'
            }`}
          >
            <span>🛸</span>
            <span>Fleet</span>
          </button>

          {/* Tab 2: Vault with MEV Badge */}
          <button
            onClick={() => onSelectTab('vault')}
            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0 ${
              activeTab === 'vault'
                ? 'bg-[#fef08a] text-[#854d0e] border-2 border-[#0b1f3a] shadow-[0_2px_0_#0b1f3a]'
                : 'text-[#0b1f3a]/75 hover:text-[#854d0e] hover:bg-white/60 border border-transparent'
            }`}
          >
            <span>⚡</span>
            <span>Vault</span>
            <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-md bg-[#fbbf24] border border-[#0b1f3a] text-[#0b1f3a] shadow-[0_1px_0_#0b1f3a]">
              MEV
            </span>
          </button>

          {/* Tab 3: Burn with REAL Badge */}
          <button
            onClick={() => onSelectTab('burn')}
            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0 ${
              activeTab === 'burn'
                ? 'bg-gradient-to-r from-[#fed7aa] to-[#fca5a5] text-[#991b1b] border-2 border-[#0b1f3a] shadow-[0_2px_0_#0b1f3a]'
                : 'text-[#0b1f3a]/75 hover:text-[#991b1b] hover:bg-white/60 border border-transparent'
            }`}
          >
            <span className="animate-pulse">🔥</span>
            <span>Burn</span>
            <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-md bg-[#ef4444] text-white border border-[#0b1f3a] shadow-[0_1px_0_#0b1f3a]">
              Real
            </span>
          </button>

          {/* Action 4: Airdrop Passport with Karma Badge */}
          {onOpenAirdropModal && (
            <button
              onClick={onOpenAirdropModal}
              className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs font-black text-[#0b1f3a]/80 hover:text-[#0b1f3a] hover:bg-[#d8b4fe]/40 border border-transparent hover:border-[#0b1f3a]/30 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0"
            >
              <span>🎁</span>
              <span>Airdrop</span>
              <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-md bg-[#d8b4fe] border border-[#0b1f3a] text-[#581c87] shadow-[0_1px_0_#0b1f3a]">
                Karma
              </span>
            </button>
          )}

          {/* Action 5: Faucet & Bridge */}
          {onOpenBridgeModal && (
            <button
              onClick={onOpenBridgeModal}
              className="hidden xl:inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs font-black text-[#0b1f3a]/80 hover:text-[#0b1f3a] hover:bg-white/60 border border-transparent hover:border-[#0b1f3a]/30 transition-all whitespace-nowrap cursor-pointer shrink-0"
            >
              <span>🚰</span>
              <span>Bridge</span>
            </button>
          )}

          {/* Action 6: Explorer */}
          <a
            href="https://cookiescan.io"
            target="_blank"
            rel="noreferrer"
            className="hidden 2xl:inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs font-bold text-[#0b1f3a]/80 hover:text-[#0b1f3a] hover:bg-white/60 border border-transparent hover:border-[#0b1f3a]/30 transition-all whitespace-nowrap shrink-0"
          >
            <span>🔍</span>
            <span>Explorer</span>
          </a>
        </nav>

        {/* Right: Docs + Connect Wallet (matches Baked Bazaar connect button) */}
        <div className="flex items-center space-x-2 shrink-0">
          <a
            href="/docs"
            target="_blank"
            rel="noreferrer"
            className="hidden 2xl:inline-flex items-center text-xs font-bold text-[#0b1f3a] hover:text-[#d97706] transition px-2 py-1 rounded-lg hover:bg-white/60 mono"
          >
            <span>[API]</span>
          </a>

          {connectedAddress ? (
            <button
              onClick={onOpenWalletModal}
              className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 bg-[#86efac] hover:bg-[#4ade80] text-[#0b1f3a] font-extrabold text-xs sm:text-sm rounded-xl neo-btn flex items-center gap-1.5 sm:gap-2 shadow-[0_2px_0_#0b1f3a] cursor-pointer shrink-0"
            >
              <span>👛</span>
              <span>{shortAddr}</span>
              <span className="hidden 2xl:inline text-[10px] text-[#065f46] font-black uppercase">
                ({activeWalletType})
              </span>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  onDisconnect();
                }}
                className="text-xs text-red-600 hover:text-red-800 ml-0.5 sm:ml-1 font-black"
                title="Disconnect"
              >
                ✕
              </span>
            </button>
          ) : (
            <button
              onClick={onOpenWalletModal}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white hover:bg-[#fff7ed] text-[#0b1f3a] font-black text-xs sm:text-sm rounded-xl border-2 border-[#0b1f3a] shadow-[0_2px_0_#0b1f3a] active:translate-y-0.5 active:shadow-none flex items-center gap-1.5 sm:gap-2 cursor-pointer transition-all shrink-0"
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


