import React from 'react';
import { WalletType } from '../types/wallet';
import { ArrowLeft, X, RotateCw, AlertTriangle, Key, ExternalLink } from 'lucide-react';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (type: WalletType) => Promise<void>;
  status: 'idle' | 'connecting' | 'declined' | 'install_notice';
  selectedWallet: WalletType | null;
  errorMessage?: string;
  onRetry: () => void;
  onBackToSelect: () => void;
  detectedWallets: Record<string, boolean>;
}

const WALLET_CONFIG: Record<WalletType, { icon: string; bg: string; storeUrl: string; desc: string }> = {
  'Nightly': {
    icon: '🦉',
    bg: 'bg-[#ffe0a8]',
    storeUrl: 'https://nightly.app/download',
    desc: 'Official SVM wallet for Cookie Chain bounties'
  },
  'Phantom': {
    icon: '👻',
    bg: 'bg-[#e9d5ff]',
    storeUrl: 'https://phantom.app/download',
    desc: 'Standard Solana / SVM Web3 provider'
  },
  'Solflare': {
    icon: '☀️',
    bg: 'bg-[#fed7aa]',
    storeUrl: 'https://solflare.com/download',
    desc: 'Solana SVM Web3 wallet'
  },
  'Session Key': {
    icon: '🔑',
    bg: 'bg-[#86efac]',
    storeUrl: '',
    desc: 'Generates real Ed25519 SVM keypair locally in browser'
  }
};

