import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './lib/auth';
import RequireAuth from './components/layout/RequireAuth';
import AppShell from './components/layout/AppShell';

import SignUp from './pages/onboarding/SignUp';
import Kyc from './pages/onboarding/Kyc';
import WalletReady from './pages/onboarding/WalletReady';

import Dashboard from './pages/dashboard/Dashboard';
import NotificationCenter from './pages/dashboard/NotificationCenter';

import SubscriptionsList from './pages/subscriptions/SubscriptionsList';
import AddSubscription from './pages/subscriptions/AddSubscription';
import SubscriptionDetail from './pages/subscriptions/SubscriptionDetail';
import EditSubscription from './pages/subscriptions/EditSubscription';

import CardHome from './pages/card/CardHome';
import SetCardPin from './pages/card/SetCardPin';
import CardCreating from './pages/card/CardCreating';
import RevealCardDetails from './pages/card/RevealCardDetails';

import TransactionHistory from './pages/activity/TransactionHistory';
import FundWallet from './pages/activity/FundWallet';
import TransactionDetail from './pages/activity/TransactionDetail';

import Profile from './pages/profile/Profile';
import ConnectedChannels from './pages/profile/ConnectedChannels';
import NotificationPreferences from './pages/profile/NotificationPreferences';
import Security from './pages/profile/Security';
import HelpSupport from './pages/profile/HelpSupport';
import Legal from './pages/profile/Legal';
import OpsDashboard from './pages/profile/OpsDashboard';

export default function App() {
  const { user, ready } = useAuth();

  if (!ready) return null;

  return (
    <Routes>
      <Route path="/welcome" element={user ? <Navigate to="/app/dashboard" replace /> : <SignUp />} />
      <Route path="/kyc" element={<Kyc />} />
      <Route path="/wallet-ready" element={<WalletReady />} />

      <Route element={<RequireAuth />}>
        <Route path="/app" element={<AppShell />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="notifications" element={<NotificationCenter />} />

          <Route path="subscriptions" element={<SubscriptionsList />} />
          <Route path="subscriptions/add" element={<AddSubscription />} />
          <Route path="subscriptions/:id" element={<SubscriptionDetail />} />
          <Route path="subscriptions/:id/edit" element={<EditSubscription />} />

          <Route path="card" element={<CardHome />} />
          <Route path="card/pin" element={<SetCardPin />} />
          <Route path="card/creating" element={<CardCreating />} />
          <Route path="card/reveal" element={<RevealCardDetails />} />

          <Route path="activity" element={<TransactionHistory />} />
          <Route path="activity/fund" element={<FundWallet />} />
          <Route path="activity/txn/:id" element={<TransactionDetail />} />

          <Route path="profile" element={<Profile />} />
          <Route path="profile/channels" element={<ConnectedChannels />} />
          <Route path="profile/notifications" element={<NotificationPreferences />} />
          <Route path="profile/security" element={<Security />} />
          <Route path="profile/help" element={<HelpSupport />} />
          <Route path="profile/legal" element={<Legal />} />
          <Route path="profile/ops" element={<OpsDashboard />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={user ? '/app/dashboard' : '/welcome'} replace />} />
    </Routes>
  );
}
