import { useNavigate } from 'react-router-dom';
import TopBar from '../../components/layout/TopBar';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import SubscriptionRow from '../../components/subscriptions/SubscriptionRow';
import ActionRequiredCard from '../../components/subscriptions/ActionRequiredCard';
import { SkeletonRows } from '../../components/ui/Skeleton';
import { useWalletData } from '../../lib/useWalletData';
import { isInsufficientFunds, shortfallKobo } from '../../lib/format';

export default function SubscriptionsList() {
  const navigate = useNavigate();
  const { loading, subscriptions, walletKobo, accountNumber } = useWalletData();

  return (
    <div>
      <TopBar
        title="My Subscriptions"
        back
        right={
          <button
            onClick={() => navigate('/app/subscriptions/add')}
            className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-white shadow-[0_3px_10px_rgba(20,40,45,0.07)]"
            aria-label="Add subscription"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1E2A2E" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        }
      />

      <div className="flex flex-col gap-2.5 px-5 pb-4">
        {loading ? (
          <SkeletonRows count={4} />
        ) : subscriptions.length === 0 ? (
          <EmptyState
            mascot="/illustrations/bee-waiting.png"
            title="No subscriptions yet"
            message="Add your first subscription and SubBee takes it from here."
            cta={<Button onClick={() => navigate('/app/subscriptions/add')}>Add a subscription</Button>}
          />
        ) : (
          subscriptions.map((sub) => {
            const insufficient = isInsufficientFunds(sub, walletKobo);
            return (
              <div key={sub.id} className={insufficient ? 'overflow-hidden rounded-[18px] bg-white shadow-[0_3px_12px_rgba(20,40,45,0.05)]' : ''}>
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
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
