import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { api } from '../../lib/api';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

export default function SetCardPin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [firstPin, setFirstPin] = useState<string | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const confirming = firstPin !== null;

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

    if (!confirming) {
      setTimeout(() => {
        setFirstPin(next);
        setPin('');
      }, 150);
      return;
    }

    if (next !== firstPin) {
      setError("PINs didn't match — try again.");
      setTimeout(() => {
        setFirstPin(null);
        setPin('');
        setError(null);
      }, 900);
      return;
    }

    if (!user) return;
    setSubmitting(true);
    try {
      await api.requestCard(user.email, next);
      navigate('/app/card/creating');
    } catch {
      setError('Could not create your card — try again.');
      setFirstPin(null);
      setPin('');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-bg">
      <div className="app-shell-width mx-auto flex min-h-screen flex-col px-6 pb-8 pt-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex h-[38px] w-[38px] items-center justify-center rounded-xl bg-white shadow-[0_3px_10px_rgba(20,40,45,0.07)]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1E2A2E" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <span className="text-lg font-extrabold text-ink">Get your card</span>
          <div className="flex-1" />
          <span className="rounded-full bg-[#EFEBE2] px-2.5 py-1.5 text-[11.5px] font-extrabold text-gold-label">
            {confirming ? 'Step 2 of 2' : 'Step 1 of 2'}
          </span>
        </div>

        <div className="teal-card-gradient relative mt-4 overflow-hidden rounded-[20px] p-4.5 text-[#E6EFEE]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold tracking-wide text-teal-soft3">SUBBEE VIRTUAL</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(242,206,124,0.2)] px-2.5 py-1 text-[10.5px] font-extrabold text-gold-light">
              ISSUING
            </span>
          </div>
          <div className="mt-4.5 text-xl font-extrabold tracking-[4px] text-[#7FA3A3]">•••• •••• •••• ••••</div>
        </div>

        <div className="mt-4.5 text-center">
          <p className="text-[21px] font-black tracking-tight text-ink">{confirming ? 'Confirm your PIN' : 'Set your card PIN'}</p>
          <p className="mx-auto mt-1 max-w-[270px] text-[13.5px] font-semibold leading-relaxed text-ink-muted">
            {error ?? "You'll use this to authorize card payments. Rarely needed for online subscriptions."}
          </p>
        </div>

        <div className="mt-4.5 flex justify-center gap-4">
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

        <div className="grid grid-cols-3 gap-3">
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

        <p className="mt-4 text-center text-xs font-semibold text-ink-faint">Your PIN is encrypted and never stored in plain text.</p>
      </div>
    </div>
  );
}
