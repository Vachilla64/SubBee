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
  { id: 'youtube', name: 'YouTube Premium', icon: '/icons/youtube.png', price: 110000 },
  { id: 'dstv', name: 'DSTV', icon: '/icons/dstv.png', price: 1660000 },
  { id: 'netflix', name: 'Netflix', icon: '/icons/netflix.png', price: 600000 },
  { id: 'spotify', name: 'Spotify', icon: '/icons/spotify.png', price: 170000 },
  { id: 'prime', name: 'Prime Video', icon: '/icons/amazon_prime.png', price: 280000 },
  { id: 'apple', name: 'Apple Music', icon: '/icons/apple.png', price: 150000 },
  { id: 'github', name: 'GitHub Copilot', icon: '/icons/github.png', price: 1000000 },
  { id: 'linkedin', name: 'LinkedIn Premium', icon: '/icons/linkedin.png', price: 4000000 },
  { id: 'openai', name: 'ChatGPT Plus', icon: '/icons/openai.png', price: 2000000 },
  { id: 'zoom', name: 'Zoom Pro', icon: '/icons/zoom.png', price: 1500000 },
  { id: 'play', name: 'Google Play', icon: '/icons/play.png', price: 100000 }
];

const GOALS = [
  { id: 'never_miss', title: 'Never miss a bill payment again', icon: '🎯' },
  { id: 'track_spend', title: 'Track exactly how much I spend', icon: '📊' },
  { id: 'virtual_card', title: 'Get a secure virtual card', icon: '💳' },
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
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [direction, setDirection] = useState(1);
  const [mode, setMode] = useState<'signup' | 'login'>('signup');
  
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [selectedSubs, setSelectedSubs] = useState<Set<string>>(new Set(['youtube', 'dstv'])); // SMART DEFAULTS

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
      // 1. Save to local storage so Dashboard picks it up
      const pendingSubs = Array.from(selectedSubs).map(id => {
        const sub = SUBSCRIPTION_OPTIONS.find(s => s.id === id);
        return {
          service_id: id,
          service_name: sub?.name,
          icon_url: sub?.icon,
          amount: sub?.price
        };
      });
      localStorage.setItem('subbee_pending_subs', JSON.stringify(pendingSubs));

      // 2. Perform actual login/signup
      const user = await login(name || email.split('@')[0], email);
      navigate(user.kycStatus === 'verified' ? '/app/dashboard' : '/kyc');
    } catch {
      setError('Something went wrong — check your details and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Auto advance animation steps
  useEffect(() => {
    if (mode === 'signup') {
      if (step === 2) {
        const timer = setTimeout(() => paginate(3), 2000);
        return () => clearTimeout(timer);
      }
      if (step === 4) {
        const timer = setTimeout(() => paginate(5), 2500);
        return () => clearTimeout(timer);
      }
    }
  }, [step, mode]);

  const renderProgressBar = () => {
    if (mode === 'login') return null;
    const percentage = (step / 6) * 100;
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
              <div className="text-center mt-6">
                <h1 className="text-[26px] font-black tracking-tight text-ink">What is your main goal with SubBee?</h1>
                <p className="mt-1.5 text-[15px] font-medium leading-relaxed text-ink-muted">
                  We'll customize your wallet to help you achieve it.
                </p>
              </div>

              <div className="mt-8 flex flex-col gap-3 flex-1">
                {GOALS.map((goal) => (
                  <button
                    key={goal.id}
                    onClick={() => {
                      setSelectedGoal(goal.id);
                      paginate(2);
                    }}
                    className={`flex items-center gap-4 rounded-2xl border-2 p-5 text-left transition-all ${
                      selectedGoal === goal.id ? 'border-teal bg-teal/5 shadow-sm scale-[1.02]' : 'border-[#EAE7DF] bg-white shadow-sm hover:border-teal/30 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-2xl">{goal.icon}</span>
                    <span className="text-[16px] font-extrabold text-ink">{goal.title}</span>
                  </button>
                ))}
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
              className="absolute inset-0 flex flex-col items-center justify-center text-center"
            >
              <div className="mx-auto mb-6 h-24 w-24 rounded-full bg-teal/10 flex items-center justify-center">
                <span className="text-4xl">🤝</span>
              </div>
              <h1 className="text-[26px] font-black tracking-tight text-ink">Great goal.</h1>
              <p className="mt-2 text-[16px] font-medium leading-relaxed text-ink-muted px-4">
                Let's start by picking the bills you want to manage.
              </p>
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
              <div className="text-center mt-2">
                <h1 className="text-[24px] font-black tracking-tight text-ink">Select your bills.</h1>
                <p className="mt-1 text-[14px] font-medium leading-relaxed text-ink-muted">
                  We've highlighted a few popular ones to get you started.
                </p>
              </div>

              <div className="mt-6 flex flex-col gap-2.5 flex-1 overflow-y-auto pb-4 px-1">
                {SUBSCRIPTION_OPTIONS.map((sub) => {
                  const selected = selectedSubs.has(sub.id);
                  return (
                    <button
                      key={sub.id}
                      onClick={() => toggleSub(sub.id)}
                      className={`flex items-center gap-3 rounded-2xl border-2 p-3 transition-all ${
                        selected ? 'border-teal bg-teal/5 shadow-sm scale-[1.01]' : 'border-[#EAE7DF] bg-white shadow-sm hover:bg-gray-50'
                      }`}
                    >
                      {/* Logo strictly on the left, not in a circle, authentic branding */}
                      <div className="flex h-10 w-12 shrink-0 items-center justify-center">
                        <img src={sub.icon} alt={sub.name} className="max-h-full max-w-full object-contain" />
                      </div>
                      <span className={`text-[15px] font-extrabold ${selected ? 'text-teal' : 'text-ink'}`}>{sub.name}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-2 text-center text-[13px] font-semibold text-ink-muted">
                Many more subscriptions can be chosen or set up inside the app!
              </div>

              <div className="mb-6 mt-4 flex items-center gap-3">
                <button type="button" onClick={() => paginate(1)} className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAE7DF] text-ink transition-colors hover:bg-[#dfdbd1]">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
                <Button 
                  fullWidth 
                  className="!h-14 !text-[17px]" 
                  onClick={() => paginate(4)}
                  disabled={selectedSubs.size === 0}
                >
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
                <button type="button" onClick={() => paginate(3)} className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAE7DF] text-ink transition-colors hover:bg-[#dfdbd1]">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
                <Button fullWidth className="!h-14 !text-[17px]" onClick={() => paginate(6)}>
                  Secure My Wallet
                </Button>
              </div>
            </motion.div>
          )}

          {step === 6 && (
            <motion.div
              key="step6"
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
                <button type="button" onClick={() => paginate(5)} className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAE7DF] text-ink transition-colors hover:bg-[#dfdbd1]">
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
