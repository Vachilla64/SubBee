type Status = 'active' | 'paused' | 'insufficient' | 'frozen' | 'inactive' | 'creating' | 'cancelled';

const STATUS: Record<Status, { label: string; icon: string; className: string }> = {
  active: { label: 'ACTIVE', icon: '✓', className: 'bg-active-bg border-[1.5px] border-active-border text-active-text' },
  paused: { label: 'PAUSED', icon: '⏸', className: 'bg-paused-bg text-paused-text' },
  insufficient: { label: 'INSUFFICIENT\nFUNDS', icon: '', className: 'bg-salmon-bg text-salmon-text text-center leading-[1.15]' },
  frozen: { label: 'FROZEN', icon: '❄', className: 'bg-teal-soft text-teal' },
  inactive: { label: 'INACTIVE', icon: '·', className: 'bg-paused-bg text-paused-text' },
  creating: { label: 'CREATING', icon: '…', className: 'bg-gold-light/40 text-gold-text' },
  cancelled: { label: 'CANCELLED', icon: '×', className: 'bg-paused-bg text-paused-text' },
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
      ) : (
        <span>{s.label}</span>
      )}
    </span>
  );
}
