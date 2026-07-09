import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 50 : -50,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 50 : -50,
    opacity: 0,
  })
};

export default function Kyc() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [direction, setDirection] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [pendingSubsCount, setPendingSubsCount] = useState(0);

  // Smart Defaults
  const defaultFirstName = user?.name?.split(' ')[0] || '';
  const defaultLastName = user?.name?.split(' ').slice(1).join(' ') || '';

  const [form, setForm] = useState<KycForm>({
    firstName: defaultFirstName,
    lastName: defaultLastName,
    phone: '',
    dob: '',
    address: '',
    state: 'Lagos', // Smart Default
    lga: '',
    postalCode: '',
    bvn: '',
    pin: '',
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem('subbee_pending_subs');
      if (stored) {
        const subs = JSON.parse(stored);
        setPendingSubsCount(subs.length);
      }
    } catch {
      // ignore
    }
  }, []);

  const set = <K extends keyof KycForm>(key: K, value: KycForm[K]) => setForm((f) => ({ ...f, [key]: value }));

  const paginate = (newStep: number) => {
    setDirection(newStep > step ? 1 : -1);
    setStep(newStep as any);
  };

  const canBack = step > 1;

  const stepValid =
    step === 1
      ? true
      : step === 2
      ? Boolean(form.firstName.trim() && form.lastName.trim() && form.dob)
      : step === 3
      ? Boolean(form.phone.trim().length >= 7 && form.address.trim() && form.state.trim() && form.lga.trim())
      : Boolean(form.bvn.length === 11 && form.pin.length === 4);

  const handleSubmit = async () => {
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

  const handleNext = () => {
    if (step < 4) {
      paginate(step + 1);
    } else {
      handleSubmit();
    }
  };

  // Goal Gradient: Fake progress start. Step 1 feels like Step 3.
  const progressPercentage = ((step + 1) / 5) * 100;

  return (
    <div className="min-h-screen bg-cream-bg">
      <div className="app-shell-width mx-auto flex min-h-screen flex-col px-6 pb-8 pt-6">
        <div className="flex items-center gap-3 relative z-10">
          <button
            onClick={() => (canBack ? paginate(step - 1) : navigate(-1))}
            className="flex h-[38px] w-[38px] items-center justify-center rounded-xl bg-white shadow-[0_3px_10px_rgba(20,40,45,0.07)] transition-transform hover:scale-105"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1E2A2E" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <div>
            <div className="text-lg font-extrabold text-ink">Unlock Virtual Card</div>
            <div className="text-xs font-bold text-ink-muted">Step {step + 1} of 5</div>
          </div>
        </div>

        <div className="mt-4 h-[7px] overflow-hidden rounded-full bg-[#EDE7DC] relative z-10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-teal-light to-teal transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        <div className="mt-6 flex-1 relative">
          <AnimatePresence custom={direction} mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="absolute inset-0 flex flex-col"
              >
                {/* Reciprocity: The blurred card visual */}
                <div className="relative mx-auto mt-4 h-[180px] w-full max-w-[280px] rounded-2xl bg-gradient-to-br from-gold-light to-gold-deep p-5 shadow-lg overflow-hidden">
                  <div className="absolute inset-0 backdrop-blur-[6px] bg-white/20 z-10 flex items-center justify-center">
                    <div className="bg-ink/80 text-white px-4 py-2 rounded-full font-bold text-sm shadow-xl flex items-center gap-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                      IDENTITY REQUIRED
                    </div>
                  </div>
                  {/* Fake card content underneath blur */}
                  <div className="flex justify-between items-start opacity-70">
                    <div className="text-white font-black text-xl tracking-widest">SubBee</div>
                    <svg width="32" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="7" cy="12" r="5"></circle><circle cx="17" cy="12" r="5"></circle></svg>
                  </div>
                  <div className="mt-8 text-white/80 font-mono tracking-widest text-lg">**** **** **** 4092</div>
                  <div className="mt-4 flex justify-between text-white/70 text-xs font-semibold uppercase">
                    <span>{user?.name || 'CARDHOLDER'}</span>
                    <span>12/28</span>
                  </div>
                </div>

                <div className="text-center mt-8">
                  {/* Loss Aversion & IKEA Effect */}
                  <h1 className="text-[26px] font-black tracking-tight text-ink leading-tight">
                    Don't lose your setup.
                  </h1>
                  <p className="mt-3 text-[15px] font-medium leading-relaxed text-ink-muted">
                    Your wallet is ready, but your virtual card is frozen. 
                    {pendingSubsCount > 0 && <span className="text-salmon-text font-bold"> We cannot pay your {pendingSubsCount} pending subscriptions until we verify your identity.</span>}
                  </p>
                </div>

                <div className="mt-auto mb-6">
                  {/* Contrast Anchoring */}
                  <div className="mb-4 text-center rounded-xl bg-teal/5 p-3 border border-teal/10">
                    <p className="text-[13px] font-bold text-teal leading-snug">
                      Traditional banks take 3 days.<br/>SubBee takes 30 seconds.
                    </p>
                  </div>
                  <Button fullWidth onClick={handleNext} className="!h-14 !text-[17px]">
                    Verify in 30 Seconds
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="absolute inset-0 flex flex-col"
              >
                <div className="text-left mt-2 mb-6">
                  <h1 className="text-[24px] font-black tracking-tight text-ink">Confirm your details.</h1>
                  <p className="mt-1 text-[14px] font-medium leading-relaxed text-ink-muted">
                    We've pre-filled what we know. Just scan and adjust.
                  </p>
                </div>

                <div className="flex flex-col gap-4 flex-1">
                  <TextField label="First name" required value={form.firstName} onChange={(e) => set('firstName', e.target.value)} />
                  <TextField label="Last name" required value={form.lastName} onChange={(e) => set('lastName', e.target.value)} />
                  <TextField label="Date of birth" type="date" required value={form.dob} onChange={(e) => set('dob', e.target.value)} />
                </div>

                <div className="mt-auto mb-6">
                  <Button fullWidth onClick={handleNext} disabled={!stepValid} className="!h-14 !text-[17px]">
                    Continue
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="absolute inset-0 flex flex-col"
              >
                <div className="text-left mt-2 mb-6">
                  <h1 className="text-[24px] font-black tracking-tight text-ink">Contact & Address</h1>
                  <p className="mt-1 text-[14px] font-medium leading-relaxed text-ink-muted">
                    Where should we register your card?
                  </p>
                </div>

                <div className="flex flex-col gap-4 flex-1 overflow-y-auto pb-4">
                  <TextField label="Phone number" type="tel" placeholder="080..." required value={form.phone} onChange={(e) => set('phone', e.target.value)} />
                  <TextField label="Street address" required value={form.address} onChange={(e) => set('address', e.target.value)} />
                  <div className="flex gap-3">
                    <TextField label="State" required placeholder="Lagos" value={form.state} onChange={(e) => set('state', e.target.value)} />
                    <TextField label="LGA" required placeholder="Eti-Osa" value={form.lga} onChange={(e) => set('lga', e.target.value)} />
                  </div>
                  <TextField label="Postal code" required placeholder="100001" value={form.postalCode} onChange={(e) => set('postalCode', e.target.value)} />
                </div>

                <div className="mt-auto mb-6">
                  <Button fullWidth onClick={handleNext} disabled={!stepValid} className="!h-14 !text-[17px]">
                    Continue
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="absolute inset-0 flex flex-col"
              >
                <div className="text-left mt-2 mb-6">
                  <h1 className="text-[24px] font-black tracking-tight text-ink">Final Security Check</h1>
                  <p className="mt-1 text-[14px] font-medium leading-relaxed text-ink-muted">
                    Your BVN is securely encrypted. We never store it.
                  </p>
                </div>

                <div className="flex flex-col gap-4 flex-1">
                  <TextField
                    label="Bank Verification Number (BVN)"
                    required
                    inputMode="numeric"
                    maxLength={11}
                    placeholder="11-digit BVN"
                    value={form.bvn}
                    onChange={(e) => set('bvn', e.target.value.replace(/\D/g, '').slice(0, 11))}
                  />

                  <div className="mt-4">
                    <TextField
                      label="Set a 4-digit card PIN"
                      required
                      inputMode="numeric"
                      maxLength={4}
                      placeholder="****"
                      value={form.pin}
                      onChange={(e) => set('pin', e.target.value.replace(/\D/g, '').slice(0, 4))}
                    />
                    <p className="mt-1.5 pl-1 text-[12px] font-medium text-ink-muted">
                      Used for confirming high-value web transactions.
                    </p>
                  </div>
                  
                  {error && <p className="mt-2 text-sm font-semibold text-salmon-text">{error}</p>}
                </div>

                <div className="mt-auto mb-6">
                  <div className="mb-4 flex items-center justify-center gap-2 text-[12px] font-bold text-ink-muted">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                    Bank-grade AES-256 Encryption
                  </div>
                  <Button fullWidth onClick={handleNext} disabled={submitting || !stepValid} className="!h-14 !text-[17px] !bg-ink text-white">
                    {submitting ? 'Verifying Identity…' : 'Unlock My Card'}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
