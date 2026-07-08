import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { api } from '../../lib/api';

export default function CardCreating() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const poll = async () => {
      try {
        const card = await api.getCard(user.email);
        if (!cancelled && card.status && card.status !== 'inactive') {
          navigate('/app/card', { replace: true });
          return;
        }
      } catch {
        // keep polling — a transient failure shouldn't strand the user here
      }
      if (!cancelled) setTimeout(poll, 1200);
    };
    poll();
    return () => {
      cancelled = true;
    };
  }, [user, navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-cream-bg px-8 text-center">
      <img src="/illustrations/subbee-logo.png" alt="" className="h-24 w-24 animate-float object-contain" />
      <p className="text-xl font-black text-ink">Creating your card…</p>
      <p className="max-w-xs text-sm font-semibold text-ink-muted">
        Usually just a few seconds. We'll take you straight to it.
      </p>
    </div>
  );
}
