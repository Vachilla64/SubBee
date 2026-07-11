import { useNavigate } from 'react-router-dom';
import TopBar from '../../components/layout/TopBar';

import SubscriptionRow from '../../components/subscriptions/SubscriptionRow';
import { SkeletonRows } from '../../components/ui/Skeleton';
import { useWalletData } from '../../lib/useWalletData';
import { isInsufficientFunds } from '../../lib/format';
import { useAuth } from '../../lib/auth';

export default function SubscriptionsList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { loading, subscriptions, walletKobo } = useWalletData();

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar
        title="My Subscriptions"
        back
        right={
            <button
              onClick={() => {
                if (!user?.isPro && subscriptions.length >= 7) {
                  navigate('/app/upgrade');
                } else {
                  navigate('/app/subscriptions/add');
                }
              }}
              className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-white shadow-[0_3px_10px_rgba(20,40,45,0.07)]"
              aria-label="Add subscription"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1E2A2E" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          }
        />

        <div className="flex-1 flex flex-col gap-2.5 px-5 pb-28">
          {loading ? (
            <SkeletonRows count={4} />
          ) : subscriptions.length === 0 ? (
            <div className="flex-1 bg-white rounded-[26px] shadow-[0_4px_16px_rgba(20,40,45,0.05)] flex flex-col items-center justify-center text-center px-[30px] py-[36px]">
              <img src="/illustrations/bee-confused-right.png" alt="" className="w-[160px] h-[160px] object-contain drop-shadow-[0_10px_16px_rgba(20,40,45,0.12)]" />
              <div className="text-[19px] font-black text-ink mt-2">No subscriptions yet!</div>
              <div className="text-[14px] font-semibold text-ink-muted leading-relaxed max-w-[250px] mt-1.5">
                Add Netflix, Spotify, DStv or any recurring bill and SubBee keeps it paid on time.
              </div>
              <button 
                onClick={() => navigate('/app/subscriptions/add')} 
                className="mt-4.5 h-[52px] px-[26px] rounded-full text-[#3A2A0E] font-black text-[15px] shadow-[0_12px_22px_-10px_rgba(207,154,68,0.9)] transition-transform active:scale-95"
                style={{ background: 'linear-gradient(165deg, #F2CE7C, #E7B84F 60%, #DFAE44)' }}
              >
                Add your first subscription
              </button>
            </div>
          ) : (
            <>
              {subscriptions.map((sub) => (
                <SubscriptionRow key={sub.id} sub={sub} insufficient={isInsufficientFunds(sub, walletKobo)} />
              ))}

              <button
                onClick={() => {
                  if (!user?.isPro && subscriptions.length >= 7) {
                    navigate('/app/upgrade');
                  } else {
                    navigate('/app/subscriptions/add');
                  }
                }}
                className="mt-1 flex items-center justify-center gap-2 rounded-[18px] border-2 border-dashed border-[#C4B58C] bg-[#F7F1E2] px-4 py-4 text-[14.5px] font-extrabold text-[#8A7A55] transition-colors hover:bg-[#F1E9D4]"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8A7A55" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12h14" />
              </svg>
              Add Subscription
            </button>
          </>
        )}
      </div>
    </div>
  );
}
