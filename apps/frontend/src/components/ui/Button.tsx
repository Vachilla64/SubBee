import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'caution' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  fullWidth?: boolean;
  children: ReactNode;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'gold-pill text-gold-text shadow-[0_6px_14px_-6px_rgba(207,154,68,0.7)]',
  secondary: 'bg-teal-soft text-teal',
  caution: 'bg-salmon-bg2 text-salmon-text',
  ghost: 'bg-white text-ink border border-ink/10',
};

export default function Button({
  variant = 'primary',
  fullWidth,
  className = '',
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-extrabold transition-transform active:scale-95 disabled:opacity-50 disabled:active:scale-100 ${VARIANT_CLASSES[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
}
