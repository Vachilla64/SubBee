import TopBar from '../../components/layout/TopBar';
import { useAuth } from '../../lib/auth';
import { useWalletData } from '../../lib/useWalletData';

export default function ConnectedChannels() {
  const { user } = useAuth();
  const { telegramConnected, telegramBotUsername } = useWalletData();
  const code = user?.id ? `conn_${user.id}` : '';

  return (
    <div>
      <TopBar title="Alert Channels" back />
      <div className="px-5 space-y-8">

        {/* ── Telegram ── */}
        <section>
          <div className="flex flex-col items-center text-center mb-4">
            <div className="flex h-[80px] w-[80px] items-center justify-center rounded-full bg-gradient-to-br from-[#37AEE2] to-[#1E96C8] shadow-[0_14px_26px_-10px_rgba(30,150,200,0.7)]">
              <svg width="42" height="42" viewBox="0 0 24 24" fill="#FFFFFF">
                <path d="M21.9 4.3 18.7 19.4c-.24 1.06-.87 1.32-1.76.82l-4.87-3.59-2.35 2.26c-.26.26-.48.48-.98.48l.35-4.96 9.02-8.15c.39-.35-.08-.54-.61-.19L6.4 13.6l-4.8-1.5c-1.04-.33-1.06-1.04.22-1.54L20.55 3.4c.87-.32 1.63.2 1.35 1.6z" />
              </svg>
            </div>
            <p className="mt-3 text-lg font-black text-ink">Telegram</p>
            <p className="mt-1 max-w-[280px] text-sm font-semibold leading-relaxed text-ink-muted">
              Get bill reminders and approve payments right in Telegram.
            </p>
          </div>

          <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3.5 shadow-[0_3px_12px_rgba(20,40,45,0.05)]">
            <span className="text-sm font-extrabold text-ink">Telegram</span>
            <span
              className={`rounded-full px-3 py-1.5 text-[11.5px] font-extrabold ${
                telegramConnected
                  ? 'border-[1.5px] border-active-border bg-active-bg text-active-text'
                  : 'bg-[#F1EEE7] text-[#8A7A55]'
              }`}
            >
              {telegramConnected ? '✓ Connected' : '● Not connected'}
            </span>
          </div>

          {!telegramConnected && (
            <a
              href={`https://t.me/${telegramBotUsername}?start=${code}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex h-14 items-center justify-center gap-2.5 rounded-full bg-gradient-to-br from-[#37AEE2] to-[#1E96C8] text-base font-black text-white shadow-[0_12px_22px_-10px_rgba(30,150,200,0.85)]"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#FFF">
                <path d="M21.9 4.3 18.7 19.4c-.24 1.06-.87 1.32-1.76.82l-4.87-3.59-2.35 2.26c-.26.26-.48.48-.98.48l.35-4.96 9.02-8.15c.39-.35-.08-.54-.61-.19L6.4 13.6l-4.8-1.5c-1.04-.33-1.06-1.04.22-1.54L20.55 3.4c.87-.32 1.63.2 1.35 1.6z" />
              </svg>
              Open Telegram
            </a>
          )}
          <p className="mt-2 text-center text-xs font-semibold text-ink-faint">
            Opens the SubBee bot with your code pre-applied - nothing to type.
          </p>
        </section>

        {/* ── WhatsApp ── */}
        <section>
          <div className="flex flex-col items-center text-center mb-4">
            <div className="flex h-[80px] w-[80px] items-center justify-center rounded-[22px] shadow-[0_14px_26px_-10px_rgba(37,211,102,0.5)] overflow-hidden">
              <img src="/icons/whatsapp.png" alt="WhatsApp" className="w-full h-full object-cover" />
            </div>
            <p className="mt-3 text-lg font-black text-ink">WhatsApp</p>
            <p className="mt-1 max-w-[280px] text-sm font-semibold leading-relaxed text-ink-muted">
              Prefer WhatsApp? Get your bill reminders sent there instead.
            </p>
          </div>

          <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3.5 shadow-[0_3px_12px_rgba(20,40,45,0.05)]">
            <span className="text-sm font-extrabold text-ink">WhatsApp</span>
            {/* WhatsApp backend integration is coming - preview only */}
            <span className="rounded-full px-3 py-1.5 text-[11.5px] font-extrabold bg-[#F1EEE7] text-[#8A7A55]">
              Coming soon
            </span>
          </div>

          <button
            disabled
            className="mt-3 flex h-14 w-full items-center justify-center gap-2.5 rounded-full bg-[#25D366] text-base font-black text-white opacity-40 cursor-not-allowed"
          >
            <img src="/icons/whatsapp.png" alt="" className="w-5 h-5 rounded-[4px] object-cover" />
            Connect WhatsApp
          </button>
          <p className="mt-2 text-center text-xs font-semibold text-ink-faint">
            WhatsApp alerts are on our roadmap - stay tuned.
          </p>
        </section>

      </div>
    </div>
  );
}
