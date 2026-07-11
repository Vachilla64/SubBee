import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import TopBar from '../../components/layout/TopBar';
import TextField from '../../components/ui/TextField';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';
import { useWalletData } from '../../lib/useWalletData';
import { api } from '../../lib/api';

export default function EditSubscription() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { loading, subscriptions, refetch } = useWalletData();
  const sub = subscriptions.find((s) => s.id === id);

  const [amount, setAmount] = useState('');
  const [billingDay, setBillingDay] = useState('');
  const [reminders, setReminders] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sub) return;
    setAmount(String(Number(sub.amountKobo) / 100));
    setBillingDay(String(sub.billingDay));
    setReminders(sub.remindersEnabled);
  }, [sub?.id]);

  if (loading) {
    return (
      <div>
        <TopBar title="Edit Subscription" back />
        <div className="px-5">
          <Skeleton className="h-64 w-full rounded-[24px]" />
        </div>
      </div>
    );
  }

  if (!sub) {
    return (
      <div>
        <TopBar title="Edit Subscription" back />
        <div className="px-5 text-center text-sm font-semibold text-ink-muted">This subscription no longer exists.</div>
      </div>
    );
  }

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await api.editSubscription(sub.id, {
        amountNaira: Number(amount),
        billingDay: Number(billingDay),
        remindersEnabled: reminders,
      });
      await refetch();
      navigate(`/app/subscriptions/${sub.id}`, { replace: true });
    } catch {
      setError('Could not save changes - try again.');
      setSubmitting(false);
    }
  };

  return (
    <div>
      <TopBar title={`Edit ${sub.merchantName}`} back />
      <div className="px-5">
        <div className="flex flex-col gap-3.5 rounded-[24px] bg-white p-5 shadow-[0_4px_16px_rgba(20,40,45,0.05)]">
          <TextField label="Billing amount (₦)" type="number" min={1} required value={amount} onChange={(e) => setAmount(e.target.value)} />
          <TextField
            label="Billing day of month"
            type="number"
            min={1}
            max={28}
            required
            value={billingDay}
            onChange={(e) => setBillingDay(e.target.value)}
          />

          <button
            type="button"
            onClick={() => setReminders((r) => !r)}
            className="flex items-center justify-between rounded-2xl bg-cream-bg px-4 py-3.5"
          >
            <div className="text-left">
              <div className="text-sm font-extrabold text-ink">Reminders</div>
              <div className="text-[11.5px] font-bold text-ink-muted">Alert me before this bill charges</div>
            </div>
            <span className={`relative h-[27px] w-[46px] shrink-0 rounded-full transition-colors ${reminders ? 'bg-gold-mid' : 'bg-paused-bg'}`}>
              <span className={`absolute top-[3px] h-[21px] w-[21px] rounded-full bg-white shadow transition-all ${reminders ? 'right-[3px]' : 'left-[3px]'}`} />
            </span>
          </button>

          {error && <p className="text-sm font-semibold text-salmon-text">{error}</p>}

          <Button fullWidth disabled={submitting} onClick={submit} className="mt-1 !h-14 !text-[16px]">
            {submitting ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}
