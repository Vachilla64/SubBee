import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import TextField from "../../components/ui/TextField";
import SelectField from "../../components/ui/SelectField";
import Button from "../../components/ui/Button";
import { useAuth } from "../../lib/auth";
import { api } from "../../lib/api";
import confetti from "canvas-confetti";

import naijaStateLocalGovernment from "naija-state-local-government";

const NIGERIAN_STATES = [
  { value: "", label: "Select a state..." },
  ...naijaStateLocalGovernment
    .states()
    .map((state: string) => ({ value: state, label: state })),
];

const formVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 50 : -50, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction < 0 ? 50 : -50, opacity: 0 }),
};

const HIVE_SPARKLES = [
  { left: '10%', top: '20%', size: 6, duration: 3.2, delay: 0 },
  { left: '86%', top: '16%', size: 5, duration: 3.6, delay: 0.4 },
  { left: '18%', top: '70%', size: 4, duration: 2.8, delay: 0.8 },
  { left: '90%', top: '64%', size: 6, duration: 3.4, delay: 0.2 },
  { left: '6%', top: '45%', size: 4, duration: 3, delay: 1.1 },
  { left: '80%', top: '84%', size: 5, duration: 3.8, delay: 0.6 },
];

export default function Kyc() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  // UI State
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [direction, setDirection] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [errorStage, setErrorStage] = useState<"kyc" | "card" | null>(null);

  // Ceremony State
  const [ceremonyPhase, setCeremonyPhase] = useState<
    "none" | "personalising" | "minting" | "revealing" | "boom" | "failed"
  >("none");

  // Card PIN step (set + confirm)
  const [cardPin, setCardPin] = useState("");
  const [cardFirstPin, setCardFirstPin] = useState<string | null>(null);
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinSubmitting, setPinSubmitting] = useState(false);
  const confirmingPin = cardFirstPin !== null;
  const PIN_KEYS = [
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "",
    "0",
    "del",
  ];

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
      triggerPill("🔒 BVN CONFIRMED");
      paginate(5);
    }
  };

  const pressPinKey = (key: string) => {
    if (key === "" || pinSubmitting) return;
    if (key === "del") {
      setCardPin((p) => p.slice(0, -1));
      return;
    }
    if (cardPin.length >= 4) return;
    const next = cardPin + key;
    setCardPin(next);
    if (next.length !== 4) return;

    if (!confirmingPin) {
      setTimeout(() => {
        setCardFirstPin(next);
        setCardPin("");
      }, 150);
      return;
    }

    if (next !== cardFirstPin) {
      setPinError("PINs didn't match - try again.");
      setTimeout(() => {
        setCardFirstPin(null);
        setCardPin("");
        setPinError(null);
      }, 900);
      return;
    }

    setPinSubmitting(true);
    startCeremony(next);
  };

  const startCeremony = async (pin: string) => {
    setCeremonyPhase("minting");
    setError(null);
    setErrorStage(null);

    try {
      await api.submitKyc(user!.email, form);
      updateUser({ kycStatus: "verified" });
    } catch (err: any) {
      let errorMessage =
        "We couldn't verify those details. Please double-check them.";
      try {
        const parsed = JSON.parse(err.message);
        if (parsed.error) errorMessage = parsed.error;
        else if (parsed.message) errorMessage = parsed.message;
        else errorMessage = err.message;
      } catch {
        errorMessage = err.message || errorMessage;
      }

      setError(errorMessage);
      setErrorStage("kyc");
      setCeremonyPhase("failed");
      setCardFirstPin(null);
      setCardPin("");
      setPinSubmitting(false);

      setTimeout(() => {
        setCeremonyPhase("none");
      }, 4500);
      return;
    }

    try {
      await api.requestCard(user!.email, pin);
    } catch (err: any) {
      let errorMessage =
        "Your identity is verified, but we couldn't create your card. Please try again.";
      try {
        const parsed = JSON.parse(err.message);
        if (parsed.error) errorMessage = parsed.error;
      } catch {
        // keep the default message
      }

      setError(errorMessage);
      setErrorStage("card");
      setCeremonyPhase("failed");
      setCardFirstPin(null);
      setCardPin("");
      setPinSubmitting(false);

      setTimeout(() => {
        setCeremonyPhase("none");
      }, 4500);
      return;
    }

    // Play success sound
    try {
      const audio = new Audio("/assets/success.mp3");
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch (e) {}

    // Transition to revealing phase
    setCeremonyPhase("revealing");

    setTimeout(() => {
      // Transition to boom phase
      setCeremonyPhase("boom");

      // Fire confetti burst!
      const hiveColors = ["#2E6264", "#E7C97E", "#1C4042", "#EB001B", "#F79E1B"];
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: hiveColors,
        zIndex: 9999,
      });
      setTimeout(() => {
        confetti({ particleCount: 45, angle: 60, spread: 60, origin: { x: 0, y: 0.6 }, colors: hiveColors, zIndex: 9999 });
        confetti({ particleCount: 45, angle: 120, spread: 60, origin: { x: 1, y: 0.6 }, colors: hiveColors, zIndex: 9999 });
      }, 350);
    }, 3500); // Wait 3.5s for the choreograph to finish
  };

  const stepValid =
    step === 1
      ? true
      : step === 2
        ? Boolean(form.firstName.trim() && form.lastName.trim() && form.dob)
        : step === 3
          ? Boolean(
              form.phone.trim().length >= 10 &&
              form.phone.startsWith("+") &&
              form.address.trim() &&
              form.state &&
              form.lga.trim() &&
              form.postalCode.trim()
            )
          : step === 4
            ? Boolean(form.bvn.length === 11)
            : true;

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
  const progressPercent = ((step - 1) / 4) * 100;

  if (ceremonyPhase !== "none") {
    const now = new Date();
    const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, "0")}`;
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-[#FAF3E1] overflow-y-auto">
        <div className="app-shell-width mx-auto flex min-h-screen flex-col px-6 pb-[30px] pt-[20px]">
          {ceremonyPhase === "failed" ? (
            <div className="flex flex-col flex-1 w-full animate-in fade-in zoom-in duration-500">
              {/* hero */}
              <div className="flex flex-col items-center text-center mt-4">
                <div className="relative w-[172px] h-[172px] flex items-center justify-center">
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background:
                        "radial-gradient(circle at 50% 45%, #FBEAE4, #F6D9CF 60%, rgba(246,217,207,0) 72%)",
                    }}
                  ></div>
                  <img
                    src="/illustrations/bee-confused-right.png"
                    alt=""
                    className="w-[150px] h-[150px] object-contain relative"
                  />
                  <div className="absolute bottom-2 right-3.5 w-10 h-10 rounded-full bg-[#C6543F] flex items-center justify-center border-[3px] border-[#FAF3E1] shadow-[0_5px_12px_rgba(198,84,63,0.4)]">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#FFF"
                      strokeWidth="3.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M18 6L6 18M6 6l12 12"></path>
                    </svg>
                  </div>
                </div>
                <div className="text-[26px] font-black text-ink tracking-tight mt-3">
                  {errorStage === "card"
                    ? "We verified you - card setup failed"
                    : "We couldn't verify you"}
                </div>
                <div className="text-[14.5px] font-semibold text-ink-muted leading-relaxed max-w-[290px] mt-1.5">
                  {errorStage === "card"
                    ? "Your identity is verified. We just couldn't create your card - let's try again."
                    : error && error.toLowerCase().includes("phone")
                      ? "There's an issue with your phone number."
                      : error && error.toLowerCase().includes("name")
                        ? "The name you provided doesn't match your BVN records."
                        : error && error.toLowerCase().includes("bvn")
                          ? "We couldn't validate your BVN."
                          : error && error.toLowerCase().includes("address")
                            ? "There's a problem with the address you provided."
                            : "Your details didn't match the records at your bank. It's usually a quick fix."}
                </div>
              </div>

              {/* reasons */}
              {errorStage === "kyc" && (
                <div className="mt-6 bg-white rounded-[22px] shadow-[0_4px_16px_rgba(20,40,45,0.05)] px-4.5 py-1.5">
                  {(!error ||
                    (!error.toLowerCase().includes("phone") &&
                      !error.toLowerCase().includes("address"))) && (
                    <>
                      <div className="flex items-start gap-3 py-3.5 border-b border-[#F0EDE5]">
                        <div className="w-[30px] h-[30px] rounded-[10px] bg-[#FEF1EE] flex items-center justify-center shrink-0">
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#C6543F"
                            strokeWidth="2.4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <rect
                              x="3"
                              y="4"
                              width="18"
                              height="16"
                              rx="2"
                            ></rect>
                            <path d="M3 9h18"></path>
                          </svg>
                        </div>
                        <div>
                          <div className="text-[14px] font-extrabold text-ink">
                            Check your BVN
                          </div>
                          <div className="text-[12.5px] font-semibold text-ink-muted leading-[1.4]">
                            Re-enter it carefully - one wrong digit will fail
                            the match.
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 py-3.5 border-b border-[#F0EDE5]">
                        <div className="w-[30px] h-[30px] rounded-[10px] bg-[#FEF1EE] flex items-center justify-center shrink-0">
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#C6543F"
                            strokeWidth="2.4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"></path>
                            <path d="M12 8v4M12 16h.01"></path>
                          </svg>
                        </div>
                        <div>
                          <div className="text-[14px] font-extrabold text-ink">
                            Match your legal name
                          </div>
                          <div className="text-[12.5px] font-semibold text-ink-muted leading-[1.4]">
                            Make sure your first and last name exactly match
                            your bank records.
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {error && error.toLowerCase().includes("phone") && (
                    <div className="flex items-start gap-3 py-3.5 border-b border-[#F0EDE5]">
                      <div className="w-[30px] h-[30px] rounded-[10px] bg-[#FEF1EE] flex items-center justify-center shrink-0">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#C6543F"
                          strokeWidth="2.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                        </svg>
                      </div>
                      <div>
                        <div className="text-[14px] font-extrabold text-ink">
                          Invalid Phone Number
                        </div>
                        <div className="text-[12.5px] font-semibold text-ink-muted leading-[1.4]">
                          Ensure your phone number is correct and doesn't
                          contain spaces or special characters.
                        </div>
                      </div>
                    </div>
                  )}

                  {error && error.toLowerCase().includes("address") && (
                    <div className="flex items-start gap-3 py-3.5 border-b border-[#F0EDE5]">
                      <div className="w-[30px] h-[30px] rounded-[10px] bg-[#FEF1EE] flex items-center justify-center shrink-0">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#C6543F"
                          strokeWidth="2.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                          <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                      </div>
                      <div>
                        <div className="text-[14px] font-extrabold text-ink">
                          Incomplete Address
                        </div>
                        <div className="text-[12.5px] font-semibold text-ink-muted leading-[1.4]">
                          Ensure your street address is complete and includes a
                          house number.
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Fallback general tip */}
                  <div className="flex items-start gap-3 py-3.5">
                    <div className="w-[30px] h-[30px] rounded-[10px] bg-[#FEF1EE] flex items-center justify-center shrink-0">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#C6543F"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                      </svg>
                    </div>
                    <div>
                      <div className="text-[14px] font-extrabold text-ink">
                        Verify your Date of Birth
                      </div>
                      <div className="text-[12.5px] font-semibold text-ink-muted leading-[1.4]">
                        Check that your DOB matches your official ID exactly.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex-1" />

              {/* CTAs */}
              <div className="mt-8 flex flex-col items-stretch w-full pb-2">
                <button
                  onClick={() => {
                    if (errorStage === "card") {
                      // Card issuance failed after KYC succeeded - retry from the PIN step
                      setCeremonyPhase("none");
                      return;
                    }
                    // Go back to the step based on error type
                    if (error) {
                      const lower = error.toLowerCase();
                      if (lower.includes("phone")) paginate(3);
                      else if (lower.includes("address")) paginate(3);
                      else if (lower.includes("name") || lower.includes("dob"))
                        paginate(2);
                      else paginate(4); // Default: likely a BVN mismatch
                    } else {
                      setCeremonyPhase("none");
                    }
                  }}
                  className="h-[58px] rounded-full text-[#3A2A0E] font-black text-[16px] shadow-[0_12px_22px_-10px_rgba(207,154,68,0.9)] flex items-center justify-center gap-2.5 transition-transform active:scale-95"
                  style={{
                    background:
                      "linear-gradient(165deg, #F2CE7C, #E7B84F 60%, #DFAE44)",
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#3A2A0E"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 12a9 9 0 1 1-6.2-8.6"></path>
                    <path d="M21 3v5h-5"></path>
                  </svg>
                  {errorStage === "card" ? "Try Again" : "Fix Details"}
                </button>
                <button
                  onClick={() => window.open("mailto:support@subbee.com")}
                  className="mt-2 h-[52px] rounded-full bg-transparent text-[#6B7377] font-extrabold text-[14.5px] flex items-center justify-center gap-2 transition-opacity hover:opacity-80"
                >
                  <svg
                    width="17"
                    height="17"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#6B7377"
                    strokeWidth="2.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                    <path d="M12 17h.01"></path>
                    <circle cx="12" cy="12" r="10"></circle>
                  </svg>
                  Contact support
                </button>
              </div>
            </div>
          ) : ceremonyPhase === "revealing" ? (
            <div className="fixed inset-0 bg-[#FDF7EC] z-50 flex items-center justify-center overflow-hidden">
              <img
                src="/illustrations/meadow.png"
                alt=""
                className="absolute bottom-0 inset-x-0 w-full h-[250px] object-cover object-bottom"
              />

              <motion.div
                initial={{ opacity: 0, y: 150, rotateX: 15, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1.1 }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10 w-[290px] h-[180px] rounded-[20px] overflow-hidden shadow-2xl border border-white/20"
                style={{
                  background:
                    "linear-gradient(150deg, #2E6264 0%, #1C4042 52%, #143032 100%)",
                }}
              >
                {/* Gliding wipe glisten effect */}
                <motion.div
                  initial={{ left: "-150%" }}
                  animate={{ left: "150%" }}
                  transition={{ delay: 1, duration: 1.5, ease: "easeInOut" }}
                  className="absolute inset-y-0 w-[150%] bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-[-25deg] z-20 pointer-events-none"
                />

                <div className="p-4 flex flex-col h-full justify-between opacity-90 relative z-10">
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
                    •••• •••• •••• 4092
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

                {/* Bee Stamp */}
                <motion.div
                  initial={{ scale: 3, opacity: 0, rotate: -30 }}
                  animate={{ scale: 1, opacity: 1, rotate: -12 }}
                  transition={{
                    delay: 1.8,
                    type: "spring",
                    stiffness: 400,
                    damping: 15,
                  }}
                  className="absolute -right-5 -bottom-5 w-20 h-20 bg-[#E7B84F] rounded-full flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.3)] border-[4px] border-white z-30"
                >
                  <img
                    src="/illustrations/subbee-logo.png"
                    alt=""
                    className="w-11 h-11 object-contain translate-x-[-1px] translate-y-[-2px]"
                  />
                </motion.div>
              </motion.div>
            </div>
          ) : ceremonyPhase === "boom" ? (
            <div className="relative flex flex-col items-center justify-center flex-1 text-center w-full overflow-hidden">
              {HIVE_SPARKLES.map((s, i) => (
                <motion.span
                  key={i}
                  className="pointer-events-none absolute rounded-full bg-gold shadow-[0_0_8px_rgba(231,184,79,0.8)]"
                  style={{ left: s.left, top: s.top, width: s.size, height: s.size }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.15, 1, 0.15], y: [0, -12, 0] }}
                  transition={{ duration: s.duration, delay: s.delay, repeat: Infinity, ease: "easeInOut" }}
                />
              ))}

              <motion.div
                initial={{ scale: 0.3, opacity: 0, rotate: -15 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 240, damping: 15, delay: 0.1 }}
                className="relative w-[184px] h-[184px] flex items-center justify-center mt-8"
              >
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: "radial-gradient(circle at 50% 45%, rgba(231,184,79,0.35), rgba(231,184,79,0.08) 60%, rgba(231,184,79,0) 75%)",
                  }}
                />
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
                  className="relative w-full h-full overflow-clip rounded-full border-[4px] border-white bg-[#E5F3ED] shadow-[0_16px_34px_-12px_rgba(46,98,100,0.55)]"
                >
                  <img
                    src="/illustrations/bee-peek.png"
                    alt=""
                    className="w-full h-full object-fill relative z-10 scale-110"
                  />
                </motion.div>
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.7, type: "spring", stiffness: 420, damping: 14 }}
                  className="absolute -bottom-1 -right-1 flex h-11 w-11 items-center justify-center rounded-full border-[3px] border-white bg-[#3E9B62] shadow-[0_6px_14px_rgba(62,155,98,0.5)]"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </motion.div>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6, ease: "easeOut" }}
                className="text-[32px] font-black tracking-tight text-ink mt-6 leading-tight"
              >
                Welcome to the Hive
                <br />
                {user?.name}!
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.65, duration: 0.6, ease: "easeOut" }}
                className="mt-3 text-[15px] font-semibold text-ink-muted max-w-xs leading-relaxed"
              >
                Your virtual Mastercard is locked, loaded, and ready to handle
                your subscriptions.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.85, duration: 0.6, ease: "easeOut" }}
                className="mt-10 mb-4 flex flex-col w-full max-w-sm gap-3.5 px-2"
              >
                <Button
                  onClick={() => navigate("/app/card")}
                  className="!h-14 !text-[16px] !bg-teal text-white shadow-[0_12px_22px_-10px_rgba(46,98,100,0.8)] transition-transform hover:scale-[1.02] active:scale-95"
                >
                  See My Card Details
                </Button>
                <button
                  onClick={() => navigate("/app/dashboard")}
                  className="h-14 text-[14.5px] font-extrabold text-teal hover:bg-teal-soft/30 rounded-full transition-colors"
                >
                  Continue to Dashboard
                </button>
              </motion.div>
            </div>
          ) : (
            <div className="flex flex-col items-center flex-1 w-full">
              {/* Hero */}
              <div className="flex flex-col items-center text-center mt-5">
                <div className="relative w-[184px] h-[184px] flex items-center justify-center">
                  <div
                    className="absolute inset-0 rounded-full overflow-hidden"
                    style={{
                      background:
                        "radial-gradient(circle at 50% 45%, #FBEFC9, #F5E4B0 60%, rgba(245,228,176,0) 72%)",
                    }}
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
                  Verification usually takes a few minutes. You can close the
                  app - we'll notify you the moment it's done.
                </div>
              </div>

              {/* Progress Timeline */}
              <div className="mt-[26px] bg-white rounded-[22px] shadow-[0_4px_16px_rgba(20,40,45,0.05)] px-5 pt-5 pb-2 w-full max-w-sm">
                <div className="flex gap-[14px]">
                  <div className="w-[26px] h-[26px] rounded-full bg-[#3E9B62] flex items-center justify-center shrink-0">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#FFF"
                      strokeWidth="3.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 6L9 17l-5-5"></path>
                    </svg>
                  </div>
                  <div className="pb-[18px] border-l-2 border-[#E3DED3] -ml-[14px] pl-[26px]">
                    <div className="text-[14px] font-extrabold text-ink">
                      Details submitted
                    </div>
                    <div className="text-[12.5px] font-semibold text-[#9AA3A6]">
                      Today · {timeStr}
                    </div>
                  </div>
                </div>

                <div className="flex gap-[14px]">
                  <div className="w-[26px] h-[26px] rounded-full bg-[#FBF0D6] border-2 border-[#E7B84F] flex items-center justify-center shrink-0">
                    <span className="w-2 h-2 rounded-full bg-[#E7B84F] animate-pulse"></span>
                  </div>
                  <div className="pb-[18px] border-l-2 border-[#E3DED3] -ml-[14px] pl-[26px]">
                    <div className="text-[14px] font-extrabold text-ink">
                      Verifying identity
                    </div>
                    <div className="text-[12.5px] font-semibold text-[#8A6A22]">
                      In progress…
                    </div>
                  </div>
                </div>

                <div className="flex gap-[14px]">
                  <div className="w-[26px] h-[26px] rounded-full bg-[#F1EEE7] flex items-center justify-center shrink-0">
                    <span className="w-2 h-2 rounded-full bg-[#C9CFC9]"></span>
                  </div>
                  <div className="pb-[2px] pl-[12px]">
                    <div className="text-[14px] font-extrabold text-[#B4B1A8]">
                      Wallet activated
                    </div>
                    <div className="text-[12.5px] font-semibold text-[#B4B1A8]">
                      Card & deposit account unlock
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 min-h-[40px]"></div>

              {/* Bottom Actions */}
              <div className="w-full flex flex-col max-w-sm mt-auto">
                <div className="flex items-center justify-center gap-2 text-[12.5px] font-bold text-[#9AA3A6]">
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#9AA3A6"
                    strokeWidth="2.2"
                  >
                    <path
                      d="M21 12a9 9 0 1 1-6.2-8.6"
                      strokeLinecap="round"
                    ></path>
                    <path
                      d="M21 3v5h-5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    ></path>
                  </svg>
                  Checking automatically every few seconds
                </div>
                <button
                  onClick={() => navigate("/app/dashboard")}
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
              Step {step} of 5
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
                •••• •••• •••• {step > 3 ? "3712" : "****"}
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
              strokeWidth="6"
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
                  Tell us a bit about you!
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
                    placeholder="+234..."
                    required
                    value={form.phone}
                    onChange={(e) => {
                      let val = e.target.value.replace(/[^\d+]/g, "");
                      if (val.startsWith("0")) val = "+234" + val.slice(1);
                      else if (val.startsWith("234")) val = "+" + val;
                      else if (val.length > 0 && !val.startsWith("+")) val = "+" + val;
                      set("phone", val);
                    }}
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
                      onChange={(e) => {
                        set("state", e.target.value);
                        set("lga", ""); // Reset LGA when state changes
                      }}
                    />
                    <SelectField
                      label="LGA"
                      required
                      options={[
                        { value: "", label: "Select LGA..." },
                        ...(
                          naijaStateLocalGovernment
                            .all()
                            .find((s: any) => s.state === form.state)?.lgas ||
                          []
                        ).map((lga: string) => ({ value: lga, label: lga })),
                      ]}
                      value={form.lga}
                      onChange={(e) => set("lga", e.target.value)}
                    />
                  </div>
                  <TextField
                    label="Postal code"
                    inputMode="numeric"
                    required
                    value={form.postalCode}
                    onChange={(e) => set("postalCode", e.target.value.replace(/\D/g, ""))}
                  />
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
                    Continue
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 5 && (
              <motion.div
                key="s5"
                custom={direction}
                variants={formVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="absolute inset-0 flex flex-col items-center text-center"
              >
                <h2 className="text-[22px] font-black tracking-tight text-ink">
                  {confirmingPin ? "Confirm your PIN" : "Set your card PIN"}
                </h2>
                <p className="mt-1 text-[13px] text-ink-muted font-bold flex items-center gap-1.5">
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
                <p className="mx-auto mt-2 max-w-[270px] text-[13.5px] font-semibold leading-relaxed text-ink-muted">
                  {pinError ??
                    "You'll use this to authorize card payments. Rarely needed for online subscriptions."}
                </p>

                <div className="mt-5 flex justify-center gap-4">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`h-4 w-4 rounded-full border-2 transition-all ${
                        i < cardPin.length
                          ? "border-gold bg-gold"
                          : "border-ink/20 bg-transparent"
                      } ${pinError ? "!border-salmon-text !bg-salmon-text" : ""}`}
                    />
                  ))}
                </div>

                <div className="flex-1" />

                <div className="grid w-full max-w-[300px] grid-cols-3 gap-3">
                  {PIN_KEYS.map((k, i) =>
                    k === "" ? (
                      <div key={i} />
                    ) : (
                      <button
                        key={i}
                        type="button"
                        onClick={() => pressPinKey(k)}
                        disabled={pinSubmitting}
                        className="flex h-[56px] items-center justify-center rounded-2xl bg-white text-2xl font-extrabold text-ink shadow-[0_3px_10px_rgba(20,40,45,0.06)] disabled:opacity-50"
                      >
                        {k === "del" ? (
                          <svg
                            width="22"
                            height="22"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#6B7377"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
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

                <p className="mt-4 mb-6 text-center text-xs font-semibold text-ink-faint">
                  Your PIN is encrypted and never stored in plain text.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
