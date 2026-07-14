import { useNavigate } from 'react-router-dom';
import { formatNaira } from '../../lib/format';

export interface SubscriptionRowData {
  id: string;
  merchantId: string;
  merchantName: string;
  amountKobo: bigint;
  isActive: boolean;
  needsConfirmation?: boolean;
  billingDay?: number;
}

function getDaysUntil(billingDay?: number) {
  if (!billingDay) return 0;
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  let targetDate = new Date(currentYear, currentMonth, billingDay);
  if (today.getTime() > targetDate.getTime()) {
    targetDate = new Date(currentYear, currentMonth + 1, billingDay);
  }
  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays === 0 ? 0 : diffDays;
}

export default function SubscriptionRow({
  sub,
  insufficient,
  embedded,
  awaitingCard,
  onClick,
}: {
  sub: SubscriptionRowData;
  insufficient: boolean;
  embedded?: boolean;
  awaitingCard?: boolean;
  onClick?: () => void;
}) {
  const navigate = useNavigate();
  const status = awaitingCard
    ? 'awaiting_card'
    : insufficient
      ? 'insufficient'
      : sub.needsConfirmation
        ? sub.amountKobo <= 1n
          ? 'awaiting_charge'
          : 'needs_review'
        : sub.isActive
          ? 'active'
          : 'paused';

  let statusText = '';
  let statusColor = 'text-ink-muted';

  switch (status) {
    case 'awaiting_card':
      statusText = 'Awaiting virtual card creation...';
      statusColor = 'text-gold-dark';
      break;
    case 'insufficient':
      statusText = '⚠️ Insufficient funds for upcoming charge';
      statusColor = 'text-salmon-text';
      break;
    case 'awaiting_charge':
      statusText = 'Auto-detecting on next charge...';
      statusColor = 'text-teal';
      break;
    case 'needs_review':
      statusText = 'Action required: Review setup';
      statusColor = 'text-salmon-text';
      break;
    case 'active':
      {
        const days = getDaysUntil(sub.billingDay);
        statusText = days === 0 ? 'Charging today' : `Next charge in ${days} days`;
        statusColor = 'text-ink-muted';
      }
      break;
    case 'paused':
      statusText = 'Subscription is paused';
      statusColor = 'text-ink-muted/70';
      break;
  }

  return (
    <button
      onClick={onClick ?? (() => navigate(`/app/subscriptions/${sub.id}`))}
      className={`flex w-full flex-col text-left transition-all hover:bg-black/[0.02] ${
        embedded ? 'py-3' : 'rounded-[20px] bg-white px-4 py-3.5 shadow-[0_4px_16px_rgba(20,40,45,0.04)] mb-2'
      }`}
    >
      <div className="flex w-full items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <img
            src={`/icons/${sub.merchantId}.png`}
            alt=""
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.visibility = 'hidden';
            }}
            className="h-[42px] w-[42px] shrink-0 rounded-[14px] bg-ink/5 object-contain p-1.5 shadow-sm"
          />
          <div className="text-[15px] font-extrabold text-ink">{sub.merchantName}</div>
        </div>
        <div className="tabular-nums text-[14.5px] font-black text-ink">
          {sub.needsConfirmation && sub.amountKobo <= 1n ? 'Pending' : formatNaira(sub.amountKobo)}
        </div>
      </div>
      
      <div className="my-3 h-[1px] w-full bg-[#F2ECE0]" />
      
      <div className={`text-[12.5px] font-bold ${statusColor}`}>
        {statusText}
      </div>
    </button>
  );
}
