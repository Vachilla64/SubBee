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
  remindersEnabled?: boolean;
}

function getOrdinalSuffix(i: number) {
  const j = i % 10,
        k = i % 100;
  if (j == 1 && k != 11) return i + "st";
  if (j == 2 && k != 12) return i + "nd";
  if (j == 3 && k != 13) return i + "rd";
  return i + "th";
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
        ? sub.amountKobo <= 100n
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
      statusColor = 'text-gold-dark';
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
          <div>
            <div className="text-[15px] font-extrabold text-ink leading-tight">{sub.merchantName}</div>
            {sub.billingDay && (
              <div className="text-[11.5px] font-bold text-ink-muted/80 mt-0.5 flex items-center gap-1.5">
                Monthly on the {getOrdinalSuffix(sub.billingDay)}
                {sub.remindersEnabled && (
                  <>
                    <span className="opacity-40">•</span>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gold-dark"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="tabular-nums text-[14.5px] font-black text-ink shrink-0">
          {sub.needsConfirmation && sub.amountKobo <= 1n ? (
            <span className="flex items-center gap-1.5 text-gold-dark text-[13px] bg-gold-light/20 px-2 py-1 rounded-lg border border-gold/30">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
              Auto
            </span>
          ) : formatNaira(sub.amountKobo)}
        </div>
      </div>
      
      <div className="my-3 h-[1px] w-full bg-[#F2ECE0]" />
      
      <div className={`text-[12.5px] font-bold ${statusColor}`}>
        {statusText}
      </div>
    </button>
  );
}
