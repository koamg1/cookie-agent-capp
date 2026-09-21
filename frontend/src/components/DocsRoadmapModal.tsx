import React, { useState } from 'react';

interface DocsRoadmapModalProps {
  isOpen: boolean;
  onClose: () => void;
  themeMode?: 'light' | 'dark';
}

type TabType = 'guide' | 'roadmap' | 'developers';

export const DocsRoadmapModal: React.FC<DocsRoadmapModalProps> = ({
  isOpen,
  onClose,
  themeMode = 'light'
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('guide');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  if (!isOpen) return null;

  const isDark = themeMode === 'dark';

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#0b1f3a]/80 backdrop-blur-md animate-fade-in">
      <div 
        className={`w-full max-w-3xl rounded-3xl border-3 shadow-[0_12px_0_#0b1f3a] overflow-hidden flex flex-col max-h-[92vh] transition-colors ${
          isDark 
            ? 'bg-[#090e1c] border-cyan-500/60 text-slate-100 shadow-[0_12px_0_#000]' 
            : 'bg-white border-[#0b1f3a] text-[#0b1f3a]'
        }`}
      >
        {/* Header */}
        <div className={`px-6 py-4 sm:py-5 border-b flex items-center justify-between gap-4 shrink-0 ${
          isDark 
            ? 'bg-[#0f172a] border-slate-800' 
            : 'bg-[#fffbeb] border-[#0b1f3a]/15'
        }`}>
          <div className="flex items-center gap-3.5">
            <span className="text-3xl sm:text-4xl">📚</span>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-lg sm:text-xl font-black tracking-tight">Documentation & Roadmap</h3>
                <span className={`text-xs font-black uppercase px-2.5 py-0.5 rounded-full border ${
                  isDark ? 'bg-cyan-950 text-cyan-300 border-cyan-500/50' : 'bg-[#ffe0a8] text-[#0b1f3a] border-[#0b1f3a]'
                }`}>
                  v1.2 Beta
                </span>
              </div>
              <p className={`text-xs sm:text-sm font-semibold mt-0.5 ${isDark ? 'text-slate-400' : 'text-[#0b1f3a]/75'}`}>
                Complete user guide, project milestones & technical reference
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`w-9 h-9 rounded-xl border-2 flex items-center justify-center font-black text-sm cursor-pointer transition ${
              isDark 
                ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' 
                : 'bg-[#fee2e2] border-[#0b1f3a] text-[#0b1f3a] hover:bg-[#fca5a5]'
            }`}
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className={`px-6 pt-3.5 pb-2.5 border-b flex items-center gap-2.5 shrink-0 ${
          isDark ? 'border-slate-800/80 bg-[#070b14]' : 'border-[#0b1f3a]/10 bg-slate-50'
        }`}>
          <button
            onClick={() => setActiveTab('guide')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'guide'
                ? isDark
                  ? 'bg-cyan-500 text-black shadow-[0_2px_0_#0891b2]'
                  : 'bg-[#ffe0a8] text-[#0b1f3a] border-2 border-[#0b1f3a] shadow-[0_2px_0_#0b1f3a]'
                : isDark
                  ? 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  : 'text-[#0b1f3a]/70 hover:text-[#0b1f3a] hover:bg-white/80'
            }`}
          >
            <span className="text-base">🚀</span>
            <span>User Guide</span>
          </button>

          <button
            onClick={() => setActiveTab('roadmap')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'roadmap'
                ? isDark
                  ? 'bg-amber-400 text-black shadow-[0_2px_0_#d97706]'
                  : 'bg-[#fef08a] text-[#854d0e] border-2 border-[#0b1f3a] shadow-[0_2px_0_#0b1f3a]'
                : isDark
                  ? 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  : 'text-[#0b1f3a]/70 hover:text-[#0b1f3a] hover:bg-white/80'
            }`}
          >
            <span className="text-base">🗺️</span>
            <span>Roadmap</span>
          </button>

          <button
            onClick={() => setActiveTab('developers')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'developers'
                ? isDark
                  ? 'bg-emerald-400 text-black shadow-[0_2px_0_#059669]'
                  : 'bg-emerald-100 text-emerald-900 border-2 border-[#0b1f3a] shadow-[0_2px_0_#0b1f3a]'
                : isDark
                  ? 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  : 'text-[#0b1f3a]/70 hover:text-[#0b1f3a] hover:bg-white/80'
            }`}
          >
            <span className="text-base">⚙️</span>
            <span>API & MCP</span>
          </button>
        </div>

        {/* Tab Content (Scrollable with larger readable fonts) */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm sm:text-base leading-relaxed">
          
          {/* TAB 1: USER GUIDE */}
          {activeTab === 'guide' && (
            <div className="space-y-4">
              {/* Intro Banner */}
              <div className={`p-4 rounded-2xl border-2 flex items-start gap-3.5 ${
                isDark 
                  ? 'bg-cyan-950/30 border-cyan-500/40 text-cyan-200' 
                  : 'bg-[#d8f1ff] border-[#0b1f3a] text-[#0b1f3a] shadow-[0_2px_0_#0b1f3a]'
              }`}>
                <span className="text-2xl shrink-0 mt-0.5">💡</span>
                <div>
                  <h4 className="font-black text-sm sm:text-base uppercase tracking-wide mb-1">Quick Start Overview</h4>
                  <p className="text-xs sm:text-sm opacity-95 leading-normal">
                    CookieAgent cApp is an autonomous AI agent gateway, burn orchestrator, and liquidity sentinel built natively for Cookie Chain SVM. Follow these simple steps to start baking and accumulating on-chain Karma.
                  </p>
                </div>
              </div>

              {/* Step 1 */}
              <div className={`p-4 sm:p-5 rounded-2xl border-2 space-y-2.5 ${
                isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-[#0b1f3a] shadow-[0_2px_0_#0b1f3a]'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-cyan-500 text-black font-black flex items-center justify-center text-sm">
                      1
                    </span>
                    <h5 className="font-black text-base sm:text-lg">Connect Your SVM Wallet</h5>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                    isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-[#0b1f3a]/30'
                  }`}>
                    9 Wallets Supported
                  </span>
                </div>
                <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-[#0b1f3a]/85'}`}>
                  Click <strong>Connect Wallet</strong> in the navigation bar. Choose between <strong>Nightly</strong> (native Cookie Chain network pre-configured), <strong>Phantom</strong>, <strong>Backpack</strong>, <strong>Solflare</strong>, <strong>OKX</strong>, or use an instant <strong>Session Key</strong> ($0 setup, no extension required). Authentication uses cryptographic Sign-In with Solana (SIWS) with zero network fees.
                </p>
              </div>

              {/* Step 2 */}
              <div className={`p-4 sm:p-5 rounded-2xl border-2 space-y-2.5 ${
                isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-[#0b1f3a] shadow-[0_2px_0_#0b1f3a]'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-400 text-black font-black flex items-center justify-center text-sm">
                      2
                    </span>
                    <h5 className="font-black text-base sm:text-lg">Acquire $COOKIE & Bridge</h5>
                  </div>
                  <a 
                    href="https://hyperlane.cookiescan.io" 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-xs sm:text-sm font-bold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
                  >
                    <span>Hyperlane Bridge</span>
                    <span>↗</span>
                  </a>
                </div>
                <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-[#0b1f3a]/85'}`}>
                  To interact on-chain, hold $COOKIE in your wallet on Cookie Chain SVM. If your funds are on Solana Mainnet (Jupiter / Raydium), bridge them seamlessly to Cookie Chain using the official Hyperlane Bridge.
                </p>
              </div>

              {/* Step 3 */}
              <div className={`p-4 sm:p-5 rounded-2xl border-2 space-y-2.5 ${
                isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-[#0b1f3a] shadow-[0_2px_0_#0b1f3a]'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-red-500 text-white font-black flex items-center justify-center text-sm">
                      3
                    </span>
                    <h5 className="font-black text-base sm:text-lg">Burn in the Oven & Gain Baker Karma</h5>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                    isDark ? 'bg-red-950 text-red-300 border-red-800' : 'bg-red-100 text-red-800 border-red-300'
                  }`}>
                    100% Real On-Chain
                  </span>
                </div>
                <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-[#0b1f3a]/85'}`}>
                  Navigate to the <strong>Burn</strong> tab. Select an amount of $COOKIE and click <strong>Bake & Burn On-Chain</strong>. Your tokens are transferred directly to the canonical Solana Incinerator address (<code>1nc1nerator...</code>) and verified by the backend RPC.
                </p>
                <div className={`p-3 rounded-xl border flex items-center justify-between gap-3 font-mono text-xs sm:text-sm ${
                  isDark ? 'bg-black/50 border-slate-800' : 'bg-slate-50 border-[#0b1f3a]/15'
                }`}>
                  <span className="truncate">Canonical: 1nc1nerator11111111111111111111111111111111</span>
                  <button
                    onClick={() => copyToClipboard('1nc1nerator11111111111111111111111111111111', 'burn')}
                    className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-400 dark:border-slate-700 rounded-lg text-xs font-bold cursor-pointer shrink-0 transition hover:bg-slate-100"
                  >
                    {copiedText === 'burn' ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Step 4 */}
              <div className={`p-4 sm:p-5 rounded-2xl border-2 space-y-2.5 ${
                isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-[#0b1f3a] shadow-[0_2px_0_#0b1f3a]'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-purple-500 text-white font-black flex items-center justify-center text-sm">
                      4
                    </span>
                    <h5 className="font-black text-base sm:text-lg">Karma Points & Community Grants</h5>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                    isDark ? 'bg-purple-950 text-purple-300 border-purple-800' : 'bg-purple-100 text-purple-800 border-purple-300'
                  }`}>
                    25% Grant Pool
                  </span>
                </div>
                <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-[#0b1f3a]/85'}`}>
                  Each verified $COOKIE burned awards <strong>10 Baker Karma points</strong>. Vault deposits add <strong>1 point</strong> per $COOKIE. Points determine your tier (<em>Novice Baker</em>, <em>Apprentice</em>, <em>Master Oven Guard</em>, <em>Sentinel Grandmaster</em>) and grant eligibility for the retroactive 25% hackathon community grant pool.
                </p>
              </div>

              {/* Step 5 */}
              <div className={`p-4 sm:p-5 rounded-2xl border-2 space-y-2.5 ${
                isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-[#0b1f3a] shadow-[0_2px_0_#0b1f3a]'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-500 text-white font-black flex items-center justify-center text-sm">
                      5
                    </span>
                    <h5 className="font-black text-base sm:text-lg">Cookie Atomic Vault & Proof of Reserves</h5>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                    isDark ? 'bg-amber-950 text-amber-300 border-amber-800' : 'bg-amber-100 text-amber-800 border-amber-300'
                  }`}>
                    Standby Sentinel
                  </span>
                </div>
                <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-[#0b1f3a]/85'}`}>
                  The <strong>Cookie Atomic Vault</strong> operates in honest <strong>Standby Sentinel mode</strong> to protect depositor principal from excessive slippage while on-chain DEX pools (Cookoven) build liquidity. All assets are accounted for in real-time on-chain via our <strong>Proof of Reserves</strong> (70% Cold / 20% Warm / 10% Hot).
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: ROADMAP */}
          {activeTab === 'roadmap' && (
            <div className="space-y-4">
              <div className={`p-4 rounded-2xl border-2 flex items-start gap-3.5 ${
                isDark 
                  ? 'bg-amber-950/30 border-amber-500/40 text-amber-200' 
                  : 'bg-[#fffbeb] border-[#0b1f3a] text-[#0b1f3a] shadow-[0_2px_0_#0b1f3a]'
              }`}>
                <span className="text-2xl shrink-0 mt-0.5">🎯</span>
                <div>
                  <h4 className="font-black text-sm sm:text-base uppercase tracking-wide mb-1">Protocol Strategic Horizon</h4>
                  <p className="text-xs sm:text-sm opacity-95 leading-normal">
                    A three-phase evolution plan designed to establish Cookie Chain as the primary high-speed liquidity hub for autonomous AI agents.
                  </p>
                </div>
              </div>

              {/* Phase 1 */}
              <div className={`p-4 sm:p-5 rounded-2xl border-2 space-y-3 ${
                isDark ? 'bg-slate-900/80 border-emerald-500/40' : 'bg-emerald-50/70 border-emerald-600 shadow-[0_2px_0_#059669]'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2.5 py-1 rounded-md bg-emerald-600 text-white font-black text-xs uppercase">
                      Phase 1 · Completed
                    </span>
                    <h5 className="font-black text-base sm:text-lg text-emerald-800 dark:text-emerald-300">
                      MVP & Verifiable Core Infrastructure
                    </h5>
                  </div>
                  <span className="text-emerald-600 dark:text-emerald-400 font-black text-xs sm:text-sm">✓ Delivered</span>
                </div>
                <ul className={`space-y-2 list-disc list-inside text-xs sm:text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                  <li><strong>Universal 9-Wallet SVM Adapter:</strong> Standardized connection with SIWS challenge signing across Nightly, Phantom, Backpack, Solflare, etc.</li>
                  <li><strong>Zero-Simulation Burn Engine:</strong> Replaced synthetic logs with genuine on-chain transfer and memo verifications against the RPC.</li>
                  <li><strong>Baker Karma Engine:</strong> Transparent mathematical scoring (10x per burn, 1x per vault deposit) and on-chain passport certification.</li>
                  <li><strong>Cryptographic Proof of Reserves:</strong> Real-time on-chain solvency telemetry matching Cold Vault assets directly to liabilities.</li>
                  <li><strong>Model Context Protocol (`cookie-mcp`):</strong> 14 native tools exposed for AI agents to query state, inspect blocks, and simulate execution.</li>
                </ul>
              </div>

              {/* Phase 2 */}
              <div className={`p-4 sm:p-5 rounded-2xl border-2 space-y-3 ${
                isDark ? 'bg-slate-900/80 border-amber-500/40' : 'bg-amber-50/70 border-amber-600 shadow-[0_2px_0_#d97706]'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2.5 py-1 rounded-md bg-amber-500 text-black font-black text-xs uppercase">
                      Phase 2 · In Progress
                    </span>
                    <h5 className="font-black text-base sm:text-lg text-amber-900 dark:text-amber-300">
                      Custody Hardening & Cookie Chain Liquidity
                    </h5>
                  </div>
                  <span className="text-amber-600 dark:text-amber-400 font-black text-xs sm:text-sm">⚡ Current Priority</span>
                </div>
                <ul className={`space-y-2 list-disc list-inside text-xs sm:text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                  <li><strong>Multi-Node Signer:</strong> extend treasury payouts from the current single isolated signer to a k-of-n approval across independent hosts, so no single machine can move funds.</li>
                  <li><strong>Server-Side SIWS Auth:</strong> verify wallet signatures on the server so nobody can act on another address's karma, position, or payout.</li>
                  <li><strong>Cookie Chain USD Market (prerequisite):</strong> COOK only has a USD market on Solana today; a COOK/USDC pool must exist on Cookie Chain before the vault can price or trade in USD. Until then the vault stays in transparent standby custody — no yield is claimed.</li>
                  <li><strong>Community Grant Distribution:</strong> proportional allocation of the reward pool to top Baker Karma participants.</li>
                </ul>
              </div>

              {/* Phase 3 */}
              <div className={`p-4 sm:p-5 rounded-2xl border-2 space-y-3 ${
                isDark ? 'bg-slate-900/80 border-purple-500/40' : 'bg-purple-50/70 border-purple-600 shadow-[0_2px_0_#7c3aed]'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2.5 py-1 rounded-md bg-purple-600 text-white font-black text-xs uppercase">
                      Phase 3 · Future Horizon
                    </span>
                    <h5 className="font-black text-base sm:text-lg text-purple-900 dark:text-purple-300">
                      Autonomous Swarms & Cross-Chain DAO
                    </h5>
                  </div>
                  <span className="text-purple-600 dark:text-purple-400 font-bold text-xs sm:text-sm">🔭 Horizon</span>
                </div>
                <ul className={`space-y-2 list-disc list-inside text-xs sm:text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                  <li><strong>Cross-Chain Autonomous Routing:</strong> Hyperlane-powered settlement synchronizing Cookie Chain SVM with Solana Mainnet and Base.</li>
                  <li><strong>AI Swarm Governance:</strong> Autonomous sentinel agents submitting and voting on risk parameters based on real-time volatility.</li>
                  <li><strong>Protocol Buy-Back &amp; Burn:</strong> if the protocol earns real on-chain revenue, direct a share to the Incinerator — funded only by actual surplus, never promised in advance.</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 3: DEVELOPER & API */}
          {activeTab === 'developers' && (
            <div className="space-y-4">
              <div className={`p-4 rounded-2xl border-2 flex items-start gap-3.5 ${
                isDark 
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200' 
                  : 'bg-emerald-50 border-[#0b1f3a] text-[#0b1f3a] shadow-[0_2px_0_#0b1f3a]'
              }`}>
                <span className="text-2xl shrink-0 mt-0.5">💻</span>
                <div>
                  <h4 className="font-black text-sm sm:text-base uppercase tracking-wide mb-1">Developer Integration Suite</h4>
                  <p className="text-xs sm:text-sm opacity-95 leading-normal">
                    CookieAgent Gateway provides open REST APIs and Model Context Protocol (MCP) endpoints for autonomous AI agents and automated trading systems.
                  </p>
                </div>
              </div>

              {/* REST API Card */}
              <div className={`p-4 sm:p-5 rounded-2xl border-2 space-y-3.5 ${
                isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-[#0b1f3a] shadow-[0_2px_0_#0b1f3a]'
              }`}>
                <div className="flex items-center justify-between">
                  <h5 className="font-black text-base sm:text-lg flex items-center gap-2">
                    <span>📖</span>
                    <span>Interactive REST API Specification</span>
                  </h5>
                  <a
                    href="/docs"
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm transition flex items-center gap-1 shadow-[0_2px_0_#047857]"
                  >
                    <span>Open Swagger UI</span>
                    <span>↗</span>
                  </a>
                </div>
                <p className={`text-xs sm:text-sm ${isDark ? 'text-slate-300' : 'text-[#0b1f3a]/85'}`}>
                  Full OpenAPI 3.0 documentation available with interactive request builders:
                </p>
                <div className={`p-3 rounded-xl font-mono text-xs sm:text-sm space-y-1.5 ${
                  isDark ? 'bg-black/60 text-emerald-400' : 'bg-slate-100 text-slate-800'
                }`}>
                  <div>GET  /health &bull; Liveness & RPC ping</div>
                  <div>GET  /api/v1/network/stats &bull; Cookie Chain block height & slot</div>
                  <div>GET  /api/v1/stats/burn &bull; Cumulative verified token burns</div>
                  <div>GET  /api/v1/atomic/status &bull; Vault TVL, NAV & Standby state</div>
                  <div>GET  /api/v1/atomic/proof-of-reserves &bull; Real-time PoR solvency</div>
                  <div>GET  /api/v1/airdrop/karma/{'{address}'} &bull; Baker Karma & tier</div>
                </div>
              </div>

              {/* MCP Tool Suite */}
              <div className={`p-4 sm:p-5 rounded-2xl border-2 space-y-3.5 ${
                isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-[#0b1f3a] shadow-[0_2px_0_#0b1f3a]'
              }`}>
                <div className="flex items-center justify-between">
                  <h5 className="font-black text-base sm:text-lg flex items-center gap-2">
                    <span>🤖</span>
                    <span>cookie-mcp Protocol (18 Tools)</span>
                  </h5>
                  <a
                    href="/api/v1/mcp/manifest"
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs sm:text-sm transition flex items-center gap-1 shadow-[0_2px_0_#581c87]"
                  >
                    <span>View Manifest</span>
                    <span>↗</span>
                  </a>
                </div>
                <p className={`text-xs sm:text-sm ${isDark ? 'text-slate-300' : 'text-[#0b1f3a]/85'}`}>
                  Ready-to-use bridge for AI assistants (Claude Desktop, Cursor, Codex) to programmatically orchestrate burns, query reserves, and simulate routes on Cookie Chain.
                </p>
              </div>

              {/* Network Parameters */}
              <div className={`p-4 sm:p-5 rounded-2xl border-2 space-y-2.5 ${
                isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-[#0b1f3a] shadow-[0_2px_0_#0b1f3a]'
              }`}>
                <h5 className="font-black text-xs sm:text-sm uppercase tracking-wider text-slate-500">Core Network Parameters</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs sm:text-sm">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800">
                    <span className="text-slate-500 font-bold">RPC URL:</span>
                    <span className="font-mono font-bold">https://rpc.cookiescan.io</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800">
                    <span className="text-slate-500 font-bold">Explorer:</span>
                    <span className="font-mono font-bold">https://cookiescan.io</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800">
                    <span className="text-slate-500 font-bold">Cold Vault:</span>
                    <span className="font-mono font-bold">0x5eBF...8bab</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800">
                    <span className="text-slate-500 font-bold">Burn Address:</span>
                    <span className="font-mono font-bold">1nc1nerator...</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className={`px-6 py-3.5 sm:py-4 border-t flex items-center justify-between shrink-0 ${
          isDark ? 'border-slate-800 bg-[#0a0f1d]' : 'border-[#0b1f3a]/10 bg-slate-50'
        }`}>
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <span>🍪</span>
            <span className="font-bold opacity-80">CookieAgent Gateway & Sentinel</span>
          </div>
          <button
            onClick={onClose}
            className={`px-5 py-2 rounded-xl font-black text-xs sm:text-sm cursor-pointer border-2 transition ${
              isDark 
                ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700' 
                : 'bg-[#0b1f3a] border-[#0b1f3a] text-white hover:bg-[#163359] shadow-[0_2px_0_#0b1f3a]'
            }`}
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
