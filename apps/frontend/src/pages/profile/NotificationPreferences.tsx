import { useState } from 'react';
import TopBar from '../../components/layout/TopBar';
import ToggleRow from '../../components/ui/ToggleRow';

export default function NotificationPreferences() {
  const [receipts, setReceipts] = useState(true);
  const [lowBalance, setLowBalance] = useState(true);
  const [tips, setTips] = useState(false);

  return (
    <div>
      <TopBar title="Notification Preferences" back />
      <div className="px-5">
        <div className="mb-4 flex items-start gap-2.5 rounded-2xl border border-[#DBD1EC] bg-[#EFEAF6] px-3.5 py-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7A5EA8" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <span className="text-xs font-bold leading-relaxed text-[#5A4C72]">
            Preview only — these controls aren't wired to the server yet. Your live alerts still arrive on Telegram.
          </span>
        </div>

        <div className="mb-2 flex items-center justify-between pl-1">
          <span className="text-[11px] font-extrabold uppercase tracking-wide text-ink-faint">Notifications</span>
          <span className="flex items-center gap-1 text-[11px] font-extrabold text-[#2A7DA8]">via Telegram & WhatsApp</span>
        </div>
        <div className="overflow-hidden rounded-[18px] bg-white shadow-[0_3px_12px_rgba(20,40,45,0.05)]">
          <div className="border-b border-[#F1EEE7]">
            <ToggleRow title="Payment receipts" subtitle="After every successful charge" checked={receipts} onChange={setReceipts} />
          </div>
          <div className="border-b border-[#F1EEE7]">
            <ToggleRow title="Low balance alerts" subtitle="When a bill may not be covered" checked={lowBalance} onChange={setLowBalance} />
          </div>
          <div className="border-b border-[#F1EEE7]">
            <ToggleRow title="Funding failures" subtitle="Always on · critical alerts" checked disabled />
          </div>
          <ToggleRow title="Product & tips" subtitle="Occasional feature updates" checked={tips} onChange={setTips} />
        </div>
      </div>
    </div>
  );
}
