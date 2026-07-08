import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import OnboardingShell from '../../components/layout/OnboardingShell';
import TextField from '../../components/ui/TextField';
import Button from '../../components/ui/Button';
import { useAuth } from '../../lib/auth';
import { formatNaira } from '../../lib/format';

type SubscriptionOption = {
  id: string;
  name: string;
  icon: string;
  price: number;
};

const SUBSCRIPTION_OPTIONS: SubscriptionOption[] = [
  { id: 'netflix', name: 'Netflix', icon: '/icons/netflix.png', price: 600000 },
  { id: 'spotify', name: 'Spotify', icon: '/icons/spotify.png', price: 170000 },
  { id: 'prime', name: 'Prime Video', icon: '/icons/amazon_prime.png', price: 280000 },
  { id: 'apple', name: 'Apple Music', icon: '/icons/apple.png', price: 150000 },
  { id: 'dstv', name: 'DSTV', icon: '/icons/dstv.png', price: 1660000 }
];

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

export default function SignUp() {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [direction, setDirection] = useState(1);
  const [mode, setMode] = useState<'signup' | 'login'>('signup');
  const [selectedSubs, setSelectedSubs] = useState<Set<string>>(new Set(['netflix', 'spotify'])); // SMART DEFAULTS

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const paginate = (newStep: number) => {
    setDirection(newStep > step ? 1 : -1);
    setStep(newStep as any);
  };

  const toggleSub = (id: string) => {
    const next = new Set(selectedSubs);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedSubs(next);
  };

  const totalSpend = useMemo(() => {
    return Array.from(selectedSubs).reduce((acc, id) => {
      const sub = SUBSCRIPTION_OPTIONS.find(s => s.id === id);
      return acc + (sub?.price || 0);
    }, 0);
  }, [selectedSubs]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    setError(null);
    try {
      const user = await login(name || email.split('@')[0], email);
      navigate(user.kycStatus === 'verified' ? '/app/dashboard' : '/kyc');
    } catch {
      setError('Something went wrong — check your details and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (step === 3 && mode === 'signup') {
      const timer = setTimeout(() => {
        paginate(4);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [step, mode]);

  const renderProgressBar = () => {
    if (mode === 'login') return null;
    const percentage = (step / 5) * 100;
    return (
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#EAE7DF]">
        <div 
          className="h-full bg-teal transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    );
  };

  const loginHeader = mode === 'signup' ? (
    <button onClick={() => setMode('login')} className="text-sm font-bold text-ink-muted underline">
      Log in
    </button>
  ) : (
    <button onClick={() => setMode('signup')} className="text-sm font-bold text-ink-muted underline">
      Sign up
    </button>
  );

  if (mode === 'login') {
    return (
      <OnboardingShell headerRight={loginHeader}>
        <div className="mt-8 flex flex-col items-center gap-2.5 text-center">
          <img src="/illustrations/subbee-logo.png" alt="SubBee" className="h-20 w-24 object-contain" />
          <span className="text-2xl font-black tracking-tight text-gold-text">Welcome Back</span>
        </div>
        
        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3.5">
          <TextField
            label="Email"
            type="email"
            required
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {error && <p className="text-sm font-semibold text-salmon-text">{error}</p>}
          <Button type="submit" fullWidth className="mt-2 !h-14 !text-[17px]" disabled={submitting}>
            {submitting ? 'Logging in…' : 'Log in'}
          </Button>
        </form>
      </OnboardingShell>
    );
  }

  return (
    <OnboardingShell headerRight={loginHeader}>
      {renderProgressBar()}
      
      <div className="flex-1 relative">
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
              <div className="text-center mt-12 flex-1">
                <div className="mx-auto mb-6 h-28 w-28 rounded-full bg-teal/10 flex items-center justify-center">
                  <span className="text-5xl">🐝</span>
                </div>
                <h1 className="text-[28px] font-black tracking-tight text-ink">Subscriptions are messy.</h1>
                <p className="mt-2 text-[16px] font-medium leading-relaxed text-ink-muted">
                  We built SubBee to make sure you never lose money to a forgotten bill again.
                </p>
              </div>
              <Button fullWidth className="!h-14 !text-[17px] mb-8" onClick={() => paginate(2)}>
                Let's build your wallet
              </Button>
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
              <div className="text-center mt-4">
                <h1 className="text-[26px] font-black tracking-tight text-ink">Select your bills.</h1>
                <p className="mt-1.5 text-[15px] font-medium leading-relaxed text-ink-muted">
                  Pick the ones you want us to manage. We've highlighted a few popular ones.
                </p>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-3 flex-1 overflow-y-auto pb-4">
                {SUBSCRIPTION_OPTIONS.map((sub) => {
                  const selected = selectedSubs.has(sub.id);
                  return (
                    <button
                      key={sub.id}
                      onClick={() => toggleSub(sub.id)}
                      className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all ${
                        selected ? 'border-teal bg-teal/5 shadow-sm scale-[1.02]' : 'border-transparent bg-white shadow-sm hover:bg-gray-50'
                      }`}
                    >
                      <img src={sub.icon} alt={sub.name} className="h-10 w-10 rounded-full object-cover shadow-sm" />
                      <span className={`text-[13px] font-extrabold ${selected ? 'text-teal' : 'text-ink'}`}>{sub.name}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mb-8 mt-4 flex items-center gap-3">
                <button type="button" onClick={() => paginate(1)} className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAE7DF] text-ink transition-colors hover:bg-[#dfdbd1]">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
                <Button 
                  fullWidth 
                  className="!h-14 !text-[17px]" 
                  onClick={() => paginate(3)}
                  disabled={selectedSubs.size === 0}
                >
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
              className="absolute inset-0 flex flex-col items-center justify-center"
            >
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                className="h-16 w-16 rounded-full border-4 border-[#EAE7DF] border-t-teal"
              />
              <h1 className="mt-6 text-[22px] font-black tracking-tight text-ink animate-pulse">
                Crunching the numbers...
              </h1>
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
              <div className="text-center mt-10 flex-1">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-teal/10">
                  <span className="text-2xl">✨</span>
                </div>
                <h1 className="text-[26px] font-black tracking-tight text-ink">Boom. Your setup is ready.</h1>
                <p className="mt-4 text-[16px] font-medium leading-relaxed text-ink-muted">
                  We'll seamlessly track your <strong className="text-ink">{formatNaira(totalSpend)}</strong> monthly spend across <strong className="text-ink">{selectedSubs.size} services</strong>.
                </p>
                <div className="mt-6 rounded-2xl bg-gold-bg p-4 shadow-sm border border-gold-label/20">
                  <p className="text-[14.5px] font-bold text-gold-text leading-snug">
                    You'll get a Telegram message 3 days before every charge so you are never caught off guard.
                  </p>
                </div>
              </div>

              <div className="mb-8 mt-4 flex items-center gap-3">
                <button type="button" onClick={() => paginate(2)} className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAE7DF] text-ink transition-colors hover:bg-[#dfdbd1]">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
                <Button fullWidth className="!h-14 !text-[17px]" onClick={() => paginate(5)}>
                  Secure My Wallet
                </Button>
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div
              key="step5"
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="absolute inset-0 flex flex-col"
            >
              <div className="text-center mt-4 mb-6">
                <h1 className="text-[26px] font-black tracking-tight text-ink">Don't lose your setup!</h1>
                <p className="mt-1.5 text-[15px] font-medium leading-relaxed text-ink-muted">
                  Create an account to save your custom wallet and generate your virtual card.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 flex-1">
                <TextField label="Full name" required placeholder="Ada Obi" value={name} onChange={(e) => setName(e.target.value)} />
                <TextField
                  label="Email"
                  type="email"
                  required
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />

                {error && <p className="text-sm font-semibold text-salmon-text">{error}</p>}
              </form>

              <div className="mb-8 mt-4 flex items-center gap-3">
                <button type="button" onClick={() => paginate(4)} className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAE7DF] text-ink transition-colors hover:bg-[#dfdbd1]">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
                <Button onClick={handleSubmit} fullWidth className="!bg-gradient-to-br !from-teal-light !to-teal !text-[#EAF3F0] !shadow-[0_12px_22px_-10px_rgba(207,154,68,0.9)] !h-14 !text-[17px]" disabled={submitting}>
                  {submitting ? 'Saving…' : 'Save My Wallet'}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </OnboardingShell>
  );
}
