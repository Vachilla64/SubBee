import type { ReactNode } from 'react';
import Button from './Button';

type Variant = 'info' | 'success' | 'error' | 'warning';

interface ModalAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'caution' | 'ghost';
  disabled?: boolean;
}

interface ModalProps {
  open: boolean;
  title: string;
  message: string;
  variant?: Variant;
  actions?: ModalAction[];
  onClose: () => void;
}

const VARIANT_ICON: Record<Variant, ReactNode> = {
  info: (
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-soft">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1C4042" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <line x1="12" y1="11" x2="12" y2="16" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    </div>
  ),
  success: (
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-active-bg">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3E6247" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6L9 17l-5-5" />
      </svg>
    </div>
  ),
  error: (
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-salmon-bg2">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#B24A3C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    </div>
  ),
  warning: (
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(242,206,124,0.35)]">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7A5A22" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    </div>
  ),
};

export default function Modal({ open, title, message, variant = 'info', actions, onClose }: ModalProps) {
  if (!open) return null;

  const resolvedActions: ModalAction[] = actions ?? [{ label: 'OK', onClick: onClose, variant: 'primary' }];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 sm:items-center" onClick={onClose}>
      <div
        className="app-shell-width w-full rounded-t-[28px] bg-white p-6 pb-8 sm:rounded-[28px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center">
          {VARIANT_ICON[variant]}
          <p className="mt-3 text-lg font-extrabold text-ink">{title}</p>
          <p className="mt-2 text-sm font-semibold text-ink-muted">{message}</p>
        </div>
        <div className="mt-5 flex gap-3">
          {resolvedActions.map((action, i) => (
            <Button key={i} variant={action.variant ?? 'primary'} fullWidth onClick={action.onClick} disabled={action.disabled}>
              {action.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
