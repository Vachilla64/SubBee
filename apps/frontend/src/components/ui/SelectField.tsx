import type { SelectHTMLAttributes } from 'react';
import { useState } from 'react';

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: { label: string; value: string }[];
  tooltip?: string;
}

export default function SelectField({ label, options, tooltip, className = '', ...rest }: SelectFieldProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <label className={`flex flex-col gap-1.5 w-full relative ${showTooltip ? 'z-50' : ''}`}>
      <div className="flex items-center gap-1.5 pl-1">
        <span className="text-[13px] font-bold text-paused-text">{label}</span>
        {tooltip && (
          <div 
            className="relative flex items-center justify-center cursor-pointer"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onClick={(e) => {
              e.preventDefault();
              setShowTooltip(!showTooltip);
            }}
          >
            <div className="w-[15px] h-[15px] rounded-full bg-[#E7DFCC] text-white flex items-center justify-center text-[10px] font-extrabold hover:bg-[#DFAE44] transition-colors">
              i
            </div>
            {showTooltip && (
              <div className="absolute left-1/2 -translate-x-1/2 bottom-[130%] w-[180px] bg-[#1E2A2E] text-[#FDF7EC] text-[11px] font-semibold p-2.5 rounded-xl shadow-xl z-50 text-center pointer-events-none transition-opacity duration-200">
                {tooltip}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-[#1E2A2E]"></div>
              </div>
            )}
          </div>
        )}
      </div>
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
