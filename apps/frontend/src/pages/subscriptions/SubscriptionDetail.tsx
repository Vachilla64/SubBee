import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import TopBar from '../../components/layout/TopBar';
import Button from '../../components/ui/Button';
import StatusChip from '../../components/ui/StatusChip';
import ConfirmSheet from '../../components/ui/ConfirmSheet';
import ActionRequiredCard from '../../components/subscriptions/ActionRequiredCard';
import Skeleton from '../../components/ui/Skeleton';
import { useWalletData } from '../../lib/useWalletData';
import { api } from '../../lib/api';
import { formatNaira, formatShortDate, isInsufficientFunds, nextChargeDate, shortfallKobo } from '../../lib/format';

export default function SubscriptionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { loading, subscriptions, walletKobo, accountNumber, refetch } = useWalletData();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  const sub = subscriptions.find((s) => s.id === id);

  if (loading) {
    return (
      <div>
        <TopBar title="Subscription" back />
        <div className="px-5">
          <Skeleton className="h-56 w-full rounded-[24px]" />
        </div>
      </div>
    );
  }

  if (!sub) {
    return (
      <div>
        <TopBar title="Subscription" back />
        <div className="px-5 text-center text-sm font-semibold text-ink-muted">
          This subscription no longer exists.
        </div>
      </div>
    );
  }

  const insufficient = isInsufficientFunds(sub, walletKobo);
  const nextDate = nextChargeDate(sub.billingDay);
  const isPending = sub.needsConfirmation && sub.amountKobo <= 100n;
  const needsReview = sub.needsConfirmation && sub.amountKobo > 100n;

  const togglePause = async () => {
    setBusy(true);
    try {
      await api.editSubscription(sub.id, { isActive: !sub.isActive });
      await refetch();
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await api.deleteSubscription(sub.id);
      navigate('/app/subscriptions', { replace: true });
    } finally {
      setBusy(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div>
      <TopBar
        title="Subscription"
        back
        right={
          <button
            onClick={() => navigate(`/app/subscriptions/${sub.id}/edit`)}
            className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-white shadow-[0_3px_10px_rgba(20,40,45,0.07)]"
            aria-label="Edit"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1E2A2E" strokeWidth="2.2" strokeLinecap="round">
              <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
            </svg>
          </button>
        }
      />

      <div className="flex flex-col gap-4 px-5 pb-6">
        <div className="flex flex-col items-center rounded-[24px] bg-white p-5.5 text-center shadow-[0_4px_16px_rgba(20,40,45,0.05)]">
          <img
            src={`/icons/${sub.merchantId}.png`}
            alt=""
            onError={(e) => ((e.currentTarget as HTMLElement).style.visibility = 'hidden')}
            className="h-[60px] w-[60px] rounded-[18px] bg-ink/5 object-contain p-2 shadow-[0_6px_14px_-6px_rgba(0,0,0,0.4)]"
          />
          <div className="mt-3 text-xl font-black text-ink">{sub.merchantName}</div>
          <StatusChip status={insufficient ? 'insufficient' : needsReview ? 'needs_review' : isPending ? 'awaiting_charge' : sub.isActive ? 'active' : 'paused'} className="mt-2" />

          <div className="mt-4.5 flex w-full gap-3">
            <div className="flex-1 rounded-[14px] bg-[#F9F5EC] p-3">
              <div className="text-[11px] font-extrabold tracking-wide text-ink-faint">AMOUNT</div>
              <div className="tabular-nums text-lg font-black text-ink">{isPending ? 'Pending' : formatNaira(sub.amountKobo)}</div>
            </div>
            <div className="flex-1 rounded-[14px] bg-[#F9F5EC] p-3">
              <div className="text-[11px] font-extrabold tracking-wide text-ink-faint">BILLS ON</div>
              <div className="text-lg font-black text-ink">{isPending ? 'Pending' : `Day ${sub.billingDay}`}</div>
            </div>
          </div>

          {sub.isActive && !isPending && !needsReview && (
            <div className="mt-3 flex w-full items-center justify-between rounded-[14px] bg-[#F1EEE7] px-4 py-3">
              <span className="text-[13px] font-bold text-paused-text">Next charge</span>
              <span className="text-sm font-black text-ink">{formatShortDate(nextDate)}</span>
            </div>
          )}

          {sub.isActive && isPending && (
            <div className="mt-3 flex w-full items-center justify-center rounded-[14px] bg-[#F1EEE7] px-4 py-3">
              <span className="text-[12.5px] font-bold text-paused-text text-center">⏳ Awaiting first charge to lock in details</span>
            </div>
          )}
        </div>

        {needsReview && (
          <div className="rounded-[20px] bg-[#FFE7D6] p-4.5 shadow-[0_4px_16px_rgba(20,40,45,0.05)] border border-[#FBC9A4]">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0 text-2xl">👀</div>
              <div className="flex-1">
                <h3 className="text-[15px] font-black text-[#A64714]">Review details</h3>
                <p className="mt-1 text-[13px] font-semibold text-[#A64714]/80 leading-relaxed">
                  We locked in the amount and date from the latest charge. Does this look right?
                </p>
                <div className="mt-3.5 flex gap-2 w-full">
                  <Button
                    variant="primary"
                    className="flex-1 !h-10 !text-[13px] !bg-[#A64714] border border-transparent"
                    onClick={async () => {
                      setBusy(true);
                      await api.editSubscription(sub.id, { needsConfirmation: false });
                      await refetch();
                      setBusy(false);
                    }}
                    disabled={busy}
                  >
                    Looks Good
                  </Button>
                  <Button
                    variant="secondary"
                    className="flex-1 !h-10 !text-[13px] !border-[#A64714]/30 !text-[#A64714] bg-white hover:bg-[#A64714]/5"
                    onClick={() => navigate(`/app/subscriptions/${sub.id}/edit`)}
                    disabled={busy}
                  >
                    Edit
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {insufficient && (
          <ActionRequiredCard
            merchantName={sub.merchantName}
            billKobo={sub.amountKobo}
            walletKobo={walletKobo}
            shortfallKobo={shortfallKobo(sub, walletKobo)}
            accountNumber={accountNumber}
            onTopUp={() =>
              navigate('/app/activity/fund', { state: { shortfallKobo: shortfallKobo(sub, walletKobo), merchantName: sub.merchantName } })
            }
          />
        )}

        <div className="flex gap-2.5">
          <Button variant={sub.isActive ? 'caution' : 'primary'} fullWidth disabled={busy} onClick={togglePause}>
            {sub.isActive ? 'Pause' : 'Resume'}
          </Button>
        </div>

        <Button variant="caution" fullWidth onClick={() => setConfirmDelete(true)}>
          Delete subscription
        </Button>
      </div>

      <ConfirmSheet
        open={confirmDelete}
        title={`Delete ${sub.merchantName}?`}
        message="This stops all future charges. You can always add it again later."
        confirmLabel="Delete"
        onConfirm={remove}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
