# SubBee: Frontend App Pages & UX Flow Specification (v2)

**What this document is:** every screen the SubBee app needs, what lives on each one, what states each screen must handle, and the step by step journeys that connect them. Enough for a frontend agent or engineer to start scaffolding without reverse-engineering decisions from the backend spec.

**What this document deliberately leaves out:** visual styling. That lives in the companion `SubBee-Visual-Design-Spec.md` (v2), which captures the approved mockup's look. Read that one for style, this one for structure and behavior.

**Backend companion:** `SubBee-Implementation-Blueprint.md` is the source of truth for the money model, provider integrations, and backend states. This document references its fields and states (e.g. `kyc_status`, `subscriptions.status`) so frontend and backend share one vocabulary.

**Changed in v2:**
- The whole document now consistently reflects the confirmed 3-tab navigation (Dashboard, Activity, Profile). v1 confirmed it in Section 1 but still described pages as if Card, Subscriptions, and Settings were their own tabs. Section 5 is now organized tab by tab.
- "Dashboard" is the canonical name everywhere (v1 mixed "Home" and "Dashboard").
- The Dashboard page spec now matches the approved mockup's composition: gold balance panel, virtual card block, upcoming payments, subscriptions preview.
- The mockup's best UX pattern, the inline Action Required card, is now specified as a first-class component and placed everywhere it applies (Subscriptions list, Subscription Detail, Dashboard banner).
- Card number/CVV/expiry are explicitly banned from the Dashboard card block; masked reference only, with reveal gated behind re-auth. This corrects the mockup, which shows them inline (see visual spec Section 12 on mockup artifacts), and aligns with blueprint rule 7.7.
- All six UX calls from v1 are marked confirmed.

---

## Table of Contents
1. Confirmed UX Decisions
2. App Structure at a Glance
3. Reusable Functional Components
4. Global Rules That Apply Across Every Page
5. Page by Page Specification (organized by tab)
6. Core UX Flows, Step by Step
7. Backend State to UI State Reference Tables
8. Suggested Build Sequence
9. Out of Scope for This Document

---

## 1. Confirmed UX Decisions

All six were open calls in v1; all are now confirmed by the founder. Recorded here so the reasoning stays visible.

1. **Available vs Reserved wallet balance (CONFIRMED).** When SubBee funds a user's card ahead of a charge, their spendable balance drops before any subscription visibly charges. To keep that from reading as a bug, the wallet balance is presented as a total with a breakdown: **Available** and **Reserved for upcoming payments**. See Flow E.
2. **International pricing display (CONFIRMED).** Catalog merchants with USD pricing show the USD sticker price plus an approximate Naira equivalent ("$15.99, about ₦25,600") and a small note that the final charged amount may vary slightly with the exchange rate. Receipts always show the real, final NGN amount.
3. **Two entry paths into Add Subscription (CONFIRMED).** Card-funded service subscriptions (Netflix, LinkedIn) and transfer-funded custom ones ("pay my landlord ₦50k monthly") are different flows with different inputs, entered as an explicit choice at step one.
4. **Recipient name resolution for transfers (CONFIRMED).** The recurring-transfer path resolves and displays the recipient's account holder name before the user can proceed, the standard Nigerian banking pattern that prevents recurring money going to the wrong account. Engineer to confirm the Nomba lookup endpoint.
5. **In-app parity with the bot's quick actions (CONFIRMED).** The Telegram/WhatsApp reminder buttons `[Pay now] [Skip this cycle] [Pause]` appear identically in-app wherever a charge is actionable, so the app never feels weaker than the bot.
6. **Three-tab navigation (CONFIRMED).** Dashboard, Activity, Profile. Card management, Subscriptions, and the Notification Center are reached from Dashboard; Fund Wallet and Transaction History live under Activity; Settings content lives under Profile.

---

## 2. App Structure at a Glance

