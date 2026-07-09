import { useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/auth";
import { useState } from "react";
import { useWalletData } from "../../lib/useWalletData";
import { api } from "../../lib/api";

const KYC_BADGE: Record<string, { label: string; className: string }> = {
  verified: {
    label: "KYC VERIFIED",
    className: "bg-[rgba(156,192,165,0.22)] text-[#B6E0BE]",
  },
  pending: {
    label: "VERIFYING…",
    className: "bg-[rgba(242,206,124,0.22)] text-gold-light",
  },
  none: { label: "NOT VERIFIED", className: "bg-white/10 text-white/70" },
};

const SETTINGS_ROWS = [
  { to: "/app/profile/notifications", label: "Notification Preferences" },
  { to: "/app/profile/security", label: "Security" },
  { to: "/app/profile/help", label: "Help & Support" },
  { to: "/app/profile/legal", label: "Legal" },
  { to: "/app/profile/ops", label: "Developer Tools" },
];

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { telegramConnected } = useWalletData();
  const [isDeleting, setIsDeleting] = useState(false);

  const badge = KYC_BADGE[user?.kycStatus ?? "none"] ?? KYC_BADGE.none;

  return (
    <div>
      <div className="teal-card-gradient pb-5">
        <div className="flex items-center justify-between px-6 pb-3.5 pt-6">
          <span className="text-xl font-black text-gold-light">Profile</span>
        </div>
        <div className="flex items-center gap-3.5 px-6">
          <div className="flex h-[66px] w-[66px] shrink-0 items-end justify-center overflow-hidden rounded-[22px] bg-gradient-to-br from-gold-panelFrom to-[#E1AC46] shadow-[0_8px_18px_-8px_rgba(0,0,0,0.5)]">
            <img
              src="/illustrations/bee-peek.png"
              alt=""
              className="h-[58px] w-[58px] object-contain object-bottom"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xl font-black leading-tight text-white">
              {user?.name}
            </div>
            <div className="truncate text-[13px] font-semibold text-teal-soft3">
              {user?.email}
            </div>
            <span
              className={`mt-1.5 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-extrabold ${badge.className}`}
            >
              ✓ {badge.label}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3.5 px-5 pt-4 pb-6">
        <div>
          <div className="mb-2 pl-1 text-[11px] font-extrabold uppercase tracking-wide text-ink-faint">
            Connected Channels
          </div>
          <button
            onClick={() => navigate("/app/profile/channels")}
            className="flex w-full items-center gap-3 rounded-[18px] bg-white px-4 py-3 text-left shadow-[0_3px_12px_rgba(20,40,45,0.05)]"
          >
            <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[13px] bg-[#229ED9]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#FFFFFF">
                <path d="M21.9 4.3l-3.3 15.6c-.25 1.1-.9 1.37-1.83.85l-5.05-3.72-2.44 2.35c-.27.27-.5.5-1.02.5l.36-5.14L18 5.6c.42-.37-.09-.58-.65-.21L6.42 12.2 1.5 10.66c-1.07-.33-1.09-1.07.22-1.58L20.5 2.7c.9-.33 1.68.21 1.4 1.6z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-[15px] font-extrabold text-ink">
                Telegram
              </div>
              <div
                className={`text-xs font-bold ${telegramConnected ? "text-active-text" : "text-ink-muted"}`}
              >
                {telegramConnected
                  ? "Alerts & receipts active"
                  : "Not connected"}
              </div>
            </div>
            <span
              className={`rounded-full px-2.5 py-1.5 text-[11px] font-extrabold ${
                telegramConnected
                  ? "border-[1.5px] border-active-border bg-active-bg text-active-text"
                  : "bg-[#F1EEE7] text-[#8A7A55]"
              }`}
            >
              {telegramConnected ? "✓ ON" : "● OFF"}
            </span>
          </button>
        </div>

        <div>
          <div className="mb-2 pl-1 text-[11px] font-extrabold uppercase tracking-wide text-ink-faint">
            Settings
          </div>
          <div className="overflow-hidden rounded-[18px] bg-white shadow-[0_3px_12px_rgba(20,40,45,0.05)]">
            {SETTINGS_ROWS.map((row, i) => (
              <button
                key={row.to}
                onClick={() => navigate(row.to)}
                className={`flex w-full items-center gap-3 px-4 py-3.5 text-left ${i < SETTINGS_ROWS.length - 1 ? "border-b border-[#F1EEE7]" : ""}`}
              >
                <span className="flex-1 text-[14.5px] font-extrabold text-ink">
                  {row.label}
                </span>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#C0C6C8"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => {
            logout();
            navigate("/welcome", { replace: true });
          }}
          className="flex items-center justify-center gap-2 rounded-2xl bg-salmon-bg2 py-3.5 text-[14.5px] font-extrabold text-salmon-text"
        >
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#B24A3C"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <path d="M16 17l5-5-5-5" />
            <path d="M21 12H9" />
          </svg>
          Log out
        </button>

        <button
          onClick={async () => {
            if (!user?.email) return;
            if (confirm("Are you sure you want to delete your account? This will wipe all your test data permanently.")) {
              setIsDeleting(true);
              try {
                await api.deleteAccount(user.email);
                logout();
                navigate("/welcome", { replace: true });
              } catch (err: any) {
                console.error("Failed to delete account:", err);
                let msg = "Failed to delete account. Please try again.";
                try {
                  const parsed = JSON.parse(err.message);
                  if (parsed.error) msg = parsed.error;
                } catch {
                  // Ignore parse error, use generic message
                }
                alert(msg);
                setIsDeleting(false);
              }
            }
          }}
          disabled={isDeleting}
          className={`flex items-center justify-center gap-2 rounded-2xl border border-salmon-alertBorder bg-transparent py-3 text-[14.5px] font-extrabold text-salmon-text transition-opacity ${isDeleting ? "opacity-50" : "hover:bg-salmon-alertBg"}`}
        >
          {isDeleting ? "Deleting..." : "Delete Account"}
        </button>
      </div>
    </div>
  );
}
