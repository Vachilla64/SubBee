import { useLocation, useNavigate } from 'react-router-dom';
import TopBar from '../../components/layout/TopBar';
import EmptyState from '../../components/ui/EmptyState';
import { formatNaira, transactionLabel } from '../../lib/format';
import type { Transaction } from './TransactionHistory';

export default function TransactionDetail() {
  const location = useLocation();
  const navigate = useNavigate();
  const txn = (location.state as { txn?: Transaction } | null)?.txn;

  if (!txn) {
    return (
      <div>
        <TopBar title="Transaction Details" back />
        <div className="px-5">
          <EmptyState
            title="Transaction not found"
            message="This link may be stale - open it again from Activity."
            cta={
              <button onClick={() => navigate('/app/activity')} className="text-sm font-extrabold text-teal">
                Back to Activity
              </button>
            }
          />
        </div>
      </div>
    );
  }

  const date = new Date(txn.createdAt);

  return (
    <div>
      <TopBar title="Transaction Details" back />
      <div className="px-5">
        <div className="relative mt-3 flex flex-col items-center rounded-[24px] border-[3px] border-active-border bg-white px-5 pb-6 pt-9 text-center shadow-[0_8px_24px_-12px_rgba(20,40,45,0.18)]">
          <div className="absolute -top-[22px] flex h-11 w-11 items-center justify-center rounded-full border-[3px] border-cream-bg bg-[#3E9B62] shadow-[0_8px_16px_-6px_rgba(62,155,98,0.7)]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <div className="text-lg font-black text-ink">{transactionLabel(txn.sourceType)}</div>
          <div className="tabular-nums mt-1 text-4xl font-black tracking-tight text-ink">
            {txn.direction === 'credit' ? '+' : '−'}
            {formatNaira(txn.amountKobo)}
          </div>
          <div className="mt-1.5 text-[13px] font-bold leading-relaxed text-ink-muted">
            {date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} ·{' '}
            {date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
          </div>
        </div>

        <div className="mt-4 rounded-[20px] bg-white p-4.5 shadow-[0_4px_16px_rgba(20,40,45,0.05)]">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-paused-text">Type</span>
            <span className="text-sm font-extrabold capitalize text-ink">{txn.direction === 'credit' ? 'Money in' : 'Money out'}</span>
          </div>
          <div className="my-2.5 h-px bg-[#F0EDE5]" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-paused-text">Reference</span>
            <span className="text-sm font-extrabold text-ink">{txn.id.slice(0, 12)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
