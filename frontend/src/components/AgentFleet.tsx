import React, { useState, useEffect, useMemo } from 'react';
import { apiUrl } from '../config/api';

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
  latency_ms?: number;
  is_live?: boolean;
}

interface AgentFleetProps {
  onSelectAgent: (agent: AgentInfo) => void;
  selectedAgentId?: string | null;
}

const SQUAD_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  defi: { bg: 'bg-[#dcfce7]', text: 'text-[#166534]', border: 'border-[#166534]' },
  security: { bg: 'bg-[#ffedd5]', text: 'text-[#9a3412]', border: 'border-[#9a3412]' },
  bridge: { bg: 'bg-[#f3e8ff]', text: 'text-[#6b21a8]', border: 'border-[#6b21a8]' },
  network: { bg: 'bg-[#e0f2fe]', text: 'text-[#075985]', border: 'border-[#075985]' },
  data_mcp: { bg: 'bg-[#fef9c3]', text: 'text-[#854d0e]', border: 'border-[#854d0e]' },
};

export const AgentFleet: React.FC<AgentFleetProps> = ({ onSelectAgent, selectedAgentId }) => {
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

  return (
    <div className="neo-card p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b-2 border-[#0b1f3a]/15 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#ffe0a8] border-2 border-[#0b1f3a] shadow-[0_2px_0_#0b1f3a] flex items-center justify-center text-xl">
            🤖
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-[#0b1f3a]">Telemetry Agent Sentinel Swarm</h2>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#d8f1ff] border-2 border-[#0b1f3a] text-[#0b1f3a] shadow-[0_1px_0_#0b1f3a]">
                ● 50 SENTINEL RPC PROBES
              </span>
            </div>
            <p className="text-[11px] font-bold text-[#0b1f3a]/65">
              Distributed Telemetry Agent Registry &bull; 5 Strategic Squads probing Cookie Chain SVM live health
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="w-full md:w-64">
          <input
            type="text"
            placeholder="Search 50 agents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full neo-input px-3.5 py-1.5 text-xs text-[#0b1f3a]"
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
              className={`px-3 py-1.5 rounded-xl text-xs font-black border-2 border-[#0b1f3a] transition-all cursor-pointer flex items-center gap-1.5 ${
                isActive
                  ? 'bg-[#0b1f3a] text-white shadow-[0_3px_0_#ffe0a8] -translate-y-0.5'
                  : 'bg-white hover:bg-[#d8f1ff] text-[#0b1f3a] shadow-[0_2px_0_#0b1f3a]'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                  isActive ? 'bg-white/20 text-white' : 'bg-[#0b1f3a]/10 text-[#0b1f3a]'
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
        <div className="py-12 text-center text-xs font-bold text-[#0b1f3a]/60 animate-pulse">
          Loading 50-Agent Sentinel Swarm from Cookie Chain...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-[480px] overflow-y-auto pr-1">
          {filteredAgents.map((agent) => {
            const squadStyle = SQUAD_COLORS[agent.squad] || {
              bg: 'bg-gray-100',
              text: 'text-gray-800',
              border: 'border-gray-800',
            };
            const isSelected = selectedAgentId === agent.id;

            return (
              <div
                key={agent.id}
                className={`p-3.5 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-[#0b1f3a] bg-[#ffe0a8] shadow-[0_4px_0_#0b1f3a] -translate-y-0.5'
                    : 'border-[#0b1f3a]/30 bg-white hover:border-[#0b1f3a] hover:shadow-[0_3px_0_#0b1f3a]'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-1">
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            agent.status === 'active'
                              ? 'bg-emerald-500 animate-pulse'
                              : agent.status === 'monitoring'
                              ? 'bg-amber-500'
                              : 'bg-gray-400'
                          }`}
                        />
                        <h4 className="font-black text-xs text-[#0b1f3a] leading-tight">
                          <span className="text-[#d97706]">Telemetry Sentinel:</span> {agent.name}
                        </h4>
                      </div>
                      <span className="text-[10px] mono text-[#0b1f3a]/50">{agent.id}</span>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span
                        className={`text-[9px] font-black px-2 py-0.5 rounded-md border ${squadStyle.bg} ${squadStyle.text} ${squadStyle.border}`}
                      >
                        {agent.squad_label.split('&')[0].trim()}
                      </span>
                      <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-[#dcfce7] text-[#166534] border border-[#166534] mono uppercase tracking-wider flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        LIVE PROBE
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] font-medium text-[#0b1f3a]/75 line-clamp-2 leading-snug">
                    {agent.role}
                  </p>

                  <div className="bg-[#f8fafc] p-2 rounded-xl border border-[#0b1f3a]/15 text-[10px] mono text-[#0b1f3a]/80 space-y-1">
                    <div className="flex justify-between items-center border-b border-[#0b1f3a]/10 pb-1">
                      <span className="text-[8px] font-black text-emerald-800 bg-emerald-100/90 px-1.5 py-0.5 rounded border border-emerald-400">
                        ● LIVE ON-CHAIN
                      </span>
                      <div className="flex items-center gap-2">
                        {agent.current_slot && (
                          <span className="text-[9px] font-bold text-[#0b1f3a]/70">
                            Slot #{agent.current_slot.toLocaleString()}
                          </span>
                        )}
                        <div className="flex items-center gap-1">
                          <span className="text-[#0b1f3a]/50 text-[9px]">Ping:</span>
                          <span className="font-bold text-emerald-600">{agent.latency_ms ? `${agent.latency_ms}ms` : agent.uptime}</span>
                        </div>
                      </div>
                    </div>
                    <div className="truncate pt-0.5">
                      <span className="text-[#0b1f3a]/50">Telemetry: </span>
                      <span className="text-[#0b1f3a] font-semibold">{agent.telemetry_sample}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2.5 mt-2 border-t border-[#0b1f3a]/10 flex items-center justify-between">
                  <a
                    href={`https://cookiescan.io/address/${agent.target_program}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`Inspect ${agent.target_program} on CookieScan`}
                    className="text-[9px] mono text-[#0284c7] hover:text-[#0369a1] hover:underline font-bold flex items-center gap-1 truncate max-w-[130px]"
                  >
                    <span>🔍</span>
                    <span>{agent.target_program.slice(0, 4)}...{agent.target_program.slice(-4)}</span>
                  </a>
                  <button
                    onClick={() => onSelectAgent({ ...agent, name: `Telemetry Sentinel: ${agent.name}` })}
                    className="px-2.5 py-1 rounded-xl text-[10px] font-black neo-btn bg-[#d8f1ff] hover:bg-[#86efac] text-[#0b1f3a] border border-[#0b1f3a] shadow-[0_1px_0_#0b1f3a] cursor-pointer"
                  >
                    ⚡ Bake Telemetry
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
