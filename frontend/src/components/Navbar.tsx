import React from 'react';
import { WalletType } from '../types/wallet';

interface NavbarProps {
  connectedAddress: string | null;
  activeWalletType: WalletType | null;
  onOpenWalletModal: () => void;
  onDisconnect: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  connectedAddress,
  activeWalletType,
  onOpenWalletModal,
  onDisconnect
}) => {
  const shortAddr = connectedAddress
    ? `${connectedAddress.slice(0, 4)}...${connectedAddress.slice(-4)}`
    : null;

  return (
    <header className="w-full px-4 sm:px-6 pt-4 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto neo-pill px-5 py-3 backdrop-blur-md bg-[#d8f1ff]/95 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-[#ffe0a8] border-2 border-[#0b1f3a] flex items-center justify-center text-xl shadow-[0_2px_0_#0b1f3a] animate-float-1 select-none">
            🍪
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-extrabold text-[#0b1f3a] tracking-tight">CookieAgent</span>
              <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-[#ffe0a8] border border-[#0b1f3a] text-[#0b1f3a] uppercase">cApp</span>
            </div>
            <p className="text-[11px] font-bold text-[#0b1f3a]/75 hidden sm:block">Autonomous SVM Gateway &bull; Cookie Chain</p>
          </div>
        </div>

        {/* Links & Connect Button */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <a
            href="https://cookiescan.io"
            target="_blank"
            rel="noreferrer"
            className="hidden md:inline-flex items-center gap-1 text-xs font-bold text-[#0b1f3a] hover:text-[#d97706] transition px-2.5 py-1 rounded-full hover:bg-white/60"
          >
            <span>🔍 Explorer</span>
          </a>
          <a
            href="https://docs.cookiechain.wtf"
            target="_blank"
            rel="noreferrer"
            className="hidden lg:inline-flex items-center gap-1 text-xs font-bold text-[#0b1f3a] hover:text-[#d97706] transition px-2.5 py-1 rounded-full hover:bg-white/60"
          >
            <span>📖 Docs</span>
          </a>
          <a
            href="/docs"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-[#0b1f3a] hover:text-[#d97706] transition px-2.5 py-1 rounded-full hover:bg-white/60 mono"
          >
            <span>[API]</span>
          </a>

          {connectedAddress ? (
            <button
              onClick={onOpenWalletModal}
              className="px-4 sm:px-5 py-2 sm:py-2.5 bg-[#86efac] hover:bg-[#4ade80] text-[#0b1f3a] font-extrabold text-xs sm:text-sm rounded-full neo-btn flex items-center gap-2"
            >
              <span>🍪 {shortAddr} ({activeWalletType})</span>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  onDisconnect();
                }}
                className="text-xs text-red-600 hover:underline ml-1.5 font-black"
              >
                [Disconnect]
              </span>
            </button>
          ) : (
            <button
              onClick={onOpenWalletModal}
              className="px-4 sm:px-5 py-2 sm:py-2.5 bg-[#ffe0a8] hover:bg-[#fed388] text-[#0b1f3a] font-extrabold text-xs sm:text-sm rounded-full neo-btn flex items-center gap-2 cursor-pointer"
            >
              <span>⚡ Connect Wallet</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
