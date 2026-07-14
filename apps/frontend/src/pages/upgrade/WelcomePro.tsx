import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import Button from '../../components/ui/Button';

const CONFETTI_COLORS = ['#F2CE7C', '#E7B84F', '#1C4042', '#2E6264', '#FFFFFF'];

const PERKS = [
  {
    title: 'Unlimited subscriptions',
    desc: 'Track every bill — no more 7-sub cap.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1C4042" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 2 7 12 12 22 7 12 2" />
        <polyline points="2 17 12 22 22 17" />
        <polyline points="2 12 12 17 22 12" />
      </svg>
    ),
  },
  {
    title: 'Priority alerts',
    desc: 'Reminders before any card charge, every time.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1C4042" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
  {
    title: 'Advanced insights',
    desc: 'See exactly where your money goes each month.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1C4042" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
];

const SPARKLES = [
  { left: '12%', top: '18%', size: 6, duration: 3.2, delay: 0 },
  { left: '85%', top: '14%', size: 5, duration: 3.6, delay: 0.4 },
  { left: '20%', top: '68%', size: 4, duration: 2.8, delay: 0.8 },
  { left: '90%', top: '62%', size: 6, duration: 3.4, delay: 0.2 },
  { left: '6%', top: '42%', size: 4, duration: 3, delay: 1.1 },
  { left: '78%', top: '82%', size: 5, duration: 3.8, delay: 0.6 },
];

export default function WelcomePro() {
  const navigate = useNavigate();

  useEffect(() => {
    const burst = () =>
      confetti({
        particleCount: 110,
        spread: 85,
        startVelocity: 42,
        origin: { y: 0.28 },
        colors: CONFETTI_COLORS,
        zIndex: 60,
      });

    const sideBursts = () => {
      confetti({ particleCount: 45, angle: 60, spread: 60, origin: { x: 0, y: 0.5 }, colors: CONFETTI_COLORS, zIndex: 60 });
      confetti({ particleCount: 45, angle: 120, spread: 60, origin: { x: 1, y: 0.5 }, colors: CONFETTI_COLORS, zIndex: 60 });
    };

    const t1 = setTimeout(burst, 400);
    const t2 = setTimeout(sideBursts, 750);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div
      className="relative flex min-h-screen flex-col overflow-hidden bg-cover bg-center px-6 pb-8 pt-10"
      style={{ backgroundImage: `url('/illustrations/paywall_honey.jpg')` }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-black/60 backdrop-blur-[2px]" />

      {SPARKLES.map((s, i) => (
        <motion.span
          key={i}
          className="pointer-events-none absolute rounded-full bg-gold-light shadow-[0_0_8px_rgba(242,206,124,0.9)]"
          style={{ left: s.left, top: s.top, width: s.size, height: s.size }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.15, 1, 0.15], y: [0, -12, 0] }}
          transition={{ duration: s.duration, delay: s.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center">
        <motion.div
          initial={{ scale: 0.3, opacity: 0, rotate: -20 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 240, damping: 15, delay: 0.1 }}
          className="relative flex h-[136px] w-[136px] items-center justify-center"
        >
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'radial-gradient(circle at 50% 45%, rgba(242,206,124,0.55), rgba(231,184,79,0.15) 60%, rgba(231,184,79,0) 75%)',
            }}
          />
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
            className="relative flex h-[106px] w-[106px] items-center justify-center overflow-hidden rounded-full border-[4px] border-white/90 bg-gradient-to-br from-gold-panelFrom to-[#E1AC46] shadow-[0_18px_36px_-10px_rgba(207,154,68,0.85)]"
          >
            <img src="/illustrations/subbee-logo.png" alt="" className="h-[62px] w-[66px] object-contain" />
            <motion.div
              initial={{ left: '-150%' }}
              animate={{ left: '150%' }}
              transition={{ delay: 1.1, duration: 1.3, ease: 'easeInOut' }}
              className="absolute inset-y-0 w-[150%] skew-x-[-25deg] bg-gradient-to-r from-transparent via-white/60 to-transparent"
            />
          </motion.div>
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.7, type: 'spring', stiffness: 420, damping: 14 }}
            className="absolute -bottom-1 -right-1 flex items-center gap-1 bg-gradient-to-r from-[#E7B84F] to-[#CF9A44] text-[#3A2A0E] text-[11px] font-black uppercase tracking-wider py-1 px-2.5 rounded-[4px] shadow-[0_6px_14px_rgba(207,154,68,0.55)] border-[1.5px] border-white"
          >
            PRO
          </motion.div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.6, ease: 'easeOut' }}
          className="mt-6 text-center text-[30px] font-black leading-[1.15] tracking-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.35)]"
        >
          Welcome to
          <br />
          SubBee Pro!
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6, ease: 'easeOut' }}
          className="mt-3 max-w-[280px] text-center text-[14.5px] font-semibold leading-relaxed text-white/90 drop-shadow-[0_1px_6px_rgba(0,0,0,0.3)]"
        >
          Your account is fully upgraded. Here's what just unlocked:
        </motion.p>

        <div className="mt-6 flex w-full max-w-[320px] flex-col gap-2.5">
          {PERKS.map((perk, i) => (
            <motion.div
              key={perk.title}
              initial={{ opacity: 0, x: -18 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9 + i * 0.13, duration: 0.5, ease: 'easeOut' }}
              className="flex items-center gap-3 rounded-[20px] border border-[#E7B84F]/40 bg-[#FDF7EC]/90 px-4 py-3 shadow-[0_8px_30px_rgba(46,57,61,0.15)] backdrop-blur-xl"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1C4042]/10">{perk.icon}</div>
              <div>
                <div className="text-[14px] font-extrabold text-[#2E393D]">{perk.title}</div>
                <div className="text-[12px] font-semibold text-[#5A4515] leading-snug">{perk.desc}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.35, duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 mx-auto w-full max-w-[320px]"
      >
        <Button
          fullWidth
          onClick={() => navigate('/app/dashboard')}
          className="h-14 text-[16px] bg-[#E7B84F] text-[#3A2A0E] shadow-[0_10px_24px_rgba(207,154,68,0.45)] hover:bg-[#F2CE7C]"
        >
          Go to Dashboard
        </Button>
      </motion.div>
    </div>
  );
}
