import { useNavigate } from 'react-router-dom';
import StatusChip from '../ui/StatusChip';
import { formatNaira } from '../../lib/format';

export interface SubscriptionRowData {
  id: string;
  merchantId: string;
  merchantName: string;
  amountKobo: number;
  isActive: boolean;
}

export default function SubscriptionRow({
  sub,
  insufficient,
  embedded,
  awaitingCard,
}: {
  sub: SubscriptionRowData;
  insufficient: boolean;
  /** When the row sits inside a combined card (e.g. above an inline Action Required panel),
   *  drop its own card chrome so we don't stack a white rounded shadow inside another. */
  embedded?: boolean;
  awaitingCard?: boolean;
}) {
  const navigate = useNavigate();
  const status = awaitingCard ? 'awaiting_card' : insufficient ? 'insufficient' : sub.isActive ? 'active' : 'paused';

  return (
    <button
      onClick={() => navigate(`/app/subscriptions/${sub.id}`)}
      className={`flex w-full items-center gap-3 px-3.5 py-3 text-left ${
        embedded ? '' : 'rounded-[18px] bg-white shadow-[0_3px_12px_rgba(20,40,45,0.05)]'
      }`}
    >
      <img
        src={`/icons/${sub.merchantId}.png`}
        alt=""
        onError={(e) => {
          (e.currentTarget as HTMLElement).style.visibility = 'hidden';
        }}
        className="h-[42px] w-[42px] shrink-0 rounded-xl bg-ink/5 object-contain p-1"
      />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] font-extrabold text-ink">{sub.merchantName}</div>
        <div className="tabular-nums text-[12.5px] font-bold text-ink-muted">{formatNaira(sub.amountKobo)}</div>
      </div>
      <StatusChip status={status} />
    </button>
  );
}
