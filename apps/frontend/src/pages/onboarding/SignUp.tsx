import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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

export default function SignUp() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [mode, setMode] = useState<'signup' | 'login'>('signup');
  const [selectedSubs, setSelectedSubs] = useState<Set<string>>(new Set(['netflix', 'spotify'])); // SMART DEFAULTS

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

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

  const renderProgressBar = () => {
    const percentage = mode === 'login' ? 100 : (step / 3) * 100; // GOAL GRADIENT (Starts at 33%)
    return (
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#EAE7DF]">
        <div 
          className="h-full bg-teal transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    );
  };

  if (mode === 'login') {
    return (
      <OnboardingShell>
        {renderProgressBar()}
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
          <button type="button" onClick={() => setMode('signup')} className="mt-4 text-sm font-bold text-ink-muted underline">
            Don't have an account? Sign up
          </button>
        </form>
      </OnboardingShell>
    );
  }

  return (
    <OnboardingShell>
      {renderProgressBar()}
      
      {step === 1 && (
        <div className="mt-4 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="text-center">
            <h1 className="text-[26px] font-black tracking-tight text-ink">Let's build your wallet.</h1>
            <p className="mt-1.5 text-[15px] font-medium leading-relaxed text-ink-muted">
              Select the subscriptions you want us to manage. We've highlighted a few popular ones.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3">
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

          <Button 
            fullWidth 
            className="mt-10 !h-14 !text-[17px]" 
            onClick={() => setStep(2)}
            disabled={selectedSubs.size === 0}
          >
            Continue
          </Button>
          <button type="button" onClick={() => setMode('login')} className="mt-6 text-sm font-bold text-ink-muted">
            Already have an account? <span className="text-teal underline">Log in</span>
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="mt-4 flex flex-col animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-teal/10">
              <span className="text-2xl">✨</span>
            </div>
            <h1 className="text-[26px] font-black tracking-tight text-ink">Your setup is ready!</h1>
            <p className="mt-2 text-[15px] font-medium leading-relaxed text-ink-muted">
              We'll track your <strong className="text-ink">{formatNaira(totalSpend)}</strong> monthly spend across <strong className="text-ink">{selectedSubs.size} services</strong>.
            </p>
            <p className="mt-3 rounded-xl bg-gold-bg p-3.5 text-[14px] font-semibold text-gold-text">
              You'll get Telegram reminders 3 days before every charge so you're never caught off guard.
            </p>
          </div>

          <Button fullWidth className="mt-10 !h-14 !text-[17px]" onClick={() => setStep(3)}>
            Secure My Wallet
          </Button>
          <button type="button" onClick={() => setStep(1)} className="mt-5 text-sm font-bold text-ink-muted underline">
            Back
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="mt-4 flex flex-col animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="text-center mb-8">
            <h1 className="text-[26px] font-black tracking-tight text-ink">Don't lose your setup!</h1>
            <p className="mt-1.5 text-[15px] font-medium leading-relaxed text-ink-muted">
              Create an account to save your custom wallet and get your virtual card.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
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

            <Button type="submit" fullWidth className="mt-4 !bg-gradient-to-br !from-teal-light !to-teal !text-[#EAF3F0] !shadow-[0_12px_22px_-10px_rgba(207,154,68,0.9)] !h-14 !text-[17px]" disabled={submitting}>
              {submitting ? 'Saving…' : 'Save My Wallet'}
            </Button>
          </form>
          <button type="button" onClick={() => setStep(2)} className="mt-5 text-center text-sm font-bold text-ink-muted underline">
            Back
          </button>
        </div>
      )}
    </OnboardingShell>
  );
}
