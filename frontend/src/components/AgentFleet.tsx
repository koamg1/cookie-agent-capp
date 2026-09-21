import React, { useState, useEffect, useMemo } from 'react';
import { apiUrl, assetUrl } from '../config/api';

export interface AgentInfo {
  id: string;
  name: string;
  squad: 'defi' | 'security' | 'bridge' | 'network' | 'data_mcp';
  squad_label: string;
  role: string;
  status: 'active' | 'monitoring' | 'idle';
  uptime: string;
  target_program: string;
  telemetry_sample: string;
  current_slot?: number;
  latency_ms?: number | null;
  is_live?: boolean;
  data_mode?: 'live' | 'spec';
}

interface AgentFleetProps {
  onSelectAgent: (agent: AgentInfo) => void;
  selectedAgentId?: string | null;
  themeMode?: 'light' | 'dark';
}

const SQUAD_COLORS_LIGHT: Record<string, { bg: string; text: string; border: string }> = {
  defi: { bg: 'bg-[#dcfce7]', text: 'text-[#166534]', border: 'border-[#166534]' },
  security: { bg: 'bg-[#ffedd5]', text: 'text-[#9a3412]', border: 'border-[#9a3412]' },
  bridge: { bg: 'bg-[#f3e8ff]', text: 'text-[#6b21a8]', border: 'border-[#6b21a8]' },
  network: { bg: 'bg-[#e0f2fe]', text: 'text-[#075985]', border: 'border-[#075985]' },
  data_mcp: { bg: 'bg-[#fef9c3]', text: 'text-[#854d0e]', border: 'border-[#854d0e]' },
};

const SQUAD_COLORS_DARK: Record<string, { bg: string; text: string; border: string }> = {
  defi: { bg: 'bg-emerald-950/80', text: 'text-emerald-300', border: 'border-emerald-500/50' },
  security: { bg: 'bg-orange-950/80', text: 'text-orange-300', border: 'border-orange-500/50' },
  bridge: { bg: 'bg-purple-950/80', text: 'text-purple-300', border: 'border-purple-500/50' },
  network: { bg: 'bg-cyan-950/80', text: 'text-cyan-300', border: 'border-cyan-500/50' },
  data_mcp: { bg: 'bg-yellow-950/80', text: 'text-yellow-300', border: 'border-yellow-500/50' },
};

