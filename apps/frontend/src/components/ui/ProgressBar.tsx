import type { HTMLAttributes } from 'react';

interface ProgressBarProps extends HTMLAttributes<HTMLDivElement> {
  value: number;
  max: number;
}

export default function ProgressBar({ value, max, className = '', ...rest }: ProgressBarProps) {
  const percentage = Math.max(0, Math.min(100, (value / max) * 100));

  return (
    <div className={`relative h-[22px] w-full rounded-full bg-[#FCF8EE] border border-[#EAE0CA] shadow-[inset_0_1px_2px_rgba(20,40,45,0.03)] ${className}`} {...rest}>
      <div 
        className="honeycomb-gold absolute inset-[1.5px] rounded-full border border-gold-deep/30 transition-all duration-500 ease-out"
        style={{ width: `calc(${percentage}% - 3px)` }}
      />
      {percentage > 0 && (
        <img 
          src="/illustrations/subbee-logo.png" 
          alt="" 
          className="absolute z-10 h-[34px] w-9 object-contain drop-shadow-[0_3px_5px_rgba(20,40,45,0.2)] transition-all duration-500 ease-out"
          style={{ 
            left: `calc(${percentage}% - 3px)`, 
            top: '50%', 
            transform: 'translate(-50%, -50%)' 
          }}
        />
      )}
    </div>
  );
}
