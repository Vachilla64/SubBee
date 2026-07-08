import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../lib/auth';

export default function RequireAuth() {
  const { user, ready } = useAuth();
  if (!ready) return null;
  if (!user) return <Navigate to="/welcome" replace />;
  return <Outlet />;
}
