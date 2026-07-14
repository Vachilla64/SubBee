import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import TopBar from '../../components/layout/TopBar';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';
import { useAuth } from '../../lib/auth';
import { useWalletData } from '../../lib/useWalletData';
import { api } from '../../lib/api';
import { formatNaira } from '../../lib/format';

export default function CardHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { loading, card, refetch } = useWalletData();
  const [showPauseWarning, setShowPauseWarning] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-bg">
        <TopBar title="Virtual Card" back />
        <div className="px-5">
          <Skeleton className="h-56 w-full rounded-[24px]" />
        </div>
      </div>
    );
  }

  if (card.status === 'inactive') {
    return (
      <div className="min-h-screen bg-cream-bg">
        <TopBar title="Get your card" back />
        <div className="px-5 pb-8">
          
          {/* Blurred Premium Card Preview (Reciprocity) */}
          <div className="relative w-full h-[210px] mt-2 mb-8 perspective-[1000px]">
            {/* Soft glow behind */}
            <div className="absolute inset-4 bg-teal/30 blur-2xl rounded-full" />
            
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
              className="w-full h-full rounded-[24px] overflow-hidden shadow-[0_20px_40px_-10px_rgba(20,40,45,0.4)] border border-white/20 relative"
              style={{
                background: "linear-gradient(150deg, #2E6264 0%, #1C4042 52%, #143032 100%)",
                filter: "blur(4px)" // Blurred until they unlock it
              }}
            >
              <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay"></div>
              
              <div className="p-5 flex flex-col h-full justify-between opacity-80">
                <div className="flex justify-between items-start">
                  <span className="text-[13px] font-extrabold tracking-wide text-white">
                    SUBBEE VIRTUAL
                  </span>
                  <div className="flex">
                    <div className="w-8 h-8 rounded-full bg-[#EB001B] mix-blend-screen opacity-90"></div>
                    <div className="w-8 h-8 rounded-full bg-[#F79E1B] mix-blend-screen opacity-90 -ml-4"></div>
                  </div>
                </div>
                <div className="w-11 h-8 rounded-md bg-gradient-to-br from-[#E7C97E] to-[#C9A545]"></div>
                <div className="font-mono text-xl tracking-[4px] text-white">
                  •••• •••• •••• ••••
                </div>
                <div className="flex justify-between items-end text-white text-[11px] font-bold tracking-widest uppercase">
                  <span>{user?.name || "CARDHOLDER"}</span>
                  <span>••/••</span>
                </div>
              </div>
            </motion.div>

            {/* Lock Overlay */}
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none drop-shadow-xl">
               <div className="bg-white/90 backdrop-blur-md p-4 rounded-full shadow-lg text-teal">
                 <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                 </svg>
               </div>
               <span className="mt-3 bg-ink text-gold text-[10px] font-black tracking-widest px-4 py-2 rounded-full shadow-xl">
                  LOCKED ASSET
               </span>
            </div>
          </div>

          <div className="text-center px-2 mb-8">
            <h2 className="text-[26px] font-black tracking-tight text-ink">Ready to activate.</h2>
            <p className="mt-2 text-[15px] font-semibold leading-relaxed text-ink-muted">
              {user?.kycStatus !== 'verified'
                ? "Verify your identity in 30 seconds to reveal and activate your secure Virtual Mastercard."
                : "Your card is ready! A card is created automatically the first time a sub needs one - or get yours now."}
            </p>
          </div>

          {user?.kycStatus !== 'verified' ? (
            <Button onClick={() => navigate('/kyc')} fullWidth className="!h-14 !text-[17px]">
              Verify Identity to Reveal
            </Button>
          ) : (
            <Button onClick={() => navigate('/app/card/pin')} fullWidth className="!h-14 !text-[17px]">
              Secure & Get My Card
            </Button>
          )}
        </div>
      </div>
    );
  }

  const toggleFreeze = async () => {
    if (!card.cardId || isToggling) return;
    setIsToggling(true);
    await api.toggleCardFreeze(card.cardId, card.status === 'frozen');
    await refetch();
    setIsToggling(false);
    setShowPauseWarning(false);
  };

  const frozen = card.status === 'frozen';

  return (
    <div className="min-h-screen bg-cream-bg">
      <TopBar title="Virtual Card" back />
      <div className="flex flex-col gap-3.5 px-5 pb-8">
        
        {/* Active Premium Card UI */}
        <div className="relative overflow-hidden rounded-[24px] p-6 text-[#E6EFEE] shadow-[0_20px_40px_-10px_rgba(20,40,45,0.4)] border border-white/20"
             style={{ background: "linear-gradient(150deg, #2E6264 0%, #1C4042 52%, #143032 100%)" }}
        >
          {/* Subtle shimmer effect */}
          <motion.div
            animate={{ x: ["-100%", "200%"] }}
            transition={{ repeat: Infinity, duration: 4, ease: "linear", repeatDelay: 2 }}
            className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12"
          />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-extrabold tracking-wide text-teal-soft3 drop-shadow-sm uppercase">
                SUBBEE VIRTUAL
              </span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black tracking-wider shadow-sm ${
                  frozen ? 'bg-white/20 text-white backdrop-blur-sm' : 'bg-[#B6E0BE]/20 text-[#B6E0BE]'
                }`}
              >
                {frozen ? '❄ FROZEN' : '✓ ACTIVE'}
              </span>
            </div>
            
            <div className="mt-5 w-11 h-8 rounded-md bg-gradient-to-br from-[#E7C97E] to-[#C9A545] shadow-sm"></div>
            
            <div className="tabular-nums mt-4 text-[22px] font-extrabold tracking-[4px] text-white drop-shadow-md">
              •••• •••• •••• {card.last4 ?? '····'}
            </div>
            
            <div className="mt-5 flex items-end justify-between">
              <div className="flex gap-6">
                <div>
                  <div className="text-[9px] font-extrabold tracking-widest text-teal-soft3">EXPIRY</div>
                  <div className="text-[13px] font-extrabold text-[#EAF3F0] mt-0.5">•• / ••</div>
                </div>
                <div>
                  <div className="text-[9px] font-extrabold tracking-widest text-teal-soft3">CVV</div>
                  <div className="text-[13px] font-extrabold text-[#EAF3F0] mt-0.5">•••</div>
                </div>
              </div>
              <div className="flex items-center mt-1">
                <div className="w-[32px] h-[32px] rounded-full bg-[#EB001B] opacity-90 mix-blend-screen"></div>
                <div className="w-[32px] h-[32px] rounded-full bg-[#F79E1B] opacity-90 mix-blend-screen -ml-[16px]"></div>
              </div>
            </div>
          </div>
          
          {frozen && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-[rgba(178,208,224,0.6)] to-[rgba(140,178,201,0.8)] backdrop-blur-[6px]">
              <div className="flex h-[56px] w-[56px] items-center justify-center rounded-full bg-white shadow-[0_10px_25px_rgba(30,60,80,0.3)]">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2E5A78" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v20M4.2 6.5l15.6 11M19.8 6.5L4.2 17.5M12 6l-3 2 3 2 3-2-3-2zM12 14l-3 2 3 2 3-2-3-2z" />
                </svg>
              </div>
              <span className="text-[15px] font-black tracking-widest text-[#1E3F55] mt-1 drop-shadow-sm">FROZEN</span>
            </div>
          )}
        </div>

        {/* Contrast Anchoring: Card Balance */}
        <div className="flex flex-col rounded-[20px] bg-white border-[1.5px] border-[#EAE7DF] shadow-[0_4px_16px_rgba(20,40,45,0.04)] overflow-hidden mt-2">
          <div className="flex items-center justify-between px-5 pt-4 pb-3">
            <div>
              <div className="text-[11px] font-extrabold tracking-widest text-ink-faint">AVAILABLE BALANCE</div>
              <div className="tabular-nums text-[24px] font-black tracking-tight text-ink mt-0.5">{formatNaira(card.balanceKobo ?? 0)}</div>
            </div>
          </div>
          {/* The Contrast Anchor */}
          <div className="bg-[#F9F5EC] px-5 py-3 border-t border-[#EAE7DF]/60 flex items-center gap-3">
            <div className="flex size-7 rounded-full bg-teal/10 items-center justify-center shrink-0">
               <span className="text-[13px]">🛡️</span>
            </div>
            <p className="text-[12px] font-bold leading-tight text-ink-muted">
              Auto-funded just-in-time. Prevented an estimated <strong className="text-teal">₦4,500</strong> in unwanted auto-renewals.
            </p>
          </div>
        </div>

        {frozen && (
          <div className="flex items-center gap-3 rounded-[20px] border border-[#B9D3E3] bg-[#EAF2F8] px-4 py-3.5">
            <div className="bg-white p-1.5 rounded-full shadow-sm shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2A5C8A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20M4.2 6.5l15.6 11M19.8 6.5L4.2 17.5" />
              </svg>
            </div>
            <span className="text-[13px] font-bold leading-snug text-[#2A5C8A]">
              Frozen for your protection. Unfreeze to reactivate - SubBee auto-freezes after repeated declines.
            </span>
          </div>
        )}

        <div className="flex gap-2.5 mt-2">
          <Button variant="primary" fullWidth onClick={() => navigate('/app/activity/fund')} className="flex-col !gap-1 !py-3.5 !text-[13px] !rounded-[16px] shadow-sm">
            Top Up
          </Button>
          <Button
            variant={frozen ? 'primary' : 'caution'}
            fullWidth
            onClick={() => {
              if (frozen) toggleFreeze();
              else setShowPauseWarning(true);
            }}
            className="flex-col !gap-1 !py-3.5 !text-[13px] !rounded-[16px] shadow-sm"
          >
            {frozen ? 'Unfreeze' : 'Freeze Card'}
          </Button>
          <Button variant="secondary" fullWidth onClick={() => navigate('/app/card/reveal')} className="flex-col !gap-1 !py-3.5 !text-[13px] !rounded-[16px] shadow-sm bg-white border border-[#EAE7DF]">
            Card Details
          </Button>
        </div>

      </div>

      {/* Loss Aversion Warning Modal */}
      <AnimatePresence>
        {showPauseWarning && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-ink/40 backdrop-blur-[2px] z-40"
              onClick={() => setShowPauseWarning(false)}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center px-5 pointer-events-none">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-white rounded-[24px] p-6 shadow-2xl pointer-events-auto w-full max-w-[340px]"
              >
                <div className="w-12 h-12 rounded-full bg-salmon-alertBg border-4 border-salmon-alertBorder flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl">⚠️</span>
                </div>
                <h3 className="text-[20px] font-black text-center text-ink tracking-tight">Pause your card?</h3>
                <p className="mt-2 text-[14px] font-semibold text-center text-ink-muted leading-relaxed">
                  Freezing this card will cause your upcoming <strong className="text-ink">active subscriptions</strong> to <strong className="text-salmon-text">fail</strong>.
                </p>
                <div className="mt-6 flex flex-col gap-2">
                  <Button variant="caution" fullWidth onClick={toggleFreeze} disabled={isToggling} className="!h-12 !text-[15px]">
                    {isToggling ? 'Freezing...' : 'Yes, freeze card'}
                  </Button>
                  <Button variant="secondary" fullWidth onClick={() => setShowPauseWarning(false)} disabled={isToggling} className="!h-12 !text-[15px] border-transparent">
                    Cancel
                  </Button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
