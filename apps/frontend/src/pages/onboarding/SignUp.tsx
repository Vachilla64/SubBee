import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OnboardingShell from '../../components/layout/OnboardingShell';
import TextField from '../../components/ui/TextField';
import Button from '../../components/ui/Button';
import { useAuth } from '../../lib/auth';

export default function SignUp() {
  const [mode, setMode] = useState<'signup' | 'login'>('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

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

  return (
    <OnboardingShell>
      <div className="mt-3 flex flex-col items-center gap-2.5 text-center">
        <img src="/illustrations/subbee-logo.png" alt="SubBee" className="h-28 w-32 animate-float object-contain" />
        <span className="text-3xl font-black tracking-tight text-gold-text">SubBee</span>
        <p className="text-[15px] font-semibold leading-snug text-gold-text">
          Subscriptions, handled.
          <br />
          Your money, safe and looked after.
        </p>
      </div>

      <div className="mt-7 flex gap-1.5 rounded-full bg-[#F1EEE7] p-1.5">
        {(['signup', 'login'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`flex-1 rounded-full py-2.5 text-[15px] font-extrabold transition-colors ${
              mode === m ? 'bg-white text-ink shadow-sm' : 'text-ink-muted'
            }`}
          >
            {m === 'signup' ? 'Sign up' : 'Log in'}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3.5">
        {mode === 'signup' && (
          <TextField label="Full name" required placeholder="Ada Obi" value={name} onChange={(e) => setName(e.target.value)} />
        )}
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
          {submitting ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Log in'}
        </Button>
      </form>

      <div className="relative mt-auto -mx-6 h-24">
        <img src="/illustrations/meadow.png" alt="" className="absolute inset-0 h-full w-full object-cover object-bottom opacity-95" />
      </div>
    </OnboardingShell>
  );
}
