import Button from './Button';

import BottomSheet from './BottomSheet';

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
  return (
    <BottomSheet open={open} onClose={onCancel}>
      <p className="text-xl font-extrabold text-ink tracking-tight">{title}</p>
      <p className="mt-2 text-sm font-semibold text-ink-muted leading-relaxed">{message}</p>
      <div className="mt-6 flex flex-col gap-2.5">
        <Button variant="caution" fullWidth onClick={onConfirm} className="!h-12 !text-[15px]">
          {confirmLabel}
        </Button>
        <Button variant="secondary" fullWidth onClick={onCancel} className="!h-12 !text-[15px] border-transparent">
          Cancel
        </Button>
      </div>
    </BottomSheet>
  );
}
