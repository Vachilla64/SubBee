import type { InputHTMLAttributes } from 'react';
import { useState } from 'react';

interface PhoneFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  label: string;
  tooltip?: string;
  value: string; // The full +234... value
  onChange: (val: string) => void;
}

export default function PhoneField({ label, tooltip, className = '', value, onChange, ...rest }: PhoneFieldProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  // Extract the local part (e.g. "8031234567") from the E.164 string
  let rawLocal = value;
  if (value.startsWith('+234')) {
    rawLocal = value.slice(4);
  } else if (value.startsWith('234')) {
    rawLocal = value.slice(3);
  } else {
    rawLocal = value.replace(/\D/g, '');
  }

  // Format the local part as "803 123 4567" for display
  const formatLocal = (v: string) => {
    const cleaned = v.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
    if (!match) return cleaned;
    const parts = [match[1], match[2], match[3]].filter(Boolean);
    return parts.join(' ');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value.replace(/\D/g, '');
    
    // Automatically strip leading zero if user types it (since we hardcode +234)
    if (input.startsWith('0')) {
      input = input.slice(1);
    }
    
    // Limit to 10 digits (Standard Nigerian mobile number length without the leading 0)
    input = input.slice(0, 10);
    
    // Fire onChange with the properly formatted E.164 string
    onChange(input ? `+234${input}` : '');
  };

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
              <div className="absolute left-1/2 -translate-x-1/2 bottom-[130%] w-[200px] bg-[#1E2A2E] text-[#FDF7EC] text-[11px] font-semibold p-2.5 rounded-xl shadow-xl z-50 text-center pointer-events-none transition-opacity duration-200">
                {tooltip}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-[#1E2A2E]"></div>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className={`relative flex items-center h-[54px] w-full rounded-2xl border-[1.5px] border-[#E7DFCC] bg-gradient-to-b from-white to-[#FBF8EF] shadow-[0_4px_10px_-4px_rgba(58,42,14,0.14)] focus-within:border-gold overflow-hidden transition-colors ${className}`}>
        {/* Country Code Prefix */}
        <div className="flex items-center gap-1.5 h-full px-4 bg-[#F2ECE0] border-r border-[#E7DFCC]">
          <span className="text-[18px] leading-none drop-shadow-sm">🇳🇬</span>
          <span className="text-[15px] font-black text-[#3A2A0E]">+234</span>
        </div>
        
        {/* Input Field */}
        <input
          type="tel"
          className="flex-1 h-full bg-transparent px-3 text-[16px] font-black text-ink tracking-wide outline-none placeholder:font-bold placeholder:text-[#B4BABD]/70 placeholder:tracking-normal"
          value={formatLocal(rawLocal)}
          onChange={handleInputChange}
          placeholder="800 000 0000"
          {...rest}
        />
      </div>
    </label>
  );
}
