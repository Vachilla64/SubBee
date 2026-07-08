export interface SubscriptionLike {
  amountKobo: number;
  billingDay: number;
  isActive: boolean;
}

/** Money always renders through here — never hand-format kobo inline. */
export function formatNaira(kobo: number): string {
  return '₦' + (kobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Next occurrence of a day-of-month billing date, rolling to next month if it's already passed. */
export function nextChargeDate(billingDay: number, from: Date = new Date()): Date {
  const candidate = new Date(from.getFullYear(), from.getMonth(), billingDay);
  candidate.setHours(0, 0, 0, 0);
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  if (candidate < today) candidate.setMonth(candidate.getMonth() + 1);
  return candidate;
}

export function daysUntil(date: Date, from: Date = new Date()): number {
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  return Math.round((date.getTime() - today.getTime()) / 86_400_000);
}

export function formatShortDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}

/**
 * There's no `subscriptions.status` column in the backend — only `is_active`. Insufficient-funds
 * is derived here (not fabricated): a sub is short if the wallet can't currently cover its own
 * bill amount. Checked per-row rather than cumulatively across all active subs, since the backend
 * has no reservation/allocation order to reason about.
 */
export function shortfallKobo(sub: SubscriptionLike, walletBalanceKobo: number): number {
  if (!sub.isActive) return 0;
  return Math.max(0, sub.amountKobo - walletBalanceKobo);
}

export function isInsufficientFunds(sub: SubscriptionLike, walletBalanceKobo: number): boolean {
  return shortfallKobo(sub, walletBalanceKobo) > 0;
}

const SOURCE_TYPE_LABEL: Record<string, string> = {
  deposit: 'Wallet Top-up',
  card_funding_reversal: 'Top-up refunded',
  card_unload: 'Card balance returned',
  refund: 'Refund',
  adjustment: 'Balance adjustment',
  float_topup: 'Float top-up',
  maintenance_fee: 'Maintenance fee',
};

export function transactionLabel(sourceType: string): string {
  return SOURCE_TYPE_LABEL[sourceType] ?? sourceType.replace(/_/g, ' ');
}

/**
 * `card_funding` is the wallet-to-card money movement that happens ahead of a charge — the spec
 * (AGENTS.md's Activity data-decision rule) is explicit that this internal step must never show as
 * a user-facing line item, only the deposit that funded it and the eventual subscription charge.
 */
export function isUserFacingTransaction(sourceType: string): boolean {
  return sourceType !== 'card_funding';
}
