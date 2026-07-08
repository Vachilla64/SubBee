import Button from './Button';

export default function ConfirmSheet({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 sm:items-center" onClick={onCancel}>
      <div
        className="app-shell-width w-full rounded-t-[28px] bg-white p-6 pb-8 sm:rounded-[28px]"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-lg font-extrabold text-ink">{title}</p>
        <p className="mt-2 text-sm font-semibold text-ink-muted">{message}</p>
        <div className="mt-5 flex gap-3">
          <Button variant="ghost" fullWidth onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="caution" fullWidth onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
