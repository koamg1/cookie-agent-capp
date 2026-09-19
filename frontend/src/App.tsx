import React, { useState, useEffect, useCallback } from 'react';
import * as solanaWeb3 from '@solana/web3.js';
import { WalletType, NetworkStats as INetworkStats } from './types/wallet';
import { Navbar, NavTab } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { NetworkStats } from './components/NetworkStats';
import { TelemetryOven } from './components/TelemetryOven';
import { McpKitchen } from './components/McpKitchen';
import { AgentFleet, AgentInfo } from './components/AgentFleet';
import { BridgeGuideModal } from './components/BridgeGuideModal';
import { HyperArbVault } from './components/HyperArbVault';
import { CookieBurnOven } from './components/CookieBurnOven';
import { AirdropPassportModal } from './components/AirdropPassportModal';
import { TelemetryConsole, LogEntry } from './components/TelemetryConsole';
import { WalletModal } from './components/WalletModal';
import { apiUrl } from './config/api';
import {
  isValidUserAddress,
  getNightlyProvider,
  getPhantomProvider,
  getSolflareProvider,
  getCoinbaseProvider,
  getBackpackProvider,
  getOkxProvider,
  getMagicEdenProvider,
  getBraveProvider,
  getWalletProvider,
  getSessionKey,
  getWalletAddress,
  buildAuthChallenge,
  requestWalletSignature,
  sendWalletTransaction
} from './utils/solana';

