import React from 'react';

interface BridgeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  connectedAddress: string | null;
}

export const BridgeGuideModal: React.FC<BridgeGuideModalProps> = ({
  isOpen,
  onClose,
  connectedAddress
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0b1f3a]/60 backdrop-blur-sm animate-fade-in">
      <div className="neo-card bg-white max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-[#0b1f3a]/15 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌉</span>
            <div>
              <h3 className="text-base font-black text-[#0b1f3a]">Hyperlane Bridge & Faucet</h3>
              <p className="text-[11px] font-bold text-[#0b1f3a]/65">Fund your Cookie Chain SVM wallet in 2 steps</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border-2 border-[#0b1f3a] bg-[#fee2e2] text-[#0b1f3a] font-black text-sm flex items-center justify-center hover:bg-[#fca5a5] cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Status Callout */}
        <div className="p-3.5 rounded-2xl bg-[#d8f1ff] border-2 border-[#0b1f3a] text-xs font-bold text-[#0b1f3a] space-y-1">
          <div className="flex items-center justify-between">
            <span>Your Active SVM Address:</span>
            <span className="text-[10px] bg-white px-2 py-0.5 rounded-md border border-[#0b1f3a]">
              Cookie Chain
            </span>
          </div>
          <div className="mono text-[11px] bg-white/80 p-2 rounded-xl border border-[#0b1f3a]/20 break-all select-all">
            {connectedAddress || 'Wallet not connected yet (Connect via Nightly or Phantom)'}
          </div>
        </div>

        {/* Step 1: Faucet */}
        <div className="p-4 rounded-2xl border-2 border-[#0b1f3a] bg-[#f8fafc] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-[#0b1f3a]">Step 1: Cookie Chain Faucet</span>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#86efac] border border-[#0b1f3a]">
              Direct SVM Drip
            </span>
          </div>
          <p className="text-[11px] text-[#0b1f3a]/80 leading-relaxed">
            Acquire free testnet $COOKIE tokens directly to your address for gas and on-chain transaction fees.
          </p>
          <a
            href="https://www.cookiechain.wtf"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black neo-btn bg-[#ffe0a8] hover:bg-[#fed388] text-[#0b1f3a] border-2 border-[#0b1f3a]"
          >
            🚰 Open Cookie Faucet &rarr;
          </a>
        </div>

        {/* Step 2: Hyperlane Bridge */}
        <div className="p-4 rounded-2xl border-2 border-[#0b1f3a] bg-[#f8fafc] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-[#0b1f3a]">Step 2: Hyperlane Bridge (Cross-Chain)</span>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#e9d5ff] border border-[#0b1f3a]">
              Base Sepolia &rarr; Cookie SVM
            </span>
          </div>
          <p className="text-[11px] text-[#0b1f3a]/80 leading-relaxed">
            Cookie Chain is bridged natively to Base Sepolia via Hyperlane Mailboxes. Transfer tokens seamlessly between EVM and SVM.
          </p>
          <div className="space-y-1 text-[11px] text-[#0b1f3a]/75 pl-2 border-l-2 border-[#0b1f3a]/20">
            <div>1. Connect EVM wallet (MetaMask) on Base Sepolia</div>
            <div>2. Enter your Cookie Chain SVM recipient address</div>
            <div>3. Approve and bridge tokens in ~18 seconds</div>
          </div>
          <a
            href="https://bridge.cookiechain.wtf"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black neo-btn bg-[#d8f1ff] hover:bg-[#bae6fd] text-[#0b1f3a] border-2 border-[#0b1f3a] mt-1"
          >
            🌉 Open Hyperlane Bridge &rarr;
          </a>
        </div>

        {/* Footer */}
        <div className="pt-2 text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl neo-btn bg-[#0b1f3a] text-white font-extrabold text-xs cursor-pointer"
          >
            Got It, Back to Dashboard
          </button>
        </div>

      </div>
    </div>
  );
};