```
Onboarding (pre-login stack)
├─ Welcome
├─ Sign Up
├─ Verify Phone/Email (OTP)
├─ Identity Verification (KYC form)
├─ Verification In Progress
└─ Wallet Ready (first-run welcome)

Main App (post-login, 3-tab bar)
│
├─ TAB 1: Dashboard
│   ├─ Dashboard (balance panel, virtual card block, upcoming payments, subscriptions preview)
│   ├─ Notification Center (opened from the header bell)
│   ├─ Subscriptions
│   │   ├─ Subscriptions List
│   │   ├─ Add Subscription (multi-step, two paths)
│   │   ├─ Subscription Detail
│   │   └─ Edit Subscription
│   └─ Card
│       ├─ Get a Card (empty state)
│       ├─ Set Card PIN
│       ├─ Card Creating
│       ├─ Card Management
│       ├─ Reveal Card Details
│       └─ Card Status Alert (frozen / delete-warned / deleted)
│
├─ TAB 2: Activity
│   ├─ Fund Wallet
│   ├─ Transaction History (the tab's landing view)
│   └─ Transaction Detail
│
└─ TAB 3: Profile
    ├─ Profile overview (account info, KYC badge; the tab's landing view)
    ├─ Connected Channels (Telegram / WhatsApp)
    ├─ Notification Preferences
    ├─ Security
    ├─ Help & Support
    └─ Legal
```

Cross-tab deep links are expected and fine: for example, "Add Money" on the Dashboard jumps straight to Activity's Fund Wallet screen, and a low-balance alert deep-links there with the shortfall pre-filled. The tab bar defines where screens *live*, not the only way to reach them.

---

## 3. Reusable Functional Components

Build these once. Nearly every page uses at least one. Described functionally; their visual treatment is in the visual spec (Section 7 there maps one-to-one onto this list).

| Component | Purpose | Used on |
|---|---|---|
| Balance panel | The hero money display: total balance with the Available / Reserved breakdown | Dashboard, Fund Wallet |
| Virtual card block | Compact card summary: label, card balance, one-line security note, masked reference (last 4 only, never full number/CVV), tap-through to Card Management | Dashboard, Card Management |
| Status chip | Small pill showing a state word (Active, Paused, Insufficient Funds, Frozen, Pending) | Subscription rows, Card Management, Transaction rows |
| Action Required card | The inline recovery pattern: soft alert card containing the problem heading, plain-language explanation with exact numbers, the virtual account number, and fix-it buttons, all in one place | Subscriptions List (inline expansion), Subscription Detail, Dashboard banner slot |
| Alert banner | Slim persistent strip for cross-tab attention items, tapping opens the relevant screen | Dashboard |
| Quick-action row | Pay now / Skip this cycle / Pause as tappable buttons | Dashboard upcoming items, Notification Center entries, Subscription Detail |
| Section header with timing tag | Section title plus a small right-aligned timing chip (e.g. "T-3 days") | Dashboard upcoming payments, anywhere a section has a timeframe |
| Stepper / wizard shell | Multi-step form with back/next and progress | Add Subscription, Identity Verification |
| PIN pad | 4-digit masked numeric entry | Set Card PIN, Reveal Card Details re-auth |
| OTP input | Segmented code entry | Verify Phone/Email |
| Copyable field | Text with a copy button (share where useful) | Fund Wallet and Action Required cards (account number), Card Management (masked reference) |
| Progress-to-limit indicator | Spend against a ceiling with the used/total readout | Card Management ($1,500/month headroom), Add Subscription card path |
| Empty state block | Message plus primary CTA (plus mascot slot, per visual spec) | Subscriptions List, Activity, Card area pre-card, Notification Center |
| Skeleton loader | Placeholder shimmer for any data screen while loading | All data screens |
| Confirmation bottom sheet | "Are you sure?" before destructive or irreversible actions | Cancel Subscription, Unload Card, Freeze Card |

---

## 4. Global Rules That Apply Across Every Page

