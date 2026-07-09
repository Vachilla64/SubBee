import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { useWalletData } from '../../lib/useWalletData';
import { daysUntil, formatNaira, formatShortDate, isInsufficientFunds, nextChargeDate, shortfallKobo } from '../../lib/format';
import BalancePanel from '../../components/money/BalancePanel';
import VirtualCardBlock from '../../components/money/VirtualCardBlock';
import SubscriptionRow from '../../components/subscriptions/SubscriptionRow';
import ActionRequiredCard from '../../components/subscriptions/ActionRequiredCard';
import EmptyState from '../../components/ui/EmptyState';
import Button from '../../components/ui/Button';
import { SkeletonRows } from '../../components/ui/Skeleton';
import { useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning,';
  if (h < 18) return 'Good afternoon,';
  return 'Good evening,';
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { loading, walletKobo, card, subscriptions, accountNumber } = useWalletData();

  const activeSubs = subscriptions.filter((s) => s.isActive);
  const withDates = activeSubs
    .map((s) => ({ sub: s, date: nextChargeDate(s.billingDay) }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  const nearest = withDates[0];
  const nearestShort = nearest ? shortfallKobo(nearest.sub, walletKobo) : 0;

  const previewSubs = subscriptions.slice(0, 3);

  // If this is the initial load, the splash screen is playing (or just played).
  // We add a delay so the subscriptions slide up exactly when the splash screen finishes clearing.
  const [isFirstLoad] = useState(() => !sessionStorage.getItem('subbee_splash_seen'));

  const [pendingSubs] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem('subbee_pending_subs');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Animation variants for subscriptions sliding up
  const subsContainerVariants: Variants = {
    hidden: { opacity: 0, y: 50 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        type: 'spring', 
        stiffness: 70, 
        damping: 15,
        delay: isFirstLoad ? 1.5 : 0, // Wait for splash screen to clear
        staggerChildren: 0.1
      } 
    }
  };

  const subItemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div>
      <div className="flex items-center justify-between px-5 pb-3.5 pt-6">
        <div>
          <p className="text-[13px] font-semibold text-gold-text">{greeting()}</p>
          <p className="text-[19px] font-extrabold text-ink">{user?.name?.split(' ')[0] ?? 'there'} 🐝</p>
        </div>
        <div className="flex gap-2.5">
          <button
            onClick={() => navigate('/app/notifications')}
            className="relative flex h-10 w-10 items-center justify-center rounded-[14px] bg-white shadow-[0_3px_10px_rgba(20,40,45,0.07)]"
            aria-label="Notifications"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1E2A2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.7 21a2 2 0 0 1-3.4 0" />
            </svg>
          </button>
          <button
            onClick={() => navigate('/app/profile')}
            className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-white shadow-[0_3px_10px_rgba(20,40,45,0.07)]"
            aria-label="Settings"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1E2A2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="px-5">
        {user?.kycStatus !== 'verified' && (
          <button
            onClick={() => navigate('/kyc')}
            className="mb-3 flex w-full items-center gap-2.5 rounded-2xl border border-gold-deep/30 bg-gold-light/25 px-4 py-3 text-left"
          >
            <span className="text-lg">🐝</span>
            <span className="text-[12.5px] font-bold leading-snug text-gold-text">
              Verify your identity to unlock a virtual card — your wallet already works.
            </span>
          </button>
        )}

        {!loading && card.status === 'frozen' && (
          <button
            onClick={() => navigate('/app/card')}
            className="mb-3 flex w-full items-center gap-2.5 rounded-2xl border border-salmon-alertBorder bg-salmon-alertBg px-4 py-3 text-left"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C6543F" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <path d="M12 2v20M4.2 6.5l15.6 11M19.8 6.5L4.2 17.5" />
            </svg>
            <span className="text-[12.5px] font-bold leading-snug text-salmon-text">
              Your card is frozen. Tap to review and unfreeze it.
            </span>
          </button>
        )}

        <BalancePanel
          loading={loading}
          totalKobo={walletKobo + (card.balanceKobo ?? 0)}
          availableKobo={walletKobo}
          reservedKobo={card.balanceKobo ?? 0}
        />

        {!loading && <VirtualCardBlock status={card.status} balanceKobo={card.balanceKobo} last4={card.last4} />}

        <div className="relative mt-4.5 overflow-hidden rounded-card bg-white shadow-[0_4px_16px_rgba(20,40,45,0.05)]">
          <div className="relative z-10 pt-4 px-4.5 pb-12">
            <div className="flex items-center justify-between">
              <span className="text-[17px] font-extrabold text-ink">Upcoming Payments</span>
              {nearest && (
                <span className="rounded-full bg-[#F1EEE7] px-2.5 py-1 text-[11px] font-extrabold text-[#8A7A55]">
                  T-{Math.max(0, daysUntil(nearest.date))} days
                </span>
              )}
            </div>

            {loading ? (
              <div className="mt-3">
                <SkeletonRows count={1} />
              </div>
            ) : !nearest ? (
              <p className="mt-2 text-[12.5px] font-semibold text-ink-muted">Add a subscription to see upcoming charges here.</p>
            ) : nearestShort > 0 ? (
              <div className="mt-2.5">
                <ActionRequiredCard
                  merchantName={nearest.sub.merchantName}
                  billKobo={nearest.sub.amountKobo}
                  walletKobo={walletKobo}
                  shortfallKobo={nearestShort}
                  accountNumber={accountNumber}
                  onTopUp={() =>
                    navigate('/app/activity/fund', { state: { shortfallKobo: nearestShort, merchantName: nearest.sub.merchantName } })
                  }
                />
              </div>
            ) : (
              <>
                <div className="mt-1.5 flex items-center gap-1.5 text-[12.5px] font-bold text-active-text">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4A8A5C" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  All upcoming subscriptions fully covered.
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <img
                    src={`/icons/${nearest.sub.merchantId}.png`}
                    alt=""
                    onError={(e) => ((e.currentTarget as HTMLElement).style.visibility = 'hidden')}
                    className="h-11 w-11 shrink-0 rounded-xl bg-ink/5 object-contain p-1"
                  />
                  <div className="flex-1">
                    <div className="text-[15px] font-extrabold text-ink">{nearest.sub.merchantName}</div>
                    <div className="text-[12.5px] font-semibold text-[#263339]">{formatShortDate(nearest.date)}</div>
                  </div>
                  <span className="tabular-nums text-base font-extrabold text-ink">{formatNaira(nearest.sub.amountKobo)}</span>
                </div>
              </>
            )}
          </div>
          <img
            src="/illustrations/meadow.png"
            alt=""
            className="pointer-events-none absolute inset-x-0 -bottom-[60px] z-0 h-[209px] w-full object-cover object-bottom opacity-[0.92]"
          />
        </div>

        <div className="mt-4.5 flex items-center justify-between px-1">
          <span className="text-[17px] font-extrabold text-ink">My Subscriptions</span>
          {subscriptions.length > 0 && (
            <button onClick={() => navigate('/app/subscriptions')} className="text-[13px] font-extrabold text-teal">
              See all
            </button>
          )}
        </div>

        <AnimatePresence>
          <motion.div 
            className="mt-2.5 flex flex-col gap-2.5 pb-4"
            variants={subsContainerVariants}
            initial="hidden"
            animate="show"
          >
            {loading ? (
                <SkeletonRows count={3} />
              ) : previewSubs.length === 0 && pendingSubs.length === 0 ? (
                <EmptyState
                  title="No subscriptions yet"
                  message="Add your first subscription and SubBee takes it from here."
                  cta={
                    <Button onClick={() => navigate('/app/subscriptions/add')}>Add a subscription</Button>
                  }
                />
              ) : (
                [...previewSubs, ...(previewSubs.length === 0 ? pendingSubs.map((p, i) => ({
                  id: `pending-${i}`,
                  merchantId: p.service_id,
                  merchantName: p.service_name,
                  amountKobo: p.amount,
                  isActive: false,
                  billingDay: 1,
                  isPending: true
                })) : [])].map((sub: any) => {
                  const insufficient = isInsufficientFunds(sub, walletKobo);
                  return (
                    <motion.div 
                      key={sub.id} 
                      variants={subItemVariants}
                      className={insufficient ? 'overflow-hidden rounded-[18px] bg-white shadow-[0_3px_12px_rgba(20,40,45,0.05)]' : ''}
                    >
                      <SubscriptionRow sub={sub} insufficient={insufficient} embedded={insufficient} />
                      {insufficient && (
                        <div className="px-2.5 pb-2.5">
                          <ActionRequiredCard
                            merchantName={sub.merchantName}
                            billKobo={sub.amountKobo}
                            walletKobo={walletKobo}
                            shortfallKobo={shortfallKobo(sub, walletKobo)}
                            accountNumber={accountNumber}
                            onTopUp={() =>
                              navigate('/app/activity/fund', {
                                state: { shortfallKobo: shortfallKobo(sub, walletKobo), merchantName: sub.merchantName },
                              })
                            }
                          />
                        </div>
                      )}
                    </motion.div>
                  );
                })
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
