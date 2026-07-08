export default function ToggleRow({
  title,
  subtitle,
  checked,
  onChange,
  disabled,
  disabledLabel,
}: {
  title: string;
  subtitle: string;
  checked: boolean;
  onChange?: (next: boolean) => void;
  disabled?: boolean;
  disabledLabel?: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <div className="flex-1">
        <div className={`text-[14.5px] font-extrabold ${disabled ? 'text-ink-muted' : 'text-ink'}`}>{title}</div>
        <div className={`text-[11.5px] font-semibold ${disabled ? 'text-ink-faint' : 'text-ink-muted'}`}>{subtitle}</div>
      </div>
      {disabledLabel ? (
        <span className="shrink-0 rounded-full bg-[#F1EEE7] px-3 py-1.5 text-[10.5px] font-extrabold text-[#8A7A55]">{disabledLabel}</span>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange?.(!checked)}
          className={`relative h-[27px] w-[46px] shrink-0 rounded-full transition-colors ${checked ? 'bg-gold-mid' : 'bg-paused-bg'} ${disabled ? 'opacity-70' : ''}`}
        >
          <span className={`absolute top-[3px] h-[21px] w-[21px] rounded-full bg-white shadow transition-all ${checked ? 'right-[3px]' : 'left-[3px]'}`} />
        </button>
      )}
    </div>
  );
}
