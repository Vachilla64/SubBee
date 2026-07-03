# SubBee
The best subscription management platform 

Mock figma file here:
https://shared-linked-48598672.figma.site

## 1. What SubBee Is

SubBee is a subscription wallet. A user funds a SubBee balance, and SubBee handles paying their recurring bills for them, such as international subscriptions and local bills. Users manage everything through Telegram or the SubBee app, and get reminded before anything is due.

The three moving parts:
*   **Nomba** gives every user a personal Nigerian bank account number to receive money and tells SubBee the instant a deposit lands.
*   **Bridgecard** issues each user a virtual Mastercard for international and local merchant charges.
*   **SubBee** is the ledger, scheduler, and messaging layer that tracks balances and moves the right amount onto the right card before a charge is due.

## 2. How Money Moves

1. User signs up, SubBee calls Nomba, and the user gets a permanent personal account number. Money sent to it lands in SubBee's Nomba parent account, and Nomba fires a webhook.
2. SubBee credits the user's wallet balance in its own ledger. All deposits pool in SubBee's Nomba account; the ledger tracks each user's share.
3. Separately, SubBee maintains a pre-funded Naira issuing wallet at Bridgecard, acting as the float.
4. When a subscription needs paying, SubBee funds the user's card from the issuing wallet via Bridgecard's fund-card API. This is an internal API call, not a database-only event.
5. The merchant charges the card. Currency conversion happens at the card network level.
6. Bridgecard sends a debit webhook. SubBee records the actual charged amount in the ledger, reconciles, and messages the user a receipt.

## 3. Provider Facts and API Details

### 3.1 Nomba (collections: virtual accounts and webhooks)

*   **Auth:** OAuth2 client credentials. `POST /v1/auth/token/issue` with `client_id` and `client_secret` returns a JWT `access_token`.
*   **Create virtual account:** `POST /v1/accounts/virtual` with `accountRef`, `accountName`, `currency: "NGN"`, and `bvn`. Response includes `bankAccountNumber`.
*   **Two account types:** Nomba distinguishes static virtual accounts from dynamic ones. We are verifying the exact request shape that produces a truly permanent static account. We must ensure accounts do not default to a 5-minute expiry.
*   **Deposit webhooks:** Nomba fires events like `payment_success`. Payloads carry a `transactionId` which we use as our idempotency key.
*   **Webhook signing:** HMAC verification against the raw request body.
*   **Sandbox Limits:** We are verifying whether any per-user account cap applies in production, as sandbox documentation notes a cap of 2 virtual accounts per user.

### 3.2 Bridgecard (card issuing)

*   **Cardholder registration:** We use the asynchronous mode which returns immediately and fires `cardholder_verification.successful` or `.failed` webhooks. Manual review can take up to 24 hours.
*   **Naira cards:** Virtual Mastercards denominated in NGN.
*   **The funding model:** Bridgecard is a funded-card issuer. Each card holds a real balance. We move money onto it with the fund-card endpoint and pull money off with the unload endpoint.
*   **Card auto-deletion rules:** Bridgecard deletes cards after 15 consecutive declines for insufficient balance, a negative balance, or roughly 3 months of inactivity. We must unload remaining funds before any deletion occurs.
*   **Reading card details:** Card data comes back encrypted. We fetch on demand via Evervault relay URLs instead of storing PCI-DSS sensitive data.
*   **Fees:** We are verifying with Bridgecard sales the exact card creation fee, monthly maintenance on NGN cards, FX spread applied on international transactions, decline fee pass-through, and volume tiers.
*   **Webhook authentication:** We are verifying the exact webhook authentication scheme and will treat unauthenticated events as hostile.

### 3.3 Messaging channels

*   **Telegram Bot API:** Free, easy webhooks, no message window restrictions.
*   **WhatsApp Cloud API:** Requires pre-approved template messages for reminders sent outside the 24-hour customer service window. We are verifying current per-message template pricing for Nigeria.

## 4. The Corrected Money Model

SubBee's database is the source of truth for whose money is whose, but it must mirror three real pots of money:

| Real-world pot | Lives at | Ledger mirror |
| :--- | :--- | :--- |
| Deposits pool | SubBee's Nomba parent account | Sum of all user `wallet` balances |
| NGN issuing wallet | Bridgecard | `float_pool` account |
| Each user's card balance | Bridgecard, per card | That user's `card` ledger account |

The four money movements:
1.  **User deposit:** Credit `user.wallet`, debit `nomba_pool`.
2.  **Float top-up:** Debit `nomba_pool`, credit `float_pool`.
3.  **Fund user's card:** Debit `user.wallet`, credit `user.card_pending`. On success webhook, move `card_pending` to `user.card`.
4.  **Merchant charges card:** Debit `user.card`, credit `merchant_spend`.

