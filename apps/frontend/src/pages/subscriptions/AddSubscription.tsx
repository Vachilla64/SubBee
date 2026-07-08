import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../../components/layout/TopBar';
import TextField from '../../components/ui/TextField';
import Button from '../../components/ui/Button';
import { MERCHANTS, type Merchant } from '../../lib/merchants';
import { useAuth } from '../../lib/auth';
import { api } from '../../lib/api';

export default function AddSubscription() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [amount, setAmount] = useState('');
  const [billingDay, setBillingDay] = useState('5');
  const [reminders, setReminders] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = (m: Merchant) => {
    setMerchant(m);
    setAmount(String(m.defaultPriceNaira));
  };

  const submit = async () => {
    if (!user || !merchant) return;
    setSubmitting(true);
    setError(null);
    try {
      const data = await api.addSubscription({
        email: user.email,
        merchantId: merchant.id,
        merchantName: merchant.name,
        amountNaira: Number(amount),
        billingDay: Number(billingDay),
        remindersEnabled: reminders,
      });
      navigate(`/app/subscriptions/${data.id}`, { replace: true });
    } catch {
      setError('Could not add this subscription — try again.');
      setSubmitting(false);
    }
  };

  return (
    <div>
      <TopBar title="Add Subscription" back={!merchant} />
      {!merchant && (
        <div className="px-5">
          <p className="mb-3 pl-1 text-sm font-bold text-ink-muted">Choose a service</p>
          <div className="flex flex-col gap-2.5">
            {MERCHANTS.map((m) => (
              <button
                key={m.id}
                onClick={() => pick(m)}
                className="flex items-center gap-3 rounded-2xl bg-white px-3.5 py-3 text-left shadow-[0_3px_12px_rgba(20,40,45,0.05)]"
              >
                <img
                  src={`/icons/${m.id}.png`}
                  alt=""
                  onError={(e) => ((e.currentTarget as HTMLElement).style.visibility = 'hidden')}
                  className="h-10 w-10 shrink-0 rounded-xl bg-ink/5 object-contain p-1"
                />
                <span className="flex-1 text-[15px] font-extrabold text-ink">{m.name}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8A9499" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            ))}
          </div>
        </div>
      )}

      {merchant && (
        <div className="px-5">
          <button onClick={() => setMerchant(null)} className="mb-3 flex items-center gap-2 text-sm font-extrabold text-teal">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1C4042" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Choose a different service
          </button>

          <div className="rounded-[24px] bg-white p-5 shadow-[0_4px_16px_rgba(20,40,45,0.05)]">
            <div className="flex items-center gap-3">
              <img
                src={`/icons/${merchant.id}.png`}
                alt=""
                onError={(e) => ((e.currentTarget as HTMLElement).style.visibility = 'hidden')}
                className="h-[46px] w-[46px] shrink-0 rounded-2xl bg-ink/5 object-contain p-1.5"
              />
              <div>
                <div className="text-[17px] font-black text-ink">{merchant.name}</div>
                <div className="text-[12.5px] font-bold text-ink-muted">Set up your billing</div>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3.5">
              <TextField
                label="Billing amount (₦)"
                type="number"
                min={1}
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
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
                  <span
                    className={`absolute top-[3px] h-[21px] w-[21px] rounded-full bg-white shadow transition-all ${reminders ? 'right-[3px]' : 'left-[3px]'}`}
                  />
                </span>
              </button>

              {error && <p className="text-sm font-semibold text-salmon-text">{error}</p>}

              <Button fullWidth disabled={submitting || !amount} onClick={submit} className="mt-1 !h-14 !text-[16px]">
                {submitting ? 'Adding…' : `Add ${merchant.name}`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
