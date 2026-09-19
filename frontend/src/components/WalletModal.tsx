import React from 'react';
import { WalletType } from '../types/wallet';
import { ArrowLeft, X, RotateCw, AlertTriangle, Key, ExternalLink } from 'lucide-react';
import { WalletLogo } from './WalletIcons';

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

const WALLET_CONFIG: Record<WalletType, { storeUrl: string; desc: string; badge?: string }> = {
  'Phantom': {
    storeUrl: 'https://phantom.app/download',
    desc: 'Standard Solana / SVM Web3 provider',
    badge: 'Popular'
  },
  'Backpack': {
    storeUrl: 'https://backpack.app/download',
    desc: 'Native Solana & xNFT community wallet',
    badge: 'Solana'
  },
  'OKX Wallet': {
    storeUrl: 'https://www.okx.com/web3',
    desc: 'Global leading multi-chain Web3 wallet',
    badge: 'Global'
  },
  'Solflare': {
    storeUrl: 'https://solflare.com/download',
    desc: 'Classic Solana SVM Web3 wallet'
  },
  'Magic Eden': {
    storeUrl: 'https://wallet.magiceden.io',
    desc: 'SVM wallet for collectibles & tokens'
  },
  'Coinbase Wallet': {
    storeUrl: 'https://www.coinbase.com/wallet/downloads',
    desc: 'Coinbase multi-chain SVM wallet'
  },
  'Nightly': {
    storeUrl: 'https://nightly.app/download',
    desc: 'Official SVM wallet for Cookie Chain bounties',
    badge: 'Recommended'
  },
  'Brave Wallet': {
    storeUrl: 'https://brave.com/wallet',
    desc: 'Built-in privacy Web3 wallet in Brave Browser'
  },
  'Session Key': {
    storeUrl: '',
    desc: 'Generates real Ed25519 SVM keypair locally in browser',
    badge: 'Zero-Install'
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
        
        {/* VIEW 1: DECLINED SCREEN (MATCHING EXACT USER SCREENSHOT) */}
        {status === 'declined' && selectedWallet && currentWalletConfig && (
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
              {/* Authentic Wallet Icon with Overlapping Red Cross Badge */}
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-3 border-[#0b1f3a] overflow-hidden shadow-[0_4px_0_#0b1f3a] flex items-center justify-center bg-white p-1">
                  <WalletLogo wallet={selectedWallet} className="w-full h-full rounded-full" />
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

              {/* Try Again Button */}
              <div className="pt-3 w-full">
                <button
                  onClick={onRetry}
                  className="w-full py-3 bg-[#0b1f3a] hover:bg-[#15345d] text-white font-black text-sm rounded-2xl neo-btn flex items-center justify-center gap-2 shadow-[0_4px_0_#0b1f3a] cursor-pointer active:translate-y-1"
                >
                  <RotateCw className="w-4 h-4" />
                  <span>Try again</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: CONNECTING STATUS (WITH AUTHENTIC WALLET LOGO & SLEEK SPINNER) */}
        {status === 'connecting' && selectedWallet && currentWalletConfig && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b-2 border-[#0b1f3a]/15 pb-3">
              <button onClick={onBackToSelect} className="p-1 text-[#0b1f3a] hover:opacity-70 cursor-pointer">
                <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
              </button>
              <h3 className="text-base font-black text-[#0b1f3a]">{selectedWallet}</h3>
              <button onClick={onClose} className="p-1 text-[#0b1f3a] hover:opacity-70 cursor-pointer">
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>

            <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
              {/* Authentic Animated Spinner around Official Vector Logo */}
              <div className="relative p-2">
                <div className="w-20 h-20 rounded-full border-3 border-[#0b1f3a] overflow-hidden shadow-[0_4px_0_#0b1f3a] flex items-center justify-center bg-white p-1">
                  <WalletLogo wallet={selectedWallet} className="w-full h-full rounded-full" />
                </div>
                {/* Smooth Outer Rotating Ring */}
                <div className="absolute inset-0 rounded-full border-4 border-t-[#f59e0b] border-r-transparent border-b-[#0b1f3a] border-l-transparent animate-spin pointer-events-none"></div>
              </div>

              <div>
                <h4 className="text-base font-black text-[#0b1f3a]">
                  Connecting to {selectedWallet}...
                </h4>
                <p className="text-xs font-medium text-[#0b1f3a]/70 mt-1 max-w-xs leading-relaxed">
                  Por favor aprueba la conexión y la <strong>firma de verificación (SIWS)</strong> en la ventana emergente de tu billetera.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: INSTALL NOTICE */}
        {status === 'install_notice' && selectedWallet && currentWalletConfig && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b-2 border-[#0b1f3a]/15 pb-3">
              <button onClick={onBackToSelect} className="p-1 text-[#0b1f3a] hover:opacity-70 cursor-pointer">
                <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
              </button>
              <h3 className="text-base font-black text-[#0b1f3a]">{selectedWallet} Not Found</h3>
              <button onClick={onClose} className="p-1 text-[#0b1f3a] hover:opacity-70 cursor-pointer">
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-[#fef08a] border-2 border-[#0b1f3a] space-y-3 shadow-[0_2px_0_#0b1f3a]">
              <div className="flex items-center gap-2 font-black text-xs text-[#0b1f3a]">
                <AlertTriangle className="w-4 h-4 text-[#d97706]" />
                <span>Wallet extension not detected in Chrome</span>
              </div>
              <p className="text-xs font-medium text-[#0b1f3a]/80 leading-relaxed">
                Abrimos la página de descarga oficial. Si prefieres no instalar extensiones, conéctate al instante con la Session Key integrada:
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

        {/* VIEW 4: DEFAULT WALLET LIST (AUTHENTIC SVG LOGOS) */}
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

            {/* Scrollable Wallet Rows with Real SVG Logos */}
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              
              {/* Phantom */}
              <div
                onClick={() => onConnect('Phantom')}
                className="p-2.5 bg-[#f8fafc] hover:bg-[#ffe0a8]/50 rounded-2xl border-2 border-[#0b1f3a] flex items-center justify-between transition cursor-pointer shadow-[0_2px_0_#0b1f3a] hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl border-2 border-[#0b1f3a] overflow-hidden shadow-sm flex items-center justify-center bg-white p-0.5">
                    <WalletLogo wallet="Phantom" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-[#0b1f3a]">Phantom</span>
                      <span className="text-[9px] px-2 py-0.2 rounded-full bg-[#e9d5ff] text-[#5340C6] border border-[#0b1f3a] font-bold">Popular</span>
                    </div>
                    <p className="text-[10px] font-medium text-[#0b1f3a]/65">Standard Solana / SVM Web3 provider</p>
                  </div>
                </div>
                <span className={`text-[10px] mono px-2 py-0.5 rounded-full border border-[#0b1f3a] font-bold ${detectedWallets['phantom'] ? 'bg-[#bbf7d0] text-[#065f46]' : 'bg-gray-200 text-gray-700'}`}>
                  {detectedWallets['phantom'] ? 'Detected' : 'Install ↗'}
                </span>
              </div>

              {/* Backpack */}
              <div
                onClick={() => onConnect('Backpack')}
                className="p-2.5 bg-[#f8fafc] hover:bg-[#ffe0a8]/50 rounded-2xl border-2 border-[#0b1f3a] flex items-center justify-between transition cursor-pointer shadow-[0_2px_0_#0b1f3a] hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl border-2 border-[#0b1f3a] overflow-hidden shadow-sm flex items-center justify-center bg-[#E33E38] p-0.5">
                    <WalletLogo wallet="Backpack" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-[#0b1f3a]">Backpack</span>
                      <span className="text-[9px] px-2 py-0.2 rounded-full bg-[#fee2e2] text-[#b91c1c] border border-[#0b1f3a] font-bold">Solana</span>
                    </div>
                    <p className="text-[10px] font-medium text-[#0b1f3a]/65">Native Solana community & xNFT wallet</p>
                  </div>
                </div>
                <span className={`text-[10px] mono px-2 py-0.5 rounded-full border border-[#0b1f3a] font-bold ${detectedWallets['backpack'] ? 'bg-[#bbf7d0] text-[#065f46]' : 'bg-gray-200 text-gray-700'}`}>
                  {detectedWallets['backpack'] ? 'Detected' : 'Install ↗'}
                </span>
              </div>

              {/* OKX Wallet */}
              <div
                onClick={() => onConnect('OKX Wallet')}
                className="p-2.5 bg-[#f8fafc] hover:bg-[#ffe0a8]/50 rounded-2xl border-2 border-[#0b1f3a] flex items-center justify-between transition cursor-pointer shadow-[0_2px_0_#0b1f3a] hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl border-2 border-[#0b1f3a] overflow-hidden shadow-sm flex items-center justify-center bg-black p-0.5">
                    <WalletLogo wallet="OKX Wallet" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-[#0b1f3a]">OKX Wallet</span>
                      <span className="text-[9px] px-2 py-0.2 rounded-full bg-gray-200 text-black border border-[#0b1f3a] font-bold">Global</span>
                    </div>
                    <p className="text-[10px] font-medium text-[#0b1f3a]/65">Global leading multi-chain Web3 wallet</p>
                  </div>
                </div>
                <span className={`text-[10px] mono px-2 py-0.5 rounded-full border border-[#0b1f3a] font-bold ${detectedWallets['okx'] ? 'bg-[#bbf7d0] text-[#065f46]' : 'bg-gray-200 text-gray-700'}`}>
                  {detectedWallets['okx'] ? 'Detected' : 'Install ↗'}
                </span>
              </div>

              {/* Solflare */}
              <div
                onClick={() => onConnect('Solflare')}
                className="p-2.5 bg-[#f8fafc] hover:bg-[#ffe0a8]/50 rounded-2xl border-2 border-[#0b1f3a] flex items-center justify-between transition cursor-pointer shadow-[0_2px_0_#0b1f3a] hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl border-2 border-[#0b1f3a] overflow-hidden shadow-sm flex items-center justify-center bg-[#181320] p-0.5">
                    <WalletLogo wallet="Solflare" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-[#0b1f3a]">Solflare</span>
                    <p className="text-[10px] font-medium text-[#0b1f3a]/65">Classic Solana SVM Web3 wallet</p>
                  </div>
                </div>
                <span className={`text-[10px] mono px-2 py-0.5 rounded-full border border-[#0b1f3a] font-bold ${detectedWallets['solflare'] ? 'bg-[#bbf7d0] text-[#065f46]' : 'bg-gray-200 text-gray-700'}`}>
                  {detectedWallets['solflare'] ? 'Detected' : 'Install ↗'}
                </span>
              </div>

              {/* Magic Eden */}
              <div
                onClick={() => onConnect('Magic Eden')}
                className="p-2.5 bg-[#f8fafc] hover:bg-[#ffe0a8]/50 rounded-2xl border-2 border-[#0b1f3a] flex items-center justify-between transition cursor-pointer shadow-[0_2px_0_#0b1f3a] hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl border-2 border-[#0b1f3a] overflow-hidden shadow-sm flex items-center justify-center bg-[#1C102E] p-0.5">
                    <WalletLogo wallet="Magic Eden" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-[#0b1f3a]">Magic Eden</span>
                    <p className="text-[10px] font-medium text-[#0b1f3a]/65">SVM wallet for collectibles & tokens</p>
                  </div>
                </div>
                <span className={`text-[10px] mono px-2 py-0.5 rounded-full border border-[#0b1f3a] font-bold ${detectedWallets['magiceden'] ? 'bg-[#bbf7d0] text-[#065f46]' : 'bg-gray-200 text-gray-700'}`}>
                  {detectedWallets['magiceden'] ? 'Detected' : 'Install ↗'}
                </span>
              </div>

              {/* Coinbase Wallet */}
              <div
                onClick={() => onConnect('Coinbase Wallet')}
                className="p-2.5 bg-[#f8fafc] hover:bg-[#ffe0a8]/50 rounded-2xl border-2 border-[#0b1f3a] flex items-center justify-between transition cursor-pointer shadow-[0_2px_0_#0b1f3a] hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl border-2 border-[#0b1f3a] overflow-hidden shadow-sm flex items-center justify-center bg-[#0052FF] p-0.5">
                    <WalletLogo wallet="Coinbase Wallet" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-[#0b1f3a]">Coinbase Wallet</span>
                      <span className="text-[9px] px-2 py-0.2 rounded-full bg-[#dbeafe] text-[#1e40af] border border-[#0b1f3a] font-bold">Multi-Chain</span>
                    </div>
                    <p className="text-[10px] font-medium text-[#0b1f3a]/65">Direct Solana SVM connection via Coinbase</p>
                  </div>
                </div>
                <span className={`text-[10px] mono px-2 py-0.5 rounded-full border border-[#0b1f3a] font-bold ${detectedWallets['coinbase'] ? 'bg-[#bbf7d0] text-[#065f46]' : 'bg-gray-200 text-gray-700'}`}>
                  {detectedWallets['coinbase'] ? 'Detected' : 'Install ↗'}
                </span>
              </div>

              {/* Nightly */}
              <div
                onClick={() => onConnect('Nightly')}
                className="p-2.5 bg-[#f8fafc] hover:bg-[#ffe0a8]/50 rounded-2xl border-2 border-[#0b1f3a] flex items-center justify-between transition cursor-pointer shadow-[0_2px_0_#0b1f3a] hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl border-2 border-[#0b1f3a] overflow-hidden shadow-sm flex items-center justify-center bg-[#0C1021] p-0.5">
                    <WalletLogo wallet="Nightly" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-[#0b1f3a]">Nightly Wallet</span>
                      <span className="text-[9px] px-2 py-0.2 rounded-full bg-[#d8f1ff] text-[#0b1f3a] border border-[#0b1f3a] font-bold">Recommended</span>
                    </div>
                    <p className="text-[10px] font-medium text-[#0b1f3a]/65">Official SVM wallet for Cookie Chain bounties</p>
                  </div>
                </div>
                <span className={`text-[10px] mono px-2 py-0.5 rounded-full border border-[#0b1f3a] font-bold ${detectedWallets['nightly'] ? 'bg-[#bbf7d0] text-[#065f46]' : 'bg-gray-200 text-gray-700'}`}>
                  {detectedWallets['nightly'] ? 'Detected' : 'Install ↗'}
                </span>
              </div>

              {/* Brave Wallet */}
              <div
                onClick={() => onConnect('Brave Wallet')}
                className="p-2.5 bg-[#f8fafc] hover:bg-[#ffe0a8]/50 rounded-2xl border-2 border-[#0b1f3a] flex items-center justify-between transition cursor-pointer shadow-[0_2px_0_#0b1f3a] hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl border-2 border-[#0b1f3a] overflow-hidden shadow-sm flex items-center justify-center bg-[#FB542B] p-0.5">
                    <WalletLogo wallet="Brave Wallet" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-[#0b1f3a]">Brave Wallet</span>
                    <p className="text-[10px] font-medium text-[#0b1f3a]/65">Built-in privacy Web3 wallet in Brave Browser</p>
                  </div>
                </div>
                <span className={`text-[10px] mono px-2 py-0.5 rounded-full border border-[#0b1f3a] font-bold ${detectedWallets['brave'] ? 'bg-[#bbf7d0] text-[#065f46]' : 'bg-gray-200 text-gray-700'}`}>
                  {detectedWallets['brave'] ? 'Detected' : 'Install ↗'}
                </span>
              </div>

              {/* Session Key */}
              <div className="pt-2 border-t-2 border-[#0b1f3a]/15">
                <div
                  onClick={() => onConnect('Session Key')}
                  className="p-2.5 bg-[#dcfce7] hover:bg-[#bbf7d0] rounded-2xl border-2 border-[#0b1f3a] flex items-center justify-between transition cursor-pointer shadow-[0_2px_0_#0b1f3a] hover:-translate-y-0.5"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl border-2 border-[#0b1f3a] overflow-hidden shadow-sm flex items-center justify-center bg-[#059669] p-0.5">
                      <WalletLogo wallet="Session Key" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-[#065f46]">In-Browser Session Key</span>
                        <span className="text-[9px] px-2 py-0.2 rounded-full bg-white text-[#065f46] border border-[#0b1f3a] font-bold">Zero-Install</span>
                      </div>
                      <p className="text-[10px] font-medium text-[#065f46]/80">Generates real Ed25519 SVM keypair locally in browser</p>
                    </div>
                  </div>
                  <span className="text-[10px] mono px-2 py-0.5 rounded-full bg-[#86efac] text-[#065f46] border border-[#0b1f3a] font-bold">
                    Ready
                  </span>
                </div>
              </div>

            </div>

            {/* Standard Explanation */}
            <div className="p-3 rounded-2xl bg-[#d8f1ff] border-2 border-[#0b1f3a] text-[11px] text-[#0b1f3a] space-y-1">
              <div className="font-extrabold flex items-center gap-1">
                <span>💡</span> Flujo de Autenticación Criptográfica SIWS:
              </div>
              <p className="font-medium text-[#0b1f3a]/80 leading-relaxed">
                Al seleccionar tu billetera, se abrirá la ventana emergente solicitándote autorizar la lectura y firmar un mensaje de autenticación gratuito (*Sign-In with Solana*). Si cancelas, podrás pulsar <strong>Try again</strong> en cualquier momento.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
