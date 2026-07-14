import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import { useAuth } from '../../lib/auth';
import { api } from '../../lib/api';

export default function WalletReady() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [account, setAccount] = useState<{ accountNumber: string | null; bankName: string | null }>({
    accountNumber: null,
    bankName: null,
  });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    api.getDepositInfo(user.email).then(setAccount).catch(() => {});
  }, [user]);

  const copy = async () => {
    if (!account.accountNumber) return;
    await navigator.clipboard.writeText(account.accountNumber).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="min-h-screen bg-cream-bg">
      <div className="app-shell-width mx-auto flex min-h-screen flex-col px-6 pb-10 pt-10">
        <div className="mt-2 flex flex-col items-center gap-2 text-center">
          <div className="relative flex h-[104px] w-[104px] items-center justify-center rounded-full bg-gradient-to-br from-gold-panelFrom to-[#E1AC46] shadow-[0_16px_30px_-12px_rgba(207,154,68,0.75)]">
            <img src="/illustrations/subbee-logo.png" alt="" className="h-[74px] w-[78px] object-contain" />
            <div className="absolute -bottom-0.5 -right-0.5 flex h-9 w-9 items-center justify-center rounded-full border-[3px] border-cream-bg bg-[#3E9B62]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
          </div>
          <h1 className="mt-3 text-[27px] font-black tracking-tight text-ink">Your wallet is ready!</h1>
          <p className="max-w-[290px] text-[14.5px] font-semibold leading-relaxed text-ink-muted">
            Identity verified and your Nomba deposit account is live. Fund it anytime to power your subscriptions.
          </p>
        </div>

        <div className="honeycomb-gold mt-6 rounded-panel px-5 pb-5 pt-5 shadow-[0_16px_30px_-14px_rgba(197,148,64,0.7)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold tracking-wide text-gold-label">YOUR DEPOSIT ACCOUNT</span>
            <span className="rounded-full bg-gold-text/15 px-2.5 py-1 text-[10.5px] font-extrabold text-gold-text">POWERED BY NOMBA</span>
          </div>
          <div className="tabular-nums mt-3 text-[34px] font-black tracking-[2.5px] text-gold-text">
            {account.accountNumber ?? 'Pending…'}
          </div>
          <div className="mt-3.5 flex gap-2.5">
            <div className="flex-1 rounded-2xl border border-gold-text/80 bg-white/40 px-3 py-2.5">
              <div className="text-[10.5px] font-extrabold tracking-wide text-gold-label">BANK</div>
              <div className="text-sm font-extrabold text-gold-text">{account.bankName ?? 'Nomba MFB'}</div>
            </div>
            <div className="flex-1 rounded-2xl border border-gold-text/80 bg-white/40 px-3 py-2.5">
              <div className="text-[10.5px] font-extrabold tracking-wide text-gold-label">ACCOUNT NAME</div>
              <div className="truncate text-sm font-extrabold text-gold-text">{user?.name}</div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-2xl border border-active-border bg-active-bg px-3.5 py-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3E6247" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
            <path d="M20 6L9 17l-5-5" />
          </svg>
          <span className="text-[12.5px] font-bold leading-relaxed text-active-text">
            Transfer money to this account and it lands in your SubBee wallet within seconds - no card needed.
          </span>
        </div>

        <div className="flex-1" />

        <Button variant="secondary" fullWidth onClick={copy} className="!h-[52px]">
          {copied ? 'Copied ✓' : 'Copy account number'}
        </Button>
        <Button fullWidth onClick={() => navigate('/app/dashboard')} className="mt-3 !h-[58px] !text-base">
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
}
