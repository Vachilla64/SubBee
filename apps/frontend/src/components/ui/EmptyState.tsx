import type { ReactNode } from "react";

export default function EmptyState({
  title,
  message,
  cta,
  mascot = "/illustrations/bee-waiting.png",
}: {
  title: string;
  message: string;
  cta?: ReactNode;
  mascot?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card bg-white p-8 text-center shadow-[0_3px_12px_rgba(20,40,45,0.05)]">
      <img src={mascot} alt="" className="h-20 w-20 object-contain" />
      <p className="text-base font-extrabold text-ink">{title}</p>
      <p className="text-sm font-semibold text-ink-muted">{message}</p>
      {cta && <div className="mt-2">{cta}</div>}
    </div>
  );
}