- **Money formatting.** Backend stores integer kobo; the app never does float math with money. Always format as Naira with thousands separators and two decimals (₦12,500.00), converting from kobo only at display time. This rule exists partly because the mockup itself contains a malformed amount ("₦1,395007") that must not be reproduced; formatting is code-enforced, never hand-typed.
- **Every data screen has three extra states** beyond loaded-with-data: loading (skeleton), empty (first-time user), error (retry action). Assumed everywhere below; not repeated per page.
- **Every notification deep-links somewhere specific** (mapping table in Section 7.5), never just to a generic list.
- **Unresolved alerts persist on the Dashboard** regardless of which tab the user is on. Low balance, KYC needs attention, card status problem: all surface in the Dashboard banner slot until resolved.
- **KYC and card status are independent.** The wallet works (deposits, balance) even while identity verification is pending or in manual review. Only card creation is gated on `kyc_status = 'verified'`. Never block the whole app on KYC.
- **Every backend status change produces a visible trace** in the Notification Center. Subscriptions pausing themselves, cards freezing, funding failures: nothing changes silently.
- **Full card details never render outside the Reveal flow.** The Dashboard and Card Management show last 4 digits only. Number, CVV, and expiry appear solely on Reveal Card Details, behind re-auth, fetched fresh, auto-hidden. (Blueprint rule 7.7; the mockup's on-dashboard card fields are an image artifact to be corrected, not copied.)
- **Consistent verbs through a flow.** The button that says "Top Up Wallet" produces a confirmation about topping up, not "deposit successful." An action keeps its name from button to toast to notification.

---

## 5. Page by Page Specification

### 5.1 Onboarding (pre-login)

#### 5.1.1 Welcome
- **Purpose:** states what SubBee does in one glance.
- **Shows:** value proposition, primary CTA into Sign Up, secondary "I already have an account" login path. (Good home for the mascot and meadow illustration at full warmth; see visual spec.)

#### 5.1.2 Sign Up
- **Shows:** phone and/or email input, password or OTP-only auth (engineer's call).
- **Leads to:** Verify Phone/Email.

#### 5.1.3 Verify Phone/Email (OTP)
- **Shows:** OTP input, resend with cooldown timer.
- **States:** wrong code (inline error, form not cleared), expired code (resend prompt).

#### 5.1.4 Identity Verification (KYC form)
- **Purpose:** one form serving two backend consumers (Nomba's BVN field and Bridgecard's cardholder KYC). The user should never feel like two identity checks.
- **Shows:** BVN or NIN (a choice, not both), full name, date of birth, address with State and a dependent LGA dropdown plus postal code, phone/email pre-filled, selfie capture (camera or upload).
- **States:** inline per-field validation, especially BVN/NIN length and LGA validity for the chosen State.
- **Leads to:** submit proceeds immediately to Wallet Ready. Identity verification resolves in the background (Flow A); the user is never parked on a waiting screen.

#### 5.1.5 Verification In Progress *(only if the user checks status before it resolves)*
- **Shows:** plain explanation that checks are running, usually automatic, occasionally up to 24 hours if manually reviewed, plus reassurance the wallet already works.
- **States:** `pending`, `manual_review`, `failed` (retry button with a short cooldown after each attempt; retries are rate-limited server-side to once per minute).

#### 5.1.6 Wallet Ready (first-run welcome)
- **Purpose:** the "this actually works" moment: the personal virtual account number, ready immediately.
- **Shows:** account number, bank name, account name (copyable field), one-line explainer ("send money here from any bank app; it lands in your SubBee wallet within seconds"), CTA into Dashboard.

---

### 5.2 TAB 1: Dashboard

#### 5.2.1 Dashboard
- **Purpose:** the single screen that answers "where do I stand?" Composition follows the approved mockup top to bottom:
  1. **Header:** notification bell (opens Notification Center, unread indicator) and settings gear (jumps to Profile tab's settings screens).
  2. **Balance panel (hero):** total balance large, with the Available / Reserved breakdown directly beneath or one tap away. The hero number is the user's total money in SubBee; Reserved is the slice already earmarked for imminent charges. The number must never appear to shrink without the breakdown explaining where the money went.
  3. **Virtual card block,** overlapping the balance panel (the signature layout detail; visual spec Section 4): card label, card balance (₦0.00 is the normal state), the one-line security note explaining funds move to the card only when a bill is due, masked last-4 reference. Tapping opens Card Management. If no card exists yet, this block becomes the Get a Card entry point instead.
  4. **Alert banner slot:** appears only when something needs attention: low balance ahead of a charge, KYC needs retry, card status problem. Persists until resolved.
  5. **Upcoming payments:** section header with timing tag ("T-3 days" when the nearest charge is three days out), listing the next two or three charges with merchant, date, amount, and the quick-action row where a charge is actionable. When everything is covered, a calm one-liner says so ("All upcoming subscriptions fully covered," per the mockup).
  6. **My Subscriptions preview:** the first few subscription rows with status chips, and a "see all" opening the full Subscriptions List.
  7. **Empty states:** brand-new user sees a friendly prompt to add money and a CTA to add a first subscription instead of blank sections.
- **Primary CTA:** Add Money, deep-linking to Activity's Fund Wallet.

#### 5.2.2 Notification Center
- **Purpose:** the in-app mirror of everything SubBee says over WhatsApp/Telegram/push: reminders, receipts, low-balance alerts, card status changes, KYC updates.
- **Shows:** reverse-chronological list, unread indicators, every entry deep-linking per the Section 7.5 table, and where relevant the quick-action row inline (a reminder entry carries Pay now / Skip / Pause directly, no need to open the subscription first).
- **States:** empty state for new users.

#### 5.2.3 Subscriptions List
- **Purpose:** the core "what am I paying for" view. Reached from the Dashboard's subscriptions preview.
- **Shows:** all subscriptions, filterable or grouped by status, each row: merchant/recipient logo, name, amount, next charge date, status chip.
- **The inline Action Required pattern (from the mockup, keep exactly):** a subscription in `insufficient_funds` expands its row in place into the Action Required card: warning heading, "Top up ₦350 to unblock this subscription" with the exact shortfall, the bill/wallet/top-up breakdown, the virtual account number right there, and two buttons (Copy Account Number, Top Up Wallet). The user fixes the problem without leaving the list. This is the single best UX moment in the product; it must survive implementation intact.
- **States:** empty state with CTA into Add Subscription.

#### 5.2.4 Add Subscription (multi-step)
Step one is an explicit choice between two paths:

**Path A: Subscribe to a service** (card-funded)
1. Choose from a searchable merchant catalog (Netflix, LinkedIn, DSTV, and so on) or enter a custom service name
2. Amount: catalog merchants with USD pricing show "$15.99, about ₦25,600" with the may-vary note; local/custom ones take NGN directly
3. Interval (weekly, monthly, quarterly, yearly, custom with its own recurrence prompt) and first-charge date
4. Reminder lead time (default 3 days, matching the backend's `reminder_days_before` default and the mockup's T-3 tag) and the auto-fund vs ask-first toggle (ask-first waits for the user's Pay now tap each cycle)
5. No card yet? Branch into the Get a Card flow (5.2.7), then return here with progress kept
6. If this subscription's expected amount would push the card past the $1,500/month international ceiling, block at this step with a plain explanation rather than letting it surface later as a mystery decline
7. Review screen, then confirm
8. Return to Subscriptions List, new item visible with its next charge date

**Path B: Set up a recurring transfer** (bank-transfer-funded, no card: rent, bills, sending someone money regularly)
1. Recipient bank details: bank, account number, then resolve and display the account holder's name before the user can proceed
2. Amount, interval, first-transfer date
3. Reminder lead time
4. Review, confirm, return to list

#### 5.2.5 Subscription Detail
- **Shows:** merchant/recipient, amount, interval, next charge date, status chip, per-subscription charge history (mini receipts), and the quick-action row. Only show actions valid for the current status and timing (Section 7.3): Pay now and Skip this cycle appear specifically when a charge is imminent (inside the reminder window), not as permanent options weeks ahead.
- **States:** `insufficient_funds` shows the same Action Required card as the list (exact shortfall, account number, fix-it buttons) plus the reassurance that payment resumes automatically the moment the wallet covers it, no manual retry needed. `paused` after missed cycles shows a plain reason and one-tap Resume.

#### 5.2.6 Edit Subscription
- **Shows:** the creation fields (amount, interval, reminder timing, auto-fund toggle) editable, with a review-before-save step for anything changing the next charge date or amount.

#### 5.2.7 Get a Card (empty state)
- **Purpose:** what the card area shows before a card exists; explains rather than looking broken.
- **Shows:** a card is created automatically the first time a subscription needs one, plus a proactive "get one now" option.
- **States:** if `kyc_status` isn't `verified`, say so plainly here with expected timing, since card creation is gated on it.

#### 5.2.8 Set Card PIN
- **Shows:** PIN pad, entered twice to confirm. Treat as sensitive input: masked, no autofill, no clipboard suggestions. (Encryption before transport is a backend concern.)

#### 5.2.9 Card Creating
- **Shows:** brief pending state. Usually seconds; must not look broken if it takes longer.

#### 5.2.10 Card Management
- **Purpose:** the card hub once one exists (mockup screen 4).
- **Shows:**
  - Masked reference (last 4 only) and status chip (Active / Frozen / Delete Warning)
  - Card balance, with the note that low or zero between charges is normal by design (the card is deliberately kept near-empty and funded just-in-time)
  - **International Spending Headroom:** the progress-to-limit indicator, "$650 used out of $1,500 monthly limit" with the fraction, warning treatment past 80 percent
  - Actions: **Top Up** (fund from wallet), **Freeze / Unfreeze**, **Card Details** (opens Reveal), **Unload to wallet**. Note: the mockup labels the caution button here "Pause Sub," which belongs to subscriptions; on this screen the caution action is Freeze Card. Treat the mockup label as an artifact.
  - Transient state: an in-progress indicator while a manual top-up is mid-flight (mirrors `pending_transfers`), resolving to confirmation or a clear failure notice.

#### 5.2.11 Reveal Card Details
- **Purpose:** the only place full card number, CVV, and expiry ever appear. Fetched fresh every time, never stored.
- **Flow:** re-authenticate (PIN or biometric) > brief loading while details are fetched live > details shown with an auto-hide timer and per-field copy buttons > a short trust note that details are never stored and are fetched fresh each time.

#### 5.2.12 Card Status Alert
One flexible screen/banner pattern for the three danger states:
- **Frozen** (after repeated declines): paused for the user's protection, what triggered it, and that topping up and confirming reactivates it.
- **Delete warning** (advance notice before the issuer auto-deletes an inactive or repeatedly failing card): what happens and by when, one-tap "keep it active."
- **Deleted:** plainly stated, any remaining balance already returned to the wallet, easy path to create a new card.

---

### 5.3 TAB 2: Activity

#### 5.3.1 Transaction History (tab landing view)
- **Purpose:** full record of the user's money events.
- **Shows:** reverse-chronological rows: type (deposit, subscription payment, refund), counterparty (bank sender for deposits, merchant for charges), amount, date, status chip. Prominent Add Money button opening Fund Wallet.
- **Data decision, not aesthetic:** internal plumbing ("funded card," "sweep-back") is never shown as line items. Users see only money in and subscriptions charged. Flow E explains why.
- **States:** filters by type and date range; empty state for new users.

#### 5.3.2 Fund Wallet
- **Purpose:** exactly how to add money.
- **Shows:** account number, bank name, account name (copyable field), optionally a QR code, a "what happens next" line (reflects within seconds, confirmation will be sent).
- **States:** when reached from a low-balance alert (Flow F), the specific shortfall amount is pre-highlighted, not a blank screen.

#### 5.3.3 Transaction Detail
- **Shows:** amount, date/time, type, related subscription if any (tappable through to Subscription Detail), status.

---

### 5.4 TAB 3: Profile

#### 5.4.1 Profile overview (tab landing view)
- **Shows:** name, contact details, KYC status badge (same plain-language states as 5.1.5), and entry points into the screens below.

#### 5.4.2 Connected Channels
- **Purpose:** link Telegram and/or WhatsApp so reminders and chat management work there. Chat-based management is part of the core pitch; this must be easy to find and finish.
- **Shows:** Telegram: status, and a Connect action that opens Telegram straight to the SubBee bot with a linking code pre-applied. WhatsApp: status, and instructions to send a starter message to the SubBee number (no code deep link exists on WhatsApp).
- **States:** connected / not connected / pending, per channel independently.

#### 5.4.3 Notification Preferences
- **Shows:** channel toggles (push, SMS fallback, WhatsApp, Telegram), per category (reminders, receipts). Security-critical alerts always on, not user-disableable.

#### 5.4.4 Security
- **Shows:** change/reset card PIN, biometric login toggle, active sessions and logout, two-factor auth if applicable.

#### 5.4.5 Help & Support
- **Shows:** FAQ, contact support.

#### 5.4.6 Legal
- **Shows:** Terms, Privacy Policy, and a brief plain statement of how customer funds are held. The blueprint (Section 9) flags fund custody as a real regulatory matter; an honest line here is good practice before real money.

---

## 6. Core UX Flows, Step by Step

### Flow A: First-Time Onboarding
1. Welcome > Sign Up > OTP verification
2. Identity form submitted once (feeds both Nomba's BVN field and Bridgecard's KYC)
3. Straight to Wallet Ready; the account number shows immediately, never blocked on verification
4. In the background, KYC resolves to verified / manual_review / failed, surfaced as a Profile badge and a Dashboard banner only if it needs the user (a `failed` retry)
5. Lands on Dashboard with ₦0 and a clear Add Money CTA

### Flow B: Funding the Wallet
1. Add Money (Dashboard or Activity) opens Fund Wallet
2. User sends a bank transfer to the shown number from any banking app, outside SubBee
3. Within seconds the balance updates (in real time or on next screen focus) and a confirmation lands in the Notification Center
4. If the deposit was prompted by a low-balance alert, the Dashboard banner clears, and any payment blocked on insufficient funds proceeds automatically (Flow F)

### Flow C: Getting & Setting Up a Card
1. Triggered proactively (Get a Card) or automatically when Add Subscription Path A needs one
2. Blocked with a plain message if `kyc_status` isn't `verified`
3. Set PIN > Card Creating (brief) > Card Management, active
4. Card starts at ₦0 by design; it's funded just before charges (Flow E), never upfront

### Flow D: Adding a Subscription
Fully specified in 5.2.4. The one flow-level rule: this is the product's core action, so keep the stepper short and the review step clear; no unnecessary screens between intent and confirmation.

### Flow E: The Charge Cycle, From the User's Side
Where the backend's async funding model needs deliberate UX, or it looks like bugs:
1. Reminder arrives (Dashboard, Notification Center, and the user's chosen channels) days before the charge: merchant, amount, date
2. Shortly before the charge, SubBee moves money from wallet to card behind the scenes. This is where Available vs Reserved earns its keep: Available drops, Reserved rises by the same amount, the total holds steady, nothing looks like it vanished
3. The merchant charges the card on its own schedule, not necessarily instantly. On confirmation, a receipt appears: the first and only Activity line item for the cycle. The earlier card-funding step is never a separate visible transaction; from the user's perspective there was one payment, the subscription
4. Any leftover buffer (SubBee funds slightly over the estimate to absorb exchange-rate movement, then sweeps back the unused part) quietly returns from Reserved to Available. A balance true-up, not a visible transaction

### Flow F: Low Balance & Missed Payment Recovery
Maps one-to-one onto the blueprint's Section 8 policy. The backend already behaves this way; the frontend's job is to represent it faithfully:
1. Days before a charge, if the wallet won't cover it, the reminder itself becomes a low-balance alert with the exact shortfall and a direct path to Fund Wallet (amount pre-filled)
2. On the charge date, still short: no charge is attempted, protecting the user from decline fees. The subscription shows Insufficient Funds (list and detail), with the inline Action Required card offering the account number and fix-it buttons. Copy makes clear that topping up is the only action needed; payment resumes automatically on the next covering deposit
3. After two missed cycles the subscription pauses itself. Shown plainly as a status, not an error, with one-tap Resume
4. Every step above leaves a Notification Center entry. Nothing changes without a trace

### Flow G: Card Danger States
1. Repeated insufficient-funds declines lead to an automatic freeze before deletion would occur; the user sees the frozen variant explaining why and the fix
2. Extended inactivity or continued failures produce an advance delete-warning: clear deadline, one action to keep the card alive
3. If deletion happens, the deleted variant states it plainly, confirms the remaining balance is already back in the wallet, and offers a new card

### Flow H: Connecting Telegram / WhatsApp
1. Profile > Connected Channels > Connect Telegram
2. The app opens Telegram to the SubBee bot with the linking code pre-applied; nothing to type
3. The bot confirms server-side; the app reflects Connected without a manual refresh
4. WhatsApp: the user sends a short starter message to the shown SubBee number; the account links by matching the number

---

## 7. Backend State to UI State Reference Tables

### 7.1 KYC Status (`users.kyc_status`)

| Backend value | What the user sees | What's blocked |
|---|---|---|
| `none` | Not user-visible; becomes `pending` on form submit | Nothing |
| `pending` | "Verifying your identity (usually just a few minutes)" | Card creation only |
| `manual_review` | "Still checking; can take up to 24 hours. Your wallet works as normal meanwhile." | Card creation only |
| `verified` | Verified badge on Profile; no banners | Nothing |
| `failed` | Dashboard banner plus Profile badge with retry guidance | Card creation; retry button cools down between attempts |

### 7.2 Card Status (`card_accounts.status`)

| Backend value | What the user sees | Available actions |
|---|---|---|
| `creating` | Brief pending state | None yet |
| `active` | Normal Card Management | Reveal details, freeze, top up, unload |
| `frozen` | Card Status Alert, frozen variant | Top up wallet to trigger reactivation |
| `delete_warned` | Card Status Alert, delete-warning variant | One-tap keep active |
| `deleted` | Card Status Alert, deleted variant | Create a new card |

### 7.3 Subscription Status (`subscriptions.status`)

| Backend value | What the user sees | Available actions |
|---|---|---|
| `active` | Active chip; next charge date | Pause, Edit, Cancel anytime; Pay now / Skip appear only inside the reminder window |
| `insufficient_funds` | Chip plus the inline Action Required card with the exact shortfall | Copy account number, Top Up Wallet; resolves automatically once funded |
| `paused` | Paused chip, with the reason if auto-paused | Resume |
| `cancelled` | Cancelled chip; kept in history, not deleted | Create a new subscription (no un-cancel) |

### 7.4 Card Funding / Transfer Status (`pending_transfers.status`)
Mostly invisible; surfaces only as a transient state:

| Backend value | What the user sees |
|---|---|
| `requested` | In-progress indicator on Card Management for manual top-ups; otherwise folded into Flow E invisibly |
| `confirmed` | Resolves to normal, or a receipt |
| `failed` | Brief clear notice plus a Notification Center entry; wallet unaffected since the reservation reverses |
| `timed_out` | Same as failed to the user; the backend's reconciliation resolves it, never the user |

### 7.5 Notification to Deep Link Mapping

| Notification type | Deep-links to |
|---|---|
| Upcoming charge reminder | Subscription Detail (quick actions inline) |
| Low balance alert | Fund Wallet (shortfall pre-filled) |
| Payment receipt | Transaction Detail |
| Card status change | Card Management or the relevant Card Status Alert |
| KYC status update | Profile |
| Subscription auto-paused | Subscription Detail |

---

## 8. Suggested Build Sequence

Paced against the blueprint's backend milestones (M0 through M4) so the two sides land together:

- **Alongside M0/M1 (skeleton, deposits):** Onboarding, Dashboard (balance panel, banner slot, empty states), Fund Wallet, Transaction History. Fully demoable as soon as deposits work.
- **Alongside M2 (card, funding):** the Card screens (5.2.7 through 5.2.12) and the Dashboard's virtual card block.
- **Alongside M3 (subscription loop):** Subscriptions List/Add/Detail/Edit, upcoming payments on the Dashboard, reminders, Notification Center.
- **Alongside M4 (trust layer):** wire the recovery and danger-state flows end to end. The screens themselves can be built earlier against mocked states so design and development never block on backend sequencing.

---

## 9. Out of Scope for This Document

- **Visual styling.** Colors, type, shape, motif, spacing: all in `SubBee-Visual-Design-Spec.md` (v2).
- **Final copywriting.** Wording above is illustrative of tone and content, not final text. The visual spec's Section 11 carries the open copy questions ("Total Liquidity" vs "Total Balance," and so on).
- **Admin/internal tooling.** The reconciliation dashboard from the blueprint's build order is a separate internal surface.
- **Exact API shapes.** Those live in the blueprint and the provider docs it links. This document specifies what data each screen needs conceptually, not how to fetch it.
