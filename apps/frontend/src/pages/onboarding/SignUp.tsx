import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import OnboardingShell from "../../components/layout/OnboardingShell";
import TextField from "../../components/ui/TextField";
import Button from "../../components/ui/Button";
import { useAuth } from "../../lib/auth";
import { useTransition } from "../../lib/TransitionContext";

type SubscriptionOption = {
  id: string;
  name: string;
  icon: string;
  price: number;
};

const SUBSCRIPTION_OPTIONS: SubscriptionOption[] = [
  {
    id: "youtube",
    name: "YouTube Premium",
    icon: "/icons/youtube.png",
    price: 110000,
  },
  { id: "dstv", name: "DSTV", icon: "/icons/dstv.png", price: 1660000 },
  { id: "netflix", name: "Netflix", icon: "/icons/netflix.png", price: 600000 },
  { id: "spotify", name: "Spotify", icon: "/icons/spotify.png", price: 170000 },
  {
    id: "prime",
    name: "Prime Video",
    icon: "/icons/amazon_prime.png",
    price: 280000,
  },
  { id: "apple", name: "Apple Music", icon: "/icons/apple.png", price: 150000 },
  {
    id: "github",
    name: "GitHub Copilot",
    icon: "/icons/github.png",
    price: 1000000,
  },
  {
    id: "linkedin",
    name: "LinkedIn Premium",
    icon: "/icons/linkedin.png",
    price: 4000000,
  },
  {
    id: "openai",
    name: "ChatGPT Plus",
    icon: "/icons/openai.png",
    price: 2000000,
  },
  { id: "zoom", name: "Zoom Pro", icon: "/icons/zoom.png", price: 1500000 },
  { id: "play", name: "Google Play", icon: "/icons/play.png", price: 100000 },
  // Foreign additions
  { id: "hulu", name: "Hulu", icon: "/icons/hulu.png", price: 450000 },
  { id: "disney", name: "Disney+", icon: "/icons/disney.png", price: 520000 },
  { id: "canva", name: "Canva Pro", icon: "/icons/canva.png", price: 800000 },
  {
    id: "adobe",
    name: "Adobe Creative Cloud",
    icon: "/icons/adobe.png",
    price: 3500000,
  },
  // Nigerian additions
  {
    id: "showmax",
    name: "Showmax",
    icon: "/icons/showmax.png",
    price: 290000,
  },
  { id: "mtn", name: "MTN", icon: "/icons/mtn.png", price: 500000 },
  { id: "airtel", name: "Airtel", icon: "/icons/airtel.png", price: 500000 },
  {
    id: "boomplay",
    name: "Boomplay",
    icon: "/icons/boomplay.png",
    price: 120000,
  },
  {
    id: "piggyvest",
    name: "PiggyVest",
    icon: "/icons/piggyvest.png",
    price: 100000,
  },
];

const GOALS = [
  { id: "never_miss", title: "Never miss a bill payment again", icon: "🎯" },
  { id: "track_spend", title: "Track exactly how much I spend", icon: "📊" },
  { id: "virtual_card", title: "Get a secure virtual card", icon: "💳" },
];

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 50 : -50,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 50 : -50,
    opacity: 0,
  }),
};

