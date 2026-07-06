import { useState, useEffect } from 'react';
import { api } from './lib/api';

// List of supported merchants with their brand icons from public/icons/
const MERCHANTS = [
  { id: 'netflix', name: 'Netflix', domain: 'netflix.com', defaultPrice: 4500 },
  { id: 'linkedin', name: 'LinkedIn', domain: 'linkedin.com', defaultPrice: 12000 },
  { id: 'spotify', name: 'Spotify', domain: 'spotify.com', defaultPrice: 900 },
  { id: 'amazon_prime', name: 'Amazon Prime Video', domain: 'primevideo.com', defaultPrice: 2300 },
  { id: 'dstv', name: 'DStv', domain: 'dstv.com', defaultPrice: 19800 },
  { id: 'youtube', name: 'YouTube Premium', domain: 'youtube.com', defaultPrice: 1300 },
  { id: 'github', name: 'GitHub Copilot', domain: 'github.com', defaultPrice: 8500 },
  { id: 'apple', name: 'Apple Music / iCloud', domain: 'apple.com', defaultPrice: 1500 },
  { id: 'openai', name: 'OpenAI ChatGPT Plus', domain: 'openai.com', defaultPrice: 17000 },
  { id: 'zoom', name: 'Zoom Premium', domain: 'zoom.us', defaultPrice: 12500 }
];

interface Subscription {
  id: string;
  merchantId: string;
  merchantName: string;
  amountKobo: number;
  billingDay: number;
  remindersEnabled: boolean;
  isActive: boolean;
}

interface KYCData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dob: string;
  address: string;
  state: string;
  lga: string;
  postalCode: string;
  bvn: string;
  selfieUrl: string;
}

