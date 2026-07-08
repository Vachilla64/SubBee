import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TextField from '../../components/ui/TextField';
import Button from '../../components/ui/Button';
import { useAuth } from '../../lib/auth';
import { api } from '../../lib/api';

interface KycForm {
  firstName: string;
  lastName: string;
  phone: string;
  dob: string;
  address: string;
  state: string;
  lga: string;
  postalCode: string;
  bvn: string;
  pin: string;
}

const STEP_LABELS = ['Your details', 'Contact', 'Home address', 'Confirm & PIN'];

export default function Kyc() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<KycForm>({
    firstName: '',
    lastName: '',
    phone: '',
    dob: '',
    address: '',
    state: '',
    lga: '',
    postalCode: '',
    bvn: '',
    pin: '1234',
  });

  const set = <K extends keyof KycForm>(key: K, value: KycForm[K]) => setForm((f) => ({ ...f, [key]: value }));

  const canBack = step > 0;
  const isLast = step === STEP_LABELS.length - 1;

  // Native `required` doesn't fire without a form submit, so gate each step explicitly.
  const stepValid =
    step === 0
      ? Boolean(form.firstName.trim() && form.lastName.trim() && form.bvn.length === 11 && form.dob)
      : step === 1
      ? form.phone.trim().length >= 7
      : step === 2
      ? Boolean(form.address.trim() && form.state.trim() && form.lga.trim() && form.postalCode.trim())
      : form.pin.length === 4;

  const handleNext = async () => {
    if (!isLast) {
      setStep((s) => s + 1);
      return;
    }
    if (!user) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.submitKyc(user.email, form);
      updateUser({ kycStatus: 'verified' });
      api.requestCard(user.email, form.pin).catch(() => {});
      navigate('/wallet-ready');
    } catch {
      setError("We couldn't verify those details. Check them and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-bg">
      <div className="app-shell-width mx-auto flex min-h-screen flex-col px-6 pb-8 pt-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => (canBack ? setStep((s) => s - 1) : navigate(-1))}
            className="flex h-[38px] w-[38px] items-center justify-center rounded-xl bg-white shadow-[0_3px_10px_rgba(20,40,45,0.07)]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1E2A2E" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <div>
            <div className="text-lg font-extrabold text-ink">Verify your identity</div>
            <div className="text-xs font-bold text-ink-muted">{STEP_LABELS[step]}</div>
          </div>
        </div>

        <div className="mt-2 h-[7px] overflow-hidden rounded-full bg-[#EDE7DC]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-gold-light to-gold-mid transition-all"
            style={{ width: `${((step + 1) / STEP_LABELS.length) * 100}%` }}
          />
        </div>

        <div className="mt-5 flex-1">
          {step === 0 && (
            <div className="flex flex-col gap-3.5">
              <TextField label="First name" required value={form.firstName} onChange={(e) => set('firstName', e.target.value)} />
              <TextField label="Last name" required value={form.lastName} onChange={(e) => set('lastName', e.target.value)} />
              <TextField
                label="BVN"
                required
                inputMode="numeric"
                maxLength={11}
                placeholder="11-digit Bank Verification Number"
                value={form.bvn}
                onChange={(e) => set('bvn', e.target.value.replace(/\D/g, '').slice(0, 11))}
              />
              <TextField label="Date of birth" type="date" required value={form.dob} onChange={(e) => set('dob', e.target.value)} />
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-col gap-3.5">
              <div className="flex items-center gap-2 rounded-2xl border border-active-border bg-active-bg px-3.5 py-2.5 text-[12.5px] font-bold text-active-text">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#4A8A5C" strokeWidth="2.5">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                {user?.email} — confirm your phone number below.
              </div>
              <TextField label="Phone number" type="tel" required value={form.phone} onChange={(e) => set('phone', e.target.value)} />
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-3.5">
              <TextField label="Street address" required value={form.address} onChange={(e) => set('address', e.target.value)} />
              <div className="flex gap-2.5">
                <TextField label="State" required placeholder="Lagos" value={form.state} onChange={(e) => set('state', e.target.value)} />
                <TextField label="LGA" required placeholder="Eti-Osa" value={form.lga} onChange={(e) => set('lga', e.target.value)} />
              </div>
              <TextField label="Postal code" required value={form.postalCode} onChange={(e) => set('postalCode', e.target.value)} />
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="mt-2 flex h-[170px] w-[170px] items-center justify-center rounded-full border-[3px] border-dashed border-[#E7C97E] bg-[radial-gradient(circle_at_50%_40%,#FBF3E1,#F1E7CF)]">
                <img src="/illustrations/subbee-logo.png" className="h-24 w-24 animate-float object-contain" />
              </div>
              <p className="max-w-[260px] text-[13.5px] font-semibold leading-relaxed text-ink-muted">
                Selfie verification happens on your next login from the mobile bot — no need to do it here.
              </p>
              <div className="w-full max-w-xs text-left">
                <TextField
                  label="Set your 4-digit card PIN"
                  inputMode="numeric"
                  maxLength={4}
                  value={form.pin}
                  onChange={(e) => set('pin', e.target.value.replace(/\D/g, '').slice(0, 4))}
                />
                <p className="mt-1.5 pl-1 text-[11.5px] font-semibold text-ink-faint">Rarely used for online subscriptions — you can change it later.</p>
              </div>
            </div>
          )}

          {error && <p className="mt-3 text-sm font-semibold text-salmon-text">{error}</p>}
        </div>

        <div className="mt-4 flex gap-2.5">
          {canBack && (
            <Button variant="ghost" onClick={() => setStep((s) => s - 1)} className="!bg-[#EFEBE2] !text-paused-text">
              Back
            </Button>
          )}
          <Button fullWidth onClick={handleNext} disabled={submitting || !stepValid} className="!h-14 !text-[16px]">
            {submitting ? 'Verifying…' : isLast ? 'Submit verification' : 'Continue'}
          </Button>
        </div>
      </div>
    </div>
  );
}
