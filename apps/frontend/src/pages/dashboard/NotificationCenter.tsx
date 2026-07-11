import { useNavigate } from 'react-router-dom';

export default function NotificationCenter() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF3E1]">
      <div className="teal-card-gradient pb-4 pt-10">
        <div className="flex items-center gap-3 px-5 pt-1">
          <button 
            onClick={() => navigate(-1)}
            className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[11px] bg-white/12 transition-colors active:bg-white/20"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#EAF3F0" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"></path></svg>
          </button>
          
          <div className="flex flex-col flex-1">
            <span className="text-[19px] font-black tracking-tight text-[#F2CE7C]">Notifications</span>
            <span className="mt-[1px] inline-flex items-center gap-1.5 text-[11px] font-bold text-[#9FC4C3]">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="#229ED9"><path d="M21.9 4.3l-3.3 15.6c-.25 1.1-.9 1.37-1.83.85l-5.05-3.72-2.44 2.35c-.27.27-.5.5-1.02.5l.36-5.14L18 5.6c.42-.37-.09-.58-.65-.21L6.42 12.2 1.5 10.66c-1.07-.33-1.09-1.07.22-1.58L20.5 2.7c.9-.33 1.68.21 1.4 1.6z"></path></svg>
              Mirrors your Telegram alerts
            </span>
          </div>

          <button className="shrink-0 text-[12.5px] font-extrabold text-[#BBD8D8] active:text-white">
            Mark all read
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4 px-[22px] pt-4 pb-8 overflow-hidden">
        
        {/* date marker: Today */}
        <div className="flex items-stretch gap-3.5">
          <div className="relative flex w-[42px] shrink-0 flex-col items-center">
            <div className="absolute bottom-[-16px] left-[calc(50%-1px)] top-[24px] border-l-2 border-dashed border-[#D6C288]"></div>
            <div className="relative z-10 mt-[3px] h-[15px] w-[15px] rotate-45 rounded-[3px] bg-[#E7B84F] shadow-[0_0_0_5px_#FAF3E1]"></div>
          </div>
          <div className="flex items-center text-[13px] font-black tracking-[0.4px] text-[#8A7A55]">Today</div>
        </div>

        {/* unread: welcome */}
        <div className="flex items-stretch gap-3.5">
          <div className="relative flex w-[42px] shrink-0 flex-col items-center">
            <div className="absolute bottom-[-16px] left-[calc(50%-1px)] top-[44px] border-l-2 border-dashed border-[#D6C288]"></div>
            <div className="relative z-10 flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[13px] shadow-[0_0_0_4px_#FAF3E1]" style={{ background: 'linear-gradient(165deg,#F3D084,#E1AC46)' }}>
              <img src="/illustrations/subbee-logo.png" alt="" className="h-[28px] w-[30px] object-contain" />
            </div>
          </div>
          <div className="relative min-w-0 flex-1 pt-[1px]">
            <div className="flex items-center gap-[7px]">
              <span className="text-[14.5px] font-black text-[#1E2A2E]">Welcome to SubBee! 🐝</span>
              <span className="h-2 w-2 shrink-0 rounded-full bg-[#E7B84F]"></span>
            </div>
            <div className="mt-[2px] text-[12.5px] font-semibold leading-[1.4] text-[#5F6B6F]">Your account is fully set up. Add your first subscription to get started.</div>
            <div className="mt-[5px] text-[11px] font-bold text-[#A6ADB0]">Just now</div>
          </div>
        </div>

        {/* unread: pro activated */}
        <div className="flex items-stretch gap-3.5">
          <div className="relative flex w-[42px] shrink-0 flex-col items-center">
            <div className="absolute bottom-[-16px] left-[calc(50%-1px)] top-[44px] border-l-2 border-dashed border-[#D6C288]"></div>
            <div className="relative z-10 flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[13px] bg-[#1C4042] shadow-[0_0_0_4px_#FAF3E1]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E7B84F" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
            </div>
          </div>
          <div className="relative min-w-0 flex-1 pt-[1px]">
            <div className="flex items-center gap-[7px]">
              <span className="text-[14.5px] font-black text-[#1E2A2E]">SubBee Pro Activated</span>
              <span className="h-2 w-2 shrink-0 rounded-full bg-[#E7B84F]"></span>
            </div>
            <div className="mt-[2px] text-[12.5px] font-semibold leading-[1.4] text-[#5F6B6F]">You now have access to unlimited subscriptions and priority alerts.</div>
            <div className="mt-[5px] text-[11px] font-bold text-[#A6ADB0]">2 min ago</div>
          </div>
        </div>

        {/* read: deposit received */}
        <div className="flex items-stretch gap-3.5">
          <div className="relative flex w-[42px] shrink-0 flex-col items-center">
            <div className="absolute bottom-[-16px] left-[calc(50%-1px)] top-[44px] border-l-2 border-dashed border-[#D6C288]"></div>
            <div className="relative z-10 flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[13px] bg-[#E8F1EC] shadow-[0_0_0_4px_#FAF3E1]">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#3E6247" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7"></path></svg>
            </div>
          </div>
          <div className="relative min-w-0 flex-1 pt-[1px]">
            <div className="text-[14.5px] font-extrabold text-[#1E2A2E]">Wallet funded</div>
            <div className="mt-[2px] text-[12.5px] font-semibold leading-[1.4] text-[#8A9499]">
              <b className="text-[#2E7D50]">+₦5,000.00</b> landed from your bank transfer.
            </div>
            <div className="mt-[5px] text-[11px] font-bold text-[#A6ADB0]">1 hr ago</div>
          </div>
        </div>

        {/* read: KYC verified (last - no connector) */}
        <div className="flex items-stretch gap-3.5">
          <div className="relative flex w-[42px] shrink-0 flex-col items-center">
            {/* no dashed border line extending past the last item */}
            <div className="relative z-10 flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[13px] bg-[#E8F1EC] shadow-[0_0_0_4px_#FAF3E1]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3E6247" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="M9 12l2 2 4-4"></path></svg>
            </div>
          </div>
          <div className="relative min-w-0 flex-1 pt-[1px]">
            <div className="text-[14.5px] font-extrabold text-[#1E2A2E]">Identity verified</div>
            <div className="mt-[2px] text-[12.5px] font-semibold leading-[1.4] text-[#8A9499]">Your card and wallet are fully unlocked. Welcome aboard!</div>
            <div className="mt-[5px] text-[11px] font-bold text-[#A6ADB0]">2 hrs ago</div>
          </div>
        </div>

      </div>
    </div>
  );
}
