import React, { useState, useEffect } from 'react';
import { apiUrl } from '../config/api';

interface CrumbOpportunity {
  id: string;
  pair: string;
  pool_a: string;
  pool_b: string;
  price_a: number;
  price_b: number;
  spread_pct: number;
  est_profit_cookie: number;
  gas_cost_cookie: number;
  target_slot: number;
  status: string;
  recommended_action: string;
}

interface CookieCrumbsRadarProps {
  connectedAddress: string | null;
  onOpenWalletModal: () => void;
  onRefreshBalance: () => void;
  onAddLog: (tag: string, msg: string, color?: string) => void;
}

export const CookieCrumbsRadar: React.FC<CookieCrumbsRadarProps> = ({
  connectedAddress,
  onOpenWalletModal,
  onRefreshBalance,
  onAddLog
}) => {
  const [crumbs, setCrumbs] = useState<CrumbOpportunity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [eatingId, setEatingId] = useState<string | null>(null);
  const [lastEatResult, setLastEatResult] = useState<any | null>(null);

  const fetchRadar = async () => {
    try {
      const res = await fetch(apiUrl('/api/v1/opportunities/radar'));
      if (res.ok) {
        const data = await res.json();
        setCrumbs(data.crumbs || []);
      }
    } catch (err) {
      console.warn('Failed to load arbitrage radar:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRadar();
    const interval = setInterval(fetchRadar, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleEatCrumb = async (crumb: CrumbOpportunity) => {
    if (!connectedAddress) {
      onOpenWalletModal();
      return;
    }

    setEatingId(crumb.id);
    onAddLog('CRUMB_HUNT', `Locking arbitrage spread of ${crumb.spread_pct}% on ${crumb.pair}...`, 'text-amber-400');

    try {
      const res = await fetch(apiUrl('/api/v1/opportunities/eat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opportunity_id: crumb.id,
          user_address: connectedAddress
        })
      });

      if (res.ok) {
        const data = await res.json();
        setLastEatResult(data);
        onAddLog(
          'CRUMB_EATEN',
          `Arbitrage executed! User payout: +${data.incentive_split.user_payout_cookie} COOKIE | Burned: +${data.incentive_split.burned_cookie} COOKIE`,
          'text-emerald-400'
        );
        onRefreshBalance();
      }
    } catch (err: any) {
      onAddLog('CRUMB_ERROR', `Arbitrage execution error: ${err?.message || err}`, 'text-red-400');
    } finally {
      setEatingId(null);
    }
  };

  return (
    <div className="neo-card p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-[#0b1f3a]/15 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#fed7aa] border-2 border-[#0b1f3a] shadow-[0_2px_0_#0b1f3a] flex items-center justify-center text-xl">
            🍪
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-[#0b1f3a]">Cookie Crumbs Radar</h2>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#86efac] border-2 border-[#0b1f3a] text-[#0b1f3a]">
                ● ARBITRAGE LIVE
              </span>
            </div>
            <p className="text-[11px] font-bold text-[#0b1f3a]/65">
              Democratized MEV &bull; 80% User Payout &bull; 10% Cookie Jar &bull; 10% $COOKIE Burn
            </p>
          </div>
        </div>

        <button
          onClick={fetchRadar}
          className="px-3 py-1.5 rounded-xl text-xs font-black bg-white hover:bg-[#d8f1ff] border-2 border-[#0b1f3a] shadow-[0_2px_0_#0b1f3a] transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <span>🔄</span> Refresh Spreads
        </button>
      </div>

      {/* Intro Note */}
      <div className="bg-[#fffbeb] p-3 rounded-2xl border-2 border-[#d97706]/30 text-xs font-medium text-[#78350f] leading-relaxed">
        <strong>How it works:</strong> Cookie Chain AMMs occasionally drift in price. Our centinels spot the spreads in real time. Instead of private bots taking 100%, <strong>you can capture it with 1 click</strong>: 80% goes to your wallet, 10% fills the community Cookie Jar, and 10% is burned forever to support $COOKIE.
      </div>

      {/* Crumbs Opportunities List */}
      {loading ? (
        <div className="py-8 text-center text-xs font-bold text-[#0b1f3a]/60 animate-pulse">
          Scanning Cookie Chain AMMs and orderbooks for fresh crumbs...
        </div>
      ) : (
        <div className="space-y-3">
          {crumbs.map((crumb) => (
            <div
              key={crumb.id}
              className="p-4 rounded-2xl border-2 border-[#0b1f3a] bg-white shadow-[0_3px_0_#0b1f3a] flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm text-[#0b1f3a]">{crumb.pair}</span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#dcfce7] text-[#166534] border border-[#166534]">
                    +{crumb.spread_pct}% Spread
                  </span>
                  <span className="text-[10px] mono text-[#0b1f3a]/50">Slot #{crumb.target_slot}</span>
                </div>

                <div className="text-[11px] text-[#0b1f3a]/75 flex flex-wrap items-center gap-2">
                  <span>
                    <strong>Routes:</strong> {crumb.pool_a} &rarr; {crumb.pool_b}
                  </span>
                  <span>&bull;</span>
                  <span className="text-emerald-700 font-bold">
                    Est. Profit: +{crumb.est_profit_cookie} COOKIE
                  </span>
                  <span>&bull;</span>
                  <span className="mono text-[10px]">Gas: ~0.000005 COOKIE</span>
                </div>

                <div className="text-[10px] font-bold text-[#0b1f3a]/60">
                  ⚡ Action: {crumb.recommended_action}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEatCrumb(crumb)}
                  disabled={eatingId === crumb.id}
                  className="w-full md:w-auto px-4 py-2.5 rounded-2xl text-xs font-black neo-btn bg-[#fed7aa] hover:bg-[#fdba74] text-[#0b1f3a] border-2 border-[#0b1f3a] flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  {eatingId === crumb.id ? (
                    <span>⏳ Eating Crumb...</span>
                  ) : (
                    <span>🍪 Eat the Crumb (1-Click Arb)</span>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Last Result Box */}
      {lastEatResult && (
        <div className="p-4 rounded-2xl bg-[#f0fdf4] border-2 border-[#166534] shadow-[0_3px_0_#166534] text-xs mono space-y-2 mt-3 animate-fade-in">
          <div className="text-[#166534] font-black flex items-center gap-1.5 text-sm">
            <span>✓</span> Arbitrage Opportunity Captured & Confirmed!
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center pt-1">
            <div className="bg-white p-2 rounded-xl border border-[#166534]/30">
              <span className="text-[10px] text-[#166534]/70 block font-bold">Your Payout (80%)</span>
              <span className="text-sm font-black text-[#166534]">
                +{lastEatResult.incentive_split.user_payout_cookie} COOKIE
              </span>
            </div>
            <div className="bg-white p-2 rounded-xl border border-[#d97706]/30">
              <span className="text-[10px] text-[#d97706]/70 block font-bold">Cookie Jar (10%)</span>
              <span className="text-sm font-black text-[#d97706]">
                +{lastEatResult.incentive_split.cookie_jar_cookie} COOKIE
              </span>
            </div>
            <div className="bg-white p-2 rounded-xl border border-red-500/30">
              <span className="text-[10px] text-red-600/70 block font-bold">Burned Forever (10%)</span>
              <span className="text-sm font-black text-red-600">
                🔥 {lastEatResult.incentive_split.burned_cookie} COOKIE
              </span>
            </div>
          </div>
          <div className="text-[11px] text-[#0b1f3a]/80 break-all pt-1">
            <strong>Receipt Memo:</strong> {lastEatResult.on_chain_memo}<br />
            <strong>Proof Signature:</strong> <span className="font-bold">{lastEatResult.tx_signature}</span>
          </div>
        </div>
      )}
    </div>
  );
};
