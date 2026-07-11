import { useState } from 'react';

export default function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard API unavailable - nothing actionable to do
    }
  };

  return (
    <div className="rounded-xl border border-ink/10 bg-white p-3">
      <div className="text-[10.5px] font-extrabold tracking-wide text-ink-faint">{label}</div>
      <div className="mt-1 flex items-center justify-between gap-3">
        <span className="tabular-nums text-lg font-extrabold tracking-[2px] text-ink">{value}</span>
        <button
          onClick={copy}
          className="shrink-0 rounded-full bg-teal-soft px-3 py-1.5 text-xs font-extrabold text-teal"
        >
          {copied ? 'Copied ✓' : 'Copy'}
        </button>
      </div>
    </div>
  );
}
