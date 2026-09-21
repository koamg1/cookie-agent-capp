import React, { useState, useEffect } from 'react';
import { apiUrl } from '../config/api';

interface AirdropPassportModalProps {
  isOpen: boolean;
  onClose: () => void;
  connectedAddress: string | null;
  activeWalletType: string | null;
  onAddLog: (tag: string, msg: string, color?: string) => void;
  themeMode?: 'light' | 'dark';
}

export const AirdropPassportModal: React.FC<AirdropPassportModalProps> = ({
  isOpen,
  onClose,
  connectedAddress,
  activeWalletType,
  onAddLog,
  themeMode = 'light'
}) => {
  const [karmaData, setKarmaData] = useState<any | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const isDark = themeMode === 'dark';

  useEffect(() => {
    if (!isOpen) return;

    fetch(apiUrl('/api/v1/karma/leaderboard'))
      .then((res) => res.json())
      .then((data) => setLeaderboard(data.leaderboard || []))
      .catch((err) => console.warn('Failed to load leaderboard:', err));

    if (!connectedAddress) {
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(apiUrl(`/api/v1/airdrop/karma/${connectedAddress}`))
      .then((res) => res.json())
      .then((data) => setKarmaData(data))
      .catch((err) => console.warn('Failed to load karma data:', err))
      .finally(() => setLoading(false));
  }, [isOpen, connectedAddress]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0b1f3a]/60 backdrop-blur-sm animate-fade-in">
      <div className={`neo-card ${isDark ? 'bg-[#0b1426] text-slate-100 border-slate-700' : 'bg-white text-[#0b1f3a] border-[#0b1f3a]'} max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto`}>
        
        {/* Header */}
        <div className={`flex items-center justify-between border-b-2 ${isDark ? 'border-slate-800' : 'border-[#0b1f3a]/15'} pb-3`}>
          <div className="flex items-center gap-2">
            <span className="text-2xl">⭐</span>
            <div>
              <h3 className={`text-base font-black ${isDark ? 'text-slate-100' : 'text-[#0b1f3a]'}`}>Baker Karma & Retroactive Rewards</h3>
              <p className={`text-[11px] font-bold ${isDark ? 'text-slate-400' : 'text-[#0b1f3a]/65'}`}>Verified On-Chain Burns & Community Reputation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`w-8 h-8 rounded-full border-2 ${isDark ? 'border-slate-600 bg-red-950 text-red-200 hover:bg-red-900' : 'border-[#0b1f3a] bg-[#fee2e2] text-[#0b1f3a] hover:bg-[#fca5a5]'} font-black text-sm flex items-center justify-center cursor-pointer transition-colors`}
          >
            ✕
          </button>
        </div>

        {!connectedAddress ? (
          <div className="py-8 text-center space-y-3">
            <p className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-[#0b1f3a]/75'}`}>
              Connect your wallet (Nightly, Phantom, or Backpack) to view your accumulated Baker Karma points from verified on-chain burns.
            </p>
          </div>
        ) : loading ? (
          <div className={`py-8 text-center text-xs font-bold ${isDark ? 'text-slate-400' : 'text-[#0b1f3a]/60'} animate-pulse`}>
            Auditing on-chain telemetry and Baker Karma for {connectedAddress.slice(0, 8)}...
          </div>
        ) : (
          <div className="space-y-4">
            {/* Tier Banner */}
            <div className={`p-4 rounded-2xl ${isDark ? 'bg-amber-950/40 border-amber-500/50' : 'bg-[#ffe0a8] border-[#0b1f3a] shadow-[0_3px_0_#0b1f3a]'} border-2 flex items-center justify-between`}>
              <div>
                <span className={`text-[10px] uppercase font-black ${isDark ? 'text-amber-400' : 'text-[#0b1f3a]/70'} block`}>Baker Tier</span>
                <span className={`text-lg font-black ${isDark ? 'text-amber-200' : 'text-[#0b1f3a]'} flex items-center gap-1.5 mt-0.5`}>
                  ⭐ {karmaData?.airdrop_tier || 'Novice Baker'}
                </span>
                <span className="text-[11px] font-bold text-emerald-500">
                  Multiplier: {karmaData?.airdrop_multiplier || '1.0x'}
                </span>
              </div>
              <div className="text-right">
                <span className={`text-[10px] uppercase font-black ${isDark ? 'text-amber-400' : 'text-[#0b1f3a]/70'} block`}>Baker Karma</span>
                <span className={`text-2xl font-black ${isDark ? 'text-amber-200' : 'text-[#0b1f3a]'} mono`}>
                  {karmaData?.baker_karma_score || 0}
                </span>
                <span className={`text-[10px] block font-bold ${isDark ? 'text-amber-400/80' : 'text-[#0b1f3a]/60'}`}>pts</span>
              </div>
            </div>

            {/* Anti-Sybil & Streak Status Banner */}
            <div className={`p-3 rounded-xl ${isDark ? 'bg-emerald-950/30 border-emerald-500/30' : 'bg-[#f0fdf4] border-[#059669]/30'} border-2 flex items-center justify-between text-xs`}>
              <div className="flex items-center gap-2">
                <span className="text-base">🛡️</span>
                <div>
                  <span className={`font-extrabold ${isDark ? 'text-emerald-400' : 'text-[#065f46]'} block text-[11px]`}>Anti-Sybil & 48h Burning Streak</span>
                  <span className={`text-[10px] ${isDark ? 'text-emerald-300/80' : 'text-[#047857]'}`}>
                    Burns &ge; 1.0 COOK &bull; {karmaData?.streak_active ? `🔥 Active Streak (${karmaData?.streak_multiplier}x)` : '⏳ Inactive Streak (1.0x)'}
                  </span>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${karmaData?.streak_active ? (isDark ? 'bg-emerald-900/60 border-emerald-500 text-emerald-300' : 'bg-[#86efac] border-[#059669] text-[#065f46]') : (isDark ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-[#e2e8f0] border-[#94a3b8] text-[#475569]')}`}>
                {karmaData?.streak_active ? '1.5x MAX BOOST' : 'BASE 1.0x'}
              </span>
            </div>

            {/* Metrics Breakdown */}
            <div className="grid grid-cols-2 gap-2.5 text-xs mono">
              <div className={`p-3 rounded-xl border ${isDark ? 'border-slate-800 bg-[#0f1d36]' : 'border-[#0b1f3a]/20 bg-[#f8fafc]'}`}>
                <span className={`${isDark ? 'text-slate-400' : 'text-[#0b1f3a]/60'} block text-[10px]`}>🔥 Eligible Burns (&ge;1 COOK)</span>
                <span className="font-black text-sm text-red-500">
                  {(karmaData?.eligible_burned_cookie ?? karmaData?.burned_cookie_verified ?? 0).toFixed(2)} COOK
                </span>
                <span className={`text-[9px] ${isDark ? 'text-slate-500' : 'text-[#0b1f3a]/50'} block mt-0.5`}>
                  {karmaData?.eligible_burn_events_count ?? karmaData?.burn_events_count ?? 0} eligible event(s)
                </span>
              </div>

              <div className={`p-3 rounded-xl border ${isDark ? 'border-slate-800 bg-[#0f1d36]' : 'border-[#0b1f3a]/20 bg-[#f8fafc]'}`}>
                <span className={`${isDark ? 'text-slate-400' : 'text-[#0b1f3a]/60'} block text-[10px]`}>🏦 Vault Standby</span>
                <span className={`font-black text-sm ${isDark ? 'text-cyan-400' : 'text-blue-700'}`}>
                  {(karmaData?.vault_deposited_cookie || 0).toFixed(2)} COOK
                </span>
                <span className={`text-[9px] ${isDark ? 'text-slate-500' : 'text-[#0b1f3a]/50'} block mt-0.5`}>
                  Non-custodial custody
                </span>
              </div>

              <div className={`p-3 rounded-xl border ${isDark ? 'border-slate-800 bg-[#0f1d36]' : 'border-[#0b1f3a]/20 bg-[#f8fafc]'}`}>
                <span className={`${isDark ? 'text-slate-400' : 'text-[#0b1f3a]/60'} block text-[10px]`}>⚖️ Karma Formula</span>
                <span className={`font-black text-xs ${isDark ? 'text-slate-200' : 'text-[#0b1f3a]'}`}>
                  (10x Burns + 1x Vault) &times; Streak
                </span>
              </div>

              <div className={`p-3 rounded-xl border ${isDark ? 'border-slate-800 bg-[#0f1d36]' : 'border-[#0b1f3a]/20 bg-[#f8fafc]'}`}>
                <span className={`${isDark ? 'text-slate-400' : 'text-[#0b1f3a]/60'} block text-[10px]`}>🏛️ Active Wallet</span>
                <span className={`font-black text-xs ${isDark ? 'text-slate-200' : 'text-[#0b1f3a]'} truncate block`}>
                  {connectedAddress ? `${connectedAddress.slice(0, 4)}...${connectedAddress.slice(-4)}` : 'Disconnected'}
                </span>
              </div>
            </div>

            {/* Retroactive Grant Note */}
            <div className={`${isDark ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200' : 'bg-[#ecfdf5] border-emerald-600/40 text-emerald-950 shadow-[0_1px_0_#059669]'} p-3.5 rounded-2xl border-2 text-[11px] leading-relaxed`}>
              <strong>🌱 Retroactive Baker Karma Grant Pool:</strong> Protocol rewards and retroactive ecosystem grants are scheduled for proportional distribution to community bakers based on verified on-chain burns recorded on CookieScan. Sybil-resistant scoring requires &ge; 1.0 COOK per transaction.
            </div>

            {/* Leaderboard Table */}
            {leaderboard.length > 0 && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-[11px] font-black uppercase">
                  <span className={isDark ? 'text-slate-300' : 'text-[#0b1f3a]'}>🏆 Top On-Chain Bakers (Karma)</span>
                  <span className="text-[9px] font-bold text-emerald-500">100% Verified</span>
                </div>
                <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1 text-xs mono">
                  {leaderboard.map((item, idx) => (
                    <div key={item.user_address} className={`p-2 rounded-xl ${isDark ? 'bg-[#0f1d36] border-slate-800' : 'bg-[#f8fafc] border-[#0b1f3a]/15'} border flex items-center justify-between`}>
                      <div className="flex items-center gap-2">
                        <span className={`font-black text-[10px] w-5 h-5 rounded-full ${isDark ? 'bg-amber-950 text-amber-300 border-amber-700' : 'bg-[#ffe0a8] text-[#0b1f3a] border-[#0b1f3a]'} border flex items-center justify-center`}>
                          #{idx + 1}
                        </span>
                        <div>
                          <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-[#0b1f3a]'} text-[11px]`}>
                            {item.user_address.slice(0, 4)}...{item.user_address.slice(-4)}
                          </span>
                          <span className={`text-[9px] ${isDark ? 'text-slate-400' : 'text-[#0b1f3a]/50'} block`}>
                            {item.eligible_burn_events ?? item.burn_events} event(s) &bull; Slot #{item.last_slot}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-red-500 text-xs">
                          {(item.eligible_burned_cookie ?? item.total_burned_cookie).toFixed(2)} COOK
                        </span>
                        <span className="text-[10px] font-bold text-purple-400 block">
                          +{item.baker_karma_pts ?? Math.round((item.eligible_burned_cookie ?? item.total_burned_cookie) * 10)} Karma
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}


          </div>
        )}

      </div>
    </div>
  );
};