export default function App() {
  // --- Authentication State ---
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authName, setAuthName] = useState('');

  // --- Active Tab State ---
  const [activeTab, setActiveTab] = useState<'dashboard' | 'kyc' | 'card' | 'subscriptions'>('dashboard');

  // --- Wallet & Balance State (Simulated) ---
  const [balanceKobo, setBalanceKobo] = useState<number>(0);
  const [telegramConnected, setTelegramConnected] = useState(false);
  const [telegramCode, setTelegramCode] = useState('');

  // --- KYC State ---
  const [kycSubmitted, setKycSubmitted] = useState(false);
  const [kycStep, setKycStep] = useState(1);
  const [kycForm, setKycForm] = useState<KYCData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dob: '',
    address: '',
    state: '',
    lga: '',
    postalCode: '',
    bvn: '',
    selfieUrl: ''
  });

  // --- Virtual Card State ---
  const [cardStatus, setCardStatus] = useState<'inactive' | 'active' | 'frozen'>('inactive');
  const [showCardDetails, setShowCardDetails] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // --- Subscriptions State ---
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [subMerchant, setSubMerchant] = useState(MERCHANTS[0].id);
  const [subAmount, setSubAmount] = useState(MERCHANTS[0].defaultPrice.toString());
  const [subBillingDay, setSubBillingDay] = useState('5');
  const [subReminders, setSubReminders] = useState(true);

  // --- Initialize data from API ---
  const loadUserData = async (email: string) => {
    try {
      const balData = await api.getBalance(email);
      setBalanceKobo(balData.balanceKobo || 0);
      setTelegramConnected(balData.telegramConnected || false);

      const cardData = await api.getCard(email);
      if (cardData.status && cardData.status !== 'inactive') {
        setCardStatus(cardData.status);
        setKycSubmitted(true);
      }

      const subData = await api.getSubscriptions(email);
      if (Array.isArray(subData)) {
        setSubscriptions(subData);
      }
    } catch (e) {
      console.error('Error loading user data:', e);
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('subbee_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setUser(parsed);
      setTelegramCode('conn_' + parsed.id);
      loadUserData(parsed.email);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authName || !authEmail) return;
    try {
      const newUser = await api.auth(authName, authEmail);
      setUser(newUser);
      localStorage.setItem('subbee_user', JSON.stringify(newUser));
      setTelegramCode('conn_' + newUser.id);
      loadUserData(newUser.email);
    } catch (e) {
      console.error('Login error:', e);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('subbee_user');
  };

  const handleSimulateDeposit = async (amountNaira: number) => {
    if (!user) return;
    try {
      await api.deposit(user.email, amountNaira);
      const balData = await api.getBalance(user.email);
      setBalanceKobo(balData.balanceKobo || 0);
    } catch (e) {
      console.error('Deposit error:', e);
    }
  };

  const handleKycSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await api.submitKyc(user.email, kycForm);
      setKycSubmitted(true);
      
      const cardData = await api.requestCard(user.email);
      if (cardData.card && cardData.card.status) {
        setCardStatus(cardData.card.status);
      }
      setActiveTab('card');
    } catch (e) {
      console.error('KYC error:', e);
    }
  };

  const handleToggleFreeze = async () => {
    if (!user) return;
    const isFrozen = cardStatus === 'frozen';
    try {
      const cardData = await api.getCard(user.email);
      await api.toggleCardFreeze(cardData.cardId, isFrozen);
      setCardStatus(isFrozen ? 'active' : 'frozen');
    } catch (e) {
      console.error('Toggle freeze error:', e);
    }
  };

  const handleRevealDetails = () => {
    setLoadingDetails(true);
    setShowCardDetails(true);
    setTimeout(() => {
      setLoadingDetails(false);
    }, 1000);
  };

  const handleAddSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const merchant = MERCHANTS.find(m => m.id === subMerchant);
    if (!merchant) return;

    try {
      const data = await api.addSubscription({
        email: user.email,
        merchantId: subMerchant,
        merchantName: merchant.name,
        amountNaira: Number(subAmount),
        billingDay: Number(subBillingDay),
        remindersEnabled: subReminders
      });

      const newSub: Subscription = {
        id: data.id,
        merchantId: subMerchant,
        merchantName: merchant.name,
        amountKobo: Number(subAmount) * 100,
        billingDay: Number(subBillingDay),
        remindersEnabled: subReminders,
        isActive: true
      };

      setSubscriptions([...subscriptions, newSub]);
      setSubAmount(MERCHANTS[0].defaultPrice.toString());
      setSubBillingDay('5');
    } catch (e) {
      console.error('Add sub error:', e);
    }
  };

  const handleDeleteSubscription = async (id: string) => {
    try {
      await api.deleteSubscription(id);
      setSubscriptions(subscriptions.filter(s => s.id !== id));
    } catch (e) {
      console.error('Delete sub error:', e);
    }
  };

  // Format currency helper
  const formatNaira = (kobo: number) => {
    return '₦' + (kobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // --- Auth Render fallback ---
  if (!user) {
    return (
      <div className="min-h-screen bg-navy-900 text-white flex items-center justify-center px-4 relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-brand-600/10 rounded-full blur-3xl" />
        </div>

        <div className="w-full max-w-md glass-card p-8 relative z-10">
          <div className="text-center mb-8">
            <span className="text-4xl inline-block mb-3 animate-bounce">🐝</span>
            <h1 className="text-3xl font-extrabold tracking-tight">SubBee</h1>
            <p className="text-sm text-white/60 mt-1">Wallet-Based Subscriptions & Virtual Cards</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-white/50 font-semibold mb-1">Full Name</label>
              <input
                type="text"
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-brand-500 transition-colors"
                placeholder="e.g. John Doe"
                value={authName}
                onChange={e => setAuthName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-white/50 font-semibold mb-1">Email Address</label>
              <input
                type="email"
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-brand-500 transition-colors"
                placeholder="e.g. john@example.com"
                value={authEmail}
                onChange={e => setAuthEmail(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="w-full bg-brand-500 hover:bg-brand-400 text-navy-900 font-bold py-3 rounded-xl transition-all active:scale-95 duration-200 mt-2 shadow-lg shadow-brand-500/20"
            >
              Sign Up / Log In
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-900 text-white flex flex-col md:flex-row relative">
      {/* ── Background decoration ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 left-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-brand-600/5 rounded-full blur-3xl" />
      </div>

      {/* ── Left Sidebar Navigation ── */}
      <aside className="w-full md:w-64 bg-navy-800/50 backdrop-blur-md border-b md:border-b-0 md:border-r border-white/5 p-6 relative z-10 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <span className="text-2xl animate-float">🐝</span>
            <span className="text-xl font-bold tracking-tight text-gradient">SubBee</span>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-semibold transition-all ${
                activeTab === 'dashboard' ? 'bg-brand-500 text-navy-900 shadow-md shadow-brand-500/10' : 'hover:bg-white/5 text-white/70'
              }`}
            >
              <span>📊</span> Dashboard
            </button>
            <button
              onClick={() => setActiveTab('kyc')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-semibold transition-all ${
                activeTab === 'kyc' ? 'bg-brand-500 text-navy-900 shadow-md shadow-brand-500/10' : 'hover:bg-white/5 text-white/70'
              }`}
            >
              <span>👤</span> KYC Verification
            </button>
            <button
              onClick={() => setActiveTab('card')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-semibold transition-all ${
                activeTab === 'card' ? 'bg-brand-500 text-navy-900 shadow-md shadow-brand-500/10' : 'hover:bg-white/5 text-white/70'
              }`}
            >
              <span>💳</span> Virtual Card
            </button>
            <button
              onClick={() => setActiveTab('subscriptions')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-semibold transition-all ${
                activeTab === 'subscriptions' ? 'bg-brand-500 text-navy-900 shadow-md shadow-brand-500/10' : 'hover:bg-white/5 text-white/70'
              }`}
            >
              <span>🔄</span> Subscriptions
            </button>
          </nav>
        </div>

        <div className="pt-6 border-t border-white/5 mt-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs text-white/40 uppercase tracking-wider font-semibold">User</p>
              <p className="text-sm font-bold truncate text-white/80">{user.name}</p>
            </div>
            <button onClick={handleLogout} className="text-white/40 hover:text-white/90 text-sm">
              🚪
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <main className="flex-1 p-6 md:p-10 relative z-10 overflow-y-auto max-w-5xl mx-auto w-full">
        {/* ──────── TABS: DASHBOARD ──────── */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h2 className="text-3xl font-extrabold">Overview</h2>
                <p className="text-sm text-white/50">Manage your balance and channels</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${telegramConnected ? 'bg-green-400' : 'bg-yellow-400'}`} />
                <span className="text-xs text-white/60 font-medium">
                  {telegramConnected ? 'Telegram Live Alerts: Connected' : 'Telegram Alerts: Disconnected'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Wallet Balance Card */}
              <div className="glass-card p-6 flex flex-col justify-between min-h-[160px]">
                <div>
                  <p className="text-xs uppercase tracking-wider text-white/40 font-semibold mb-1">SubBee Wallet Balance</p>
                  <h3 className="text-4xl font-extrabold text-gradient">{formatNaira(balanceKobo)}</h3>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => handleSimulateDeposit(2500)}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white border border-white/10 px-3 py-2 rounded-xl text-xs font-bold transition-all"
                  >
                    + ₦2,500
                  </button>
                  <button
                    onClick={() => handleSimulateDeposit(10000)}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white border border-white/10 px-3 py-2 rounded-xl text-xs font-bold transition-all"
                  >
                    + ₦10,000
                  </button>
                </div>
              </div>

              {/* Deposit Account Details */}
              <div className="glass-card p-6 flex flex-col justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-white/40 font-semibold mb-1">Deposit Accounts (Nomba MFB)</p>
                  <p className="text-sm font-semibold text-white/80">Account: 8235885652</p>
                  <p className="text-xs text-white/40 mt-0.5">Permanent account assigned to your profile</p>
                </div>
                <div className="mt-4 text-xs bg-white/5 p-3 rounded-lg border border-white/5 text-white/60">
                  Transfer funds from any banking app to fund your SubBee balance automatically.
                </div>
              </div>
            </div>

            {/* Telegram Channel Connection */}
            <div className="glass-card p-6">
              <h4 className="text-lg font-bold mb-2">Connected Channels</h4>
              <p className="text-sm text-white/60 mb-4">
                SubBee sends notification summaries, renewal reminders, and receipts to your Telegram account 3 days before any subscription renewal.
              </p>

              {telegramConnected ? (
                <div className="bg-green-500/10 border border-green-500/20 text-green-300 px-4 py-3 rounded-xl text-sm flex justify-between items-center">
                  <span>Connected successfully to @{user.name.replace(/\s+/g, '').toLowerCase()}_tg</span>
                  <button onClick={() => setTelegramConnected(false)} className="text-xs font-bold underline hover:no-underline">
                    Disconnect
                  </button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-brand-500/5 border border-brand-500/20">
                  <div>
                    <p className="text-sm font-semibold text-brand-300">Connect SubBee Bot</p>
                    <p className="text-xs text-white/50">Your connection code: <strong>{telegramCode}</strong></p>
                  </div>
                  <a
                    href={`https://t.me/SubBeeBot?start=${telegramCode}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-brand-500 hover:bg-brand-400 text-navy-900 font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-md shadow-brand-500/20"
                  >
                    Open Telegram & Connect
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ──────── TABS: KYC Verification ──────── */}
        {activeTab === 'kyc' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-extrabold">KYC Verification</h2>
              <p className="text-sm text-white/50">Required by Bridgecard for card issuing</p>
            </div>

            {kycSubmitted ? (
              <div className="glass-card p-8 text-center max-w-md mx-auto">
                <span className="text-5xl block mb-4">✅</span>
                <h3 className="text-xl font-bold mb-1">Verification Complete</h3>
                <p className="text-sm text-white/50 mb-6">Your details have been registered. Your virtual card is active.</p>
                <button
                  onClick={() => {
                    setKycSubmitted(false);
                    setKycStep(1);
                  }}
                  className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                >
                  Edit Verification Details
                </button>
              </div>
            ) : (
              <div className="glass-card p-6 max-w-lg mx-auto">
                {/* Step indicator */}
                <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
                  <span className={`text-xs font-bold ${kycStep === 1 ? 'text-brand-300' : 'text-white/40'}`}>1. Personal</span>
                  <span className={`text-xs font-bold ${kycStep === 2 ? 'text-brand-300' : 'text-white/40'}`}>2. Address</span>
                  <span className={`text-xs font-bold ${kycStep === 3 ? 'text-brand-300' : 'text-white/40'}`}>3. Identity & Selfie</span>
                </div>

                <form onSubmit={handleKycSubmit} className="space-y-4">
                  {kycStep === 1 && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-white/50 font-semibold mb-1">First Name</label>
                          <input
                            type="text"
                            required
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
                            value={kycForm.firstName}
                            onChange={e => setKycForm({ ...kycForm, firstName: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-white/50 font-semibold mb-1">Last Name</label>
                          <input
                            type="text"
                            required
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
                            value={kycForm.lastName}
                            onChange={e => setKycForm({ ...kycForm, lastName: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-white/50 font-semibold mb-1">Phone Number</label>
                          <input
                            type="tel"
                            required
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
                            value={kycForm.phone}
                            onChange={e => setKycForm({ ...kycForm, phone: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-white/50 font-semibold mb-1">Email Address</label>
                          <input
                            type="email"
                            required
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
                            value={kycForm.email}
                            onChange={e => setKycForm({ ...kycForm, email: e.target.value })}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-white/50 font-semibold mb-1">Date of Birth</label>
                        <input
                          type="date"
                          required
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
                          value={kycForm.dob}
                          onChange={e => setKycForm({ ...kycForm, dob: e.target.value })}
                        />
                      </div>
                      <div className="flex justify-end pt-4">
                        <button
                          type="button"
                          onClick={() => setKycStep(2)}
                          className="bg-brand-500 text-navy-900 font-bold px-6 py-2.5 rounded-xl text-sm"
                        >
                          Next: Address
                        </button>
                      </div>
                    </div>
                  )}

                  {kycStep === 2 && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs text-white/50 font-semibold mb-1">Street Address</label>
                        <input
                          type="text"
                          required
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
                          value={kycForm.address}
                          onChange={e => setKycForm({ ...kycForm, address: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs text-white/50 font-semibold mb-1">State</label>
                          <input
                            type="text"
                            required
                            placeholder="Lagos"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
                            value={kycForm.state}
                            onChange={e => setKycForm({ ...kycForm, state: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-white/50 font-semibold mb-1">LGA</label>
                          <input
                            type="text"
                            required
                            placeholder="Ikeja"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
                            value={kycForm.lga}
                            onChange={e => setKycForm({ ...kycForm, lga: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-white/50 font-semibold mb-1">Postal Code</label>
                          <input
                            type="text"
                            required
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
                            value={kycForm.postalCode}
                            onChange={e => setKycForm({ ...kycForm, postalCode: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="flex justify-between pt-4">
                        <button
                          type="button"
                          onClick={() => setKycStep(1)}
                          className="bg-white/5 text-white border border-white/10 px-6 py-2.5 rounded-xl text-sm"
                        >
                          Back
                        </button>
                        <button
                          type="button"
                          onClick={() => setKycStep(3)}
                          className="bg-brand-500 text-navy-900 font-bold px-6 py-2.5 rounded-xl text-sm"
                        >
                          Next: Identity
                        </button>
                      </div>
                    </div>
                  )}

                  {kycStep === 3 && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs text-white/50 font-semibold mb-1">Bank Verification Number (BVN) / NIN</label>
                        <input
                          type="text"
                          required
                          pattern="\d{11}"
                          title="Must be exactly 11 digits"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
                          placeholder="11-digit number"
                          value={kycForm.bvn}
                          onChange={e => setKycForm({ ...kycForm, bvn: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-white/50 font-semibold mb-1">Selfie Verification</label>
                        <input
                          type="file"
                          accept="image/*"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white/60 focus:outline-none focus:border-brand-500"
                          onChange={() => setKycForm({ ...kycForm, selfieUrl: 'simulated_selfie_url' })}
                        />
                        <p className="text-[10px] text-white/40 mt-1">Requires standard camera access in live environment</p>
                      </div>
                      <div className="flex justify-between pt-4">
                        <button
                          type="button"
                          onClick={() => setKycStep(2)}
                          className="bg-white/5 text-white border border-white/10 px-6 py-2.5 rounded-xl text-sm"
                        >
                          Back
                        </button>
                        <button
                          type="submit"
                          className="bg-brand-500 hover:bg-brand-400 text-navy-900 font-bold px-6 py-2.5 rounded-xl text-sm shadow-md shadow-brand-500/20 animate-pulse"
                        >
                          Submit Verification
                        </button>
                      </div>
                    </div>
                  )}
                </form>
              </div>
            )}
          </div>
        )}

        {/* ──────── TABS: VIRTUAL CARD ──────── */}
        {activeTab === 'card' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-extrabold">Virtual Card</h2>
              <p className="text-sm text-white/50">Naira MasterCard issued via Bridgecard</p>
            </div>

            {cardStatus === 'inactive' ? (
              <div className="glass-card p-8 text-center max-w-md mx-auto">
                <span className="text-5xl block mb-4">🔏</span>
                <h3 className="text-lg font-bold mb-2">No Card Issued</h3>
                <p className="text-sm text-white/60 mb-6">
                  You must complete your KYC Verification to register a cardholder profile and issue a zero-balance virtual card.
                </p>
                <button
                  onClick={() => setActiveTab('kyc')}
                  className="bg-brand-500 hover:bg-brand-400 text-navy-900 font-bold px-6 py-3 rounded-xl text-sm transition-all"
                >
                  Start KYC Verification
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Visual Card representation */}
                <div className="max-w-md mx-auto w-full aspect-[1.586] rounded-2xl p-6 relative overflow-hidden bg-gradient-to-br from-navy-800/80 to-navy-950/90 border border-white/10 shadow-2xl flex flex-col justify-between">
                  {/* Glassmorphic overlay */}
                  <div className="absolute inset-0 bg-white/[0.02] backdrop-blur-[2px]" />

                  {/* Card top */}
                  <div className="relative z-10 flex justify-between items-start">
                    <div>
                      <p className="text-xs text-white/40 uppercase tracking-widest font-semibold">Virtual Card</p>
                      <h4 className="text-sm font-bold text-brand-300 mt-0.5">SubBee Automated Wallet</h4>
                    </div>
                    <span className="text-2xl">🐝</span>
                  </div>

                  {/* Card middle */}
                  <div className="relative z-10 my-4">
                    {showCardDetails ? (
                      loadingDetails ? (
                        <div className="h-6 w-48 bg-white/5 animate-pulse rounded-md" />
                      ) : (
                        <p className="text-xl font-bold tracking-widest font-mono text-white/90">5123 4567 8901 2345</p>
                      )
                    ) : (
                      <p className="text-xl font-bold tracking-widest font-mono text-white/50">•••• •••• •••• 2345</p>
                    )}
                  </div>

                  {/* Card bottom */}
                  <div className="relative z-10 flex justify-between items-end">
                    <div>
                      <p className="text-[9px] text-white/30 uppercase tracking-wider font-semibold">Cardholder</p>
                      <p className="text-xs font-bold text-white/80 uppercase">{kycForm.firstName} {kycForm.lastName}</p>
                    </div>
                    <div className="flex gap-4">
                      <div>
                        <p className="text-[9px] text-white/30 uppercase tracking-wider font-semibold">Expiry</p>
                        <p className="text-xs font-bold text-white/80">{showCardDetails && !loadingDetails ? '08/29' : '••/••'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-white/30 uppercase tracking-wider font-semibold">CVV</p>
                        <p className="text-xs font-bold text-white/80">{showCardDetails && !loadingDetails ? '731' : '•••'}</p>
                      </div>
                    </div>
                    {/* MasterCard circle logo */}
                    <div className="flex -space-x-2 shrink-0">
                      <div className="w-6 h-6 rounded-full bg-red-500/80" />
                      <div className="w-6 h-6 rounded-full bg-yellow-500/80" />
                    </div>
                  </div>
                </div>

                {/* Card Controls */}
                <div className="max-w-md mx-auto flex gap-4">
                  <button
                    onClick={handleToggleFreeze}
                    className={`flex-1 font-bold py-3 rounded-xl text-xs transition-all border ${
                      cardStatus === 'frozen'
                        ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/25'
                        : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                    }`}
                  >
                    {cardStatus === 'frozen' ? '❄️ Frozen (Click to Unfreeze)' : '❄️ Freeze Card'}
                  </button>
                  <button
                    onClick={handleRevealDetails}
                    className="flex-1 bg-brand-500 hover:bg-brand-400 text-navy-900 font-bold py-3 rounded-xl text-xs transition-all shadow-md shadow-brand-500/25"
                  >
                    👁️ Reveal Card Details
                  </button>
                </div>

                {/* Reveal Alert Details Modal/State */}
                {showCardDetails && (
                  <div className="max-w-md mx-auto bg-brand-500/5 border border-brand-500/15 p-4 rounded-xl text-xs text-brand-300 relative flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="font-bold">🔒 Secure Card Details Active</p>
                      <p className="text-white/60">
                        Details are loaded fresh from Bridgecard's secure storage. Close this warning to mask details again.
                      </p>
                    </div>
                    <button onClick={() => setShowCardDetails(false)} className="text-brand-300 font-bold hover:text-brand-100">
                      ✕
                    </button>
                  </div>
                )}

                {/* Money model warning box */}
                <div className="max-w-md mx-auto bg-navy-800/40 border border-white/5 p-4 rounded-xl text-xs text-white/50">
                  ⚠️ <strong>Mastercard Money Model Notice:</strong> SubBee virtual cards use Just-In-Time (JIT) funding. The card balance stays at ₦0.00 and is only funded the exact millisecond a subscription payment is captured.
                </div>
              </div>
            )}
          </div>
        )}

        {/* ──────── TABS: SUBSCRIPTIONS ──────── */}
        {activeTab === 'subscriptions' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-extrabold">Subscriptions</h2>
              <p className="text-sm text-white/50">Automate and queue your recurring payments</p>
            </div>

            {/* Grid of Add Sub and Active Subs */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* Add subscription form */}
              <div className="glass-card p-6 lg:col-span-1 space-y-4">
                <h3 className="text-lg font-bold">Add Subscription</h3>

                <form onSubmit={handleAddSubscription} className="space-y-3">
                  <div>
                    <label className="block text-xs text-white/50 font-semibold mb-1">Merchant</label>
                    <select
                      className="w-full bg-navy-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
                      value={subMerchant}
                      onChange={e => {
                        setSubMerchant(e.target.value);
                        const m = MERCHANTS.find(x => x.id === e.target.value);
                        if (m) setSubAmount(m.defaultPrice.toString());
                      }}
                    >
                      {MERCHANTS.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-white/50 font-semibold mb-1">Billing Amount (₦)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
                      value={subAmount}
                      onChange={e => setSubAmount(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-white/50 font-semibold mb-1">Renewal Day of Month</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="28"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
                      placeholder="e.g. 5"
                      value={subBillingDay}
                      onChange={e => setSubBillingDay(e.target.value)}
                    />
                  </div>

                  <div className="flex items-center gap-2 py-1">
                    <input
                      type="checkbox"
                      id="reminders"
                      className="rounded border-white/10 bg-white/5 text-brand-500 focus:ring-0"
                      checked={subReminders}
                      onChange={e => setSubReminders(e.target.checked)}
                    />
                    <label htmlFor="reminders" className="text-xs text-white/60 font-semibold">
                      Enable Telegram alerts & reminders
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-brand-500 hover:bg-brand-400 text-navy-900 font-bold py-2.5 rounded-xl text-xs transition-all shadow-md shadow-brand-500/10"
                  >
                    Add to SubBee Ledger
                  </button>
                </form>
              </div>

              {/* Active subscriptions list */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-lg font-bold">Active Subscriptions</h3>

                {subscriptions.length === 0 ? (
                  <div className="glass-card p-8 text-center text-white/40 text-sm">
                    No subscriptions added yet. Complete the form to begin tracking and JIT-funding.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {subscriptions.map(sub => {
                      return (
                        <div
                          key={sub.id}
                          className="glass-card p-4 flex items-center justify-between gap-4 hover:bg-white/[0.08] transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Brandfetch official downloaded logo */}
                            <img
                              src={`/icons/${sub.merchantId}.png`}
                              alt={sub.merchantName}
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                              className="w-10 h-10 rounded-lg object-contain bg-white/5 border border-white/5 p-1 flex-shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="font-bold text-sm truncate">{sub.merchantName}</p>
                              <p className="text-xs text-white/40">
                                Bills on Day {sub.billingDay} · {sub.remindersEnabled ? '🔔 Alert active' : '🔕 Muted'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 shrink-0">
                            <div className="text-right">
                              <p className="font-extrabold text-sm text-brand-300">{formatNaira(sub.amountKobo)}</p>
                              <span className="text-[10px] uppercase font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-md border border-green-500/10">
                                Active
                              </span>
                            </div>
                            <button
                              onClick={() => handleDeleteSubscription(sub.id)}
                              className="text-white/30 hover:text-red-400 text-sm transition-colors"
                              title="Delete subscription"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
