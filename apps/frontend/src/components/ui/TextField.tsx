import type { InputHTMLAttributes } from 'react';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export default function TextField({ label, className = '', ...rest }: TextFieldProps) {
  return (
    <label className="flex flex-col gap-1.5 w-full">
      <span className="pl-1 text-[13px] font-bold text-paused-text">{label}</span>
      <input
        className={`h-[54px] w-full rounded-2xl border-[1.5px] border-[#E7DFCC] bg-gradient-to-b from-white to-[#FBF8EF] px-4 text-[15px] font-semibold text-ink shadow-[0_4px_10px_-4px_rgba(58,42,14,0.14)] outline-none placeholder:font-medium placeholder:text-[#B4BABD] focus:border-gold ${className}`}
        {...rest}
      />
    </label>
  );
}
