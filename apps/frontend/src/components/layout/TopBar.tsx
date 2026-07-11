import { useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../../lib/auth';

export default function TopBar({
  title,
  subtitle,
  back,
  right,
}: {
  title: string;
  subtitle?: string;
  back?: boolean;
  right?: ReactNode;
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  return (
    <div className="flex items-center justify-between gap-3 px-5 pb-4 pt-6">
      <div className="flex items-center gap-3">
        {back && (
          <button
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-white shadow-[0_3px_10px_rgba(20,40,45,0.07)]"
            aria-label="Back"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1E2A2E" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        )}
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-ink">{title}</h1>
            {user?.isPro && (
              <span className="bg-gradient-to-r from-[#E7B84F] to-[#CF9A44] text-[#3A2A0E] text-[10px] font-black uppercase tracking-wider py-0.5 px-1.5 rounded-sm shadow-sm flex items-center">
                PRO
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs font-semibold text-ink-muted">{subtitle}</p>}
        </div>
      </div>
      {right}
    </div>
  );
}
