import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../../components/layout/TopBar';
import Button from '../../components/ui/Button';
import ConfirmSheet from '../../components/ui/ConfirmSheet';
import { useAuth } from '../../lib/auth';
import toast from 'react-hot-toast';

export default function ProSubscriptionSettings() {
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);

  const handleCancel = () => {
    setIsCanceling(true);
    // Simulate backend call
    setTimeout(() => {
      setIsCanceling(false);
      updateUser({ isPro: false });
      setShowConfirm(false);
      toast.success('Your Pro subscription has been canceled.');
      navigate('/app/profile');
    }, 1500);
  };

  return (
    <div className="flex min-h-screen flex-col bg-cream-bg">
      <TopBar title="Pro Subscription" back />
      
      <div className="px-5 pt-4 flex-1">
        <div className="rounded-[24px] bg-white p-5 shadow-[0_4px_16px_rgba(20,40,45,0.05)] mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-[#E7B84F] to-[#CF9A44] rounded-2xl flex items-center justify-center shadow-sm overflow-hidden pt-1">
              <img src="/illustrations/bee-peek.png" alt="SubBee Logo" className="w-9 h-9 object-contain" />
            </div>
            <div>
              <h2 className="text-[17px] font-black text-ink">SubBee Pro</h2>
              <p className="text-[13px] font-bold text-teal">Active</p>
            </div>
          </div>
          
          <div className="space-y-3 pt-4 border-t border-ink/5">
            <div className="flex justify-between items-center">
              <span className="text-[13px] font-semibold text-ink-muted">Plan</span>
              <span className="text-[13px] font-bold text-ink">Annual (₦10,800/yr)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[13px] font-semibold text-ink-muted">Next billing date</span>
              <span className="text-[13px] font-bold text-ink">Aug 11, 2026</span>
            </div>
          </div>
        </div>

        <div className="rounded-[24px] bg-white p-5 shadow-[0_4px_16px_rgba(20,40,45,0.05)]">
          <h3 className="text-[15px] font-black text-ink mb-2">Cancel Subscription</h3>
          <p className="text-[13px] font-medium text-ink-muted mb-4 leading-relaxed">
            If you cancel, you will lose access to unlimited subscription tracking and priority alerts at the end of your billing cycle.
          </p>
          <Button 
            fullWidth 
            onClick={() => setShowConfirm(true)}
            className="!bg-[#FFEEEE] !text-[#E04D4D] hover:!bg-[#E04D4D] hover:!text-white"
          >
            Cancel Pro Subscription
          </Button>
        </div>
      </div>

      <ConfirmSheet
        open={showConfirm}
        onCancel={() => setShowConfirm(false)}
        title="Cancel SubBee Pro?"
        message="Are you sure you want to cancel? Already paid charges will not be refunded T_T."
        confirmLabel={isCanceling ? "Canceling..." : "Yes, cancel my plan"}
        onConfirm={handleCancel}
      />
    </div>
  );
}
