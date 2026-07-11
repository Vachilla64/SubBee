import { useState } from 'react';
import TopBar from '../../components/layout/TopBar';
import ToggleRow from '../../components/ui/ToggleRow';

export default function Security() {
  const [biometric, setBiometric] = useState(true);
  const [confirmReveal, setConfirmReveal] = useState(true);

  return (
    <div>
      <TopBar title="Security" back />
      <div className="px-5">
        <div className="mb-4 flex items-start gap-2.5 rounded-2xl border border-[#DBD1EC] bg-[#EFEAF6] px-3.5 py-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7A5EA8" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <span className="text-xs font-bold leading-relaxed text-[#5A4C72]">
            Preview only - most of these controls aren't wired to the server yet.
          </span>
        </div>

        <div className="mb-2 pl-1 text-[11px] font-extrabold uppercase tracking-wide text-ink-faint">Security</div>
        <div className="overflow-hidden rounded-[18px] bg-white shadow-[0_3px_12px_rgba(20,40,45,0.05)]">
          <div className="border-b border-[#F1EEE7]">
            <ToggleRow title="Biometric unlock" subtitle="Face ID to open SubBee" checked={biometric} onChange={setBiometric} />
          </div>
          <div className="border-b border-[#F1EEE7]">
            <ToggleRow
              title="Confirm before revealing card"
              subtitle="Extra tap to show full details"
              checked={confirmReveal}
              onChange={setConfirmReveal}
            />
          </div>
          <div className="border-b border-[#F1EEE7]">
            <ToggleRow title="Two-factor authentication" subtitle="Not yet available on the server" checked={false} disabled disabledLabel="COMING SOON" />
          </div>
          <div className="flex items-center gap-3 px-4 py-3.5 opacity-60">
            <span className="flex-1 text-[14.5px] font-extrabold text-ink">Change transaction PIN</span>
            <span className="rounded-full bg-[#F1EEE7] px-3 py-1.5 text-[10.5px] font-extrabold text-[#8A7A55]">COMING SOON</span>
          </div>
        </div>
      </div>
    </div>
  );
}
