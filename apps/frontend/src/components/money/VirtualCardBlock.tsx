import { useNavigate } from "react-router-dom";
import { formatNaira } from "../../lib/format";

type CardStatus = "inactive" | "active" | "frozen" | "creating";

export default function VirtualCardBlock({
  status,
  balanceKobo,
  last4,
  overlap = true,
}: {
  status: CardStatus;
  balanceKobo?: number;
  last4?: string;
  overlap?: boolean;
}) {
  const navigate = useNavigate();

  if (status === "inactive") {
    return (
      <button
        onClick={() => navigate("/app/card")}
        className={`teal-card-gradient relative block w-full overflow-hidden rounded-[22px] p-6 text-left text-[#E6EFEE] shadow-[0_18px_34px_-16px_rgba(10,30,30,0.85)] ${overlap ? "-mt-10" : ""}`}
      >
        <div className="relative z-10 flex flex-col">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-extrabold tracking-wide text-teal-soft3">
              VIRTUAL CARD
            </span>
            <div className="flex h-8 w-12 items-center justify-center rounded-lg bg-white/10">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-teal-soft3/70"
              >
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
            </div>
          </div>
          <p className="mt-4 text-[22px] font-black text-white leading-none">
            No card yet
          </p>
          <p className="mt-3 text-[13px] font-medium leading-relaxed text-teal-softText">
            A secure virtual Mastercard is created automatically when a
            subscription needs one — or you can get yours right now.
          </p>
          <div className="mt-6">
            <span className="flex w-full items-center justify-center gap-2 rounded-[14px] bg-[#E7B84F] px-4 py-3.5 text-[14.5px] font-extrabold tracking-wide text-[#3B2C12] shadow-[0_4px_14px_rgba(231,184,79,0.25)] transition-transform hover:scale-[1.02]">
              Get Virtual Card
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="opacity-80"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </span>
          </div>
        </div>
      </button>
    );
  }

  const statusChip =
    status === "frozen"
      ? { label: "❄ FROZEN", className: "bg-salmon-bg2/30 text-salmon-bg" }
      : status === "creating"
        ? { label: "… CREATING", className: "bg-white/10 text-teal-softText" }
        : {
            label: "✓ ACTIVE",
            className: "bg-[rgba(156,192,165,0.22)] text-[#B6E0BE]",
          };

  return (
    <button
      onClick={() => navigate("/app/card")}
      className={`teal-card-gradient relative block w-full  rounded-[22px]  ${overlap ? "-mt-10" : ""}`}
    >
      <img
        src="/illustrations/subbee-logo.png"
        alt=""
        className="pointer-events-none absolute z-10 -top-[30px] right-[-14px] h-[110px] w-[120px] object-contain opacity-[0.92]"
      />
      <div
        className={`teal-card-gradient relative block w-full overflow-hidden rounded-[22px] px-5 py-[18px] text-left text-[#E6EFEE] shadow-[0_18px_34px_-16px_rgba(10,30,30,0.85)]`}
      >
        <div className="relative flex items-center justify-between">
          <span className="flex items-center gap-2 text-[13px] font-extrabold tracking-wide text-teal-soft3">
            VIRTUAL CARD
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-extrabold ${statusChip.className}`}
            >
              {statusChip.label}
            </span>
          </span>
        </div>
        <div className="mt-2 flex items-end gap-2">
          <span className="tabular-nums text-3xl font-black leading-none text-white">
            {formatNaira(balanceKobo ?? 0)}
          </span>
        </div>
        <div className="mt-2.5 flex items-start gap-2 rounded-xl bg-black/15 px-2.5 py-2">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#9FC4C3"
            strokeWidth="2.2"
            className="mt-0.5 shrink-0"
          >
            <rect x="4" y="11" width="16" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
          <span className="text-[11.5px] font-semibold leading-snug text-teal-softText">
            Kept low by design. SubBee funds your card automatically the moment
            a bill is due.
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[15px] font-bold tracking-[2.5px] text-[#D8E7E6]">
            •••• •••• •••• {last4 ?? "····"}
          </span>
          <span className="text-xs font-extrabold text-teal-soft3">
            Reveal ›
          </span>
        </div>
      </div>
    </button>
  );
}
