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
  let statusIcon: React.ReactNode = null;

  switch (status) {
    case 'awaiting_card':
      statusText = 'Awaiting virtual card creation...';
      statusIcon = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>;
      statusColor = 'text-gold-dark';
      break;
    case 'insufficient':
      statusText = 'Insufficient funds for upcoming charge';
      statusIcon = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
      statusColor = 'text-salmon-text';
      break;
    case 'awaiting_charge':
      statusText = 'Auto-detecting on next charge...';
      statusIcon = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>;
      statusColor = 'text-gold-dark';
      break;
    case 'needs_review':
      statusText = 'Action required: Review setup';
      statusIcon = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
      statusColor = 'text-salmon-text';
      break;
    case 'active':
      {
        const days = getDaysUntil(sub.billingDay);
        if (days === 0) {
          statusText = 'Charging today';
          statusIcon = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>;
          statusColor = 'text-gold-dark';
        } else {
          statusText = `Next charge in ${days} days`;
          statusIcon = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
          statusColor = 'text-ink-muted';
        }
      }
      break;
    case 'paused':
      statusText = 'Subscription is paused';
      statusIcon = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>;
      statusColor = 'text-ink-muted/70';
      break;
  }

  return (
    <button
      onClick={onClick ?? (() => navigate(`/app/subscriptions/${sub.id}`))}
      className={`flex w-full flex-col text-left transition-all duration-300 active:scale-[0.98] group ${
        embedded ? 'py-3' : 'rounded-[24px] bg-white border border-[#EAE7DF]/60 p-4 shadow-[0_4px_16px_rgba(20,40,45,0.03)] hover:shadow-[0_8px_24px_rgba(231,201,126,0.15)] hover:border-gold/40 hover:-translate-y-0.5 mb-3 relative overflow-hidden'
      }`}
    >
      <div className="flex w-full items-start justify-between gap-3 relative z-10">
        <div className="flex gap-3.5">
          <img
            src={`/icons/${sub.merchantId}.png`}
            alt=""
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.visibility = 'hidden';
            }}
            className="h-[48px] w-[48px] shrink-0 rounded-[16px] bg-gradient-to-br from-[#FDFBF7] to-[#F4EFE6] object-contain p-2.5 border border-white shadow-[0_2px_8px_rgba(20,40,45,0.06)] group-hover:scale-105 transition-transform duration-300"
          />
          <div className="flex flex-col mt-0.5">
            <span className="text-[17px] font-black text-ink leading-tight tracking-tight group-hover:text-gold-dark transition-colors duration-300">{sub.merchantName}</span>
            {sub.billingDay && (
              <span className="text-[12px] font-bold text-ink-muted mt-1 flex items-center gap-1.5">
                Monthly • {getOrdinalSuffix(sub.billingDay)}
                {sub.remindersEnabled && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-[#EAE7DF]" />
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gold-dark"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                  </>
                )}
              </span>
            )}
          </div>
        </div>
        
        <div className="text-right flex flex-col items-end gap-1 mt-0.5">
          {sub.needsConfirmation && sub.amountKobo <= 1n ? (
            <span className="flex items-center gap-1 text-[#3A2A0E] text-[10px] font-black tracking-widest uppercase bg-gradient-to-r from-[#F2CE7C] to-[#E7B84F] px-2.5 py-1 rounded-md shadow-sm border border-white/40 ring-1 ring-black/5">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
              Auto
            </span>
          ) : (
            <span className="tabular-nums text-[17px] font-black text-ink tracking-tight drop-shadow-sm">
              {formatNaira(sub.amountKobo)}
            </span>
          )}
        </div>
      </div>
      
      <div className="my-3.5 h-[1.5px] w-full bg-gradient-to-r from-[#F2ECE0]/40 via-[#F2ECE0] to-[#F2ECE0]/40 group-hover:via-gold/20 transition-colors duration-500" />
      
      <div className={`flex items-center justify-between w-full`}>
        <div className={`text-[12.5px] font-bold flex items-center gap-2.5 ${statusColor}`}>
          <div className={`flex items-center justify-center p-1.5 rounded-[10px] ${statusColor.replace('text-', 'bg-').split('/')[0]}/10`}>
             {statusIcon}
          </div>
          <span className="tracking-wide">{statusText}</span>
        </div>
        <div className="text-ink-muted/30 group-hover:text-gold group-hover:translate-x-1 transition-all duration-300">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </div>
      </div>
    </button>
  );
}
