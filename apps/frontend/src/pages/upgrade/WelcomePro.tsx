import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';

export default function WelcomePro() {
  const navigate = useNavigate();

  return (
    <div 
      className="flex flex-col min-h-screen bg-cover bg-center bg-fixed relative justify-center items-center px-6"
      style={{ backgroundImage: `url('/illustrations/paywall_honey.jpg')` }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>

      <div className="relative z-10 bg-white/95 backdrop-blur-xl p-8 rounded-[32px] max-w-[320px] w-full shadow-[0_20px_60px_rgba(0,0,0,0.3)] border border-[#E7B84F]/40 text-center animate-in fade-in zoom-in duration-700">
        <div className="w-20 h-20 bg-[#E7B84F]/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl drop-shadow-sm">🐝</span>
        </div>
        
        <h1 className="text-[28px] font-black text-[#2E393D] leading-tight mb-3">
          Welcome to<br/>SubBee Pro!
        </h1>
        
        <p className="text-[15px] font-semibold text-[#5A4515] leading-relaxed mb-8">
          Your account is fully upgraded. Get ready for unlimited tracking and advanced insights.
        </p>

        <Button 
          fullWidth 
          onClick={() => navigate('/app/dashboard')} 
          className="h-14 text-[16px] bg-[#E7B84F] text-[#3A2A0E] shadow-[0_6px_20px_rgba(207,154,68,0.4)] hover:bg-[#F2CE7C]"
        >
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
}
