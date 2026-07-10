import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { api } from '../../lib/api';
import { formatNaira, isUserFacingTransaction, transactionLabel } from '../../lib/format';
import Button from '../../components/ui/Button';
import { SkeletonRows } from '../../components/ui/Skeleton';

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
    <div className="flex flex-col min-h-screen bg-[#FDF7EC]">
      <div className="bg-gradient-to-br from-[#2E6264] via-[#1C4042] to-[#143032] pb-4 pt-10">
        <div className="flex flex-col items-center gap-0.5 mt-2">
          <img src="/illustrations/subbee-logo.png" alt="" className="h-7 w-8 object-contain drop-shadow-sm" />
          <span className="text-[19px] font-black text-gold-light tracking-tight">Activity</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col p-5 pb-28">
        {loading ? (
          <SkeletonRows count={4} />
        ) : txns.length === 0 ? (
          <div className="flex-1 bg-white rounded-[26px] shadow-[0_4px_16px_rgba(20,40,45,0.05)] flex flex-col items-center justify-center text-center px-[30px] py-[36px]">
            <img src="/illustrations/bee-confused-right.png" alt="" className="w-[150px] h-[150px] object-contain drop-shadow-[0_10px_16px_rgba(20,40,45,0.12)]" />
            <div className="text-[19px] font-black text-ink mt-2">Nothing buzzing yet</div>
            <div className="text-[14px] font-semibold text-ink-muted leading-relaxed max-w-[250px] mt-1.5">
              Payments, top-ups and refunds will show up here as soon as they happen.
            </div>
            <button 
              onClick={() => navigate('/app/activity/fund')} 
              className="mt-4.5 h-[50px] px-[26px] rounded-full text-[#3A2A0E] font-black text-[15px] shadow-[0_12px_22px_-10px_rgba(207,154,68,0.9)] transition-transform active:scale-95"
              style={{ background: 'linear-gradient(165deg, #F2CE7C, #E7B84F 60%, #DFAE44)' }}
            >
              Add money to start
            </button>
          </div>
        ) : (
          <>
            <div className="mb-4 flex gap-2.5">
              <Button fullWidth onClick={() => navigate('/app/activity/fund')}>
                + Add Money
              </Button>
              <Button variant="secondary" fullWidth onClick={() => navigate('/app/activity/withdraw')}>
                Withdraw
              </Button>
            </div>
            {Object.entries(groups).map(([label, rows]) => (
              <div key={label} className="mb-4">
                <div className="pb-2 pl-1 text-[13px] font-black tracking-wide text-[#8A7A55]">{label}</div>
                <div className="flex flex-col gap-2">
                  {rows.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => navigate(`/app/activity/txn/${t.id}`, { state: { txn: t } })}
                      className="flex w-full items-center gap-3 rounded-[18px] bg-white px-4 py-3.5 text-left shadow-[0_3px_12px_rgba(20,40,45,0.05)] transition-transform active:scale-95"
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
            ))}
          </>
        )}
      </div>
    </div>
  );
}
