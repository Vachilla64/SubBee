import { useEffect, useState } from 'react';
import TopBar from '../../components/layout/TopBar';
import Skeleton from '../../components/ui/Skeleton';
import { api } from '../../lib/api';
import { formatNaira } from '../../lib/format';

interface TrustMetrics {
  balanceIntegrity: string;
  zeroSum: string;
  overdraftCheck: string;
  floatKobo: bigint;
  poolKobo: bigint;
  stats: { usersCount: number; subsCount: number; ledgerCount: number };
}

function StatusCard({ label, value }: { label: string; value: string }) {
  const passed = value === 'Passed';
  return (
    <div className="rounded-2xl bg-white p-4 shadow-[0_3px_12px_rgba(20,40,45,0.05)]">
      <div className="text-[11px] font-extrabold uppercase tracking-wide text-ink-faint">{label}</div>
      <div className={`mt-1 text-sm font-black ${passed ? 'text-active-text' : 'text-salmon-text'}`}>
        {passed ? '🟢 Passed' : `🔴 ${value}`}
      </div>
    </div>
  );
}

export default function OpsDashboard() {
  const [metrics, setMetrics] = useState<TrustMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getTrustMetrics()
      .then(setMetrics)
      .catch(() => setMetrics(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <TopBar title="Developer Tools" subtitle="Ledger invariants & provider liquidity — internal only" back />
      <div className="flex flex-col gap-3.5 px-5 pb-6">
        {loading ? (
          <Skeleton className="h-64 w-full rounded-2xl" />
        ) : !metrics ? (
          <p className="text-sm font-semibold text-ink-muted">Couldn't load trust metrics.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-2.5">
              <StatusCard label="Balance Integrity" value={metrics.balanceIntegrity} />
              <StatusCard label="Zero-Sum Balance" value={metrics.zeroSum} />
              <StatusCard label="Overdraft Protection" value={metrics.overdraftCheck} />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-2xl bg-white p-4 shadow-[0_3px_12px_rgba(20,40,45,0.05)]">
                <div className="text-[11px] font-extrabold uppercase tracking-wide text-ink-faint">Bridgecard Float</div>
                <div className="tabular-nums mt-1 text-lg font-black text-ink">{formatNaira(metrics.floatKobo)}</div>
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-[0_3px_12px_rgba(20,40,45,0.05)]">
                <div className="text-[11px] font-extrabold uppercase tracking-wide text-ink-faint">Nomba Pool</div>
                <div className="tabular-nums mt-1 text-lg font-black text-ink">{formatNaira(metrics.poolKobo < 0n ? -metrics.poolKobo : metrics.poolKobo)}</div>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-[0_3px_12px_rgba(20,40,45,0.05)]">
              <div className="mb-2 text-sm font-black text-ink">Core Platform Stats</div>
              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="rounded-xl bg-cream-bg p-3">
                  <div className="text-xl font-black text-gold-text">{metrics.stats.usersCount}</div>
                  <div className="text-[10px] font-extrabold uppercase tracking-wide text-ink-faint">Users</div>
                </div>
                <div className="rounded-xl bg-cream-bg p-3">
                  <div className="text-xl font-black text-gold-text">{metrics.stats.subsCount}</div>
                  <div className="text-[10px] font-extrabold uppercase tracking-wide text-ink-faint">Subs</div>
                </div>
                <div className="rounded-xl bg-cream-bg p-3">
                  <div className="text-xl font-black text-gold-text">{metrics.stats.ledgerCount}</div>
                  <div className="text-[10px] font-extrabold uppercase tracking-wide text-ink-faint">Ledger rows</div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
