import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import TopBar from '../../components/layout/TopBar';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';
import { useWalletData } from '../../lib/useWalletData';
import { api } from '../../lib/api';

interface SecureDetails {
  card_number?: string;
  cvv?: string;
  expiry_month?: string;
  expiry_year?: string;
}

const AUTO_HIDE_SECONDS = 20;

export default function RevealCardDetails() {
  const { card } = useWalletData();
  const [phase, setPhase] = useState<'confirm' | 'loading' | 'revealed' | 'error'>('confirm');
  const [details, setDetails] = useState<SecureDetails | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(AUTO_HIDE_SECONDS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const reveal = async () => {
    if (!card.cardId) return;
    setPhase('loading');
    try {
      const fresh = await api.revealCardDetails(card.cardId);
      setDetails(fresh);
      setPhase('revealed');
      setSecondsLeft(AUTO_HIDE_SECONDS);
      timerRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            setPhase('confirm');
            setDetails(null);
            return AUTO_HIDE_SECONDS;
          }
          return s - 1;
        });
      }, 1000);
    } catch {
      setPhase('error');
    }
  };

  return (
    <div>
      <TopBar title="Card Details" back />
      <div className="flex flex-col gap-4 px-5">
        <div className="relative overflow-hidden rounded-[24px] p-6 text-[#E6EFEE] shadow-[0_20px_40px_-10px_rgba(20,40,45,0.4)] border border-white/20"
             style={{ background: "linear-gradient(150deg, #2E6264 0%, #1C4042 52%, #143032 100%)" }}
        >
          {/* Subtle shimmer effect */}
          <motion.div
            animate={{ x: ["-100%", "200%"] }}
            transition={{ repeat: Infinity, duration: 4, ease: "linear", repeatDelay: 2 }}
            className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 pointer-events-none"
          />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-extrabold tracking-wide text-teal-soft3 drop-shadow-sm uppercase">SUBBEE VIRTUAL</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#B6E0BE]/20 px-2.5 py-1 text-[10px] font-black tracking-wider shadow-sm text-[#B6E0BE]">
                ✓ ACTIVE
              </span>
            </div>

            {phase === 'loading' ? (
              <Skeleton className="mt-8 mb-2 h-6 w-52 !bg-white/10" />
            ) : (
              <div className="tabular-nums mt-8 mb-2 text-[22px] font-extrabold tracking-[4px] text-white drop-shadow-md">
                {phase === 'revealed' && details?.card_number ? details.card_number.replace(/(.{4})/g, '$1 ').trim() : `•••• •••• •••• ${card.last4 ?? '····'}`}
              </div>
            )}

            <div className="mt-5 flex gap-6">
              <div>
                <div className="text-[9px] font-extrabold tracking-widest text-teal-soft3">EXPIRY</div>
                <div className="tabular-nums text-[13px] font-extrabold text-[#EAF3F0] mt-0.5">
                  {phase === 'revealed' && details ? `${details.expiry_month} / ${details.expiry_year}` : '•• / ••'}
                </div>
              </div>
              <div>
                <div className="text-[9px] font-extrabold tracking-widest text-teal-soft3">CVV</div>
                <div className="tabular-nums text-[13px] font-extrabold text-[#EAF3F0] mt-0.5">
                  {phase === 'revealed' && details ? details.cvv : '•••'}
                </div>
              </div>
            </div>

            {phase === 'revealed' && (
              <div className="relative mt-5 pt-3 border-t border-white/10 flex items-center gap-2 text-[11px] font-bold text-teal-softText">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9FC4C3" strokeWidth="2.4">
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                Hides automatically in 0:{secondsLeft.toString().padStart(2, '0')} · never stored
              </div>
            )}
          </div>
        </div>

        {phase === 'confirm' && (
          <div className="flex flex-col gap-3 rounded-2xl bg-white p-4.5 text-center shadow-[0_4px_16px_rgba(20,40,45,0.05)]">
            <p className="text-sm font-bold text-ink">Full number, CVV, and expiry are fetched fresh from Bridgecard every time - never stored on our side.</p>
            <Button onClick={reveal}>Reveal card details</Button>
          </div>
        )}

        {phase === 'revealed' && (
          <Button variant="secondary" fullWidth onClick={() => { setPhase('confirm'); setDetails(null); if (timerRef.current) clearInterval(timerRef.current); }}>
            Hide details
          </Button>
        )}

        {phase === 'error' && (
          <div className="flex flex-col gap-3 rounded-2xl border border-salmon-alertBorder bg-salmon-alertBg p-4.5 text-center">
            <p className="text-sm font-bold text-salmon-text">Couldn't fetch details - try again.</p>
            <Button onClick={reveal}>Retry</Button>
          </div>
        )}
      </div>
    </div>
  );
}