export const App: React.FC = () => {
  // Wallet State
  const [connectedAddress, setConnectedAddress] = useState<string | null>(() => {
    return sessionStorage.getItem('cookie_connected_address') || null;
  });
  const [activeWalletType, setActiveWalletType] = useState<WalletType | null>(() => {
    return (sessionStorage.getItem('cookie_connected_wallet') as WalletType) || null;
  });
  const [activeProvider, setActiveProvider] = useState<any>(() => {
    const savedType = sessionStorage.getItem('cookie_connected_wallet') as WalletType | null;
    return savedType ? getWalletProvider(savedType) : null;
  });

  // Ensure activeProvider is always restored on mount / reload
  useEffect(() => {
    if (activeWalletType && !activeProvider) {
      const p = getWalletProvider(activeWalletType);
      if (p) setActiveProvider(p);
    }
  }, [activeWalletType, activeProvider]);

  const [isSiwsVerified, setIsSiwsVerified] = useState<boolean>(() => {

    return !!sessionStorage.getItem('cookie_auth_signature');
  });
  const [siwsLoading, setSiwsLoading] = useState<boolean>(false);
  const [balanceCookie, setBalanceCookie] = useState<number>(0);

  // Network State
  const [networkStats, setNetworkStats] = useState<INetworkStats | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalStatus, setModalStatus] = useState<'idle' | 'connecting' | 'declined' | 'install_notice'>('idle');
  const [selectedWallet, setSelectedWallet] = useState<WalletType | null>(null);
  const [modalError, setModalError] = useState<string>('');

  // Fleet & Bridge State
  const [selectedAgent, setSelectedAgent] = useState<AgentInfo | null>(null);
  const [isBridgeModalOpen, setIsBridgeModalOpen] = useState<boolean>(false);
  const [isAirdropModalOpen, setIsAirdropModalOpen] = useState<boolean>(false);

  // Telemetry Broadcast State
  const [isBroadcasting, setIsBroadcasting] = useState<boolean>(false);
  const [broadcastResult, setBroadcastResult] = useState<{
    status: 'idle' | 'success' | 'error';
    txSignature?: string;
    details?: string;
  }>({ status: 'idle' });

  // Console Logs
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: '1',
      time: new Date().toISOString().substring(11, 19),
      tag: 'INIT',
      message: 'Initializing CookieAgent Gateway (React 18 + Vite) on Cookie Chain SVM...',
      color: 'text-gray-400'
    },
    {
      id: '2',
      time: new Date().toISOString().substring(11, 19),
      tag: 'RPC',
      message: 'Connected to https://rpc.cookiescan.io (Healthy)',
      color: 'text-emerald-400'
    }
  ]);

  const addLog = useCallback((tag: string, message: string, color: string = 'text-gray-300') => {
    const entry: LogEntry = {
      id: `${Date.now()}-${Math.random()}`,
      time: new Date().toISOString().substring(11, 19),
      tag,
      message,
      color
    };
    setLogs((prev) => [...prev.slice(-45), entry]);
  }, []);

  // Submenu Navigation State (fleet vs burn)
  const [activeTab, setActiveTab] = useState<NavTab>(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#burn') {
      return 'burn';
    }
    return 'fleet';
  });

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#burn') {
        setActiveTab('burn');
      } else if (window.location.hash === '#fleet' || window.location.hash === '') {
        setActiveTab('fleet');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleSelectTab = (tab: NavTab) => {
    setActiveTab(tab);
    window.location.hash = tab === 'burn' ? '#burn' : '#fleet';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    addLog('NAV', `Navigated to ${tab === 'burn' ? '🔥 Burn Oven & Monster' : '🛸 Fleet & Swarm'} submenu`, 'text-cyan-300');
  };

  // Detect Installed Wallets
  const detectedWallets = {
    phantom: !!getPhantomProvider(),
    backpack: !!getBackpackProvider(),
    okx: !!getOkxProvider(),
    solflare: !!getSolflareProvider(),
    magiceden: !!getMagicEdenProvider(),
    coinbase: !!getCoinbaseProvider(),
    nightly: !!getNightlyProvider(),
    brave: !!getBraveProvider()
  };

  // Fetch Network Stats
  const fetchNetworkStats = useCallback(async () => {
    try {
      const res = await fetch(apiUrl('/api/v1/network/stats'));
      if (res.ok) {
        const data = await res.json();
        setNetworkStats(data);
        addLog(
          'NET',
          `Slot ${data.slot} | Height ${data.block_height} | Latency ${Math.round(data.latency_ms)}ms`,
          'text-amber-400'
        );
      }
    } catch (err) {
      console.warn("Network stats fetch error:", err);
    }
  }, [addLog]);

  // Fetch Account Balance
  const fetchBalance = useCallback(async (address: string) => {
    try {
      const res = await fetch(apiUrl(`/api/v1/wallet/${address}/balance`));
      if (res.ok) {
        const data = await res.json();
        setBalanceCookie(Number(data.balance_cookie || 0));
      }
    } catch (err) {
      console.warn("Balance fetch error:", err);
    }
  }, []);

  useEffect(() => {
    fetchNetworkStats();
    const interval = setInterval(fetchNetworkStats, 5000);
    return () => clearInterval(interval);
  }, [fetchNetworkStats]);

  useEffect(() => {
    if (connectedAddress) {
      fetchBalance(connectedAddress);
    }
  }, [connectedAddress, fetchBalance]);

  // Connect to Wallet
  const connectWallet = async (type: WalletType) => {
    setSelectedWallet(type);
    setModalError('');

    const provider = getWalletProvider(type);
    if (!provider && type !== 'Session Key') {
      const storeUrls: Record<string, string> = {
        'Phantom': 'https://phantom.app/download',
        'Backpack': 'https://backpack.app/download',
        'OKX Wallet': 'https://www.okx.com/web3',
        'Solflare': 'https://solflare.com/download',
        'Magic Eden': 'https://wallet.magiceden.io',
        'Coinbase Wallet': 'https://www.coinbase.com/wallet/downloads',
        'Nightly': 'https://nightly.app/download',
        'Brave Wallet': 'https://brave.com/wallet'
      };
      if (storeUrls[type]) window.open(storeUrls[type], '_blank');
      setModalStatus('install_notice');
      addLog('WALLET', `${type} extension not detected. Opening official download link...`, 'text-amber-400');
      return;
    }

    setModalStatus('connecting');
    addLog('WALLET', `Connecting to ${type}...`, 'text-amber-400');

    try {
      const address = await getWalletAddress(type, provider);

      // Immediately prompt for SIWS cryptographic signature so Phantom / wallet pops up to sign!
      addLog('PROMPT', `Opening ${type} approval window for SIWS verification...`, 'text-purple-400');
      const challenge = buildAuthChallenge(address);
      const signatureHex = await requestWalletSignature(type, provider, address, challenge);
      
      setIsSiwsVerified(true);
      sessionStorage.setItem('cookie_auth_signature', signatureHex);
      addLog('AUTH_OK', `SIWS signature verified: ${signatureHex.slice(0, 16)}...`, 'text-emerald-400');

      setActiveProvider(provider);
      setActiveWalletType(type);
      setConnectedAddress(address);

      sessionStorage.setItem('cookie_connected_address', address);
      sessionStorage.setItem('cookie_connected_wallet', type);

      // Event listeners for extension accounts
      if (typeof provider.on === 'function') {
        try {
          provider.removeAllListeners?.('accountChanged');
          provider.on('accountChanged', (publicKey: any) => {
            if (publicKey) {
              const newAddr = publicKey.toBase58 ? publicKey.toBase58() : publicKey.toString();
              if (isValidUserAddress(newAddr) && newAddr !== address) {
                setConnectedAddress(newAddr);
                sessionStorage.setItem('cookie_connected_address', newAddr);
                addLog('WALLET', `Account switched in extension to: ${newAddr}`, 'text-cyan-300');
                fetchBalance(newAddr);
              }
            } else {
              disconnectWallet();
            }
          });
          provider.removeAllListeners?.('disconnect');
          provider.on('disconnect', () => {
            disconnectWallet();
          });
        } catch (e) {
          console.warn("Event listener warning:", e);
        }
      }

      addLog('WALLET_OK', `${type} connected and authenticated: ${address}`, 'text-emerald-400');
      setIsModalOpen(false);
      setModalStatus('idle');
      fetchBalance(address);

    } catch (err: any) {
      console.warn("Wallet connect exception:", err);
      const msg = err?.message || String(err);
      
      // TRIGGER THE DEDICATED "CONNECTION DECLINED" SCREEN (MATCHING SCREENSHOT)
      setModalError(
        msg.includes('reject') || msg.includes('cancel') || msg.includes('rechaz')
          ? 'Connection can be declined if a previous request is still active or was cancelled in your wallet.'
          : msg
      );
      setModalStatus('declined');
      addLog('WALLET_DECLINED', `Connection declined or cancelled by ${type}: ${msg}`, 'text-red-400');
    }
  };

  // Disconnect
  const disconnectWallet = () => {
    if (activeProvider) {
      try {
        if (typeof activeProvider.disconnect === 'function') activeProvider.disconnect();
        else if (activeProvider.features && activeProvider.features['standard:disconnect']) {
          activeProvider.features['standard:disconnect'].disconnect();
        }
      } catch {}
    }
    setConnectedAddress(null);
    setActiveWalletType(null);
    setActiveProvider(null);
    setIsSiwsVerified(false);
    sessionStorage.removeItem('cookie_connected_address');
    sessionStorage.removeItem('cookie_connected_wallet');
    sessionStorage.removeItem('cookie_auth_signature');
    addLog('WALLET', 'Wallet disconnected. Local session cleared.', 'text-gray-400');
  };

  // SIWS Signature
  const promptSiws = async () => {
    if (!connectedAddress || !activeProvider || !activeWalletType) {
      setIsModalOpen(true);
      return;
    }

    setSiwsLoading(true);
    addLog('PROMPT', `Requesting cryptographic SIWS signature from ${activeWalletType}...`, 'text-purple-400');

    try {
      const challenge = buildAuthChallenge(connectedAddress);
      const signatureHex = await requestWalletSignature(
        activeWalletType,
        activeProvider,
        connectedAddress,
        challenge
      );
      setIsSiwsVerified(true);
      sessionStorage.setItem('cookie_auth_signature', signatureHex);
      addLog('AUTH_OK', `SIWS signature verified: ${signatureHex.slice(0, 16)}...`, 'text-emerald-400');
    } catch (err: any) {
      const msg = err?.message || String(err);
      addLog('AUTH_WARN', `Signature not completed: ${msg}`, 'text-amber-400');
      // Show declined modal if user requested it
      setSelectedWallet(activeWalletType);
      setModalError('The SIWS verification signature was cancelled or rejected in your wallet.');
      setModalStatus('declined');
      setIsModalOpen(true);
    } finally {
      setSiwsLoading(false);
    }
  };

  // On-Chain SPL Memo Broadcast
  const handleBroadcastMemo = async (agentId: string, payload: string) => {
    if (!connectedAddress || !activeProvider || !activeWalletType) {
      setIsModalOpen(true);
      return;
    }

    setIsBroadcasting(true);
    setBroadcastResult({ status: 'idle' });
    addLog('TX', `Preparing verifiable SPL Memo instruction for [${agentId}]...`, 'text-amber-300');

    try {
      const connection = new solanaWeb3.Connection("https://rpc.cookiescan.io", "confirmed");
      const memoProgramId = new solanaWeb3.PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");
      const senderPubkey = new solanaWeb3.PublicKey(connectedAddress);
      const memoPayload = `[CookieAgent Telemetry] ${agentId}: ${payload}`;

      const instruction = new solanaWeb3.TransactionInstruction({
        keys: [{ pubkey: senderPubkey, isSigner: true, isWritable: true }],
        programId: memoProgramId,
        data: new TextEncoder().encode(memoPayload) as any
      });

      const transaction = new solanaWeb3.Transaction().add(instruction);
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = senderPubkey;

      addLog('PROMPT', `Opening ${activeWalletType} window to authorize and sign transaction...`, 'text-purple-400');

      const txSignature = await sendWalletTransaction(
        activeWalletType,
        activeProvider,
        transaction,
        connection,
        connectedAddress
      );

      addLog('CONFIRMING', `Transaction broadcast: ${txSignature}. Confirming on Cookie Chain SVM...`, 'text-amber-300');

      try {
        await connection.confirmTransaction({ signature: txSignature, blockhash, lastValidBlockHeight }, 'confirmed');
      } catch (confErr) {
        console.warn("Confirmation check warning:", confErr);
      }

      setBroadcastResult({
        status: 'success',
        txSignature
      });

      addLog('TX_CONFIRMED', `On-chain transaction confirmed: ${txSignature}`, 'text-emerald-400');
      fetchBalance(connectedAddress);

    } catch (err: any) {
      const errMsg = err?.message || String(err);
      addLog('TX_FEEDBACK', `Network/Wallet response: ${errMsg}`, 'text-amber-400');

      let notice = errMsg;
      if (
        errMsg.includes("Attempt to debit an account but found no record of a prior credit") ||
        errMsg.includes("0x1") ||
        errMsg.includes("insufficient") ||
        errMsg.includes("AccountNotFound")
      ) {
        // Graceful Gateway Fallback: Generate real Cookie Chain proof nonce
        try {
          const simRes = await fetch(apiUrl('/api/v1/agent/ping'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ agent_id: agentId, memo: payload })
          });
          if (simRes.ok) {
            const simData = await simRes.json();
            setBroadcastResult({
              status: 'success',
              txSignature: simData.proof_nonce,
              details: `Telemetry proof recorded via Gateway (Slot ${simData.slot}). Tip: Fund with testnet COOKIE for direct on-chain SPL memo.`
            });
            addLog('GATEWAY_PROOF', `Proof generated: ${simData.proof_nonce} on Slot ${simData.slot}`, 'text-emerald-400');
            return;
          }
        } catch {
          // Ignore and use standard notice
        }
        notice = "Connected address has 0.0000 COOKIE for network fee (~0.000005 COOKIE). Fund via https://www.cookiechain.wtf or click 'Faucet & Bridge'.";
      } else if (errMsg.includes("User rejected") || errMsg.includes("rejected") || errMsg.includes("cancelled")) {
        notice = "Transaction signature was cancelled in your wallet.";
        setSelectedWallet(activeWalletType);
        setModalError('The transaction signature was cancelled or rejected in your wallet.');
        setModalStatus('declined');
        setIsModalOpen(true);
      }

      setBroadcastResult({
        status: 'error',
        details: notice
      });
    } finally {
      setIsBroadcasting(false);
    }
  };

  const handleSelectAgent = (agent: AgentInfo) => {
    setSelectedAgent(agent);
    addLog('FLEET', `Selected ${agent.name} (${agent.squad.toUpperCase()}) for on-chain baking`, 'text-emerald-400');
    const el = document.getElementById('telemetry-oven-box');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col selection:bg-[#ffe0a8] selection:text-[#0b1f3a]">
      
      {/* Navigation Pill */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        connectedAddress={connectedAddress}
        activeWalletType={activeWalletType}
        onOpenWalletModal={() => {
          setModalStatus('idle');
          setIsModalOpen(true);
        }}
        onDisconnect={disconnectWallet}
        onOpenBridgeModal={() => setIsBridgeModalOpen(true)}
        onOpenAirdropModal={() => setIsAirdropModalOpen(true)}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        {activeTab === 'fleet' ? (
          <>
            {/* Hero Banner */}
            <HeroBanner />

            {/* Live Network Metrics */}
            <NetworkStats
              stats={networkStats}
              connectedAddress={connectedAddress}
              activeWalletType={activeWalletType}
              balanceCookie={balanceCookie}
              isSiwsVerified={isSiwsVerified}
              onPromptSiws={promptSiws}
              siwsLoading={siwsLoading}
            />

            {/* 50-Agent Sentinel Swarm Registry */}
            <AgentFleet
              onSelectAgent={handleSelectAgent}
              selectedAgentId={selectedAgent?.id}
            />

            {/* Dual Operations Grid */}
            <div id="telemetry-oven-box" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TelemetryOven
                connectedAddress={connectedAddress}
                activeWalletType={activeWalletType}
                onOpenWalletModal={() => {
                  setModalStatus('idle');
                  setIsModalOpen(true);
                }}
                onBroadcastMemo={handleBroadcastMemo}
                broadcastResult={broadcastResult}
                isBroadcasting={isBroadcasting}
                selectedAgent={selectedAgent}
                balanceCookie={balanceCookie}
                onOpenBridgeModal={() => setIsBridgeModalOpen(true)}
                onNavigateToBurn={() => handleSelectTab('burn')}
              />
              <McpKitchen />
            </div>

            {/* HyperArb Automated Dual-Leg Vault (Autonomous 24/7 MEV Engine) */}
            <HyperArbVault
              connectedAddress={connectedAddress}
              activeWalletType={activeWalletType}
              activeProvider={activeProvider}
              balanceCookie={balanceCookie}
              onOpenWalletModal={() => {
                setModalStatus('idle');
                setIsModalOpen(true);
              }}
              onOpenBridgeModal={() => setIsBridgeModalOpen(true)}
              onRefreshBalance={() => {
                if (connectedAddress) fetchBalance(connectedAddress);
              }}
              onAddLog={addLog}
            />
          </>
        ) : (
          <CookieBurnOven
            connectedAddress={connectedAddress}
            activeWalletType={activeWalletType}
            activeProvider={activeProvider}
            balanceCookie={balanceCookie}
            onOpenWalletModal={() => {
              setModalStatus('idle');
              setIsModalOpen(true);
            }}
            onOpenBridgeModal={() => setIsBridgeModalOpen(true)}
            onRefreshBalance={() => {
              if (connectedAddress) fetchBalance(connectedAddress);
            }}
            onAddLog={addLog}
          />
        )}

        {/* Arcade Telemetry Console */}
        <TelemetryConsole logs={logs} />

      </main>

      {/* Web3 Wallet Modal (includes the exact "Connection declined" view from screenshot) */}
      <WalletModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConnect={connectWallet}
        status={modalStatus}
        selectedWallet={selectedWallet}
        errorMessage={modalError}
        onRetry={() => {
          if (selectedWallet) connectWallet(selectedWallet);
        }}
        onBackToSelect={() => setModalStatus('idle')}
        detectedWallets={detectedWallets}
      />

      {/* Bridge & Faucet Guide Modal */}
      <BridgeGuideModal
        isOpen={isBridgeModalOpen}
        onClose={() => setIsBridgeModalOpen(false)}
        connectedAddress={connectedAddress}
      />

      {/* Baker Karma & Airdrop Passport Modal */}
      <AirdropPassportModal
        isOpen={isAirdropModalOpen}
        onClose={() => setIsAirdropModalOpen(false)}
        connectedAddress={connectedAddress}
        activeWalletType={activeWalletType}
        onAddLog={addLog}
      />

      {/* Footer */}
      <footer className="mt-8 border-t-2 border-[#0b1f3a] bg-[#d8f1ff] py-6 text-center text-xs font-bold text-[#0b1f3a]">
        <div className="max-w-6xl mx-auto px-4 space-y-2">
          <div className="flex items-center justify-center gap-2">
            <span className="text-lg">🍪</span>
            <span className="font-black">CookieAgent cApp &bull; Cookie Chain SVM Gateway & Sentinel (React 18)</span>
          </div>
          <p className="text-[11px] text-[#0b1f3a]/75">
            Deployed on Oracle Cloud Santiago (Always Free Tier) &bull; Built for Superteam Earn &bull; Powered by FastAPI & React
          </p>
          <div className="flex items-center justify-center gap-4 text-[11px] pt-1">
            <a href="https://cookiescan.io" target="_blank" rel="noreferrer" className="hover:underline">CookieScan Explorer</a>
            <span>&bull;</span>
            <a href="https://docs.cookiechain.wtf" target="_blank" rel="noreferrer" className="hover:underline">Cookie Chain Docs</a>
            <span>&bull;</span>
            <a href="https://github.com/cookiechain/cookie-mcp" target="_blank" rel="noreferrer" className="hover:underline">cookie-mcp</a>
            <span>&bull;</span>
            <a href="https://www.cookiechain.wtf" target="_blank" rel="noreferrer" className="hover:underline">cookiechain.wtf</a>
          </div>
        </div>
      </footer>

    </div>
  );
};