const AgentFleetComponent: React.FC<AgentFleetProps> = ({
  onSelectAgent,
  selectedAgentId,
  themeMode = 'light'
}) => {
  const isDark = themeMode === 'dark';
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    fetch(apiUrl('/api/v1/agents/fleet'))
      .then((res) => res.json())
      .then((data) => {
        if (data.agents && Array.isArray(data.agents)) {
          setAgents(data.agents);
        }
      })
      .catch((err) => console.warn('Failed to load agent fleet:', err))
      .finally(() => setLoading(false));
  }, []);

  const filteredAgents = useMemo(() => {
    return agents.filter((agent) => {
      const matchesSquad = activeTab === 'all' || agent.squad === activeTab;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        agent.name.toLowerCase().includes(q) ||
        agent.role.toLowerCase().includes(q) ||
        agent.id.toLowerCase().includes(q);
      return matchesSquad && matchesSearch;
    });
  }, [agents, activeTab, searchQuery]);

  const squadCounts = useMemo(() => {
    const counts: Record<string, number> = { all: agents.length };
    agents.forEach((a) => {
      counts[a.squad] = (counts[a.squad] || 0) + 1;
    });
    return counts;
  }, [agents]);

  const squadColors = isDark ? SQUAD_COLORS_DARK : SQUAD_COLORS_LIGHT;

  return (
    <div className={`p-6 space-y-5 transition-all duration-300 ${
      isDark
        ? 'rounded-3xl border-2 border-cyan-500/40 bg-[#070e1e] shadow-[0_0_25px_rgba(0,210,255,0.12)] text-slate-100'
        : 'neo-card bg-white text-[#0b1f3a]'
    }`}>
      {/* Header */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 pb-4 ${
        isDark ? 'border-cyan-500/20' : 'border-[#0b1f3a]/15'
      }`}>
        <div className="flex items-center gap-3.5">
          {/* Stylized Avatar Frame for Mascot */}
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center p-1.5 overflow-hidden shrink-0 transition-all ${
            isDark
              ? 'bg-[#0b1328] border-2 border-cyan-400 shadow-[0_0_15px_rgba(0,210,255,0.4)]'
              : 'bg-[#ffe0a8] border-[3px] border-[#0b1f3a] shadow-[0_4px_0_#0b1f3a]'
          }`}>
            <img
              src={assetUrl('/agents/hooded_agent_head.png')}
              alt="Sentinel Fleet"
              className="w-full h-full object-contain pixelated scale-110"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/agents/hooded_agent_head.png';
              }}
            />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className={`text-lg font-black tracking-tight ${
                isDark
                  ? 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-amber-300 to-emerald-300'
                  : 'text-[#0b1f3a]'
              }`}>
                {isDark ? 'Cyber-Industrial Sentinel Fleet: RPC Probes & Observers' : 'Autonomous Sentinel Fleet: RPC Probes & Telemetry'}
              </h2>
              <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border mono ${
                isDark
                  ? 'bg-cyan-950 text-cyan-300 border-cyan-400 shadow-[0_0_8px_rgba(0,210,255,0.3)]'
                  : 'bg-[#d8f1ff] border-2 border-[#0b1f3a] text-[#0b1f3a] shadow-[0_1px_0_#0b1f3a]'
              }`}>
                {`${agents.length}-AGENT REGISTRY · ${agents.filter((a) => a.is_live).length} LIVE`}
              </span>
            </div>
            <p className={`text-[11px] font-bold mt-0.5 ${isDark ? 'text-slate-400' : 'text-[#0b1f3a]/65'}`}>
              {isDark 
                ? 'Sentinel capability registry • 5 squads • live network slot from Cookie Chain SVM RPC; per-agent metrics are capability specs unless flagged LIVE'
                : 'Sentinel capability registry • 5 squads • live network slot from Cookie Chain SVM RPC; per-agent metrics are specs unless flagged LIVE'}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="w-full md:w-64">
          <input
            type="text"
            aria-label="Search sentinel agents by name, role or id"
            placeholder={isDark ? "Search 50 sentinels..." : "Search 50 agents..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full px-3.5 py-2 text-xs transition-all ${
              isDark
                ? 'bg-[#0a1324] border-2 border-cyan-500/40 text-cyan-200 placeholder-slate-500 rounded-xl focus:border-cyan-300 focus:shadow-[0_0_12px_rgba(0,210,255,0.4)] outline-none mono'
                : 'neo-input text-[#0b1f3a]'
            }`}
          />
        </div>
      </div>

      {/* Squad Tabs */}
      <div className="flex flex-wrap gap-2 pt-1">
        {[
          { id: 'all', label: 'All Fleet', icon: '🌐' },
          { id: 'defi', label: 'DeFi & Liquidity', icon: '💰' },
          { id: 'security', label: 'Security & Threats', icon: '🛡️' },
          { id: 'bridge', label: 'Hyperlane Bridges', icon: '🌉' },
          { id: 'network', label: 'Network & RPC', icon: '⚡' },
          { id: 'data_mcp', label: 'Data & MCP', icon: '🧠' },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          const count = squadCounts[tab.id] || 0;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                isActive
                  ? isDark
                    ? 'bg-[#0f1d38] text-cyan-300 border-2 border-cyan-400 shadow-[0_0_15px_rgba(0,210,255,0.35)] -translate-y-0.5'
                    : 'bg-[#0b1f3a] text-white border-2 border-[#0b1f3a] shadow-[0_3px_0_#ffe0a8] -translate-y-0.5'
                  : isDark
                    ? 'bg-[#091122] hover:bg-slate-900 text-slate-300 border border-slate-800'
                    : 'bg-white hover:bg-[#d8f1ff] text-[#0b1f3a] border-2 border-[#0b1f3a] shadow-[0_2px_0_#0b1f3a]'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                  isActive
                    ? isDark ? 'bg-cyan-500/20 text-cyan-300' : 'bg-white/20 text-white'
                    : isDark ? 'bg-slate-800 text-slate-300' : 'bg-[#0b1f3a]/10 text-[#0b1f3a]'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Agents Grid */}
      {loading ? (
        <div className={`py-12 text-center text-xs font-bold ${isDark ? 'text-cyan-400' : 'text-[#0b1f3a]/60'}`}>
          {isDark ? 'Loading 50-Sentinel Matrix from Cookie Chain SVM...' : 'Loading Fleet of 50 Sentinel Agents...'}
        </div>
      ) : (
        <div className="space-y-5 max-h-[520px] overflow-y-auto pr-1">
          {(() => {
            const liveAgents = filteredAgents.filter((a) => a.is_live);
            const roadmapAgents = filteredAgents.filter((a) => !a.is_live);
            const gridCls = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5';
            const renderCard = (agent: AgentInfo) => {
            const squadStyle = squadColors[agent.squad] || {
              bg: isDark ? 'bg-slate-800' : 'bg-gray-100',
              text: isDark ? 'text-slate-200' : 'text-gray-800',
              border: isDark ? 'border-slate-700' : 'border-gray-800',
            };
            const isSelected = selectedAgentId === agent.id;
            const locked = !agent.is_live;

            return (
              <div
                key={agent.id}
                className={`agent-card-contain p-3.5 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                  isSelected
                    ? isDark
                      ? 'border-cyan-400 bg-[#0f2347] shadow-[0_0_20px_rgba(0,210,255,0.35)] -translate-y-0.5'
                      : 'border-[#0b1f3a] bg-[#ffe0a8] shadow-[0_4px_0_#0b1f3a] -translate-y-0.5'
                    : isDark
                      ? 'border-slate-800/90 bg-[#091122] hover:border-cyan-500/60 hover:shadow-[0_0_15px_rgba(0,210,255,0.2)] text-slate-200'
                      : 'border-[#0b1f3a]/30 bg-white hover:border-[#0b1f3a] hover:shadow-[0_3px_0_#0b1f3a]'
                } ${locked ? 'opacity-50 grayscale pointer-events-none' : ''}`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-1">
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            agent.status === 'active'
                              ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.9)]'
                              : agent.status === 'monitoring'
                              ? 'bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.8)]'
                              : 'bg-gray-400'
                          }`}
                        />
                        <h4 className={`font-black text-xs leading-tight ${isDark ? 'text-white' : 'text-[#0b1f3a]'}`}>
                          <span className={isDark ? 'text-amber-400' : 'text-[#d97706]'}>
                            {isDark ? 'SVM Sentinel:' : 'Telemetry Sentinel:'}
                          </span>{' '}
                          {agent.name}
                        </h4>
                      </div>
                      <span className={`text-[10px] mono ${isDark ? 'text-slate-400' : 'text-[#0b1f3a]/50'}`}>
                        {agent.id}
                      </span>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span
                        className={`text-[9px] font-black px-2 py-0.5 rounded-md border ${squadStyle.bg} ${squadStyle.text} ${squadStyle.border}`}
                      >
                        {agent.squad_label.split('&')[0].trim()}
                      </span>
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border mono uppercase tracking-wider flex items-center gap-1 ${
                        agent.is_live
                          ? (isDark ? 'bg-emerald-950 text-emerald-300 border-emerald-500' : 'bg-[#dcfce7] text-[#166534] border-[#166534]')
                          : (isDark ? 'bg-slate-800 text-slate-400 border-slate-600' : 'bg-[#f1f5f9] text-[#475569] border-[#94a3b8]')
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${agent.is_live ? 'bg-emerald-400 shadow-[0_0_4px_#10b981]' : 'bg-slate-400'}`} />
                        {agent.is_live ? 'LIVE PROBE' : 'SPEC'}
                      </span>
                    </div>
                  </div>

                  <p className={`text-[11px] font-medium line-clamp-2 leading-snug ${
                    isDark ? 'text-slate-300' : 'text-[#0b1f3a]/75'
                  }`}>
                    {agent.role}
                  </p>

                  <div className={`p-2 rounded-xl border text-[10px] mono space-y-1 ${
                    isDark
                      ? 'bg-[#050a16] border-cyan-500/20 text-cyan-200'
                      : 'bg-[#f8fafc] border-[#0b1f3a]/15 text-[#0b1f3a]/80'
                  }`}>
                    <div className={`flex justify-between items-center border-b pb-1 ${
                      isDark ? 'border-cyan-500/20' : 'border-[#0b1f3a]/10'
                    }`}>
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border ${
                        agent.is_live
                          ? (isDark ? 'bg-emerald-950 text-emerald-300 border-emerald-500' : 'text-emerald-800 bg-emerald-100/90 border-emerald-400')
                          : (isDark ? 'bg-slate-800 text-slate-400 border-slate-600' : 'text-[#475569] bg-slate-100 border-[#94a3b8]')
                      }`}>
                        {agent.is_live ? '● LIVE ON-CHAIN' : '◦ CAPABILITY SPEC'}
                      </span>
                      <div className="flex items-center gap-2">
                        {agent.current_slot && (
                          <span className={`text-[9px] font-bold ${isDark ? 'text-slate-400' : 'text-[#0b1f3a]/70'}`}>
                            Slot #{agent.current_slot.toLocaleString()}
                          </span>
                        )}
                        <div className="flex items-center gap-1">
                          <span className={isDark ? 'text-slate-400 text-[9px]' : 'text-[#0b1f3a]/50 text-[9px]'}>
                            Ping:
                          </span>
                          <span className="font-bold text-emerald-400">
                            {agent.latency_ms ? `${agent.latency_ms}ms` : agent.uptime}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="truncate pt-0.5">
                      <span className={isDark ? 'text-slate-400' : 'text-[#0b1f3a]/50'}>
                        Telemetry:{' '}
                      </span>
                      <span className={isDark ? 'text-cyan-200 font-semibold' : 'text-[#0b1f3a] font-semibold'}>
                        {agent.telemetry_sample}
                      </span>
                    </div>
                  </div>
                </div>

                <div className={`pt-2.5 mt-2 border-t flex items-center justify-between ${
                  isDark ? 'border-slate-800' : 'border-[#0b1f3a]/10'
                }`}>
                  <a
                    href={`https://cookiescan.io/address/${agent.target_program}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`Inspect ${agent.target_program} on CookieScan`}
                    className={`text-[9px] mono font-bold flex items-center gap-1 truncate max-w-[130px] hover:underline ${
                      isDark ? 'text-cyan-400' : 'text-[#0284c7]'
                    }`}
                  >
                    <span>🔍</span>
                    <span>{agent.target_program.slice(0, 4)}...{agent.target_program.slice(-4)}</span>
                  </a>
                  <button
                    disabled={locked}
                    onClick={locked ? undefined : () => onSelectAgent({ ...agent, name: `${isDark ? 'SVM Sentinel' : 'Telemetry Sentinel'}: ${agent.name}` })}
                    title={locked ? 'Roadmap capability — not an executable live probe' : undefined}
                    className={`px-2.5 py-1 rounded-xl text-[10px] font-black transition-all ${
                      locked
                        ? (isDark
                            ? 'bg-slate-900 border border-slate-700 text-slate-500 cursor-not-allowed'
                            : 'bg-slate-100 border border-[#94a3b8] text-[#94a3b8] cursor-not-allowed')
                        : isDark
                        ? 'cursor-pointer bg-cyan-950 hover:bg-cyan-900 border border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(0,210,255,0.3)] active:scale-95'
                        : 'cursor-pointer neo-btn bg-[#d8f1ff] hover:bg-[#86efac] text-[#0b1f3a] border border-[#0b1f3a] shadow-[0_1px_0_#0b1f3a]'
                    }`}
                  >
                    {locked ? (isDark ? '🔒 Spec' : '🔒 Roadmap') : `⚡ ${isDark ? 'Bake Microstate' : 'Bake Telemetry'}`}
                  </button>
                </div>
              </div>
            );
            };
            return (
              <>
                {liveAgents.length > 0 && (
                  <section className="space-y-2.5">
                    <div className={`flex items-center gap-2 text-[11px] font-black uppercase tracking-wide ${isDark ? 'text-emerald-300' : 'text-[#166534]'}`}>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]" />
                      Live Sentinels · real on-chain reads ({liveAgents.length})
                    </div>
                    <div className={gridCls}>{liveAgents.map(renderCard)}</div>
                  </section>
                )}
                {roadmapAgents.length > 0 && (
                  <section className="space-y-2.5">
                    <div className={`flex items-center gap-2 text-[11px] font-black uppercase tracking-wide ${isDark ? 'text-slate-400' : 'text-[#475569]'}`}>
                      <span className="w-2 h-2 rounded-full bg-slate-400" />
                      Roadmap · planned capabilities ({roadmapAgents.length})
                    </div>
                    <p className={`text-[10px] font-medium ${isDark ? 'text-slate-500' : 'text-[#0b1f3a]/50'}`}>
                      Published specs on the delivery roadmap — not live measurements.
                    </p>
                    <div className={gridCls}>{roadmapAgents.map(renderCard)}</div>
                  </section>
                )}
                {liveAgents.length === 0 && roadmapAgents.length === 0 && (
                  <div className={`py-8 text-center text-xs font-bold ${isDark ? 'text-slate-500' : 'text-[#0b1f3a]/50'}`}>
                    No agents match this filter.
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export const AgentFleet = React.memo(AgentFleetComponent);
