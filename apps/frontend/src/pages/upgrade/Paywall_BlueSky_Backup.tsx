import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';

export default function Paywall() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState<'annual' | 'monthly'>('annual');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const monthlyPrice = 900;
  const annualPrice = monthlyPrice * 12;

  const handleSubscribe = () => {
    setIsSubmitting(true);
    // Simulate API call to subscribe
    setTimeout(() => {
      setIsSubmitting(false);
      navigate('/app/dashboard');
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
      style={{ backgroundImage: `url('/illustrations/paywall_bg.png')` }}
    >
      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"></div>

      {/* Header / Dismiss */}
      <div className="relative z-10 flex justify-between items-center p-4">
        <button 
          onClick={prevStep} 
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-md"
        >
          {step === 1 ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"></path></svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          )}
        </button>

        {/* Step Indicator */}
        <div className="flex gap-1.5">
          {[1, 2, 3].map((i) => (
            <div 
              key={i} 
              className={`h-1.5 rounded-full transition-all duration-300 ${step >= i ? 'w-6 bg-white' : 'w-2 bg-white/30'}`}
            ></div>
          ))}
        </div>
      </div>

      <div className="relative z-10 flex-1 flex flex-col justify-end px-6 pb-28 pt-10">
        
        {/* === STEP 1: VALUE PROP === */}
        <div className={`transition-all duration-500 absolute left-6 right-6 bottom-32 ${step === 1 ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-8 pointer-events-none'}`}>
          <div className="flex flex-col items-center text-center">
            <div className="relative w-32 h-32 mb-8">
              <div className="absolute inset-0 rounded-full bg-gold-bg/80 animate-pulse blur-xl"></div>
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-gold to-[#FFD572] shadow-[0_0_40px_rgba(207,154,68,0.5)]"></div>
              <div className="absolute inset-2 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center shadow-inner border border-white/30">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              {/* Floating generic app icons */}
              <div className="absolute -top-2 -left-2 w-12 h-12 bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl shadow-xl flex items-center justify-center animate-bounce" style={{ animationDelay: '0ms' }}>
                 <span className="text-2xl drop-shadow-md">🎵</span>
              </div>
              <div className="absolute top-10 -right-4 w-14 h-14 bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl shadow-xl flex items-center justify-center animate-bounce" style={{ animationDelay: '200ms' }}>
                 <span className="text-3xl drop-shadow-md">🎬</span>
              </div>
              <div className="absolute -bottom-2 left-6 w-12 h-12 bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl shadow-xl flex items-center justify-center animate-bounce" style={{ animationDelay: '400ms' }}>
                 <span className="text-2xl drop-shadow-md">📦</span>
              </div>
            </div>

            <h1 className="text-[32px] font-black text-white leading-[1.15] tracking-tight drop-shadow-lg">
              Never miss a payment.<br/>Unlock SubBee Pro.
            </h1>
            <p className="mt-4 text-[16px] font-medium text-white/90 leading-relaxed max-w-[280px] drop-shadow-md">
              Get unlimited subscriptions, advanced spending insights, and priority Telegram alerts.
            </p>
          </div>
        </div>

        {/* === STEP 2: TRUST TIMELINE === */}
        <div className={`transition-all duration-500 absolute left-6 right-6 bottom-32 ${step === 2 ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-8 pointer-events-none'}`}>
          <h2 className="text-[28px] font-black text-white leading-tight mb-6 drop-shadow-lg">
            Try it risk-free.
          </h2>
          <div className="bg-white/10 backdrop-blur-xl rounded-[24px] p-6 shadow-2xl border border-white/20">
            <h3 className="text-[13px] font-extrabold text-white/70 uppercase tracking-wider mb-5 px-1">How your free trial works</h3>
            
            <div className="relative pl-3 space-y-6">
              <div className="absolute left-4 top-2 bottom-4 w-0.5 bg-white/20 rounded-full"></div>
              
              <div className="relative flex gap-4">
                <div className="w-[10px] h-[10px] rounded-full bg-gold shrink-0 mt-1 relative z-10 ring-4 ring-white/20 shadow-[0_0_10px_rgba(207,154,68,0.8)]"></div>
                <div>
                  <div className="text-[16px] font-extrabold text-white drop-shadow-sm">Today</div>
                  <div className="text-[14px] font-medium text-white/80 mt-0.5 leading-snug">Get instant access to Pro.</div>
                </div>
              </div>

              <div className="relative flex gap-4">
                <div className="w-[10px] h-[10px] rounded-full bg-white/40 shrink-0 mt-1 relative z-10 ring-4 ring-white/10"></div>
                <div>
                  <div className="text-[16px] font-extrabold text-white drop-shadow-sm">Day 12</div>
                  <div className="text-[14px] font-medium text-white/80 mt-0.5 leading-snug">We send a reminder. Cancel if you want.</div>
                </div>
              </div>

              <div className="relative flex gap-4">
                <div className="w-[10px] h-[10px] rounded-full bg-white/40 shrink-0 mt-1 relative z-10 ring-4 ring-white/10"></div>
                <div>
                  <div className="text-[16px] font-extrabold text-white drop-shadow-sm">Day 14</div>
                  <div className="text-[14px] font-medium text-white/80 mt-0.5 leading-snug">You're charged for your plan.</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* === STEP 3: PRICING === */}
        <div className={`transition-all duration-500 absolute left-6 right-6 bottom-32 ${step === 3 ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-8 pointer-events-none'}`}>
          <h2 className="text-[28px] font-black text-white leading-tight mb-6 drop-shadow-lg">
            Choose your plan.
          </h2>
          <div className="flex flex-col gap-3">
            
            {/* Annual Plan */}
            <button 
              onClick={() => setSelectedPlan('annual')}
              className={`relative flex items-center p-4 rounded-[20px] transition-all duration-200 text-left w-full border border-white/20 backdrop-blur-xl ${
                selectedPlan === 'annual' 
                  ? 'bg-gold/20 border-gold shadow-[0_0_20px_rgba(207,154,68,0.3)]' 
                  : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              <div className="absolute -top-3 right-4 bg-gold text-[#3A2A0E] text-[11px] font-black uppercase tracking-wider py-1 px-2.5 rounded-full shadow-lg">
                Best Value
              </div>
              
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mr-4 ${
                selectedPlan === 'annual' ? 'border-gold bg-gold' : 'border-white/40'
              }`}>
                {selectedPlan === 'annual' && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3A2A0E" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
              </div>

              <div className="flex-1">
                <div className="text-[16px] font-black text-white">Annual Plan</div>
                <div className="text-[13.5px] font-medium text-white/80 leading-snug mt-0.5">Just ₦{monthlyPrice.toLocaleString()} / month</div>
              </div>

              <div className="text-right">
                <div className="text-[16px] font-black text-white">₦{annualPrice.toLocaleString()}</div>
                <div className="text-[12px] font-medium text-white/80 mt-0.5">/ year</div>
              </div>
            </button>

            {/* Monthly Plan */}
            <button 
              onClick={() => setSelectedPlan('monthly')}
              className={`relative flex items-center p-4 rounded-[20px] transition-all duration-200 text-left w-full border border-white/20 backdrop-blur-xl ${
                selectedPlan === 'monthly' 
                  ? 'bg-gold/20 border-gold shadow-[0_0_20px_rgba(207,154,68,0.3)]' 
                  : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mr-4 ${
                selectedPlan === 'monthly' ? 'border-gold bg-gold' : 'border-white/40'
              }`}>
                {selectedPlan === 'monthly' && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3A2A0E" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
              </div>

              <div className="flex-1">
                <div className="text-[16px] font-black text-white">Monthly Plan</div>
              </div>

              <div className="text-right">
                <div className="text-[16px] font-black text-white">₦{monthlyPrice.toLocaleString()}</div>
                <div className="text-[12px] font-medium text-white/80 mt-0.5">/ month</div>
              </div>
            </button>

          </div>
        </div>

      </div>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 px-6 pb-8 pt-10 bg-gradient-to-t from-black/60 to-transparent pointer-events-none z-20">
        <div className="max-w-md mx-auto relative flex flex-col items-center pointer-events-auto">
          {step < 3 ? (
             <Button fullWidth onClick={nextStep} className="h-14 text-[16px] bg-white text-ink shadow-[0_6px_20px_rgba(0,0,0,0.2)] hover:bg-white/90">
               Continue
             </Button>
          ) : (
             <Button fullWidth onClick={handleSubscribe} disabled={isSubmitting} className="h-14 text-[16px] bg-gold text-[#3A2A0E] shadow-[0_6px_20px_rgba(207,154,68,0.4)] hover:bg-[#F2CE7C]">
               {isSubmitting ? 'Starting Trial...' : 'Start 14-Day Free Trial'}
               <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-1"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
             </Button>
          )}
          
          <p className="mt-4 text-[12px] font-medium text-white/80 text-center max-w-[250px] drop-shadow-md">
            No commitment. Cancel anytime from your settings with one tap.
          </p>
        </div>
      </div>

    </div>
  );
}
