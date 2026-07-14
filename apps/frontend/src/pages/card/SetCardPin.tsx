import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../lib/auth';
import { api } from '../../lib/api';
import TextField from '../../components/ui/TextField';
import Button from '../../components/ui/Button';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

const variants = {
  enter: (direction: number) => ({ x: direction > 0 ? 50 : -50, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction < 0 ? 50 : -50, opacity: 0 }),
};

export default function SetCardPin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<'name' | 'pin' | 'confirm'>('name');
  const [direction, setDirection] = useState(1);
  const [cardName, setCardName] = useState('My Subscriptions');
  const [firstPin, setFirstPin] = useState<string | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const paginate = (newStep: 'name' | 'pin' | 'confirm') => {
    const order = { name: 1, pin: 2, confirm: 3 };
    setDirection(order[newStep] > order[step] ? 1 : -1);
    setStep(newStep);
  };

  const press = async (key: string) => {
    if (key === '' || submitting) return;
    if (key === 'del') {
      setPin((p) => p.slice(0, -1));
      return;
    }
    if (pin.length >= 4) return;
    const next = pin + key;
    setPin(next);
    if (next.length !== 4) return;

    if (step === 'pin') {
      setTimeout(() => {
        setFirstPin(next);
        setPin('');
        paginate('confirm');
      }, 150);
      return;
    }

    if (next !== firstPin) {
      setError("PINs didn't match - try again.");
      setTimeout(() => {
        setFirstPin(null);
        setPin('');
        setError(null);
        paginate('pin');
      }, 900);
      return;
    }

    if (!user) return;
    setSubmitting(true);
    try {
      await api.requestCard(user.email, next); 
      navigate('/app/card/creating');
    } catch {
      setError('Could not create your card - try again.');
      setFirstPin(null);
      setPin('');
      setSubmitting(false);
      paginate('pin');
    }
  };

  const handleNameContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardName.trim()) return;
    paginate('pin');
  };

  return (
    <div className="min-h-screen bg-cream-bg flex flex-col">
      {/* Progress Bar (Goal Gradient) */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#EAE7DF] z-50">
        <div className="h-full bg-teal transition-all duration-1000 ease-out" style={{ width: '90%' }} />
      </div>

      <div className="app-shell-width mx-auto flex min-h-screen flex-col px-6 pb-8 pt-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => step === 'name' ? navigate(-1) : paginate('name')}
            className="flex h-[38px] w-[38px] items-center justify-center rounded-xl bg-white shadow-[0_3px_10px_rgba(20,40,45,0.07)]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1E2A2E" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <span className="text-lg font-extrabold text-ink">Get your card</span>
          <div className="flex-1" />
          <span className="rounded-full bg-[#EFEBE2] px-2.5 py-1.5 text-[10px] font-black tracking-widest text-gold-label">
            FINAL STEP
          </span>
        </div>

        <div className="teal-card-gradient relative mt-6 overflow-hidden rounded-[22px] p-5 text-[#E6EFEE] shadow-[0_12px_24px_-10px_rgba(24,55,57,0.4)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold tracking-wide text-teal-soft3 uppercase max-w-[150px] truncate">{cardName || 'SUBBEE VIRTUAL'}</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(242,206,124,0.2)] px-2.5 py-1 text-[10px] font-black tracking-wider text-gold-light">
              ISSUING
            </span>
          </div>
          <div className="mt-5 text-xl font-extrabold tracking-[4px] text-[#7FA3A3]">•••• •••• •••• ••••</div>
        </div>

        <div className="flex-1 relative mt-8">
          <AnimatePresence custom={direction} mode="wait">
            {step === 'name' && (
              <motion.div
                key="name"
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="absolute inset-0 flex flex-col"
              >
                <div className="text-center">
                  <h1 className="text-[24px] font-black tracking-tight text-ink">Name your card</h1>
                  <p className="mt-1.5 text-[14px] font-medium leading-relaxed text-ink-muted">
                    Give it a nickname to easily identify it later.
                  </p>
                </div>
                
                <form onSubmit={handleNameContinue} className="mt-8 flex flex-col flex-1">
                  <TextField 
                    label="Card Nickname" 
                    value={cardName} 
                    onChange={(e) => setCardName(e.target.value)} 
                    placeholder="e.g. My Subscriptions"
                    required
                    maxLength={20}
                  />
                  <div className="flex-1" />
                  <Button type="submit" fullWidth className="!h-14 !text-[16px] mb-2" disabled={!cardName.trim()}>
                    Continue to PIN
                  </Button>
                </form>
              </motion.div>
            )}

            {(step === 'pin' || step === 'confirm') && (
              <motion.div
                key="pin"
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="absolute inset-0 flex flex-col"
              >
                <div className="text-center">
                  <p className="text-[24px] font-black tracking-tight text-ink">
                    {step === 'confirm' ? 'Confirm your PIN' : 'Set your card PIN'}
                  </p>
                  <p className="mx-auto mt-1 max-w-[270px] text-[13.5px] font-semibold leading-relaxed text-ink-muted">
                    {error ?? "You'll use this to authorize card payments. Rarely needed for online subscriptions."}
                  </p>
                </div>

                <div className="mt-6 flex justify-center gap-4">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`h-4 w-4 rounded-full border-2 transition-all ${
                        i < pin.length ? 'border-gold bg-gold' : 'border-ink/20 bg-transparent'
                      } ${error ? '!border-salmon-text !bg-salmon-text' : ''}`}
                    />
                  ))}
                </div>

                <div className="flex-1" />

                <div className="grid grid-cols-3 gap-3 mb-2">
                  {KEYS.map((k, i) =>
                    k === '' ? (
                      <div key={i} />
                    ) : (
                      <button
                        key={i}
                        onClick={() => press(k)}
                        disabled={submitting}
                        className="flex h-[60px] items-center justify-center rounded-2xl bg-white text-2xl font-extrabold text-ink shadow-[0_3px_10px_rgba(20,40,45,0.06)] disabled:opacity-50"
                      >
                        {k === 'del' ? (
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6B7377" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
                            <path d="M18 9l-6 6M12 9l6 6" />
                          </svg>
                        ) : (
                          k
                        )}
                      </button>
                    ),
                  )}
                </div>
                <p className="mt-2 mb-2 text-center text-[11px] font-bold text-ink-faint uppercase tracking-wider">
                  Bank-grade AES-256 Encryption
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
