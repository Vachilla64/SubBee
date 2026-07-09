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
  balanceKobo?: bigint;
  last4?: string;
  overlap?: boolean;
}) {
  const navigate = useNavigate();

  if (status === "inactive") {
    return (
      <div className={`relative flex flex-col items-center overflow-hidden rounded-[22px] border-2 border-dashed border-[#C4B58C] bg-[#F7F1E2] p-[22px] px-5 text-center ${overlap ? "-mt-4" : ""}`}>
        <div className="flex h-10 w-[60px] items-center justify-center rounded-md border-2 border-dashed border-[#C4B58C]" style={{ background: 'repeating-linear-gradient(135deg,rgba(196,181,140,0.16) 0 6px,transparent 6px 12px)' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#B49A55" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        </div>
        <div className="mt-3 text-[16px] font-black text-ink tracking-tight">No virtual card yet</div>
        <div className="mt-1.5 max-w-[250px] text-[12.5px] font-semibold leading-[1.45] text-[#8A7A55]">
          Create a free virtual card so SubBee can pay your bills automatically the moment they're due.
        </div>
        <button
          onClick={() => navigate("/app/card")}
          className="mt-[14px] flex w-full items-center justify-center gap-2 rounded-full p-[13px] text-[14px] font-black text-[#3A2A0E] shadow-[0_10px_20px_-8px_rgba(197,148,64,0.75)] transition-transform active:scale-95"
          style={{ background: 'linear-gradient(165deg,#F2CE7C,#E7B84F)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3A2A0E" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2.5"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
          Get a Card
        </button>
        <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-bold text-[#9AA3A6]">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9AA3A6" strokeWidth="2.4"><rect x="4" y="11" width="16" height="10" rx="2"></rect><path d="M8 11V7a4 4 0 0 1 8 0v4"></path></svg>
          Takes under a minute · you'll set a card PIN
        </div>
      </div>
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