export default function SignUp() {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [direction, setDirection] = useState(1);
  const [mode, setMode] = useState<"signup" | "login">("signup");

  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [selectedSubs, setSelectedSubs] = useState<Set<string>>(
    new Set(["youtube", "dstv"]),
  ); // SMART DEFAULTS

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const { triggerTransition } = useTransition();
  const navigate = useNavigate();

  useEffect(() => {
    if (step === 6) {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#E9B84A", "#183739", "#BBD8D8", "#FFFFFF"],
      });
    }
  }, [step]);

  const paginate = (newStep: number) => {
    setDirection(newStep > step ? 1 : -1);
    setStep(newStep as any);
  };

  const toggleSub = (id: string) => {
    const next = new Set(selectedSubs);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedSubs(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    setError(null);
    try {
      // 1. Save to local storage so Dashboard picks it up
      const pendingSubs = Array.from(selectedSubs).map((id) => {
        const sub = SUBSCRIPTION_OPTIONS.find((s) => s.id === id);
        return {
          service_id: id,
          service_name: sub?.name,
          icon_url: sub?.icon,
          amount: sub?.price,
        };
      });
      localStorage.setItem("subbee_pending_subs", JSON.stringify(pendingSubs));

      // 2. Perform actual login/signup
      const user = await login(name || email.split("@")[0], email);
      triggerTransition(() => {
        navigate(user.kycStatus === "verified" ? "/app/dashboard" : "/kyc");
      });
    } catch {
      setError("Something went wrong - check your details and try again.");
      setSubmitting(false);
    }
  };

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setError(null);
    paginate(6);
  };

  // Auto advance animation steps
  useEffect(() => {
    if (mode === "signup") {
      if (step === 2) {
        const timer = setTimeout(() => paginate(3), 2000);
        return () => clearTimeout(timer);
      }
      if (step === 4) {
        const timer = setTimeout(() => paginate(5), 2500);
        return () => clearTimeout(timer);
      }
    }
  }, [step, mode]);

  const renderProgressBar = () => {
    if (mode === "login") return null;
    const percentage = (step / 6) * 100;
    return (
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#EAE7DF]">
        <div
          className="h-full bg-teal transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    );
  };

  const loginHeader =
    mode === "signup" ? (
      <button
        onClick={() => setMode("login")}
        className="text-sm font-bold text-ink-muted underline"
      >
        Log in
      </button>
    ) : (
      <button
        onClick={() => setMode("signup")}
        className="text-sm font-bold text-ink-muted underline"
      >
        Sign up
      </button>
    );

  if (mode === "login") {
    return (
      <OnboardingShell headerRight={loginHeader}>
        <div className="mt-8 flex flex-col items-center gap-2.5 text-center">
          <img
            src="/illustrations/subbee-logo.png"
            alt="SubBee"
            className="h-20 w-24 object-contain"
          />
          <span className="text-2xl font-black tracking-tight text-gold-text">
            Welcome Back
          </span>
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
          {error && (
            <p className="text-sm font-semibold text-salmon-text">{error}</p>
          )}
          <Button
            type="submit"
            fullWidth
            className="mt-2 !h-14 !text-[17px]"
            disabled={submitting}
          >
            {submitting ? "Logging in…" : "Log in"}
          </Button>
        </form>
      </OnboardingShell>
    );
  }

  return (
    <OnboardingShell headerRight={loginHeader}>
      {renderProgressBar()}

      <div className="flex-1 relative">
        <AnimatePresence custom={direction} mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute inset-0 flex flex-col"
            >
              <div className="text-center mt-6">
                <h1 className="text-[26px] font-black tracking-tight text-ink">
                  What is your main goal with SubBee?
                </h1>
                <p className="mt-1.5 text-[15px] font-medium leading-relaxed text-ink-muted">
                  We'll customize your wallet to help you achieve it.
                </p>
              </div>

              <div className="mt-8 flex flex-col gap-3 flex-1">
                {GOALS.map((goal) => (
                  <button
                    key={goal.id}
                    onClick={() => {
                      setSelectedGoal(goal.id);
                      paginate(2);
                    }}
                    className={`flex items-center gap-4 rounded-2xl border-2 p-5 text-left transition-all ${
                      selectedGoal === goal.id
                        ? "border-gold-mid bg-white shadow-[0_6px_16px_rgba(207,154,68,0.15)] scale-[1.02]"
                        : "border-[#EAE7DF] bg-white shadow-sm hover:border-gold-mid/30 hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-2xl">{goal.icon}</span>
                    <span className="text-[16px] font-extrabold text-ink">
                      {goal.title}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute inset-0 flex flex-col items-center justify-center text-center"
            >
              <div className="mx-auto mb-6 h-24 w-24 rounded-full bg-teal/10 flex items-center justify-center">
                <span className="text-7xl">🎯</span>
              </div>
              <h1 className="text-[26px] font-black tracking-tight text-ink">
                Great goals.
              </h1>
              <p className="mt-2 text-[16px] font-medium leading-relaxed text-ink-muted px-4">
                These and more will be easy now!
              </p>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute inset-0 flex flex-col"
            >
              <div className="text-center mt-2">
                <h1 className="text-[24px] font-black tracking-tight text-ink">
                  Which of these do you use?.
                </h1>
                <p className="mt-1 text-[14px] font-medium leading-relaxed text-ink-muted">
                  We've highlighted a few popular ones for you.
                </p>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3 flex-1 overflow-y-auto pt-1 pb-4 px-1">
                {SUBSCRIPTION_OPTIONS.map((sub) => {
                  const selected = selectedSubs.has(sub.id);
                  return (
                    <button
                      key={sub.id}
                      onClick={() => toggleSub(sub.id)}
                      className={`relative flex flex-col items-center gap-2.5 rounded-3xl border-2 p-4 text-center transition-all ${
                        selected
                          ? "border-gold-mid border-2 bg-white shadow-[0_6px_16px_rgba(207,154,68,0.15)] scale-[1.02]"
                          : "border-[#EAE7DF] bg-white shadow-sm hover:border-gold-mid/30"
                      }`}
                    >
                      {/*tick*/}
                      {selected && (
                        <div className="absolute top-2 right-2 flex size-5 items-center justify-center rounded-full bg-gold-mid text-white shadow-sm">
                          <svg
                            width="10"
                            height="10"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                        </div>
                      )}
                      <div
                        className={`flex shrink-0 items-center justify-center rounded-full size-14 overflow-hidden transition-colors ${selected ? "bg-[#FCF7EA]" : "bg-ink/5"}`}
                      >
                        <img
                          src={sub.icon}
                          alt={sub.name}
                          className="max-h-full max-w-full object-contain drop-shadow-sm"
                        />
                      </div>
                      <span
                        className={`text-[13px] leading-tight font-extrabold ${selected ? "text-ink" : "text-ink-muted"}`}
                      >
                        {sub.name}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-2 text-center text-[13px] font-semibold text-ink-muted">
                Many more subscriptions can be set up inside the app!
              </div>

              <div className="mb-6 mt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => paginate(1)}
                  className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAE7DF] text-ink transition-colors hover:bg-[#dfdbd1]"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
                <Button
                  fullWidth
                  className="!h-14 !text-[17px]"
                  onClick={() => paginate(4)}
                  disabled={selectedSubs.size === 0}
                >
                  Continue
                </Button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute inset-0 flex flex-col items-center justify-center"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                className="h-16 w-16 rounded-full border-4 border-[#EAE7DF] border-t-teal"
              />
              <h1 className="mt-6 text-[22px] font-black tracking-tight text-ink animate-pulse">
                Crunching the numbers...
              </h1>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div
              key="step5"
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute inset-0 flex flex-col"
            >
              <div className="text-center mt-4 mb-6">
                <h1 className="text-[26px] font-black tracking-tight text-ink">
                  Who are you?
                </h1>
                <p className="mt-1.5 text-[15px] font-medium leading-relaxed text-ink-muted">
                  Create an account to set up your virtual card so you can make
                  your payments.
                </p>
              </div>

              <form
                onSubmit={handleContinue}
                className="flex flex-col gap-3.5 flex-1"
              >
                <TextField
                  label="Full name"
                  required
                  pattern="[a-zA-Z\s\-]+"
                  tooltip="Enter your legal first and last name as it appears on your ID."
                  placeholder="Ada Obi"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <TextField
                  label="Email"
                  type="email"
                  required
                  pattern="[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}"
                  tooltip="A valid email is required to send your virtual card receipts."
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />

                {error && (
                  <p className="text-sm font-semibold text-salmon-text">
                    {error}
                  </p>
                )}
              </form>

              <div className="mb-8 mt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => paginate(3)}
                  className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAE7DF] text-ink transition-colors hover:bg-[#dfdbd1]"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
                <Button
                  fullWidth
                  className="!h-14 !text-[17px]"
                  onClick={handleContinue}
                  disabled={!name.trim() || !email.trim()}
                >
                  Continue
                </Button>
              </div>
            </motion.div>
          )}

          {step === 6 && (
            <motion.div
              key="step6"
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute inset-0 flex flex-col"
            >
              <div className="text-center mt-4 flex-1 flex flex-col justify-center items-center">
                <motion.img
                  src="/illustrations/subbee-logo.png"
                  alt="SubBee"
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 200,
                    damping: 15,
                    delay: 0.1,
                  }}
                  className="mx-auto mb-6 h-[140px] w-[140px] object-contain drop-shadow-xl"
                />
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-[32px] font-black tracking-tighter text-ink"
                >
                  Welcome to the Hive!
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="mt-3 text-[16px] font-semibold leading-relaxed text-ink-muted max-w-[280px]"
                >
                  We've successfully queued up your <strong className="text-ink">{selectedSubs.size} services</strong>.
                </motion.p>
                
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, type: "spring" }}
                  className="mt-6 w-full teal-card-gradient relative overflow-hidden rounded-[24px] p-6 shadow-[0_12px_24px_-10px_rgba(24,55,57,0.5)] border border-white/10"
                >
                  {/* Subtle shimmer effect */}
                  <motion.div
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ repeat: Infinity, duration: 3, ease: "linear", repeatDelay: 1 }}
                    className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12"
                  />
                  
                  <div className="relative z-10 text-left">
                    <div className="flex justify-between items-center mb-4">
                      <p className="text-[13px] font-extrabold uppercase tracking-widest text-teal-soft/90">
                        SubBee Virtual Card
                      </p>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-teal-soft/90" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="5" width="20" height="14" rx="2" />
                        <line x1="2" y1="10" x2="22" y2="10" />
                      </svg>
                    </div>
                    <p className="text-[26px] font-black tracking-tight text-white drop-shadow-md">
                      Ready to activate
                    </p>
                    <p className="text-[13.5px] font-bold text-white/90 mt-4 pt-3 border-t border-white/10 leading-snug">
                      Your subscriptions are securely locked in. Let's generate your card to automate them!
                    </p>
                  </div>
                </motion.div>

                {error && (
                  <p className="mt-4 text-sm font-semibold text-salmon-text">
                    {error}
                  </p>
                )}
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="mb-8 mt-6 flex items-center gap-3 w-full"
              >
                <button
                  type="button"
                  onClick={() => paginate(5)}
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#EAE7DF] text-ink transition-colors hover:bg-[#dfdbd1]"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
                <Button
                  onClick={handleSubmit}
                  fullWidth
                  className="!bg-gradient-to-br !from-teal-light !to-teal !text-[#EAF3F0] !shadow-[0_12px_22px_-10px_rgba(20,48,50,0.5)] !h-14 !text-[17px]"
                  disabled={submitting}
                >
                  {submitting ? "Creating…" : "Get my virtual card"}
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </OnboardingShell>
  );
}
