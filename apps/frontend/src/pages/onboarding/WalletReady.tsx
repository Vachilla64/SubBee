import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, Variants } from 'framer-motion';
import confetti from 'canvas-confetti';
import Button from '../../components/ui/Button';
import { useAuth } from '../../lib/auth';
import { api } from '../../lib/api';
import { useTransition } from '../../lib/TransitionContext';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 },
  },
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } },
};

export default function WalletReady() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { triggerTransition } = useTransition();
  const [account, setAccount] = useState<{ accountNumber: string | null; bankName: string | null }>({
    accountNumber: null,
    bankName: null,
  });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Fire celebratory confetti!
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.8 },
        colors: ['#E9B84A', '#183739', '#3E9B62']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.8 },
        colors: ['#E9B84A', '#183739', '#3E9B62']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  useEffect(() => {
    if (!user) return;
    api.getDepositInfo(user.email).then(setAccount).catch(() => {});
  }, [user]);

  const copy = async () => {
    if (!account.accountNumber) return;
    await navigator.clipboard.writeText(account.accountNumber).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGoToDashboard = () => {
    triggerTransition(() => navigate('/app/dashboard'));
  };

  return (
    <div className="min-h-screen bg-cream-bg relative overflow-hidden">
      {/* Decorative background blurs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#E9B84A] rounded-full mix-blend-multiply filter blur-[100px] opacity-20 pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#2E6264] rounded-full mix-blend-multiply filter blur-[100px] opacity-10 pointer-events-none" />

      <div className="app-shell-width mx-auto flex min-h-screen flex-col px-6 pb-10 pt-10 relative z-10">
        
        <motion.div 
          variants={containerVariants} 
          initial="hidden" 
          animate="visible"
          className="flex-1 flex flex-col justify-center"
        >
          <motion.div variants={itemVariants} className="mt-2 flex flex-col items-center gap-2 text-center">
            {/* Celebratory Mascot */}
            <div className="relative mb-2">
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", bounce: 0.5, delay: 0.1 }}
              >
                <img src="/illustrations/bee-happy.png" alt="Happy Bee" className="h-[120px] object-contain drop-shadow-xl" />
              </motion.div>
            </div>
            
            <h1 className="text-3xl font-black tracking-tight text-ink">Welcome to the hive!</h1>
            <p className="max-w-[290px] mt-1 text-[15px] font-semibold leading-relaxed text-ink-muted">
              Identity verified. Your Nomba deposit account is live and ready for action.
            </p>
          </motion.div>

          <motion.div 
            variants={itemVariants}
            className="honeycomb-gold mt-8 rounded-[24px] px-6 pb-6 pt-5 shadow-[0_24px_40px_-14px_rgba(197,148,64,0.6)] relative overflow-hidden"
          >
            {/* Shimmer effect inside the card */}
            <motion.div 
              className="absolute inset-0 w-[200%] bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12"
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            />
            
            <div className="relative z-10 flex items-center justify-between">
              <span className="text-xs font-extrabold tracking-wide text-gold-label">YOUR DEPOSIT ACCOUNT</span>
              <span className="rounded-full bg-gold-text/15 px-2.5 py-1 text-[10px] font-extrabold text-gold-text border border-gold-text/20 backdrop-blur-md">
                POWERED BY NOMBA
              </span>
            </div>
            
            <div className="relative z-10 tabular-nums mt-4 text-[38px] font-black tracking-[3px] text-gold-text drop-shadow-sm">
              {account.accountNumber ?? 'Pending…'}
            </div>
            
            <div className="relative z-10 mt-5 flex gap-3">
              <div className="flex-1 rounded-2xl border border-gold-text/80 bg-white/40 px-3.5 py-3 backdrop-blur-sm">
                <div className="text-[10.5px] font-extrabold tracking-wide text-gold-label">BANK</div>
                <div className="text-sm font-extrabold text-gold-text">{account.bankName ?? 'Nomba MFB'}</div>
              </div>
              <div className="flex-1 rounded-2xl border border-gold-text/80 bg-white/40 px-3.5 py-3 backdrop-blur-sm">
                <div className="text-[10.5px] font-extrabold tracking-wide text-gold-label">ACCOUNT NAME</div>
                <div className="truncate text-sm font-extrabold text-gold-text">{user?.name}</div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            variants={itemVariants}
            className="mt-6 flex items-start gap-3 rounded-[20px] border border-active-border bg-active-bg px-4 py-3.5 shadow-sm"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#3E6247] shadow-inner mt-0.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <span className="text-[13px] font-bold leading-relaxed text-[#2C4834]">
              Fund this account to power your subscriptions. Money lands in your SubBee wallet instantly.
            </span>
          </motion.div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="mt-8 flex flex-col gap-3"
        >
          <Button 
            variant="secondary" 
            fullWidth 
            onClick={copy} 
            className="!h-[54px] bg-white hover:bg-gray-50 border-gray-200 text-ink shadow-sm transition-all"
          >
            {copied ? (
              <span className="flex items-center justify-center gap-2 text-[#3E9B62]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                Copied!
              </span>
            ) : (
              'Copy account number'
            )}
          </Button>
          <Button fullWidth onClick={handleGoToDashboard} className="!h-[60px] !text-[16px] shadow-[0_8px_16px_-6px_rgba(233,184,74,0.4)]">
            Go to Dashboard
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
