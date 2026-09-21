import React from 'react';
import { NavTab } from '../types/wallet';
import { assetUrl } from '../config/api';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenBridgeModal?: () => void;
  onOpenAirdropModal?: () => void;
  onOpenDocsModal?: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  themeMode?: 'light' | 'dark';
}

const SidebarComponent: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  onOpenBridgeModal,
  onOpenAirdropModal,
  onOpenDocsModal,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  themeMode = 'light'
}) => {
  const isDark = themeMode === 'dark';

  interface NavItem {
    id: NavTab | string;
    label: string;
    sub: string;
    icon: React.ReactNode;
    badge: string | null;
    badgeColor?: string;
    onClick: () => void;
  }

  interface NavGroup {
    group: string;
    items: NavItem[];
  }

  const navItems: NavGroup[] = [
    {
      group: 'Trade & Arbitrage',
      items: [
        {
          id: 'arbitrage' as NavTab,
          label: 'Arbitrage Radar',
          sub: 'Live DEX Spread',
          icon: '⚡',
          badge: 'LIVE',
          badgeColor: isDark 
            ? 'bg-amber-950/90 text-amber-300 border-amber-500/60 shadow-[0_0_10px_rgba(245,158,11,0.4)]' 
            : 'bg-[#fef08a] text-[#854d0e] border-[#0b1f3a]',
          onClick: () => {
            onSelectTab('arbitrage');
            onCloseMobile();
          }
        },
        {
          id: 'atomic' as NavTab,
          label: 'Atomic Agent',
          sub: 'SVM Flash Sniper',
          icon: (
            <img
              src={assetUrl('/agents/atomic_agent_avatar.png')}
              alt="Atomic Agent"
              className="w-6 h-6 object-contain pixelated inline-block"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/agents/atomic_agent_avatar.png';
              }}
            />
          ),
          badge: 'OFF',
          badgeColor: isDark 
            ? 'bg-slate-900/90 text-slate-400 border-slate-700/80' 
            : 'bg-[#e2e8f0] text-slate-600 border-[#0b1f3a]',
          onClick: () => {
            onSelectTab('atomic');
            onCloseMobile();
          }
        },
        {
          id: 'fleet' as NavTab,
          label: 'Sentinel Swarm',
          sub: 'Agents & Telemetry',
          icon: (
            <img
              src={assetUrl('/agents/hooded_agent_head.png')}
              alt="Sentinel Swarm"
              className="w-6 h-6 object-contain pixelated inline-block"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/agents/hooded_agent_head.png';
              }}
            />
          ),
          badge: 'LIVE',
          badgeColor: isDark 
            ? 'bg-cyan-950/90 text-cyan-300 border-cyan-500/60 shadow-[0_0_10px_rgba(6,182,212,0.4)]' 
            : 'bg-[#e0f2fe] text-[#0369a1] border-[#0b1f3a]',
          onClick: () => {
            onSelectTab('fleet');
            onCloseMobile();
          }
        },
        {
          id: 'burn' as NavTab,
          label: 'Burn Oven',
          sub: 'Canonical SVM Deflation',
          icon: (
            <img
              src={assetUrl('/agents/burn_agent_avatar.png?v=4')}
              alt="Burn Oven"
              className="w-6 h-6 object-contain pixelated inline-block"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/agents/burn_agent_avatar.png?v=4';
              }}
            />
          ),
          badge: 'LIVE',
          badgeColor: isDark
            ? 'bg-red-950/90 text-red-300 border-red-500/60 shadow-[0_0_10px_rgba(239,68,68,0.4)]'
            : 'bg-[#fee2e2] text-[#991b1b] border-[#0b1f3a]',
          onClick: () => {
            onSelectTab('burn');
            onCloseMobile();
          }
        }
      ]
    },
    {
      group: 'Treasury & Reserves',
      items: [
        {
          id: 'vault' as NavTab,
          label: 'Treasury Vault',
          sub: 'Bank & Proof of Reserves',
          icon: '🏛️',
          badge: 'Protected',
          badgeColor: isDark 
            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.2)]' 
            : 'bg-emerald-100 text-emerald-800 border-emerald-300',
          onClick: () => {
            onSelectTab('vault');
            onCloseMobile();
          }
        }
      ]
    },
    {
      group: 'Ecosystem & Tools',
      items: [
        {
          id: 'karma',
          label: 'Baker Karma',
          sub: 'On-Chain Passport & Rank',
          icon: '⭐',
          badge: 'cApp',
          badgeColor: isDark 
            ? 'bg-purple-950/80 text-purple-300 border-purple-500/40' 
            : 'bg-[#f3e8ff] text-[#6b21a8] border-[#0b1f3a]',
          onClick: () => {
            if (onOpenAirdropModal) onOpenAirdropModal();
            onCloseMobile();
          }
        },
        {
          id: 'bridge',
          label: 'Bridge $COOKIE',
          sub: 'Hyperlane Cross-Chain',
          icon: '🚰',
          badge: null,
          onClick: () => {
            if (onOpenBridgeModal) onOpenBridgeModal();
            onCloseMobile();
          }
        },
        {
          id: 'explorer',
          label: 'SVM Explorer',
          sub: 'CookieScan Explorer',
          icon: '🔍',
          badge: '↗',
          badgeColor: isDark 
            ? 'bg-slate-800/80 text-slate-300 border-slate-700' 
            : 'bg-slate-100 text-[#0b1f3a] border-[#0b1f3a]/30',
          onClick: () => {
            window.open('https://cookiescan.io', '_blank');
            onCloseMobile();
          }
        }
      ]
    },
    {
      group: 'Protocol & Docs',
      items: [
        {
          id: 'docs',
          label: 'Docs & Roadmap',
          sub: 'Usage Guide & Phases',
          icon: '📖',
          badge: 'Guide',
          badgeColor: isDark 
            ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50' 
            : 'bg-cyan-100 text-cyan-800 border-cyan-300',
          onClick: () => {
            if (onOpenDocsModal) {
              onOpenDocsModal();
            } else {
              window.open('/docs', '_blank');
            }
            onCloseMobile();
          }
        },
        {
          id: 'contracts',
          label: '1nc1nerator',
          sub: 'Canonical SVM Contract',
          icon: '📜',
          badge: 'SVM',
          badgeColor: isDark 
            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50' 
            : 'bg-emerald-100 text-emerald-800 border-emerald-300',
          onClick: () => {
            window.open('https://cookiescan.io/address/1nc1nerator11111111111111111111111111111111', '_blank');
            onCloseMobile();
          }
        }
      ]
    }
  ];

  const sidebarContent = (
    <div className={`h-full flex flex-col select-none ${
      isDark ? 'text-slate-200' : 'text-[#0b1f3a]'
    }`}>
      {/* Top Header: Cyber Bitten Cookie (Logo + Interactive Toggle) + Brand */}
      <div className={`shrink-0 px-3 py-3.5 flex items-center justify-between border-b transition-colors ${
        isDark ? 'border-slate-800/80 bg-[#060a14]' : 'border-[#0b1f3a]/15 bg-white/95'
      }`}>
        <div className="flex items-center gap-3 min-w-0">
          {/* Main Bitten Cyber Cookie: Clicking toggles the sidebar smoothly */}
          <button
            onClick={onToggleCollapse}
            type="button"
            title={isCollapsed ? "Click cookie to expand menu" : "Click cookie to collapse menu"}
            className={`w-10 h-10 rounded-2xl flex items-center justify-center p-1 cursor-pointer select-none transition-all duration-200 active:scale-95 group shrink-0 relative ${
              isDark
                ? 'bg-[#0b1426] border-2 border-cyan-400/60 shadow-[0_0_12px_rgba(0,210,255,0.3)] hover:border-cyan-300'
                : 'bg-white border-2 border-[#0b1f3a] shadow-[0_2px_0_#0b1f3a] hover:bg-[#fffbeb]'
            }`}
          >
            <img
              src={assetUrl('/agents/cyber_cookie_bitten.png')}
              alt="CookieAgent Cyber Cookie"
              className="w-full h-full object-contain pixelated group-hover:scale-110 group-hover:rotate-6 transition-transform duration-200"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/agents/cyber_cookie_bitten.png';
              }}
            />
          </button>
          
          {/* Title & Brand (Smooth slide & fade) */}
          <div 
            onClick={() => {
              onSelectTab('fleet');
              onCloseMobile();
            }}
            className={`flex flex-col min-w-0 cursor-pointer overflow-hidden transition-all duration-300 ease-out ${
              isCollapsed ? 'w-0 opacity-0 pointer-events-none' : 'w-auto opacity-100'
            }`}
          >
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className={`text-sm font-black tracking-tight ${
                isDark ? 'text-white' : 'text-[#0b1f3a]'
              }`}>
                CookieAgent
              </span>
              <span className={`text-[8px] font-black px-1.5 py-0.2 rounded uppercase ${
                isDark ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40' : 'bg-[#ffe0a8] border border-[#0b1f3a] text-[#0b1f3a]'
              }`}>
                cApp
              </span>
            </div>
            <span className={`text-[9px] font-bold truncate ${
              isDark ? 'text-cyan-400/75 mono' : 'text-[#0b1f3a]/60'
            }`}>
              Cookie Chain SVM
            </span>
          </div>
        </div>

        {/* Mobile Close Button (only visible on small touch screens) */}
        <button
          onClick={onCloseMobile}
          type="button"
          aria-label="Close menu"
          className={`md:hidden flex items-center justify-center w-8 h-8 rounded-lg text-sm transition-colors ${
            isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-[#0b1f3a] hover:bg-[#0b1f3a]/10'
          }`}
        >
          <span aria-hidden="true">✕</span>
        </button>
      </div>

      {/* Navigation Categories & Links */}
      <nav className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-2.5 space-y-4 [scrollbar-width:thin]">
          {navItems.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              {!isCollapsed && (
                <div className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider mono transition-opacity duration-200 ${
                  isDark ? 'text-slate-400' : 'text-[#0b1f3a]/55'
                }`}>
                  {group.group}
                </div>
              )}

              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={item.onClick}
                      title={isCollapsed ? `${item.label} (${item.sub})` : undefined}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left item-smooth cursor-pointer relative group ${
                        isActive
                          ? isDark
                            ? 'bg-[#0f1d38] text-cyan-300 border border-cyan-500/50 shadow-[0_0_15px_rgba(0,210,255,0.25)] font-black'
                            : 'bg-[#ffe0a8] text-[#0b1f3a] border-2 border-[#0b1f3a] shadow-[0_2px_0_#0b1f3a] font-black'
                          : isDark
                            ? 'text-slate-400 hover:text-white hover:bg-slate-900/90 border border-transparent font-bold'
                            : 'text-[#0b1f3a]/75 hover:text-[#0b1f3a] hover:bg-white/80 border border-transparent font-bold'
                      } ${isCollapsed ? 'justify-center px-2' : ''}`}
                    >
                      {/* Active Indicator Bar (like Jupiter) */}
                      {isActive && (
                        <div className={`absolute left-0 top-2 bottom-2 w-1 rounded-r-full ${
                          isDark ? 'bg-cyan-400 shadow-[0_0_8px_#00D2FF]' : 'bg-[#0b1f3a]'
                        }`} />
                      )}

                      {/* Icon with smooth micro-scale on hover */}
                      <span className="text-base shrink-0 group-hover:scale-110 transition-transform duration-200">
                        {item.icon}
                      </span>

                      {/* Labels (smooth collapse) */}
                      {!isCollapsed && (
                        <div className="flex-1 min-w-0 flex items-center justify-between gap-1.5 overflow-hidden transition-all duration-200">
                          <div className="truncate">
                            <span className="text-xs block truncate leading-tight">
                              {item.label}
                            </span>
                            <span className={`text-[9px] block truncate font-medium ${
                              isActive
                                ? isDark ? 'text-cyan-400/80' : 'text-[#0b1f3a]/75'
                                : isDark ? 'text-slate-400' : 'text-[#0b1f3a]/50'
                            }`}>
                              {item.sub}
                            </span>
                          </div>

                          {/* Badge Tag if any */}
                          {item.badge && (
                            <span className={`text-[8px] font-black px-1.5 py-0.2 rounded border mono shrink-0 uppercase ${
                              item.badgeColor || (isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-200 text-[#0b1f3a] border-[#0b1f3a]/20')
                            }`}>
                              {item.badge}
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      {/* Footer Status & Network Indicator */}
      <div className={`shrink-0 p-3 border-t transition-colors ${
        isDark ? 'border-slate-800/80 bg-[#060a14]' : 'border-[#0b1f3a]/15 bg-white/95'
      }`}>
        <div className={`overflow-hidden transition-all duration-200 ${
          isCollapsed ? 'h-6 flex items-center justify-center' : 'h-auto space-y-1.5'
        }`}>
          {!isCollapsed ? (
            <>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-black flex items-center gap-1.5 mono ${
                  isDark ? 'text-emerald-400' : 'text-[#065f46]'
                }`}>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Cookie Chain SVM
                </span>
                <span className={`text-[9px] font-bold mono ${
                  isDark ? 'text-slate-400' : 'text-[#0b1f3a]/60'
                }`}>
                  Live
                </span>
              </div>
              <div className={`text-[9px] font-bold mono flex items-center justify-between ${
                isDark ? 'text-slate-400' : 'text-[#0b1f3a]/50'
              }`}>
                <span>RPC: Healthy</span>
                <span>v2.4 Jupiter</span>
              </div>
            </>
          ) : (
            <div className="flex justify-center cursor-pointer" onClick={onToggleCollapse} title="Cookie Chain SVM Online - Click to expand">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar with Silky Smooth Transition */}
      <aside 
        className={`hidden md:block shrink-0 h-screen sticky top-0 sidebar-smooth z-30 overflow-hidden ${
          isCollapsed ? 'w-16' : 'w-60 lg:w-64'
        } ${
          isDark 
            ? 'bg-[#050914] border-r border-slate-800/80 shadow-[4px_0_24px_rgba(0,0,0,0.5)]' 
            : 'bg-[#d8f1ff] border-r-2 border-[#0b1f3a] shadow-[3px_0_0_#0b1f3a]'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Slide-over Drawer Overlay */}
      {isMobileOpen && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
        />
      )}

      {/* Mobile Slide-over Drawer with Smooth Slide.
          aria-hidden + inert when closed so the off-screen copy of the nav is not
          announced twice by screen readers or reachable by keyboard. */}
      <div 
        aria-hidden={!isMobileOpen}
        {...(!isMobileOpen ? { inert: '' as any } : {})}
        className={`fixed top-0 bottom-0 left-0 w-72 max-w-[85vw] z-50 md:hidden transition-transform duration-300 cubic-bezier(0.16, 1, 0.3, 1) ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        } ${
          isDark 
            ? 'bg-[#050914] border-r border-slate-800 shadow-2xl' 
            : 'bg-[#d8f1ff] border-r-2 border-[#0b1f3a] shadow-2xl'
        }`}
      >
        {sidebarContent}
      </div>
    </>
  );
};

export const Sidebar = React.memo(SidebarComponent);
