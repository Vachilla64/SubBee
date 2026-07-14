type Status = 'active' | 'paused' | 'insufficient' | 'frozen' | 'inactive' | 'creating' | 'cancelled' | 'awaiting_card' | 'awaiting_charge' | 'needs_review';

const STATUS: Record<Status, { label: string; icon: string; className: string }> = {
  active: { label: 'ACTIVE', icon: '✓', className: 'bg-active-bg border-[1.5px] border-active-border text-active-text' },
  paused: { label: 'PAUSED', icon: '⏸', className: 'bg-paused-bg text-paused-text' },
  insufficient: { label: 'INSUFFICIENT\nFUNDS', icon: '', className: 'bg-salmon-bg text-salmon-text text-center leading-[1.15]' },
  frozen: { label: 'FROZEN', icon: '❄', className: 'bg-teal-soft text-teal' },
  inactive: { label: 'INACTIVE', icon: '·', className: 'bg-paused-bg text-paused-text' },
  creating: { label: 'CREATING', icon: '…', className: 'bg-gold-light/40 text-gold-text' },
  cancelled: { label: 'CANCELLED', icon: '×', className: 'bg-paused-bg text-paused-text' },
  awaiting_card: { label: 'AWAITING\nCARD', icon: '', className: 'bg-[#F1EEE7] text-[#8A7A55] text-center leading-[1.15]' },
  awaiting_charge: { label: 'AWAITING\nCHARGE', icon: '', className: 'bg-[#FFF4D6] text-[#A67E14] text-center leading-[1.15] border border-[#FBE6A4]' },
  needs_review: { label: 'NEEDS\nREVIEW', icon: '', className: 'bg-[#FFE7D6] text-[#A64714] text-center leading-[1.15] border border-[#FBC9A4]' },
};

export default function StatusChip({ status, className = '' }: { status: Status; className?: string }) {
  const s = STATUS[status];
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-extrabold leading-tight ${s.className} ${className}`}
    >
      {s.icon && <span>{s.icon}</span>}
      {status === 'insufficient' ? (
        <span>INSUFFICIENT<br />FUNDS</span>
      ) : status === 'awaiting_card' ? (
        <span>AWAITING<br />CARD</span>
      ) : status === 'awaiting_charge' ? (
        <span>AWAITING<br />CHARGE</span>
      ) : status === 'needs_review' ? (
        <span>NEEDS<br />REVIEW</span>
      ) : (
        <span>{s.label}</span>
      )}
    </span>
  );
}
