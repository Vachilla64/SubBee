import Skeleton from '../ui/Skeleton';
import { formatNaira } from '../../lib/format';

export default function BalancePanel({
  totalKobo,
  availableKobo,
  reservedKobo,
  loading,
}: {
  totalKobo: number;
  availableKobo: number;
  reservedKobo: number;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="rounded-panel p-6">
        <Skeleton className="h-36 w-full" />
      </div>
    );
  }

  return (
    <div className="honeycomb-gold relative overflow-hidden rounded-panel px-6 pb-14 pt-5 shadow-[0_16px_30px_-14px_rgba(197,148,64,0.7)]">
      <span className="text-[13px] font-extrabold tracking-wide text-gold-label">TOTAL BALANCE</span>
      <div className="tabular-nums mt-0.5 text-[40px] font-black leading-tight -tracking-[1px] text-gold-text">
        {formatNaira(totalKobo)}
      </div>
      <div className="mt-3 flex gap-2.5">
        <div className="flex-1 rounded-[14px] border border-[#3A2A0E] bg-white/[0.42] px-3 py-2.5">
          <div className="text-[11px] font-extrabold tracking-wide text-gold-label">AVAILABLE</div>
          <div className="tabular-nums text-base font-extrabold text-gold-text">{formatNaira(availableKobo)}</div>
        </div>
        <div className="flex-1 rounded-[14px] border border-[#3A2A0E] bg-white/[0.42] px-3 py-2.5">
          <div className="text-[11px] font-extrabold tracking-wide text-gold-label">RESERVED</div>
          <div className="tabular-nums text-base font-extrabold text-gold-text">{formatNaira(reservedKobo)}</div>
        </div>
      </div>
    </div>
  );
}
