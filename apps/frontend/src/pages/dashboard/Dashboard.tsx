import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../lib/auth";
import { useWalletData } from "../../lib/useWalletData";
import { api } from "../../lib/api";
import {
  daysUntil,
  formatNaira,
  formatShortDate,
  isInsufficientFunds,
  nextChargeDate,
} from "../../lib/format";
import BalancePanel from "../../components/money/BalancePanel";
import VirtualCardBlock from "../../components/money/VirtualCardBlock";
import SubscriptionRow from "../../components/subscriptions/SubscriptionRow";
import SubscriptionActionSheet from "../../components/subscriptions/SubscriptionActionSheet";
import EmptyState from "../../components/ui/EmptyState";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import { SkeletonRows } from "../../components/ui/Skeleton";
import { useEffect, useState } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning,";
  if (h < 18) return "Good afternoon,";
  return "Good evening,";
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { loading, walletKobo, card, subscriptions, refetch } = useWalletData();

  const activeSubs = subscriptions.filter((s) => s.isActive);
  const upcomingSubs = activeSubs.filter((s) => !s.needsConfirmation);
  const withDates = upcomingSubs
    .map((s) => ({ sub: s, date: nextChargeDate(s.billingDay) }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  
  const dueSoon = withDates.filter((item) => Math.max(0, daysUntil(item.date)) <= 3);
  const totalDueSoon = dueSoon.reduce((acc, curr) => acc + curr.sub.amountKobo, 0n);
  const totalShortfall = walletKobo < totalDueSoon ? totalDueSoon - walletKobo : 0n;
  const nearest = dueSoon[0]; // For the T-X days badge

  const previewSubs = subscriptions.slice(0, 3);

  // If this is the initial load, the splash screen is playing (or just played).
  // We add a delay so the subscriptions slide up exactly when the splash screen finishes clearing.
  const [isFirstLoad] = useState(
    () => !sessionStorage.getItem("subbee_splash_seen"),
  );

  const [pendingSubs, setPendingSubs] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem("subbee_pending_subs");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [settingUp, setSettingUp] = useState(false);
  const [actionSheetSub, setActionSheetSub] = useState<any | null>(null);

  // Subscriptions picked during signup are only ever staged in localStorage -
  // nothing is actually created until the user has a working card. Once that's
  // true, prompt them to finish setup instead of leaving dead "pending" rows
  // that 404 when tapped.
  useEffect(() => {
    if (!loading && card.status !== "inactive" && pendingSubs.length > 0) {
      setShowPendingModal(true);
    }
  }, [loading, card.status, pendingSubs.length]);

  const clearPending = () => {
    localStorage.removeItem("subbee_pending_subs");
    setPendingSubs([]);
    setShowPendingModal(false);
  };

  const autoSetupPending = async () => {
    if (!user) return;
    setSettingUp(true);
    const results = await Promise.allSettled(
      pendingSubs.map((p) =>
        api.addSubscription({
          email: user.email,
          merchantId: p.service_id,
          merchantName: p.service_name,
          amountNaira: (p.amount ?? 0) / 100,
          billingDay: Math.min(28, Math.max(1, new Date().getDate())),
          remindersEnabled: true,
        }),
      ),
    );
    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const total = pendingSubs.length;
    setSettingUp(false);
    clearPending();
    await refetch();
    if (succeeded === total) {
      toast.success(
        `${succeeded} subscription${succeeded === 1 ? "" : "s"} set up!`,
      );
    } else if (succeeded > 0) {
      toast.error(`${succeeded} of ${total} set up - add the rest anytime.`);
    } else {
      toast.error(
        "Couldn't set those up automatically - add them manually anytime.",
      );
    }
  };

  const setUpManually = () => {
    clearPending();
    navigate("/app/subscriptions/add");
  };

  // Animation variants for subscriptions sliding up
  const subsContainerVariants: Variants = {
    hidden: { opacity: 0, y: 50 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 70,
        damping: 15,
        delay: isFirstLoad ? 1.5 : 0, // Wait for splash screen to clear
        staggerChildren: 0.1,
      },
    },
  };

  const subItemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div>
      <div className="flex items-center justify-between px-5 pb-3.5 pt-6">
        <div>
          <p className="text-[13px] font-semibold text-gold-text">
            {greeting()}
          </p>
          <div className="flex items-center gap-2">
            <p className="text-[19px] font-extrabold text-ink">
              {user?.name?.split(" ")[0] ?? "there"}🌻
            </p>
            {user?.isPro && (
              <span className="bg-gradient-to-r from-[#E7B84F] to-[#CF9A44] text-[#3A2A0E] text-[10px] font-black uppercase tracking-wider py-0.5 px-1.5 rounded-sm shadow-sm flex items-center mt-0.5">
                PRO
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2.5">
          <button
            onClick={() => navigate("/app/notifications")}
            className="relative flex h-10 w-10 items-center justify-center rounded-[14px] bg-white shadow-[0_3px_10px_rgba(20,40,45,0.07)]"
            aria-label="Notifications"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#1E2A2E"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.7 21a2 2 0 0 1-3.4 0" />
            </svg>
          </button>
          <button
            onClick={() => navigate("/app/profile")}
            className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-white shadow-[0_3px_10px_rgba(20,40,45,0.07)]"
            aria-label="Settings"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#1E2A2E"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="px-5">
        {user?.kycStatus !== "verified" && (
          <button
            onClick={() => navigate("/kyc")}
            className="mb-3 flex w-full items-center gap-2.5 rounded-2xl border border-gold-deep/30 bg-gold-light/25 px-4 py-3 text-left"
          >
            <span className="text-lg">🐝</span>
            <span className="text-[12.5px] font-bold leading-snug text-gold-text">
              Verify your identity to unlock a virtual card - your wallet
              already works.
            </span>
          </button>
        )}

        {!loading && card.status === "frozen" && (
          <button
            onClick={() => navigate("/app/card")}
            className="mb-3 flex w-full items-center gap-2.5 rounded-2xl border border-salmon-alertBorder bg-salmon-alertBg px-4 py-3 text-left"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#C6543F"
              strokeWidth="2.3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0"
            >
              <path d="M12 2v20M4.2 6.5l15.6 11M19.8 6.5L4.2 17.5" />
            </svg>
            <span className="text-[12.5px] font-bold leading-snug text-salmon-text">
              Your card is frozen. Tap to review and unfreeze it.
            </span>
          </button>
        )}

        <BalancePanel
          loading={loading}
          totalKobo={walletKobo + (card.balanceKobo ?? 0n)}
          availableKobo={walletKobo}
          reservedKobo={card.balanceKobo ?? 0n}
        />

        {!loading && (
          <VirtualCardBlock
            status={card.status}
            balanceKobo={card.balanceKobo}
            last4={card.last4}
          />
        )}

        {!loading && card.status !== "inactive" && (
          <div className="relative mt-4.5 overflow-hidden rounded-card bg-white shadow-[0_4px_16px_rgba(20,40,45,0.05)]">
            <div className="relative z-10 pt-4 px-4.5 pb-12">
              <div className="flex items-center justify-between">
                <span className="text-[17px] font-extrabold text-ink">
                  Upcoming Payments
                </span>
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
              ) : dueSoon.length === 0 ? (
                <p className="mt-2 text-[12.5px] font-semibold text-ink-muted">
                  {subscriptions.length > 0 
                    ? "No payments due in the next 3 days."
                    : "Add a subscription to see upcoming charges here."}
                </p>
              ) : (
                <>
                  <div
                    className={`mt-1.5 flex items-center gap-1.5 text-[12.5px] font-bold ${
                      totalShortfall > 0n
                        ? "text-salmon-text"
                        : "text-active-text"
                    }`}
                  >
                    {totalShortfall > 0n ? (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#C6543F"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                    ) : (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#4A8A5C"
                        strokeWidth="2.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    )}
                    {totalShortfall > 0n
                      ? `Short ${formatNaira(totalShortfall)} - top up your wallet`
                      : "All upcoming subscriptions fully covered."}
                  </div>
                  
                  {dueSoon.map((item) => (
                    <button
                      key={item.sub.id}
                      onClick={() => setActionSheetSub(item.sub)}
                      className="mt-4 flex w-full items-center gap-3.5 text-left transition-all hover:bg-black/[0.02] p-1.5 -mx-1.5 rounded-2xl"
                    >
                      <img
                        src={`/icons/${item.sub.merchantId}.png`}
                        alt=""
                        onError={(e) =>
                          ((e.currentTarget as HTMLElement).style.visibility =
                            "hidden")
                        }
                        className="h-[46px] w-[46px] shrink-0 rounded-[16px] bg-ink/5 object-contain p-[7px] shadow-sm"
                      />
                      <div className="flex-1">
                        <div className="text-[15.5px] font-extrabold text-ink leading-tight">
                          {item.sub.merchantName}
                        </div>
                        <div className="text-[12.5px] font-bold text-ink-muted/80 mt-0.5 flex items-center gap-1.5">
                          {formatShortDate(item.date)}
                          {item.sub.remindersEnabled && (
                            <>
                              <span className="opacity-40">•</span>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gold-dark"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                            </>
                          )}
                        </div>
                      </div>
                      <span className="tabular-nums text-[15px] font-extrabold text-ink shrink-0">
                        {item.sub.needsConfirmation && item.sub.amountKobo <= 1n ? (
                          <span className="flex items-center gap-1.5 text-gold-dark text-[13px] bg-gold-light/20 px-2.5 py-1 rounded-lg border border-gold/30">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                            Auto
                          </span>
                        ) : formatNaira(item.sub.amountKobo)}
                      </span>
                    </button>
                  ))}
                </>
              )}
            </div>
            <img
              src="/illustrations/meadow.png"
              alt=""
              className="pointer-events-none absolute inset-x-0 -bottom-[60px] z-0 h-[209px] w-full object-cover object-bottom opacity-[0.92]"
            />
          </div>
        )}

        {/* Upgrade Banner */}
        {!user?.isPro && (
          <div
            onClick={() => navigate("/app/upgrade")}
            className="mt-4 mx-1 rounded-[20px] bg-gradient-to-r from-[#E7B84F] to-[#DFAE44] p-4 flex items-center justify-between shadow-[0_8px_16px_-6px_rgba(207,154,68,0.4)] cursor-pointer transition-transform active:scale-95"
          >
            <div>
              <div className="text-[14px] font-black text-[#3A2A0E] flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#3A2A0E">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                </svg>
                Unlock SubBee Pro
              </div>
              <div className="text-[12px] font-semibold text-[#5A4515] mt-0.5">
                Add unlimited subscriptions & more
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#3A2A0E"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between px-1 mt-5">
          <span className="text-[17px] font-extrabold text-ink">
            My Subscriptions
          </span>
          {(subscriptions.length > 0 || pendingSubs.length > 0) && (
            <button
              onClick={() => navigate("/app/subscriptions")}
              className="text-[13px] font-extrabold text-teal"
            >
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
                  <Button onClick={() => navigate("/app/subscriptions/add")}>
                    Add a subscription
                  </Button>
                }
              />
            ) : (
              [
                ...previewSubs,
                ...(previewSubs.length === 0
                  ? pendingSubs.map((p, i) => ({
                      id: `pending-${i}`,
                      merchantId: p.service_id,
                      merchantName: p.service_name,
                      amountKobo: p.amount,
                      isActive: false,
                      billingDay: 1,
                      isPending: true,
                    }))
                  : []),
              ].map((sub: any) => {
                const insufficient = isInsufficientFunds(sub, walletKobo);
                return (
                  <motion.div key={sub.id} variants={subItemVariants}>
                    <SubscriptionRow
                      sub={sub}
                      insufficient={insufficient}
                      awaitingCard={card.status === "inactive"}
                      onClick={
                        sub.isPending
                          ? () => navigate("/app/subscriptions/add")
                          : () => setActionSheetSub(sub)
                      }
                    />
                  </motion.div>
                );
              })
            )}

            <button
              onClick={() => {
                if (!user?.isPro && subscriptions.length >= 7) {
                  navigate("/app/upgrade");
                } else {
                  navigate("/app/subscriptions/add");
                }
              }}
              className="mt-1 flex items-center justify-center gap-2 rounded-[18px] border-2 border-dashed border-[#C4B58C] bg-[#F7F1E2] px-4 py-4 text-[14.5px] font-extrabold text-[#8A7A55] transition-colors hover:bg-[#F1E9D4]"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#8A7A55"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              Add Subscription
            </button>
          </motion.div>
        </AnimatePresence>
      </div>

      <Modal
        open={showPendingModal}
        variant="info"
        title="Finish setting up your subscriptions"
        message={`You picked ${pendingSubs.length} subscription${pendingSubs.length === 1 ? "" : "s"} during signup (${pendingSubs
          .slice(0, 3)
          .map((p) => p.service_name)
          .join(
            ", ",
          )}${pendingSubs.length > 3 ? ` +${pendingSubs.length - 3} more` : ""}). Want SubBee to set them up automatically, or would you rather do it yourself?`}
        onClose={() => setShowPendingModal(false)}
        actions={[
          {
            label: settingUp ? "Setting up…" : "Auto-setup all",
            onClick: autoSetupPending,
            variant: "primary",
            disabled: settingUp,
          },
          {
            label: "I'll set them up myself",
            onClick: setUpManually,
            variant: "ghost",
            disabled: settingUp,
          },
        ]}
      />

      <SubscriptionActionSheet
        sub={actionSheetSub}
        walletKobo={walletKobo}
        awaitingCard={card.status === "inactive"}
        onClose={() => setActionSheetSub(null)}
        onChanged={refetch}
      />
    </div>
  );
}
