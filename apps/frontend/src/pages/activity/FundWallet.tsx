import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { useWalletData } from '../../lib/useWalletData';
import { api } from '../../lib/api';
import { formatNaira } from '../../lib/format';
import TopBar from '../../components/layout/TopBar';
import Button from '../../components/ui/Button';

export default function FundWallet() {
  const { user } = useAuth();
  const location = useLocation();
  const shortfallKobo = (location.state as { shortfallKobo?: number; merchantName?: string } | null)?.shortfallKobo;
  const merchantName = (location.state as { merchantName?: string } | null)?.merchantName;

  const { walletKobo, accountNumber, bankName, refetch } = useWalletData();
  const [copied, setCopied] = useState(false);
  const [simulating, setSimulating] = useState(false);

  const copy = async () => {
    if (!accountNumber) return;
    await navigator.clipboard.writeText(accountNumber).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const simulateDeposit = async (amountNaira: number) => {
    if (!user) return;
    setSimulating(true);
    try {
      await api.deposit(user.email, amountNaira);
      await refetch();
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div>
      <TopBar title="Add Money" back />
      <div className="px-5">
        {shortfallKobo != null && shortfallKobo > 0 && (
          <div className="mb-3 flex items-center gap-2.5 rounded-2xl border border-salmon-alertBorder bg-salmon-alertBg px-3.5 py-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C6543F" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span className="text-[13px] font-bold leading-snug text-[#7A4A40]">
              Add <b className="text-salmon-text">{formatNaira(shortfallKobo)}</b> to cover {merchantName ?? 'your next bill'}.
            </span>
          </div>
        )}

        <div className="honeycomb-gold rounded-2xl px-4.5 py-3.5">
          <span className="text-[11.5px] font-extrabold tracking-wide text-gold-label">WALLET BALANCE</span>
          <div className="tabular-nums text-[26px] font-black tracking-tight text-gold-text">{formatNaira(walletKobo)}</div>
        </div>

        <p className="mb-2.5 mt-4 pl-0.5 text-sm font-bold text-ink">Send a bank transfer to your SubBee account</p>

        <div className="flex flex-col gap-3.5 rounded-[20px] bg-white p-4.5 shadow-[0_4px_16px_rgba(20,40,45,0.06)]">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] font-extrabold tracking-wide text-ink-faint">BANK</div>
              <div className="text-[15px] font-extrabold text-ink">{bankName ?? 'Nomba MFB'}</div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E9F1EF]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2E6264" strokeWidth="2">
                <path d="M3 21h18M4 10h16M12 3 3 8h18l-9-5zM6 10v11M18 10v11M10 10v11M14 10v11" />
              </svg>
            </div>
          </div>
          <div className="h-px bg-[#F0EDE5]" />
          <div>
            <div className="text-[11px] font-extrabold tracking-wide text-ink-faint">ACCOUNT NUMBER</div>
            <div className="tabular-nums text-[26px] font-black tracking-[2.5px] text-ink">{accountNumber ?? 'Pending…'}</div>
          </div>
          <div>
            <div className="text-[11px] font-extrabold tracking-wide text-ink-faint">ACCOUNT NAME</div>
            <div className="text-[15px] font-bold text-ink">{user?.name}</div>
          </div>
        </div>

        <Button fullWidth onClick={copy} className="mt-3.5 !bg-gradient-to-br !from-teal-light !to-teal !text-[#EAF3F0] !shadow-[0_12px_22px_-10px_rgba(207,154,68,0.9)]">
          {copied ? 'Copied ✓' : 'Copy Account Number'}
        </Button>

        <div className="mt-3.5 flex items-start gap-2 px-1">
          <img src="/illustrations/subbee-logo.png" className="h-8 w-8 shrink-0 object-contain" />
          <span className="text-[12.5px] font-semibold leading-relaxed text-ink-muted">
            Money you send lands in your wallet within seconds. We'll send a confirmation the moment it arrives.
          </span>
        </div>

        <div className="mt-5 rounded-2xl border border-dashed border-ink/15 p-3.5">
          <p className="mb-2 text-xs font-extrabold text-ink-faint">DEV SHORTCUT — no bank webhook in this environment</p>
          <div className="flex gap-2">
            <Button variant="secondary" fullWidth disabled={simulating} onClick={() => simulateDeposit(2500)} className="!py-2.5 !text-xs">
              Simulate +₦2,500
            </Button>
            <Button variant="secondary" fullWidth disabled={simulating} onClick={() => simulateDeposit(10000)} className="!py-2.5 !text-xs">
              Simulate +₦10,000
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
