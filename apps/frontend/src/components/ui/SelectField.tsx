import type { SelectHTMLAttributes } from 'react';

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: { label: string; value: string }[];
}

export default function SelectField({ label, options, className = '', ...rest }: SelectFieldProps) {
  return (
    <label className="flex flex-col gap-1.5 w-full">
      <span className="pl-1 text-[13px] font-bold text-paused-text">{label}</span>
      <div className="relative">
        <select
          className={`h-[54px] w-full appearance-none rounded-2xl border-[1.5px] border-[#E7DFCC] bg-gradient-to-b from-white to-[#FBF8EF] px-4 pr-10 text-[15px] font-semibold text-ink shadow-[0_4px_10px_-4px_rgba(58,42,14,0.14)] outline-none focus:border-gold ${className}`}
          {...rest}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1E2A2E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-60">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>
    </label>
  );
}
