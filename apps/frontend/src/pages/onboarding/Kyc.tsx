import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import TextField from "../../components/ui/TextField";
import SelectField from "../../components/ui/SelectField";
import Button from "../../components/ui/Button";
import { useAuth } from "../../lib/auth";
import { api } from "../../lib/api";

const NIGERIAN_STATES = [
  { value: "", label: "Select a state..." },
  { value: "Abia", label: "Abia" },
  { value: "Abuja", label: "Abuja (FCT)" },
  { value: "Adamawa", label: "Adamawa" },
  { value: "Akwa Ibom", label: "Akwa Ibom" },
  { value: "Anambra", label: "Anambra" },
  { value: "Bauchi", label: "Bauchi" },
  { value: "Bayelsa", label: "Bayelsa" },
  { value: "Benue", label: "Benue" },
  { value: "Borno", label: "Borno" },
  { value: "Cross River", label: "Cross River" },
  { value: "Delta", label: "Delta" },
  { value: "Ebonyi", label: "Ebonyi" },
  { value: "Edo", label: "Edo" },
  { value: "Ekiti", label: "Ekiti" },
  { value: "Enugu", label: "Enugu" },
  { value: "Gombe", label: "Gombe" },
  { value: "Imo", label: "Imo" },
  { value: "Jigawa", label: "Jigawa" },
  { value: "Kaduna", label: "Kaduna" },
  { value: "Kano", label: "Kano" },
  { value: "Katsina", label: "Katsina" },
  { value: "Kebbi", label: "Kebbi" },
  { value: "Kogi", label: "Kogi" },
  { value: "Kwara", label: "Kwara" },
  { value: "Lagos", label: "Lagos" },
  { value: "Nasarawa", label: "Nasarawa" },
  { value: "Niger", label: "Niger" },
  { value: "Ogun", label: "Ogun" },
  { value: "Ondo", label: "Ondo" },
  { value: "Osun", label: "Osun" },
  { value: "Oyo", label: "Oyo" },
  { value: "Plateau", label: "Plateau" },
  { value: "Rivers", label: "Rivers" },
  { value: "Sokoto", label: "Sokoto" },
  { value: "Taraba", label: "Taraba" },
  { value: "Yobe", label: "Yobe" },
  { value: "Zamfara", label: "Zamfara" },
];

const formVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 50 : -50, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction < 0 ? 50 : -50, opacity: 0 }),
};

