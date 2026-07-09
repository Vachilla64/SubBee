import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { api } from '../../lib/api';
import { formatNaira, isUserFacingTransaction, transactionLabel } from '../../lib/format';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import { SkeletonRows } from '../../components/ui/Skeleton';
import { motion } from 'framer-motion';

export interface Transaction {
  id: string;
  direction: 'credit' | 'debit';
  amountKobo: number;
  sourceType: string;
  createdAt: string;
}

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}

function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export default function TransactionHistory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [txns, setTxns] = useState<Transaction[]>([]);

  useEffect(() => {
    if (!user) return;
    api
      .getTransactions(user.email)
      .then((rows: Transaction[]) => setTxns(Array.isArray(rows) ? rows.filter((t) => isUserFacingTransaction(t.sourceType)) : []))
      .catch(() => setTxns([]))
      .finally(() => setLoading(false));
  }, [user]);

  const groups = txns.reduce<Record<string, Transaction[]>>((acc, t) => {
    const key = dayLabel(t.createdAt);
    (acc[key] ??= []).push(t);
    return acc;
  }, {});

  return (
    <div>
      <div className="teal-card-gradient rounded-b-[26px] pb-4 pt-6">
        <div className="flex items-center justify-between px-5">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-white/10 text-white transition-colors hover:bg-white/20 active:bg-white/25"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </motion.button>
          <div className="flex flex-col items-center gap-0.5">
            <img src="/illustrations/subbee-logo.png" alt="" className="h-7 w-8 object-contain" />
            <span className="text-[19px] font-black tracking-tight text-gold-light">Activity</span>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate('/app/activity/fund')}
            className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-white/10 text-white transition-colors hover:bg-white/20 active:bg-white/25"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </motion.button>
        </div>
      </div>

      <div className="px-5 pt-4">
        <Button fullWidth onClick={() => navigate('/app/activity/fund')} className="mb-4">
          + Add Money
        </Button>

        {loading ? (
          <SkeletonRows count={4} />
        ) : txns.length === 0 ? (
          <EmptyState
            mascot="/illustrations/bee-waiting.png"
            title="No activity yet"
            message="Fund your wallet to see deposits and subscription charges here."
            cta={<Button onClick={() => navigate('/app/activity/fund')}>Add Money</Button>}
          />
        ) : (
          Object.entries(groups).map(([label, rows]) => (
            <div key={label} className="mb-4">
              <div className="pb-2 pl-1 text-[13px] font-black tracking-wide text-[#8A7A55]">{label}</div>
              <div className="flex flex-col gap-2">
                {rows.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => navigate(`/app/activity/txn/${t.id}`, { state: { txn: t } })}
                    className="flex w-full items-center gap-3 rounded-[18px] bg-white px-4 py-3.5 text-left shadow-[0_3px_12px_rgba(20,40,45,0.05)]"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-gold-panelFrom to-[#E1AC46]">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3A2A0E" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                        {t.direction === 'credit' ? <path d="M12 19V5M5 12l7-7 7 7" /> : <path d="M12 5v14M19 12l-7 7-7-7" />}
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className={`tabular-nums text-[15.5px] font-black ${t.direction === 'credit' ? 'text-[#2E7D50]' : 'text-ink'}`}>
                        {t.direction === 'credit' ? '+' : '−'}
                        {formatNaira(t.amountKobo)}
                      </div>
                      <div className="truncate text-sm font-extrabold text-ink">{transactionLabel(t.sourceType)}</div>
                      <div className="text-xs font-bold text-ink-muted">{timeLabel(t.createdAt)}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
