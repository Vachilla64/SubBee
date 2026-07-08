import TopBar from '../../components/layout/TopBar';

export default function Legal() {
  return (
    <div>
      <TopBar title="Legal" back />
      <div className="flex flex-col gap-2.5 px-5 pb-6">
        <div className="rounded-2xl bg-white p-4 shadow-[0_3px_12px_rgba(20,40,45,0.05)]">
          <p className="text-sm font-extrabold text-ink">How your money is held</p>
          <p className="mt-1.5 text-[13px] font-semibold leading-relaxed text-ink-muted">
            Your wallet balance sits in a pooled settlement account at our banking partner (Nomba) and is tracked for you
            individually in SubBee's own ledger. Money is only ever moved to your virtual card (issued via Bridgecard) in
            the moments just before a bill is due.
          </p>
        </div>
        <button className="flex items-center justify-between rounded-2xl bg-white px-4 py-3.5 text-left shadow-[0_3px_12px_rgba(20,40,45,0.05)]">
          <span className="text-sm font-extrabold text-ink">Terms of Service</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C0C6C8" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
        <button className="flex items-center justify-between rounded-2xl bg-white px-4 py-3.5 text-left shadow-[0_3px_12px_rgba(20,40,45,0.05)]">
          <span className="text-sm font-extrabold text-ink">Privacy Policy</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C0C6C8" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
