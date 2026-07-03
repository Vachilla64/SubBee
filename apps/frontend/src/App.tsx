/**
 * SubBee Frontend Interface — M0 Placeholder
 *
 * This is the landing/splash screen that will evolve into the full dashboard.
 * Current milestone: skeleton — confirms Tailwind, Vite, and React are wired up.
 */

const FEATURES = [
  {
    icon: '🏦',
    title: 'Personal Bank Account',
    description:
      'Every user gets a dedicated Nigerian virtual account number. Fund your wallet instantly.',
  },
  {
    icon: '💳',
    title: 'Virtual Mastercard',
    description:
      'A Naira-denominated virtual card issued to you. Pay Netflix, Spotify, and more — globally.',
  },
  {
    icon: '🔔',
    title: 'Smart Reminders',
    description:
      'We remind you 3 days before every renewal via Telegram. Never get surprised again.',
  },
  {
    icon: '🔒',
    title: 'Zero-Balance Cards',
    description:
      'Cards stay empty until moments before a charge. You control the money, always.',
  },
];

const STACK_ITEMS = [
  { label: 'Collections', value: 'Nomba' },
  { label: 'Card Issuing', value: 'Bridgecard' },
  { label: 'Messaging', value: 'Telegram' },
  { label: 'Ledger', value: 'PostgreSQL' },
  { label: 'Queue', value: 'BullMQ + Redis' },
];

export default function App() {
  return (
    <div className="min-h-screen bg-navy-900 text-white overflow-hidden relative">
      {/* ── Ambient background glows ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute top-1/2 -right-40 w-80 h-80 bg-brand-400/15 rounded-full blur-3xl animate-pulse-slow [animation-delay:1.5s]" />
        <div className="absolute -bottom-20 left-1/3 w-72 h-72 bg-brand-600/10 rounded-full blur-3xl animate-pulse-slow [animation-delay:3s]" />
      </div>

      {/* ── Nav ── */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-2xl animate-float inline-block">🐝</span>
          <span className="text-xl font-bold tracking-tight">SubBee</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-brand-500/20 text-brand-300 border border-brand-500/30">
            M0 — Skeleton
          </span>
        </div>
      </nav>

      {/* ── Hero ── */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 pt-16 pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-sm font-medium mb-8">
          <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
          SubBee Frontend Interface
        </div>

        <h1 className="text-5xl sm:text-7xl font-extrabold leading-tight mb-6 tracking-tight">
          Your subscriptions,{' '}
          <span className="text-gradient">automated.</span>
        </h1>

        <p className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto mb-12 leading-relaxed">
          Fund once. SubBee pays Netflix, Spotify, electricity — everything —
          exactly when it's due. Never get surprised by a charge, never forget
          to cancel.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
          <button
            id="cta-get-started"
            className="px-8 py-4 rounded-2xl bg-brand-500 hover:bg-brand-400 text-navy-900 font-bold text-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-brand-500/30"
          >
            Get Started — It's Free
          </button>
          <button
            id="cta-learn-more"
            className="px-8 py-4 rounded-2xl glass-card hover:bg-white/10 font-semibold text-lg transition-all duration-200 hover:scale-105 active:scale-95"
          >
            How it works →
          </button>
        </div>

        {/* ── Feature grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-20">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="glass-card p-6 text-left hover:bg-white/[0.08] transition-colors duration-200 group"
            >
              <div className="text-3xl mb-4 group-hover:scale-110 transition-transform duration-200 inline-block">
                {f.icon}
              </div>
              <h2 className="font-semibold text-white mb-2 text-sm">
                {f.title}
              </h2>
              <p className="text-white/50 text-sm leading-relaxed">
                {f.description}
              </p>
            </div>
          ))}
        </div>

        {/* ── Architecture strip ── */}
        <div className="glass-card p-6 max-w-2xl mx-auto">
          <p className="text-white/40 text-xs uppercase tracking-widest font-semibold mb-4">
            Powered by
          </p>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3">
            {STACK_ITEMS.map((item) => (
              <div key={item.label} className="text-center">
                <p className="text-brand-400 font-bold text-sm">{item.value}</p>
                <p className="text-white/30 text-xs mt-0.5">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="relative z-10 text-center pb-8 text-white/20 text-xs">
        SubBee · Nomba Hackathon 2026 · Team 246
      </footer>
    </div>
  );
}
