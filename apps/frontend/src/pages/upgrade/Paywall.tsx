import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import { useAuth } from '../../lib/auth';

export default function Paywall() {
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const [step, setStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState<'annual' | 'monthly'>('annual');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);

  useEffect(() => {
    // Delay the appearance of UI details so the background image can be appreciated first
    const timer = setTimeout(() => {
      setContentVisible(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const monthlyPrice = 900;
  const annualPrice = monthlyPrice * 12;

  const handleSubscribe = () => {
    setIsSubmitting(true);
    // Simulate API call to subscribe
    setTimeout(() => {
      setIsSubmitting(false);
      updateUser({ isPro: true });
      navigate('/app/welcome-pro');
    }, 1500);
  };

  const nextStep = () => setStep((s) => Math.min(s + 1, 3));
  const prevStep = () => {
    if (step > 1) setStep((s) => s - 1);
    else navigate(-1);
  };

  return (
    <div
      className="flex flex-col min-h-screen bg-cover bg-center bg-fixed relative transition-all duration-500"
      style={{ backgroundImage: `url('/illustrations/paywall_honey.jpg')` }}
    >
      {/* Container for all UI elements */}
      <div className="flex flex-col flex-1">
        {/* Header / Dismiss */}
        <div
          className={`relative z-10 flex justify-between items-center p-4 transition-all duration-1000 ease-out delay-[1000ms] ${contentVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}
        >
          <button
            onClick={prevStep}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/40 hover:bg-white/60 transition-colors backdrop-blur-md shadow-sm"
          >
            {step === 1 ? (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#2E393D"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6L6 18M6 6l12 12"></path>
              </svg>
            ) : (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#2E393D"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            )}
          </button>

          {/* Step Indicator */}
          <div className="flex gap-1.5 bg-white/40 backdrop-blur-md px-3 py-2 rounded-full shadow-sm">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${step >= i ? "w-6 bg-gold-dark" : "w-2 bg-black/20"}`}
                style={step >= i ? { backgroundColor: "#8A7A55" } : {}}
              ></div>
            ))}
          </div>
        </div>

        {/* Centered Content Area to align with the bright empty middle of the honeycomb image */}
        <div className="relative z-10 flex-1 flex flex-col justify-center items-center px-6 pb-20 pt-4">
          {/* === STEP 1: VALUE PROP === */}
          <div
            className={`transition-all duration-700 ease-out absolute left-6 right-6 top-[42%] -translate-y-1/2 ${step === 1 ? "pointer-events-auto" : "scale-95 pointer-events-none"}`}
          >
            <div className="flex flex-col items-center text-center">
              <h1
                className={`text-[32px] font-black text-[#2E393D] leading-[1.15] tracking-tight transition-all duration-1000 delay-[1200ms] ${contentVisible && step === 1 ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}
              >
                Never miss a payment.
                <br />
                Unlock SubBee Pro.
              </h1>
              <p
                className={`mt-4 text-[16px] font-semibold text-[#5A4515] leading-relaxed max-w-[280px] transition-all duration-1000 delay-[1500ms] ${contentVisible && step === 1 ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}
              >
                Get unlimited subscriptions, advanced spending insights, and
                priority Telegram alerts.
              </p>
            </div>
          </div>

          {/* === STEP 2: TRUST TIMELINE === */}
          <div
            className={`transition-all duration-700 ease-out absolute left-6 right-6 top-[42%] -translate-y-1/2 ${step === 2 ? "pointer-events-auto" : "scale-95 pointer-events-none"}`}
          >
            <h2
              className={`text-[28px] font-black text-[#2E393D] leading-tight mb-6 text-center transition-all duration-1000 delay-[200ms] ${contentVisible && step === 2 ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}
            >
              Try it risk-free.
            </h2>
            <div
              className={`bg-[#FDF7EC]/85 backdrop-blur-xl rounded-[24px] p-6 shadow-[0_8px_30px_rgba(46,57,61,0.15)] border border-[#E7B84F]/40 transition-all duration-1000 delay-[400ms] ${contentVisible && step === 2 ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}
            >
              <h3 className="text-[13px] font-extrabold text-[#5A4515] uppercase tracking-wider mb-5 px-1">
                How your free trial works
              </h3>

              <div className="relative pl-3 space-y-6">
                <div className="absolute left-[22px] top-2 bottom-4 w-0.5 bg-[#8A7A55]/20 rounded-full"></div>

                <div
                  className={`relative flex gap-4 transition-all duration-700 delay-[600ms] ${contentVisible && step === 2 ? "translate-x-0 opacity-100" : "-translate-x-6 opacity-0"}`}
                >
                  <div className="w-5 h-5 shrink-0 mt-0.5 relative z-10 flex items-center justify-center">
                    <span className="text-[16px] drop-shadow-sm">🐝</span>
                  </div>
                  <div>
                    <div className="text-[16px] font-extrabold text-[#2E393D]">
                      Today
                    </div>
                    <div className="text-[14px] font-semibold text-[#5A4515] mt-0.5 leading-snug">
                      Get instant access to Pro.
                    </div>
                  </div>
                </div>

                <div
                  className={`relative flex gap-4 transition-all duration-700 delay-[900ms] ${contentVisible && step === 2 ? "translate-x-0 opacity-100" : "-translate-x-6 opacity-0"}`}
                >
                  <div className="w-5 h-5 shrink-0 mt-0.5 relative z-10 flex items-center justify-center">
                    <span className="text-[16px] drop-shadow-sm opacity-90">🍯</span>
                  </div>
                  <div>
                    <div className="text-[16px] font-extrabold text-[#2E393D]">
                      Day 12
                    </div>
                    <div className="text-[14px] font-semibold text-[#5A4515] mt-0.5 leading-snug">
                      We send a reminder. Cancel if you want.
                    </div>
                  </div>
                </div>

                <div
                  className={`relative flex gap-4 transition-all duration-700 delay-[1200ms] ${contentVisible && step === 2 ? "translate-x-0 opacity-100" : "-translate-x-6 opacity-0"}`}
                >
                  <div className="w-5 h-5 shrink-0 mt-0.5 relative z-10 flex items-center justify-center">
                    <span className="text-[16px] drop-shadow-sm opacity-90">🌻</span>
                  </div>
                  <div>
                    <div className="text-[16px] font-extrabold text-[#2E393D]">
                      Day 14
                    </div>
                    <div className="text-[14px] font-semibold text-[#5A4515] mt-0.5 leading-snug">
                      You're charged for your plan.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* === STEP 3: PRICING === */}
          <div
            className={`transition-all duration-700 ease-out absolute left-6 right-6 top-[42%] -translate-y-[60%] ${step === 3 ? "pointer-events-auto" : "scale-95 pointer-events-none"}`}
          >
            <h2
              className={`text-[28px] font-black text-[#2E393D] leading-tight mb-6 text-center transition-all duration-1000 delay-[200ms] ${contentVisible && step === 3 ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}
            >
              Choose your plan.
            </h2>
            <div className="flex flex-col gap-3">
              {/* Annual Plan */}
              <button
                onClick={() => setSelectedPlan("annual")}
                className={`relative flex items-center p-4 rounded-[20px] transition-all duration-700 delay-[400ms] text-left w-full border ${contentVisible && step === 3 ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"} ${
                  selectedPlan === "annual"
                    ? "bg-white/95 backdrop-blur-xl border-[#E7B84F] shadow-[0_8px_20px_rgba(207,154,68,0.25)] scale-[1.02] ring-2 ring-[#E7B84F]/30"
                    : "bg-[#FDF7EC]/85 backdrop-blur-xl border-[#E7B84F]/30 shadow-sm hover:bg-white/90"
                }`}
              >
                <div className="absolute -top-3 right-4 bg-[#E7B84F] text-[#3A2A0E] text-[11px] font-black uppercase tracking-wider py-1 px-2.5 rounded-full shadow-md">
                  Best Value
                </div>

                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mr-4 transition-colors duration-300 ${
                    selectedPlan === "annual"
                      ? "border-[#E7B84F] bg-[#E7B84F]"
                      : "border-[#8A7A55]/40"
                  }`}
                >
                  {selectedPlan === "annual" && (
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#3A2A0E"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  )}
                </div>

                <div className="flex-1">
                  <div className="text-[16px] font-black text-[#2E393D]">
                    Annual Plan
                  </div>
                  <div className="text-[13.5px] font-semibold text-[#5A4515] leading-snug mt-0.5">
                    Just ₦{monthlyPrice.toLocaleString()} / month
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[16px] font-black text-[#2E393D]">
                    ₦{annualPrice.toLocaleString()}
                  </div>
                  <div className="text-[12px] font-semibold text-[#5A4515] mt-0.5">
                    / year
                  </div>
                </div>
              </button>

              {/* Monthly Plan */}
              <button
                onClick={() => setSelectedPlan("monthly")}
                className={`relative flex items-center p-4 rounded-[20px] transition-all duration-700 delay-[600ms] text-left w-full border ${contentVisible && step === 3 ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"} ${
                  selectedPlan === "monthly"
                    ? "bg-white/95 backdrop-blur-xl border-[#E7B84F] shadow-[0_8px_20px_rgba(207,154,68,0.25)] scale-[1.02] ring-2 ring-[#E7B84F]/30"
                    : "bg-[#FDF7EC]/85 backdrop-blur-xl border-[#E7B84F]/30 shadow-sm hover:bg-white/90"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mr-4 transition-colors duration-300 ${
                    selectedPlan === "monthly"
                      ? "border-[#E7B84F] bg-[#E7B84F]"
                      : "border-[#8A7A55]/40"
                  }`}
                >
                  {selectedPlan === "monthly" && (
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#3A2A0E"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  )}
                </div>

                <div className="flex-1">
                  <div className="text-[16px] font-black text-[#2E393D]">
                    Monthly Plan
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[16px] font-black text-[#2E393D]">
                    ₦{monthlyPrice.toLocaleString()}
                  </div>
                  <div className="text-[12px] font-semibold text-[#5A4515] mt-0.5">
                    / month
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Fixed Bottom CTA */}
        <div
          className={`fixed bottom-0 left-0 right-0 px-6 pb-8 pt-12 bg-gradient-to-t from-[#1F3E3B]/80 via-[#1F3E3B]/30 to-transparent pointer-events-none z-20 transition-all duration-1000 delay-[1800ms] ${contentVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
        >
          <div className="max-w-md mx-auto relative flex flex-col items-center pointer-events-auto">
            {step < 3 ? (
              <Button
                fullWidth
                onClick={nextStep}
                className="h-14 text-[16px] bg-[#E7B84F] text-[#3A2A0E] shadow-[0_6px_20px_rgba(207,154,68,0.4)] hover:bg-[#F2CE7C]"
              >
                Continue
              </Button>
            ) : (
              <Button fullWidth onClick={handleSubscribe} disabled={isSubmitting} className="h-14 text-[16px] bg-[#E7B84F] text-[#3A2A0E] shadow-[0_6px_20px_rgba(207,154,68,0.4)] hover:bg-[#F2CE7C]">
                 {isSubmitting ? 'Activating Pro...' : 'Activate 14-Day Free Trial'}
                 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-1"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
               </Button>
            )}

            <p className="mt-4 text-[12px] font-semibold text-white/95 text-center max-w-[280px] drop-shadow-md leading-relaxed">
              Plan cost will be automatically deducted from your funded SubBee balance after the trial. No credit card required. Cancel anytime.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
