import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomSheet from '../ui/BottomSheet';
import Button from '../ui/Button';
import StatusChip from '../ui/StatusChip';
import { api } from '../../lib/api';
import { formatNaira, isInsufficientFunds, shortfallKobo } from '../../lib/format';

interface SheetSub {
  id: string;
  merchantId: string;
  merchantName: string;
  amountKobo: bigint;
  billingDay: number;
  isActive: boolean;
}

export default function SubscriptionActionSheet({
  sub,
  walletKobo,
  awaitingCard,
  onClose,
  onChanged,
}: {
  sub: SheetSub | null;
  walletKobo: bigint;
  awaitingCard?: boolean;
  onClose: () => void;
  onChanged: () => Promise<void> | void;
}) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const insufficient = sub ? isInsufficientFunds(sub, walletKobo) : false;
  const status = awaitingCard ? 'awaiting_card' : insufficient ? 'insufficient' : sub?.isActive ? 'active' : 'paused';

  const togglePause = async () => {
    if (!sub) return;
    setBusy(true);
    try {
      await api.editSubscription(sub.id, { isActive: !sub.isActive });
      await onChanged();
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <BottomSheet open={!!sub} onClose={onClose}>
      {sub && (
        <div className="flex flex-col items-center text-center">
          <img
            src={`/icons/${sub.merchantId}.png`}
            alt=""
            onError={(e) => ((e.currentTarget as HTMLElement).style.visibility = 'hidden')}
            className="h-16 w-16 rounded-2xl bg-ink/5 object-contain p-2 shadow-[0_6px_14px_-6px_rgba(0,0,0,0.15)]"
          />
          <h2 className="mt-3 text-xl font-black text-ink">{sub.merchantName}</h2>
          <div className="tabular-nums mt-1 text-2xl font-black text-ink">{formatNaira(sub.amountKobo)}</div>
          <StatusChip status={status} className="mt-2.5" />

          <div className="mt-6 flex w-full flex-col gap-2.5">
            {insufficient && (
              <Button
                fullWidth
                onClick={() =>
                  navigate('/app/activity/fund', {
                    state: { shortfallKobo: shortfallKobo(sub, walletKobo), merchantName: sub.merchantName },
                  })
                }
              >
                Top Up Wallet
              </Button>
            )}
            {!awaitingCard && (
              <Button variant="secondary" fullWidth disabled={busy} onClick={togglePause}>
                {busy ? 'Updating…' : sub.isActive ? 'Pause Subscription' : 'Resume Subscription'}
              </Button>
            )}
            <Button variant="ghost" fullWidth onClick={() => navigate(`/app/subscriptions/${sub.id}`)}>
              View Full Details
            </Button>
          </div>
        </div>
      )}
    </BottomSheet>
  );
}