export const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  onClose,
  onConnect,
  status,
  selectedWallet,
  errorMessage,
  onRetry,
  onBackToSelect,
  detectedWallets
}) => {
  if (!isOpen) return null;

  const currentWalletConfig = selectedWallet ? WALLET_CONFIG[selectedWallet] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b1f3a]/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="neo-card max-w-md w-full p-6 space-y-4 shadow-[0_8px_0_#0b1f3a] bg-white transition-all">
        
        {/* VIEW 1: DECLINED SCREEN (EXACT MATCH TO USER SCREENSHOT) */}
        {status === 'declined' && currentWalletConfig && (
          <div className="space-y-6">
            {/* Top Navigation Bar: Back arrow, Wallet Name, Close X */}
            <div className="flex items-center justify-between border-b-2 border-[#0b1f3a]/15 pb-3">
              <button 
                onClick={onBackToSelect} 
                className="p-1.5 rounded-full hover:bg-gray-100 text-[#0b1f3a] transition-colors cursor-pointer"
                title="Back to wallets"
              >
                <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
              </button>
              <h3 className="text-base font-black text-[#0b1f3a]">
                {selectedWallet}
              </h3>
              <button 
                onClick={onClose} 
                className="p-1.5 rounded-full hover:bg-gray-100 text-[#0b1f3a] transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>

            {/* Central Error Presentation */}
            <div className="flex flex-col items-center justify-center py-4 text-center space-y-3">
              {/* Wallet Icon with Overlapping Red Cross Badge */}
              <div className="relative">
                <div className={`w-20 h-20 rounded-full ${currentWalletConfig.bg} border-3 border-[#0b1f3a] flex items-center justify-center text-4xl shadow-[0_4px_0_#0b1f3a]`}>
                  {currentWalletConfig.icon}
                </div>
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-red-500 border-2 border-[#0b1f3a] flex items-center justify-center text-white shadow-sm">
                  <X className="w-4 h-4 stroke-[3]" />
                </div>
              </div>

              {/* Red Title */}
              <h4 className="text-lg font-black text-red-500 tracking-tight">
                Connection declined
              </h4>

              {/* Explanatory Message */}
              <p className="text-xs font-medium text-[#0b1f3a]/75 max-w-xs leading-relaxed">
                {errorMessage || 'Connection can be declined if a previous request is still active or was cancelled in your wallet.'}
              </p>

              {/* Try Again Button (prominent pill style) */}
              <div className="pt-3 w-full">
                <button
                  onClick={onRetry}
                  className="w-full py-3 bg-[#0b1f3a] hover:bg-[#15345d] text-white font-black text-sm rounded-2xl neo-btn flex items-center justify-center gap-2 shadow-[0_4px_0_#0b1f3a] cursor-pointer"
                >
                  <RotateCw className="w-4 h-4 animate-spin-reverse" />
                  <span>Try again</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: CONNECTING STATUS */}
        {status === 'connecting' && currentWalletConfig && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b-2 border-[#0b1f3a]/15 pb-3">
              <button onClick={onBackToSelect} className="p-1 text-[#0b1f3a] hover:opacity-70">
                <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
              </button>
              <h3 className="text-base font-black text-[#0b1f3a]">{selectedWallet}</h3>
              <button onClick={onClose} className="p-1 text-[#0b1f3a] hover:opacity-70">
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>

            <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
              <div className="relative">
                <div className={`w-20 h-20 rounded-full ${currentWalletConfig.bg} border-3 border-[#0b1f3a] flex items-center justify-center text-4xl shadow-[0_4px_0_#0b1f3a]`}>
                  {currentWalletConfig.icon}
                </div>
                <div className="absolute inset-0 rounded-full border-4 border-t-amber-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
              </div>

              <div>
                <h4 className="text-base font-black text-[#0b1f3a]">
                  Connecting to {selectedWallet}...
                </h4>
                <p className="text-xs font-medium text-[#0b1f3a]/70 mt-1 max-w-xs">
                  Please approve the connection in your wallet window to continue.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: INSTALL NOTICE */}
        {status === 'install_notice' && currentWalletConfig && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b-2 border-[#0b1f3a]/15 pb-3">
              <button onClick={onBackToSelect} className="p-1 text-[#0b1f3a] hover:opacity-70">
                <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
              </button>
              <h3 className="text-base font-black text-[#0b1f3a]">{selectedWallet} Not Found</h3>
              <button onClick={onClose} className="p-1 text-[#0b1f3a] hover:opacity-70">
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-[#fef08a] border-2 border-[#0b1f3a] space-y-3">
              <div className="flex items-center gap-2 font-black text-xs text-[#0b1f3a]">
                <AlertTriangle className="w-4 h-4 text-[#d97706]" />
                <span>Wallet extension not detected</span>
              </div>
              <p className="text-xs font-medium text-[#0b1f3a]/80 leading-relaxed">
                We opened the official install page in a new tab. If you prefer not to install browser extensions, connect instantly using the built-in Session Key:
              </p>
              <div className="pt-1 flex flex-col gap-2">
                <a
                  href={currentWalletConfig.storeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 px-3 rounded-xl bg-white text-[#0b1f3a] font-bold text-xs neo-btn flex items-center justify-center gap-1.5 border-2 border-[#0b1f3a]"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Download {selectedWallet}</span>
                </a>
                <button
                  onClick={() => onConnect('Session Key')}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#86efac] hover:bg-[#4ade80] text-[#0b1f3a] font-black text-xs neo-btn flex items-center justify-center gap-1.5"
                >
                  <Key className="w-4 h-4" />
                  <span>Connect with Session Key (Instant)</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: DEFAULT SELECTION LIST */}
        {status === 'idle' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b-2 border-[#0b1f3a]/15 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">👛</span>
                <div>
                  <h3 className="text-base font-black text-[#0b1f3a]">Connect SVM Wallet</h3>
                  <p className="text-[11px] font-bold text-[#0b1f3a]/65">Select an authentic Web3 provider on Cookie Chain</p>
                </div>
              </div>
              <button onClick={onClose} className="p-1 text-[#0b1f3a] hover:opacity-70 text-xl font-bold cursor-pointer">
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>

            {/* Wallet Rows */}
            <div className="space-y-2.5">
              
              {/* Nightly */}
              <div
                onClick={() => onConnect('Nightly')}
                className="p-3 bg-[#f8fafc] hover:bg-[#ffe0a8]/50 rounded-2xl border-2 border-[#0b1f3a] flex items-center justify-between transition cursor-pointer shadow-[0_2px_0_#0b1f3a] hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#ffe0a8] border-2 border-[#0b1f3a] flex items-center justify-center text-xl">
                    🦉
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-[#0b1f3a]">Nightly Wallet</span>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#d8f1ff] text-[#0b1f3a] border border-[#0b1f3a] font-bold">Recommended</span>
                    </div>
                    <p className="text-[10px] font-medium text-[#0b1f3a]/65">Official SVM wallet for Cookie Chain bounties</p>
                  </div>
                </div>
                <span className={`text-[10px] mono px-2.5 py-0.5 rounded-full border border-[#0b1f3a] font-bold ${detectedWallets['nightly'] ? 'bg-[#bbf7d0] text-[#065f46]' : 'bg-gray-200 text-gray-700'}`}>
                  {detectedWallets['nightly'] ? 'Detected' : 'Install ↗'}
                </span>
              </div>

              {/* Phantom */}
              <div
                onClick={() => onConnect('Phantom')}
                className="p-3 bg-[#f8fafc] hover:bg-[#ffe0a8]/50 rounded-2xl border-2 border-[#0b1f3a] flex items-center justify-between transition cursor-pointer shadow-[0_2px_0_#0b1f3a] hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#e9d5ff] border-2 border-[#0b1f3a] flex items-center justify-center text-xl">
                    👻
                  </div>
                  <div>
                    <span className="text-xs font-black text-[#0b1f3a]">Phantom</span>
                    <p className="text-[10px] font-medium text-[#0b1f3a]/65">Standard Solana / SVM Web3 provider</p>
                  </div>
                </div>
                <span className={`text-[10px] mono px-2.5 py-0.5 rounded-full border border-[#0b1f3a] font-bold ${detectedWallets['phantom'] ? 'bg-[#bbf7d0] text-[#065f46]' : 'bg-gray-200 text-gray-700'}`}>
                  {detectedWallets['phantom'] ? 'Detected' : 'Install ↗'}
                </span>
              </div>

              {/* Solflare */}
              <div
                onClick={() => onConnect('Solflare')}
                className="p-3 bg-[#f8fafc] hover:bg-[#ffe0a8]/50 rounded-2xl border-2 border-[#0b1f3a] flex items-center justify-between transition cursor-pointer shadow-[0_2px_0_#0b1f3a] hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#fed7aa] border-2 border-[#0b1f3a] flex items-center justify-center text-xl">
                    ☀️
                  </div>
                  <div>
                    <span className="text-xs font-black text-[#0b1f3a]">Solflare</span>
                    <p className="text-[10px] font-medium text-[#0b1f3a]/65">Solana SVM Web3 wallet</p>
                  </div>
                </div>
                <span className={`text-[10px] mono px-2.5 py-0.5 rounded-full border border-[#0b1f3a] font-bold ${detectedWallets['solflare'] ? 'bg-[#bbf7d0] text-[#065f46]' : 'bg-gray-200 text-gray-700'}`}>
                  {detectedWallets['solflare'] ? 'Detected' : 'Install ↗'}
                </span>
              </div>

              {/* Session Key */}
              <div className="pt-2 border-t-2 border-[#0b1f3a]/15">
                <div
                  onClick={() => onConnect('Session Key')}
                  className="p-3 bg-[#dcfce7] hover:bg-[#bbf7d0] rounded-2xl border-2 border-[#0b1f3a] flex items-center justify-between transition cursor-pointer shadow-[0_2px_0_#0b1f3a] hover:-translate-y-0.5"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#86efac] border-2 border-[#0b1f3a] flex items-center justify-center text-xl">
                      🔑
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-[#065f46]">In-Browser Session Key</span>
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-white text-[#065f46] border border-[#0b1f3a] font-bold">Zero-Install</span>
                      </div>
                      <p className="text-[10px] font-medium text-[#065f46]/80">Generates real Ed25519 SVM keypair locally in browser</p>
                    </div>
                  </div>
                  <span className="text-[10px] mono px-2.5 py-0.5 rounded-full bg-[#86efac] text-[#065f46] border border-[#0b1f3a] font-bold">
                    Ready
                  </span>
                </div>
              </div>

            </div>

            {/* Standard Explanation */}
            <div className="p-3 rounded-2xl bg-[#d8f1ff] border-2 border-[#0b1f3a] text-[11px] text-[#0b1f3a] space-y-1">
              <div className="font-extrabold flex items-center gap-1">
                <span>💡</span> Estándar Web3 en Solana (igual que Jupiter y Raydium):
              </div>
              <p className="font-medium text-[#0b1f3a]/80 leading-relaxed">
                Al conectar, solo se comparte la dirección pública para lectura. Las firmas de transacciones únicamente se solicitan cuando tú presionas una acción on-chain.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
