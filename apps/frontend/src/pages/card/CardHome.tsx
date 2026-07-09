import { useNavigate } from 'react-router-dom';
import TopBar from '../../components/layout/TopBar';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import Skeleton from '../../components/ui/Skeleton';
import { useAuth } from '../../lib/auth';
import { useWalletData } from '../../lib/useWalletData';
import { api } from '../../lib/api';
import { formatNaira } from '../../lib/format';

export default function CardHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { loading, card, refetch } = useWalletData();

  if (loading) {
    return (
      <div>
        <TopBar title="Virtual Card" back />
        <div className="px-5">
          <Skeleton className="h-48 w-full rounded-[22px]" />
        </div>
      </div>
    );
  }

  if (card.status === 'inactive') {
    return (
      <div>
        <TopBar title="Get your card" back />
        <div className="px-5">
          <EmptyState
            mascot="/illustrations/bee-waiting.png"
            title="No card yet"
            message={
              user?.kycStatus !== 'verified'
                ? 'Verify your identity first — card issuing is gated on KYC. Your wallet works fine in the meantime.'
                : 'A card is created automatically the first time a subscription needs one — or get one now.'
            }
            cta={
              user?.kycStatus !== 'verified' ? (
                <Button onClick={() => navigate('/kyc')}>Verify identity</Button>
              ) : (
                <Button onClick={() => navigate('/app/card/pin')}>Get a card</Button>
              )
            }
          />
        </div>
      </div>
    );
  }

  const toggleFreeze = async () => {
    if (!card.cardId) return;
    await api.toggleCardFreeze(card.cardId, card.status === 'frozen');
    await refetch();
  };

  const frozen = card.status === 'frozen';

  return (
    <div>
      <TopBar title="Virtual Card" back />
      <div className="flex flex-col gap-3.5 px-5 pb-6">
        <div className="teal-card-gradient relative overflow-hidden rounded-[22px] p-5 text-[#E6EFEE] shadow-[0_18px_34px_-16px_rgba(10,30,30,0.85)]">
          <div className="flex items-center justify-between">
            <span className="text-[12.5px] font-extrabold tracking-wide text-teal-soft3">SUBBEE VIRTUAL</span>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-extrabold ${
                frozen ? 'bg-[#DCEBF3]/25 text-[#DCEBF3]' : 'bg-[rgba(156,192,165,0.22)] text-[#B6E0BE]'
              }`}
            >
              {frozen ? '❄ FROZEN' : '✓ ACTIVE'}
            </span>
          </div>
          <div className="tabular-nums mt-5 text-xl font-extrabold tracking-[3px] text-white">
            •••• •••• •••• {card.last4 ?? '····'}
          </div>
          <div className="mt-4 flex items-center gap-6">
            <div>
              <div className="text-[9.5px] font-extrabold tracking-wide text-teal-soft3">EXPIRY</div>
              <div className="text-sm font-extrabold text-[#EAF3F0]">•• / ••</div>
            </div>
            <div>
              <div className="text-[9.5px] font-extrabold tracking-wide text-teal-soft3">CVV</div>
              <div className="text-sm font-extrabold text-[#EAF3F0]">•••</div>
            </div>
            <div className="flex-1" />
            <img src="/illustrations/subbee-logo.png" alt="" className="h-9 w-10 object-contain opacity-90" />
          </div>
          {frozen && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-[rgba(178,208,224,0.82)] to-[rgba(140,178,201,0.88)] backdrop-blur-sm">
              <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-white/55 shadow-[0_6px_16px_rgba(40,70,95,0.28)]">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2E5A78" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v20M4.2 6.5l15.6 11M19.8 6.5L4.2 17.5M12 6l-3 2 3 2 3-2-3-2zM12 14l-3 2 3 2 3-2-3-2z" />
                </svg>
              </div>
              <span className="text-sm font-black tracking-wide text-[#1E3F55]">FROZEN</span>
            </div>
          )}
        </div>

        {frozen && (
          <div className="flex items-center gap-2.5 rounded-2xl border border-[#B9D3E3] bg-[#EAF2F8] px-3.5 py-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2A5C8A" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <path d="M12 2v20M4.2 6.5l15.6 11M19.8 6.5L4.2 17.5" />
            </svg>
            <span className="text-[13px] font-bold leading-snug text-[#2A5C8A]">
              Frozen for your protection. Unfreeze to reactivate — SubBee auto-freezes after repeated declines.
            </span>
          </div>
        )}

        <div className="flex gap-2.5">
          <Button variant="primary" fullWidth onClick={() => navigate('/app/activity/fund')} className="flex-col !gap-1 !py-3 !text-[12.5px]">
            Top Up
          </Button>
          <Button
            variant={frozen ? 'primary' : 'caution'}
            fullWidth
            onClick={toggleFreeze}
            className="flex-col !gap-1 !py-3 !text-[12.5px]"
          >
            {frozen ? 'Unfreeze' : 'Pause Sub'}
          </Button>
          <Button variant="secondary" fullWidth onClick={() => navigate('/app/card/reveal')} className="flex-col !gap-1 !py-3 !text-[12.5px]">
            Card Details
          </Button>
        </div>

        <div className="flex items-center justify-between rounded-2xl bg-[#F9F5EC] px-4 py-3.5">
          <div>
            <div className="text-[11px] font-extrabold tracking-wide text-ink-faint">CARD BALANCE</div>
            <div className="tabular-nums text-xl font-black text-ink">{formatNaira(card.balanceKobo ?? 0)}</div>
          </div>
          <span className="max-w-[150px] text-right text-[11px] font-semibold leading-snug text-ink-muted">
            Low or zero between charges is normal — funded just-in-time.
          </span>
        </div>


      </div>
    </div>
  );
}
