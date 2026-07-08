import TopBar from '../../components/layout/TopBar';
import { useAuth } from '../../lib/auth';
import { useWalletData } from '../../lib/useWalletData';

export default function ConnectedChannels() {
  const { user } = useAuth();
  const { telegramConnected, telegramBotUsername } = useWalletData();
  const code = user?.id ? `conn_${user.id}` : '';

  return (
    <div>
      <TopBar title="Connect Telegram" back />
      <div className="px-5">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-[88px] w-[88px] items-center justify-center rounded-full bg-gradient-to-br from-[#37AEE2] to-[#1E96C8] shadow-[0_14px_26px_-10px_rgba(30,150,200,0.7)]">
            <svg width="46" height="46" viewBox="0 0 24 24" fill="#FFFFFF">
              <path d="M21.9 4.3 18.7 19.4c-.24 1.06-.87 1.32-1.76.82l-4.87-3.59-2.35 2.26c-.26.26-.48.48-.98.48l.35-4.96 9.02-8.15c.39-.35-.08-.54-.61-.19L6.4 13.6l-4.8-1.5c-1.04-.33-1.06-1.04.22-1.54L20.55 3.4c.87-.32 1.63.2 1.35 1.6z" />
            </svg>
          </div>
          <p className="mt-3.5 text-xl font-black text-ink">Manage SubBee in chat</p>
          <p className="mt-1.5 max-w-[280px] text-sm font-semibold leading-relaxed text-ink-muted">
            Get reminders and act on them right where you already chat — no need to open the app.
          </p>
        </div>

        <div className="mt-4.5 flex items-center justify-between rounded-2xl bg-white px-4 py-3.5 shadow-[0_3px_12px_rgba(20,40,45,0.05)]">
          <span className="text-sm font-extrabold text-ink">Telegram</span>
          <span
            className={`rounded-full px-3 py-1.5 text-[11.5px] font-extrabold ${
              telegramConnected ? 'border-[1.5px] border-active-border bg-active-bg text-active-text' : 'bg-[#F1EEE7] text-[#8A7A55]'
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
            className="mt-3.5 flex h-14 items-center justify-center gap-2.5 rounded-full bg-gradient-to-br from-[#37AEE2] to-[#1E96C8] text-base font-black text-white shadow-[0_12px_22px_-10px_rgba(30,150,200,0.85)]"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#FFF">
              <path d="M21.9 4.3 18.7 19.4c-.24 1.06-.87 1.32-1.76.82l-4.87-3.59-2.35 2.26c-.26.26-.48.48-.98.48l.35-4.96 9.02-8.15c.39-.35-.08-.54-.61-.19L6.4 13.6l-4.8-1.5c-1.04-.33-1.06-1.04.22-1.54L20.55 3.4c.87-.32 1.63.2 1.35 1.6z" />
            </svg>
            Open Telegram
          </a>
        )}
        <p className="mt-2 text-center text-xs font-semibold text-ink-faint">
          Opens the SubBee bot with your code pre-applied — nothing to type.
        </p>

        <div className="my-4 flex items-center gap-3">
          <span className="h-px flex-1 bg-[#E7E1D6]" />
          <span className="text-xs font-bold text-ink-faint">or use WhatsApp</span>
          <span className="h-px flex-1 bg-[#E7E1D6]" />
        </div>

        <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3.5 opacity-70 shadow-[0_3px_12px_rgba(20,40,45,0.05)]">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#25D366]">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#FFF">
              <path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.26A10 10 0 1 0 12 2z" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-extrabold text-ink">WhatsApp</div>
            <div className="text-xs font-semibold text-ink-muted">Not yet available</div>
          </div>
        </div>
      </div>
    </div>
  );
}