export default function Kyc() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  // UI State
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [direction, setDirection] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // Ceremony State
  const [ceremonyPhase, setCeremonyPhase] = useState<
    "none" | "minting" | "personalising" | "boom" | "failed"
  >("none");

  // Micro-Animations
  const [isShaking, setIsShaking] = useState(false);
  const [showPill, setShowPill] = useState<string | null>(null);
  const [radarPulse, setRadarPulse] = useState(false);

  // Form Data
  const defaultFirstName = user?.name?.split(" ")[0] || "";
  const defaultLastName = user?.name?.split(" ").slice(1).join(" ") || "";

  const [form, setForm] = useState({
    firstName: defaultFirstName,
    lastName: defaultLastName,
    phone: "",
    dob: "",
    address: "",
    state: "Lagos",
    lga: "",
    postalCode: "",
    bvn: "",
    pin: "",
  });

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const paginate = (newStep: number) => {
    setDirection(newStep > step ? 1 : -1);
    setStep(newStep as any);
  };

  const triggerPill = (msg: string) => {
    setShowPill(msg);
    setTimeout(() => setShowPill(null), 2500);
  };

  const handleNext = () => {
    if (step === 1) {
      paginate(2);
    } else if (step === 2) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 400);
      triggerPill("✓ NAME VERIFIED");
      paginate(3);
    } else if (step === 3) {
      setRadarPulse(true);
      setTimeout(() => setRadarPulse(false), 1500);
      triggerPill("📍 LOCATION CONFIRMED");
      paginate(4);
    } else if (step === 4) {
      startCeremony();
    }
  };

  const startCeremony = async () => {
    setCeremonyPhase("minting"); // Reuse 'minting' as 'reviewing' state
    setError(null);

    try {
      const submitReq = api.submitKyc(user!.email, form);

      await submitReq;
      updateUser({ kycStatus: "verified" });
      api.requestCard(user!.email, form.pin).catch(() => {});

      // Simulate waiting on the review screen so they see the new UI
      setTimeout(() => {
        navigate("/app/dashboard");
      }, 3500);
    } catch (err: any) {
      let errorMessage = "We couldn't verify those details. Please double-check them.";
      try {
        const parsed = JSON.parse(err.message);
        if (parsed.error) errorMessage = parsed.error;
        else if (parsed.message) errorMessage = parsed.message;
        else errorMessage = err.message;
      } catch {
        errorMessage = err.message || errorMessage;
      }
      
      setError(errorMessage);
      setCeremonyPhase("failed");
      
      setTimeout(() => {
        setCeremonyPhase("none");
      }, 4500);
    }
  };

  const stepValid =
    step === 1
      ? true
      : step === 2
        ? Boolean(form.firstName.trim() && form.lastName.trim() && form.dob)
        : step === 3
          ? Boolean(
              form.phone.trim().length >= 7 &&
              form.address.trim() &&
              form.state &&
              form.lga.trim(),
            )
          : Boolean(form.bvn.length === 11 && form.pin.length === 4);

  // Card specific derivations
  const blurAmount =
    ceremonyPhase === "personalising"
      ? 0
      : ceremonyPhase === "boom"
        ? 0
        : step === 1
          ? "12px"
          : step === 2
            ? "8px"
            : step === 3
              ? "4px"
              : "2px";
  const progressPercent = ((step - 1) / 3) * 100;

  if (ceremonyPhase !== "none") {
    const now = new Date();
    const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, "0")}`;
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-[#FAF3E1] overflow-y-auto">
        <div className="app-shell-width mx-auto flex min-h-screen flex-col px-6 pb-[30px] pt-[20px]">
          {ceremonyPhase === "failed" ? (
            <div className="flex flex-col items-center justify-center flex-1 text-center">
              <div className="w-24 h-24 bg-salmon-bg2/30 rounded-full flex items-center justify-center mb-6">
                <span className="text-4xl">⚠️</span>
              </div>
              <h1 className="text-[28px] font-black tracking-tight text-ink">
                Verification Failed
              </h1>
              <p className="mt-3 text-[15px] font-semibold text-salmon-text bg-salmon-alertBg border border-salmon-alertBorder px-4 py-3 rounded-xl max-w-sm">
                {error || "Please double-check your details and try again."}
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center flex-1 w-full">
              {/* Hero */}
              <div className="flex flex-col items-center text-center mt-5">
                <div className="relative w-[184px] h-[184px] flex items-center justify-center">
                  <div 
                    className="absolute inset-0 rounded-full overflow-hidden" 
                    style={{ background: 'radial-gradient(circle at 50% 45%, #FBEFC9, #F5E4B0 60%, rgba(245,228,176,0) 72%)' }}
                  >
                    <img
                      src="/illustrations/bee-peek.png"
                      alt=""
                      className="w-full h-full object-fill relative"
                    />
                  </div>
                </div>
                <span className="mt-2 inline-flex items-center gap-[7px] px-[14px] py-[6px] rounded-full bg-[#FBF0D6] text-[#8A6A22] font-extrabold text-[12.5px] tracking-[0.3px]">
                  <span className="w-2 h-2 rounded-full bg-[#E7B84F] inline-block animate-pulse"></span>
                  REVIEW IN PROGRESS
                </span>
                <div className="text-[26px] font-black text-ink tracking-tight mt-[14px]">
                  We're reviewing your ID
                </div>
                <div className="text-[14.5px] font-semibold text-[#8A9499] leading-relaxed max-w-[290px] mt-1.5">
                  Verification usually takes a few minutes. You can close the app — we'll notify you the moment it's done.
                </div>
              </div>

              {/* Progress Timeline */}
              <div className="mt-[26px] bg-white rounded-[22px] shadow-[0_4px_16px_rgba(20,40,45,0.05)] px-5 pt-5 pb-2 w-full max-w-sm">
                <div className="flex gap-[14px]">
                  <div className="w-[26px] h-[26px] rounded-full bg-[#3E9B62] flex items-center justify-center shrink-0">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5"></path>
                    </svg>
                  </div>
                  <div className="pb-[18px] border-l-2 border-[#E3DED3] -ml-[14px] pl-[26px]">
                    <div className="text-[14px] font-extrabold text-ink">Details submitted</div>
                    <div className="text-[12.5px] font-semibold text-[#9AA3A6]">Today · {timeStr}</div>
                  </div>
                </div>
                
                <div className="flex gap-[14px]">
                  <div className="w-[26px] h-[26px] rounded-full bg-[#FBF0D6] border-2 border-[#E7B84F] flex items-center justify-center shrink-0">
                    <span className="w-2 h-2 rounded-full bg-[#E7B84F] animate-pulse"></span>
                  </div>
                  <div className="pb-[18px] border-l-2 border-[#E3DED3] -ml-[14px] pl-[26px]">
                    <div className="text-[14px] font-extrabold text-ink">Verifying identity</div>
                    <div className="text-[12.5px] font-semibold text-[#8A6A22]">In progress…</div>
                  </div>
                </div>
                
                <div className="flex gap-[14px]">
                  <div className="w-[26px] h-[26px] rounded-full bg-[#F1EEE7] flex items-center justify-center shrink-0">
                    <span className="w-2 h-2 rounded-full bg-[#C9CFC9]"></span>
                  </div>
                  <div className="pb-[2px] pl-[12px]">
                    <div className="text-[14px] font-extrabold text-[#B4B1A8]">Wallet activated</div>
                    <div className="text-[12.5px] font-semibold text-[#B4B1A8]">Card & deposit account unlock</div>
                  </div>
                </div>
              </div>

              <div className="flex-1 min-h-[40px]"></div>

              {/* Bottom Actions */}
              <div className="w-full flex flex-col max-w-sm mt-auto">
                <div className="flex items-center justify-center gap-2 text-[12.5px] font-bold text-[#9AA3A6]">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9AA3A6" strokeWidth="2.2">
                    <path d="M21 12a9 9 0 1 1-6.2-8.6" strokeLinecap="round"></path>
                    <path d="M21 3v5h-5" strokeLinecap="round" strokeLinejoin="round"></path>
                  </svg>
                  Checking automatically every few seconds
                </div>
                <button 
                  onClick={() => navigate('/app/dashboard')} 
                  className="mt-[14px] border-none cursor-pointer h-[56px] rounded-full bg-[#BBD8D8] text-[#1C4042] font-extrabold text-[15px] w-full hover:bg-[#A8CACB] transition-colors"
                >
                  Notify me & close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-bg flex flex-col">
      <div className="app-shell-width mx-auto flex min-h-screen flex-col px-5 pb-8 pt-4">
        {/* Header */}
        <div className="flex items-center gap-3 relative z-10 mb-4">
          <button
            onClick={() => (step > 1 ? paginate(step - 1) : navigate(-1))}
            className="flex h-[38px] w-[38px] items-center justify-center rounded-xl bg-white shadow-[0_3px_10px_rgba(20,40,45,0.07)]"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#1E2A2E"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <div>
            <div className="text-lg font-extrabold text-ink">
              Unlock Virtual Card
            </div>
            <div className="text-xs font-bold text-ink-muted">
              Step {step} of 4
            </div>
          </div>
        </div>

        {/* The Card Protocol Area */}
        <div className="relative mx-auto w-full max-w-[290px] h-[180px] mt-2 mb-6 perspective-[1000px]">
          {/* Radar Pulse Effect */}
          {radarPulse && (
            <>
              <motion.div
                initial={{ scale: 1, opacity: 0.8 }}
                animate={{ scale: 1.4, opacity: 0 }}
                transition={{ duration: 1 }}
                className="absolute inset-0 rounded-2xl border-2 border-gold"
              />
              <motion.div
                initial={{ scale: 1, opacity: 0.6 }}
                animate={{ scale: 1.8, opacity: 0 }}
                transition={{ duration: 1.2, delay: 0.2 }}
                className="absolute inset-0 rounded-2xl border border-gold"
              />
            </>
          )}

          {/* Floating Pill Notification */}
          <AnimatePresence>
            {showPill && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: -20, scale: 1 }}
                exit={{ opacity: 0, y: -40 }}
                className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap z-30 bg-ink text-gold text-[10px] font-black tracking-widest px-3 py-1.5 rounded-full shadow-xl"
              >
                {showPill}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            animate={
              isShaking ? { x: [0, -8, 8, -4, 4, 0] } : { y: [0, -4, 0] }
            }
            transition={
              isShaking
                ? { duration: 0.4 }
                : { repeat: Infinity, duration: 4, ease: "easeInOut" }
            }
            className="w-full h-full rounded-[20px] overflow-hidden shadow-xl border border-white/10"
            style={{
              background:
                "linear-gradient(150deg, #2E6264 0%, #1C4042 52%, #143032 100%)",
              filter: `blur(${blurAmount})`,
              transition: "filter 0.5s ease",
            }}
          >
            {step === 1 && (
              <div className="absolute inset-0 backdrop-blur-[4px] bg-white/10 z-10 flex items-center justify-center">
                <div className="bg-white/90 text-ink px-4 py-2 rounded-full font-black text-[11px] tracking-widest shadow-lg flex items-center gap-2">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  IDENTITY REQUIRED
                </div>
              </div>
            )}

            <div className="p-4 flex flex-col h-full justify-between opacity-80">
              <div className="flex justify-between items-start">
                <span className="text-[12px] font-extrabold tracking-wide text-white">
                  SUBBEE
                </span>
                <div className="flex">
                  <div className="w-7 h-7 rounded-full bg-[#EB001B] mix-blend-screen opacity-90"></div>
                  <div className="w-7 h-7 rounded-full bg-[#F79E1B] mix-blend-screen opacity-90 -ml-3"></div>
                </div>
              </div>
              <div className="w-10 h-7 rounded bg-gradient-to-br from-[#E7C97E] to-[#C9A545]"></div>
              <div className="font-mono text-lg tracking-[3px] text-white">
                •••• •••• •••• {step > 3 ? "4092" : "****"}
              </div>
              <div className="flex justify-between items-end text-white text-[10px] font-bold tracking-wider uppercase">
                <span>
                  {form.firstName || form.lastName
                    ? `${form.firstName} ${form.lastName}`
                    : "CARDHOLDER"}
                </span>
                <span>12/28</span>
              </div>
            </div>
          </motion.div>

          {/* Progress Ring Overlay */}
          <svg className="absolute -inset-4 w-[calc(100%+32px)] h-[calc(100%+32px)] pointer-events-none opacity-40">
            <rect
              x="2"
              y="2"
              width="100%"
              height="100%"
              rx="24"
              fill="none"
              stroke="#E7C97E"
              strokeWidth="2"
              strokeDasharray="1000"
              strokeDashoffset={1000 - (1000 * progressPercent) / 100}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
        </div>

        {/* Dynamic Form Area */}
        <div className="flex-1 relative">
          <AnimatePresence custom={direction} mode="wait">
            {step === 1 && (
              <motion.div
                key="s1"
                custom={direction}
                variants={formVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="absolute inset-0 flex flex-col items-center text-center"
              >
                <h1 className="text-[28px] font-black tracking-tight text-ink mt-2">
                  Your Card is ready.
                </h1>
                <p className="mt-3 text-[15px] font-medium leading-relaxed text-ink-muted px-2">
                  Verify your identity in{" "}
                  <span className="font-bold text-ink">30 seconds</span> to
                  activate your virtual Mastercard and start paying your
                  subscriptions smoothly!
                </p>
                <div className="mt-auto mb-6 w-full">
                  <Button
                    fullWidth
                    onClick={handleNext}
                    className="!h-14 !text-[17px] !bg-teal text-white"
                  >
                    Activate My Card &rarr;
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="s2"
                custom={direction}
                variants={formVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="absolute inset-0 flex flex-col"
              >
                <h2 className="text-[22px] font-black tracking-tight text-ink">
                  Who's on the card?
                </h2>
                <p className="mt-1 mb-6 text-[14px] text-ink-muted">
                  We've pre-filled what we know.
                </p>
                <div className="flex flex-col gap-4">
                  <TextField
                    label="First name"
                    required
                    value={form.firstName}
                    onChange={(e) => set("firstName", e.target.value)}
                  />
                  <TextField
                    label="Last name"
                    required
                    value={form.lastName}
                    onChange={(e) => set("lastName", e.target.value)}
                  />
                  <TextField
                    label="Date of birth"
                    type="date"
                    required
                    value={form.dob}
                    onChange={(e) => set("dob", e.target.value)}
                  />
                </div>
                <div className="mt-auto mb-6 w-full">
                  <Button
                    fullWidth
                    onClick={handleNext}
                    disabled={!stepValid}
                    className="!h-14"
                  >
                    Continue
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="s3"
                custom={direction}
                variants={formVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="absolute inset-0 flex flex-col"
              >
                <h2 className="text-[22px] font-black tracking-tight text-ink">
                  Where should we register it?
                </h2>
                <div className="mt-4 flex flex-col gap-4 overflow-y-auto pb-4">
                  <TextField
                    label="Phone number"
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                  />
                  <TextField
                    label="Street address"
                    required
                    value={form.address}
                    onChange={(e) => set("address", e.target.value)}
                  />
                  <div className="flex gap-3 w-full">
                    <SelectField
                      label="State"
                      required
                      options={NIGERIAN_STATES}
                      value={form.state}
                      onChange={(e) => set("state", e.target.value)}
                    />
                    <TextField
                      label="LGA"
                      required
                      placeholder="Eti-Osa"
                      value={form.lga}
                      onChange={(e) => set("lga", e.target.value)}
                    />
                  </div>
                </div>
                <div className="mt-auto mb-6 w-full">
                  <Button
                    fullWidth
                    onClick={handleNext}
                    disabled={!stepValid}
                    className="!h-14"
                  >
                    Confirm Address
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="s4"
                custom={direction}
                variants={formVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="absolute inset-0 flex flex-col"
              >
                <h2 className="text-[22px] font-black tracking-tight text-ink">
                  Final Security Check
                </h2>
                <p className="mt-1 mb-6 text-[13px] text-ink-muted font-bold flex items-center gap-1.5">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  Bank-grade AES-256 Encryption
                </p>

                <div className="flex flex-col gap-4">
                  <TextField
                    label="Bank Verification Number"
                    placeholder="11-digit BVN"
                    inputMode="numeric"
                    maxLength={11}
                    required
                    value={form.bvn}
                    onChange={(e) =>
                      set("bvn", e.target.value.replace(/\D/g, "").slice(0, 11))
                    }
                  />
                  <TextField
                    label="Set a 4-digit card PIN"
                    placeholder="****"
                    inputMode="numeric"
                    maxLength={4}
                    required
                    value={form.pin}
                    onChange={(e) =>
                      set("pin", e.target.value.replace(/\D/g, "").slice(0, 4))
                    }
                  />
                  {error && (
                    <p className="text-sm font-semibold text-salmon-text">
                      {error}
                    </p>
                  )}
                </div>
                <div className="mt-auto mb-6 w-full">
                  <Button
                    fullWidth
                    onClick={handleNext}
                    disabled={!stepValid}
                    className="!h-14 !bg-ink text-white"
                  >
                    Mint My Card
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
