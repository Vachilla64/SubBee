import TopBar from '../../components/layout/TopBar';

const FAQS = [
  {
    q: "Why is my card balance ₦0.00?",
    a: "By design. SubBee keeps your card near-empty and funds it automatically the moment a bill is due, then sweeps any leftover back to your wallet.",
  },
  {
    q: 'What does "Insufficient Funds" mean?',
    a: "Your wallet doesn't yet cover an upcoming bill. Top up the exact shortfall shown and the payment resumes automatically - no manual retry needed.",
  },
  {
    q: 'Why did my subscription pause itself?',
    a: 'After two missed cycles for insufficient funds, SubBee pauses a subscription to avoid repeated decline fees. One tap resumes it once funded.',
  },
  {
    q: 'How fast do deposits land?',
    a: 'Bank transfers to your SubBee account number usually reflect within seconds.',
  },
];

export default function HelpSupport() {
  return (
    <div>
      <TopBar title="Help & Support" back />
      <div className="flex flex-col gap-2.5 px-5 pb-6">
        {FAQS.map((f) => (
          <div key={f.q} className="rounded-2xl bg-white p-4 shadow-[0_3px_12px_rgba(20,40,45,0.05)]">
            <p className="text-sm font-extrabold text-ink">{f.q}</p>
            <p className="mt-1.5 text-[13px] font-semibold leading-relaxed text-ink-muted">{f.a}</p>
          </div>
        ))}

        <a
          href="mailto:support@subbee.app"
          className="mt-2 flex h-14 items-center justify-center rounded-full bg-gradient-to-br from-teal-light to-teal text-base font-black text-[#EAF3F0]"
        >
          Contact support
        </a>
      </div>
    </div>
  );
}