## 5. Technical Architecture

### 5.1 System shape

One deployable Node.js backend. Webhook receivers do almost nothing inline (verify, persist, acknowledge, enqueue); all real work happens in BullMQ queue workers on Redis.

### 5.2 Data model

Amounts are BIGINT in kobo.

*   `users`: Tracks identity and KYC status.
*   `ledger_accounts`: Tracks `wallet`, `card`, `card_pending`, `float_pool`, and `nomba_pool`.
*   `ledger_entries`: APPEND ONLY. No UPDATE or DELETE. Includes `txn_id` for double-entry auditing.
*   `card_accounts`: Mirrors Bridgecard cards. Includes `consecutive_declines` counter.
*   `subscriptions`: Tracks `merchant_name`, `next_charge_at`, and `buffer_pct` (FX slippage cushion).
*   `webhook_events`: Idempotency guard `UNIQUE (provider, event_id)` for all inbound webhooks.

### 5.3 The current balance cache

`ledger_accounts.current_balance` is a cache updated in the same PostgreSQL transaction as `ledger_entries` inserts. We use atomic in-place arithmetic with a constraint `AND current_balance >= $amount` to enforce overdraft protection at the database level.

### 5.4 CardIssuerAdapter

All Bridgecard calls go through one interface (e.g., `adapter.createCard`, `adapter.fundCard`, `adapter.normalizeWebhook`) to allow swapping to a backup issuer like Sudo Africa later without rewriting business logic.

## 6. Integration Flows

### 6.1 Deposit flow

1. Read RAW body bytes and compute HMAC.
2. `INSERT INTO webhook_events` with `ON CONFLICT DO NOTHING`. If duplicate, respond 200 and stop.
3. Respond 200 immediately. Enqueue processing job.
4. Worker processes the double-entry ledger update and enqueues a notification message.

### 6.2 Subscription charge cycle

Keep cards near-empty and fund just-in-time.

1. Scheduler runs every 5 minutes.
2. For due subscriptions, calculate `amount_to_fund` (expected amount plus a 5% buffer).
3. If wallet has sufficient funds, execute `adapter.fundCard`.
4. On `card_credit_event.successful`, the `card_pending` balance moves to the actual card.
5. Merchant charges the card. Bridgecard sends `naira_card_debit_event.successful`.
6. SubBee sweeps back the leftover buffer amount via `adapter.unloadCard` a few days later.

### 6.3 Reconciliation job

Runs frequently to pull recent transactions from Nomba and Bridgecard. Any deposit or card charge without a matching `webhook_events` row is processed to catch dropped webhooks.

## 7. The Dangerous Details Checklist

*   **Verify webhook signatures against the raw body:** In Express, mount `express.raw` before `express.json` to compute the HMAC accurately.
*   **Idempotency is a database constraint:** Use `UNIQUE (provider, event_id)`.
*   **The decline-loop defense:** Log every `debit_event.declined` and increment `consecutive_declines`. At 3 declines, freeze the card via API to prevent Bridgecard from deleting it at 15.
*   **Maintenance fees:** We must process `card_maintenance_fee_debit_event.successful` webhooks to keep the ledger accurate.
*   **Card data is radioactive:** Store `card_id` and `last4` only.

## 8. Failure Policy: Insufficient Balance

1.  **T minus 3 days:** Send a low-balance alert reminding the user to top up.
2.  **T minus 0:** Do not fund the card. Set subscription status to `insufficient_funds`.
3.  **Recovery:** Automatically re-check pending subscriptions on every subsequent deposit webhook.

## 9. Regulatory Reality

Holding other people's money in a wallet is a licensed activity in Nigeria. Only Mobile Money Operators (MMOs) with massive capital requirements can do this directly. For the pilot, we will partner with an already-licensed BaaS entity so customer funds sit in their regulated structure.

## 10. Costs That Shape the Design

We are waiting to confirm unpublished numbers from providers (card creation fees, maintenance fees, FX spreads). These will dictate our own revenue model and whether we absorb or pass through decline fees.

## 11. Build Order

*   **M0 Skeleton:** Node/TS monorepo, Postgres schema, BullMQ, Nomba auth.
*   **M1 Deposits:** Virtual accounts, webhook HMAC, ledger credits.
*   **M2 Card Funding:** KYC flow, lazy card creation, `card_pending` pipeline.
*   **M3 Subscription Loop:** Scheduler, just-in-time funding, webhook charge receipts.
*   **M4 Trust Layer:** Reconciliation cron jobs and sweep-back logic.

## 12. Stack

Node.js, TypeScript, PostgreSQL (vital for ACID transactions and idempotency constraints), Redis, and BullMQ.
