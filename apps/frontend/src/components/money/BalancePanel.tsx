import Skeleton from '../ui/Skeleton';
import { formatNaira } from '../../lib/format';
import { useNavigate } from 'react-router-dom';

export default function BalancePanel({
  totalKobo,
  loading,
}: {
  totalKobo: bigint;
  availableKobo: bigint;
  reservedKobo: bigint;
  loading?: boolean;
}) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="rounded-panel p-6">
        <Skeleton className="h-36 w-full" />
      </div>
    );
  }

  return (
    <div className="honeycomb-gold relative overflow-hidden rounded-panel px-6 pb-[72px] pt-5 shadow-[0_16px_30px_-14px_rgba(197,148,64,0.7)]">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[13px] font-extrabold tracking-wide text-gold-label">TOTAL BALANCE</span>
          <div className="tabular-nums mt-0.5 text-[40px] font-black leading-tight -tracking-[1px] text-gold-text">
            {formatNaira(totalKobo)}
          </div>
        </div>
      </div>
      <div className="mt-6 flex gap-3">
        <button 
          onClick={() => navigate('/app/activity/fund')}
          className="flex-1 flex items-center justify-center gap-2 bg-[#3A2A0E] text-[#E7B84F] rounded-2xl px-4 py-3.5 text-[15px] font-black shadow-[0_4px_12px_rgba(58,42,14,0.15)] transition-transform active:scale-95"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>
          Fund
        </button>
        <button 
          onClick={() => navigate('/app/activity/withdraw')}
          className="flex-1 flex items-center justify-center gap-2 bg-white/40 border-2 border-[#3A2A0E]/10 text-[#3A2A0E] rounded-2xl px-4 py-3.5 text-[15px] font-black shadow-sm transition-transform active:scale-95"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
          Withdraw
        </button>
      </div>
    </div>
  );
}
