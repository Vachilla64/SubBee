import { useState } from 'react';
import Button from '../ui/Button';
import { formatNaira } from '../../lib/format';

export default function ActionRequiredCard({
  merchantName,
  billKobo,
  walletKobo,
  shortfallKobo,
  accountNumber,
  onTopUp,
}: {
  merchantName: string;
  billKobo: bigint;
  walletKobo: bigint;
  shortfallKobo: bigint;
  accountNumber: string | null;
  onTopUp: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copyAccount = async () => {
    if (!accountNumber) return;
    try {
      await navigator.clipboard.writeText(accountNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable — nothing actionable
    }
  };

  return (
    <div className="rounded-[14px] border border-salmon-alertBorder bg-salmon-alertBg p-3.5">
      <div className="flex items-center gap-1.5">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C6543F" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <span className="text-sm font-black text-salmon-text">Action Required</span>
      </div>
      <p className="mt-1.5 text-[13px] font-semibold leading-snug text-[#5A4A46]">
        Top up <b className="text-salmon-text">{formatNaira(shortfallKobo)}</b> to unblock {merchantName}. Payment resumes
        automatically once your wallet covers it.
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5 text-[11.5px] font-bold text-[#8A7C78]">
        <span>Bill {formatNaira(billKobo)}</span>
        <span>·</span>
        <span>Wallet {formatNaira(walletKobo)}</span>
        <span>·</span>
        <span className="text-salmon-text">Short {formatNaira(shortfallKobo)}</span>
      </div>
      <div className="mt-2.5 rounded-[11px] border border-[#F0DED8] bg-white px-3 py-2">
        <div className="text-[10.5px] font-extrabold tracking-wide text-ink-faint">NOMBA VIRTUAL ACCOUNT</div>
        <div className="tabular-nums text-lg font-extrabold tracking-[2px] text-ink">{accountNumber ?? 'Pending'}</div>
      </div>
      <div className="mt-2.5 flex gap-2">
        <Button variant="secondary" fullWidth onClick={copyAccount} className="!py-2.5 !text-[13px] flex items-center justify-center gap-1.5">
          {copied ? 'Copied ✓' : (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#A7C4C7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
                <path d="M2 14l1.48-1.48C3.96 11.47 5.06 10.8 6.5 10.8c.28 0 .55.03.82.08"/>
                <path d="M12 15l-3-3"/>
              </svg>
              Copy Account Number
            </>
          )}
        </Button>
        <Button variant="primary" fullWidth onClick={onTopUp} className="!py-2.5 !text-[13px] shadow-none">
          Top Up Wallet
        </Button>
      </div>
    </div>
  );
}
