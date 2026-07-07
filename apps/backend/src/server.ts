/**
 * SubBee Backend — Express server (M1 deposits)
 */

import { config } from './config';
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import crypto from 'crypto';
import { db } from './db';
import { cardQueue, schedulerQueue, invariantQueue, reconciliationQueue } from './workers/queue';
import { bridgecard } from './services/bridgecard/client';
import { checkBalanceIntegrity, checkZeroSum, checkOverdrafts } from './ledger/invariants';

// Import workers to ensure they register and start listening to Redis
import './workers/deposit.worker';
import './workers/card.worker';
import './workers/scheduler.worker';
import './workers/reconciliation.worker';
import { bot } from './telegram/bot';
import nombaWebhookRouter from './webhooks/nomba';
import { createNombaVirtualAccount } from './services/nomba/accounts';

let botUsername = 'SubBeeBot';
bot.api.getMe().then((me) => {
  botUsername = me.username;
  console.log(`[server] Fetched active bot username: @${botUsername}`);
}).catch((err) => {
  console.error('[server] Failed to fetch bot username:', err);
});

const PORT = config.PORT;

const app: Application = express();

app.use(cors());

// Health check
app.get('/', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'SubBee API',
    version: '0.2.0',
    milestone: 'M1 — deposits',
    timestamp: new Date().toISOString(),
  });
});

app.use('/webhooks/nomba', nombaWebhookRouter);

// ─── Bridgecard webhook receiver (skeleton — implementation in M2) ────────────

app.post(
  '/webhooks/bridgecard',
  express.raw({ type: 'application/json' }),
  async (req: Request, res: Response) => {
    const isMockRequest = req.headers['x-bridgecard-mock'] === 'true';
    const rawBody = req.body as Buffer;

    // ── Step 1: Signature Verification ───────────────────────────────────────
    if (!isMockRequest) {
      const incomingSignature = req.headers['x-bridgecard-signature'] as string | undefined;
      if (!incomingSignature) {
        console.warn('[webhook/bridgecard] Missing signature header — 401');
        res.status(401).json({ error: 'Missing signature header' });
        return;
      }

      const computedHmac = crypto
        .createHmac('sha256', config.BRIDGECARD_WEBHOOK_SECRET)
        .update(rawBody)
        .digest('hex');

      let isValid = false;
      try {
        const sigBuffer = Buffer.from(incomingSignature, 'hex');
        const computedBuffer = Buffer.from(computedHmac, 'hex');
        isValid =
          sigBuffer.length === computedBuffer.length &&
          crypto.timingSafeEqual(sigBuffer, computedBuffer);
      } catch {
        isValid = false;
      }

      if (!isValid) {
        console.warn('[webhook/bridgecard] Invalid HMAC signature — 401');
        res.status(401).json({ error: 'Invalid signature' });
        return;
      }
    }

    // ── Step 2: Parse Payload ────────────────────────────────────────────────
    let payload: any;
    try {
      payload = JSON.parse(rawBody.toString('utf-8'));
    } catch {
      res.status(400).json({ error: 'Invalid JSON payload' });
      return;
    }

    const eventType = payload.event || 'unknown';
    const data = payload.data || {};
    const eventId =
      data.transaction_reference ||
      payload.transaction_reference ||
      payload.id ||
      'bc_evt_' + crypto.randomBytes(8).toString('hex');

    try {
      // ── Step 3: Idempotency Guard ──────────────────────────────────────────
      const dbInsert = await db.query(
        `INSERT INTO webhook_events (provider, event_id, event_type, raw_payload) 
         VALUES ($1, $2, $3, $4) 
         ON CONFLICT (provider, event_id) DO NOTHING`,
        ['bridgecard', eventId, eventType, JSON.stringify(payload)]
      );

      if (dbInsert.rowCount === 0) {
        console.log(`[webhook/bridgecard] Duplicate event ignored: ${eventId}`);
        res.status(200).json({ received: true, duplicate: true });
        return;
      }

      // ── Step 4: Enqueue to BullMQ ──────────────────────────────────────────
      await cardQueue.add('process-card-webhook', {
        eventId,
        eventType,
        payload
      });

      console.log('[webhook/bridgecard] Webhook enqueued successfully', { eventId, eventType });

      // ── Step 5: Acknowledge Bridgecard ──────────────────────────────────────
      res.status(200).json({ received: true });
    } catch (error: any) {
      console.error('[webhook/bridgecard] Error handling webhook:', error);
      res.status(500).json({ error: 'Internal processing failure' });
    }
  }
);

// ─── Global JSON parser (after webhook routes) ────────────────────────────────
//
// Any route registered after this point gets parsed JSON in req.body.
// Webhook routes above use express.raw() instead — they are unaffected.

app.use(express.json());

// ─── User Facing API Routes (M2 & Frontend Integration) ──────────────────────

// Helper to look up user by email
async function getUserByEmail(email: string) {
  const res = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  if (res.rowCount === 0) {
    throw new Error(`User with email ${email} not found`);
  }
  return res.rows[0];
}

// 1. Authenticate / Retrieve Profile
app.post('/api/auth', async (req: Request, res: Response) => {
  const { name, email } = req.body;
  if (!email) {
    res.status(400).json({ error: 'Email is required' });
    return;
  }

  try {
    const user = await db.transaction(async (client) => {
      const userRes = await client.query('SELECT * FROM users WHERE email = $1', [email]);
      if (userRes.rows.length > 0) return userRes.rows[0];

      // Create new user
      const insertUser = await client.query(
        'INSERT INTO users (email, kyc_status) VALUES ($1, $2) RETURNING *',
        [email, 'none']
      );
      const newUser = insertUser.rows[0];

      // Initialize user ledger accounts
      await client.query(
        "INSERT INTO ledger_accounts (user_id, type, currency, current_balance) VALUES ($1, 'wallet', 'NGN', 0)",
        [newUser.id]
      );
      await client.query(
        "INSERT INTO ledger_accounts (user_id, type, currency, current_balance) VALUES ($1, 'card', 'NGN', 0)",
        [newUser.id]
      );
      await client.query(
        "INSERT INTO ledger_accounts (user_id, type, currency, current_balance) VALUES ($1, 'card_pending', 'NGN', 0)",
        [newUser.id]
      );

      // (Virtual account creation deferred until KYC)

      return newUser;
    });

    res.json({ name: name || email.split('@')[0], email: user.email, id: user.id, kycStatus: user.kyc_status });
  } catch (error: any) {
    console.error('[api/auth] Error during authentication:', error);
    res.status(500).json({ error: error.message });
  }
});

// 2. Submit KYC Onboarding
app.post('/api/kyc', async (req: Request, res: Response) => {
  const { email, firstName, lastName, phone, dob, address, state, lga, postalCode, bvn } = req.body;
  if (!email || !firstName || !lastName || !phone || !dob || !bvn) {
    res.status(400).json({ error: 'Missing required KYC fields' });
    return;
  }

  try {
    const user = await getUserByEmail(email);

    // Call Bridgecard client to register the cardholder
    const bridgecardId = await bridgecard.registerCardholder({
      firstName,
      lastName,
      phone,
      email,
      dob,
      bvn,
      addressStreet: address,
      addressState: state,
      addressLga: lga,
      addressPostalCode: postalCode
    });

    // Check if Nomba account already exists locally
    const existingNombaRes = await db.query(
      "SELECT bank_account_number as \"bankAccountNumber\", bank_name as \"bankName\" FROM virtual_accounts WHERE user_id = $1 AND provider = 'nomba'",
      [user.id]
    );

    let nombaAccount = existingNombaRes.rows[0] || null;

    if (!nombaAccount) {
      nombaAccount = await createNombaVirtualAccount({
        accountRef: user.id,
        accountName: `${firstName} ${lastName}`,
        bvn: bvn
      });
    }

    await db.transaction(async (client) => {
      // Create cardholder profile record
      const existingCh = await client.query('SELECT id FROM cardholders WHERE user_id = $1', [user.id]);
      if (existingCh.rowCount !== null && existingCh.rowCount > 0) {
        await client.query(
          `UPDATE cardholders SET bridgecard_cardholder_id = $2, status = $3, first_name = $4, last_name = $5, phone = $6, email = $7, dob = $8, bvn = $9, address_street = $10, address_state = $11, address_lga = $12, address_postal_code = $13 WHERE user_id = $1`,
          [user.id, bridgecardId, 'active', firstName, lastName, phone, email, dob, bvn, address, state, lga, postalCode]
        );
      } else {
        await client.query(
          `INSERT INTO cardholders (user_id, bridgecard_cardholder_id, status, first_name, last_name, phone, email, dob, bvn, address_street, address_state, address_lga, address_postal_code) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [user.id, bridgecardId, 'active', firstName, lastName, phone, email, dob, bvn, address, state, lga, postalCode]
        );
      }

      if (existingNombaRes.rowCount === 0 && nombaAccount) {
        // Save Nomba Virtual Account
        await client.query(
          'INSERT INTO virtual_accounts (user_id, provider, account_ref, bank_account_number, bank_name) VALUES ($1, $2, $3, $4, $5)',
          [user.id, 'nomba', user.id, nombaAccount.bankAccountNumber, nombaAccount.bankName]
        );
      }

      // Update user kyc_status to verified
      await client.query(
        "UPDATE users SET kyc_status = 'verified' WHERE id = $1",
        [user.id]
      );
    });

    res.json({ status: 'success', cardholderId: bridgecardId });
  } catch (error: any) {
    console.error('[api/kyc] Error submitting KYC:', error);
    res.status(500).json({ error: error.message });
  }
});

// 2b. Get Deposit Information
app.get('/api/deposit/info', async (req: Request, res: Response) => {
  const email = req.query.email as string;
  if (!email) {
    res.status(400).json({ error: 'Email is required' });
    return;
  }

  try {
    const userRes = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userRes.rowCount === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const user = userRes.rows[0];

    const accountRes = await db.query(
      "SELECT bank_account_number as \"accountNumber\", bank_name as \"bankName\" FROM virtual_accounts WHERE user_id = $1 AND provider = 'nomba'",
      [user.id]
    );

    if (accountRes.rowCount === 0) {
      res.json({ accountNumber: null, bankName: null });
      return;
    }

    res.json(accountRes.rows[0]);
  } catch (error: any) {
    console.error('[api/deposit/info] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 3. Get Wallet Balance and Deposit Account Details
app.get('/api/balance', async (req: Request, res: Response) => {
  const email = req.query.email as string;
  if (!email) {
    res.status(400).json({ error: 'Email is required' });
    return;
  }

  try {
    const user = await getUserByEmail(email);

    // Fetch balance from ledger_accounts
    const walletRes = await db.query(
      "SELECT current_balance FROM ledger_accounts WHERE user_id = $1 AND type = 'wallet'",
      [user.id]
    );
    const balanceKobo = walletRes.rows[0]?.current_balance ?? 0;

    // Fetch virtual account details
    const accountRes = await db.query(
      "SELECT bank_account_number, bank_name FROM virtual_accounts WHERE user_id = $1",
      [user.id]
    );

    const bankAccount = accountRes.rows[0]
      ? { bankName: accountRes.rows[0].bank_name, accountNumber: accountRes.rows[0].bank_account_number }
      : { bankName: 'Nomba MFB', accountNumber: 'Pending' };

    res.json({
      balanceKobo,
      bankAccount,
      kycStatus: user.kyc_status,
      telegramConnected: !!user.telegram_chat_id,
      telegramBotUsername: botUsername
    });
  } catch (error: any) {
    console.error('[api/balance] Error fetching balance:', error);
    res.status(500).json({ error: error.message });
  }
});

// 4. Simulate Deposit (Nomba webhook helper)
app.post('/api/deposit', async (req: Request, res: Response) => {
  const { email, amountNaira } = req.body;
  if (!email || !amountNaira) {
    res.status(400).json({ error: 'Email and amountNaira are required' });
    return;
  }

  const amountKobo = Math.round(amountNaira * 100);

  try {
    const user = await getUserByEmail(email);

    await db.transaction(async (client) => {
      // Get user wallet account
      const walletRes = await client.query(
        "SELECT id FROM ledger_accounts WHERE user_id = $1 AND type = 'wallet'",
        [user.id]
      );
      const userWallet = walletRes.rows[0];

      // Get house clearing account (nomba_pool)
      let poolRes = await client.query(
        "SELECT id FROM ledger_accounts WHERE user_id IS NULL AND type = 'nomba_pool'"
      );
      if (poolRes.rowCount === 0) {
        poolRes = await client.query(
          "INSERT INTO ledger_accounts (user_id, type, currency) VALUES (NULL, 'nomba_pool', 'NGN') RETURNING id"
        );
      }
      const nombaPool = poolRes.rows[0];

      const txnId = crypto.randomUUID();
      const transactionId = 'sim_' + Math.random().toString(36).substring(2, 10).toUpperCase();

      // Leg A: Debit Nomba Pool
      await client.query(
        'INSERT INTO ledger_entries (txn_id, account_id, direction, amount, source_type, source_ref) VALUES ($1, $2, $3, $4, $5, $6)',
        [txnId, nombaPool.id, 'debit', amountKobo, 'deposit', transactionId]
      );

      // Leg B: Credit User Wallet
      await client.query(
        'INSERT INTO ledger_entries (txn_id, account_id, direction, amount, source_type, source_ref) VALUES ($1, $2, $3, $4, $5, $6)',
        [txnId, userWallet.id, 'credit', amountKobo, 'deposit', transactionId]
      );

      // Update current_balances
      await client.query(
        'UPDATE ledger_accounts SET current_balance = current_balance - $1 WHERE id = $2',
        [amountKobo, nombaPool.id]
      );
      await client.query(
        'UPDATE ledger_accounts SET current_balance = current_balance + $1 WHERE id = $2',
        [amountKobo, userWallet.id]
      );
    });

    res.json({ status: 'success', message: `Simulated deposit of ₦${amountNaira}` });
  } catch (error: any) {
    console.error('[api/deposit] Error simulating deposit:', error);
    res.status(500).json({ error: error.message });
  }
});

// 5. Issue Card (Lazy card issuance)
app.post('/api/card', async (req: Request, res: Response) => {
  const { email, pin } = req.body;
  if (!email) {
    res.status(400).json({ error: 'Email is required' });
    return;
  }

  try {
    const user = await getUserByEmail(email);

    // Get cardholder profile
    const chRes = await db.query(
      'SELECT id, bridgecard_cardholder_id FROM cardholders WHERE user_id = $1',
      [user.id]
    );

    if (chRes.rowCount === 0) {
      res.status(400).json({ error: 'Please complete KYC before requesting a virtual card' });
      return;
    }
    const cardholder = chRes.rows[0];

    // Call Bridgecard client to lazy issue card
    const cardData = await bridgecard.createVirtualCard(cardholder.bridgecard_cardholder_id, pin || '1234');

    // Save card details in cards table
    await db.query(
      'INSERT INTO cards (user_id, cardholder_id, bridgecard_card_id, last4, brand, status) VALUES ($1, $2, $3, $4, $5, $6)',
      [user.id, cardholder.id, cardData.cardId, cardData.last4, cardData.brand, cardData.status]
    );

    res.json({ status: 'success', card: cardData });
  } catch (error: any) {
    console.error('[api/card/create] Error issuing card:', error);
    res.status(500).json({ error: error.message });
  }
});

// 6. Get Virtual Card details
app.get('/api/card', async (req: Request, res: Response) => {
  const email = req.query.email as string;
  if (!email) {
    res.status(400).json({ error: 'Email is required' });
    return;
  }

  try {
    const user = await getUserByEmail(email);

    const cardRes = await db.query(
      'SELECT * FROM cards WHERE user_id = $1',
      [user.id]
    );

    if (cardRes.rowCount === 0) {
      res.json({ status: 'inactive' });
      return;
    }
    const card = cardRes.rows[0];

    // Get card balance from ledger
    const balanceRes = await db.query(
      "SELECT current_balance FROM ledger_accounts WHERE user_id = $1 AND type = 'card'",
      [user.id]
    );
    const balanceKobo = balanceRes.rows[0]?.current_balance ?? 0;

    res.json({
      status: card.status,
      cardId: card.bridgecard_card_id,
      last4: card.last4,
      brand: card.brand,
      balanceKobo
    });
  } catch (error: any) {
    console.error('[api/card/get] Error fetching card:', error);
    res.status(500).json({ error: error.message });
  }
});

// 7. Freeze Card
app.post('/api/card/freeze', async (req: Request, res: Response) => {
  const { cardId } = req.body;
  if (!cardId) {
    res.status(400).json({ error: 'cardId is required' });
    return;
  }

  try {
    await bridgecard.freezeCard(cardId);
    await db.query(
      "UPDATE cards SET status = 'frozen' WHERE bridgecard_card_id = $1",
      [cardId]
    );
    res.json({ status: 'success' });
  } catch (error: any) {
    console.error('[api/card/freeze] Error freezing card:', error);
    res.status(500).json({ error: error.message });
  }
});

// 8. Unfreeze Card
app.post('/api/card/unfreeze', async (req: Request, res: Response) => {
  const { cardId } = req.body;
  if (!cardId) {
    res.status(400).json({ error: 'cardId is required' });
    return;
  }

  try {
    await bridgecard.unfreezeCard(cardId);
    await db.query(
      "UPDATE cards SET status = 'active' WHERE bridgecard_card_id = $1",
      [cardId]
    );
    res.json({ status: 'success' });
  } catch (error: any) {
    console.error('[api/card/unfreeze] Error unfreezing card:', error);
    res.status(500).json({ error: error.message });
  }
});

// 9. Reveal Secure Card Details
app.post('/api/card/reveal', async (req: Request, res: Response) => {
  const { cardId } = req.body;
  if (!cardId) {
    res.status(400).json({ error: 'cardId is required' });
    return;
  }

  try {
    const details = await bridgecard.getCardSecureDetails(cardId);
    res.json(details);
  } catch (error: any) {
    console.error('[api/card/reveal] Error revealing card details:', error);
    res.status(500).json({ error: error.message });
  }
});

// 10. Subscriptions Endpoint (CRUD)
app.post('/api/subscriptions', async (req: Request, res: Response) => {
  const { email, merchantId, merchantName, amountNaira, billingDay, remindersEnabled } = req.body;
  if (!email || !merchantId || !merchantName || !amountNaira || !billingDay) {
    res.status(400).json({ error: 'Missing required subscription fields' });
    return;
  }

  const amountKobo = Math.round(amountNaira * 100);

  try {
    const user = await getUserByEmail(email);

    const insertRes = await db.query(
      `INSERT INTO subscriptions (user_id, merchant_id, merchant_name, amount_kobo, billing_day, reminders_enabled, is_active) 
       VALUES ($1, $2, $3, $4, $5, $6, TRUE) RETURNING id`,
      [user.id, merchantId, merchantName, amountKobo, billingDay, remindersEnabled]
    );

    res.json({ status: 'success', id: insertRes.rows[0].id });
  } catch (error: any) {
    console.error('[api/subscriptions/create] Error creating subscription:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/subscriptions', async (req: Request, res: Response) => {
  const email = req.query.email as string;
  if (!email) {
    res.status(400).json({ error: 'Email is required' });
    return;
  }

  try {
    const user = await getUserByEmail(email);

    const subsRes = await db.query(
      'SELECT id, merchant_id as "merchantId", merchant_name as "merchantName", amount_kobo as "amountKobo", billing_day as "billingDay", reminders_enabled as "remindersEnabled", is_active as "isActive" FROM subscriptions WHERE user_id = $1',
      [user.id]
    );

    res.json(subsRes.rows);
  } catch (error: any) {
    console.error('[api/subscriptions/get] Error fetching subscriptions:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/subscriptions/:id', async (req: Request, res: Response) => {
  const id = req.params.id;

  try {
    await db.query('DELETE FROM subscriptions WHERE id = $1', [id]);
    res.json({ status: 'success' });
  } catch (error: any) {
    console.error('[api/subscriptions/delete] Error deleting subscription:', error);
    res.status(500).json({ error: error.message });
  }
});

// Debug Trigger Sweep Endpoint
app.post('/api/debug/trigger-sweep', async (req: Request, res: Response) => {
  try {
    const { runAllForTesting } = req.body;
    await schedulerQueue.add('daily-subscription-sweep-manual', { runAllForTesting: runAllForTesting !== false });
    res.json({ status: 'success', message: 'Subscription sweep manually triggered.' });
  } catch (error: any) {
    console.error('[api/debug/trigger-sweep] Error triggering sweep:', error);
    res.status(500).json({ error: error.message });
  }
});

// Debug — Fund sandbox issuing wallet (required before any card can be funded on Bridgecard sandbox)
app.post('/api/debug/fund-issuing-wallet', async (req: Request, res: Response) => {
  try {
    const amountKobo = Number(req.body.amountKobo ?? 10_000_000); // default ₦100,000
    await bridgecard.fundIssuingWallet(amountKobo);
    res.json({ status: 'success', message: `Funded sandbox issuing wallet with ${amountKobo} kobo (₦${amountKobo / 100})` });
  } catch (error: any) {
    console.error('[api/debug/fund-issuing-wallet] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/ops/trust-metrics — Returns system-wide ledger invariants & health metrics
app.get('/api/ops/trust-metrics', async (_req: Request, res: Response) => {
  try {
    let balanceIntegrity = 'Passed';
    let zeroSum = 'Passed';
    let overdraftCheck = 'Passed';

    try {
      await checkBalanceIntegrity();
    } catch (e: any) {
      balanceIntegrity = e.message;
    }

    try {
      await checkZeroSum();
    } catch (e: any) {
      zeroSum = e.message;
    }

    try {
      await checkOverdrafts();
    } catch (e: any) {
      overdraftCheck = e.message;
    }

    const floatKobo = await bridgecard.getIssuingWalletBalance().catch(() => 0);

    const poolRes = await db.query("SELECT current_balance FROM ledger_accounts WHERE type = 'nomba_pool' LIMIT 1");
    const poolKobo = Number(poolRes.rows[0]?.current_balance || 0);

    const statsRes = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as users_count,
        (SELECT COUNT(*) FROM subscriptions) as subs_count,
        (SELECT COUNT(*) FROM ledger_entries) as ledger_count
    `);

    res.json({
      balanceIntegrity,
      zeroSum,
      overdraftCheck,
      floatKobo,
      poolKobo,
      stats: {
        usersCount: Number(statsRes.rows[0].users_count),
        subsCount: Number(statsRes.rows[0].subs_count),
        ledgerCount: Number(statsRes.rows[0].ledger_count)
      }
    });
  } catch (error: any) {
    console.error('[api/ops/trust-metrics] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ─── 404 fallback ─────────────────────────────────────────────────────────────

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Not found" });
});

// ─── Global error handler ────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[server] Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// ─── Start ────────────────────────────────────────────────────────────────────

async function bootstrapScheduler() {
  try {
    // Clear any existing repeatable jobs to avoid duplicates
    const schedJobs = await schedulerQueue.getRepeatableJobs();
    for (const job of schedJobs) await schedulerQueue.removeRepeatableByKey(job.key);

    const invJobs = await invariantQueue.getRepeatableJobs();
    for (const job of invJobs) await invariantQueue.removeRepeatableByKey(job.key);

    const recJobs = await reconciliationQueue.getRepeatableJobs();
    for (const job of recJobs) await reconciliationQueue.removeRepeatableByKey(job.key);

    // Schedule daily sweep at 8:00 AM
    await schedulerQueue.add('daily-subscription-sweep', {}, { repeat: { pattern: '0 8 * * *' } });
    console.log('[server] Daily subscription sweep repeatable job scheduled.');

    // M4: Invariants (every 10 minutes)
    await invariantQueue.add('invariant-check', {}, { repeat: { pattern: '*/10 * * * *' } });
    console.log('[server] Invariant check repeatable job scheduled.');

    // M4: Float Monitor (hourly)
    await reconciliationQueue.add('float-monitor', {}, { repeat: { pattern: '0 * * * *' } });
    console.log('[server] Float monitor repeatable job scheduled.');

    // M4: Sweep-back (nightly at 2:00 AM)
    await reconciliationQueue.add('sweep-back', {}, { repeat: { pattern: '0 2 * * *' } });
    console.log('[server] Sweep-back repeatable job scheduled.');

  } catch (err) {
    console.error('[server] Failed to bootstrap repeatable scheduler job:', err);
  }
}

app.listen(PORT, () => {
  console.log(`
┌─────────────────────────────────────────────────┐
│              🐝  SubBee API  🐝                  │
│                                                  │
│  Listening on  http://localhost:${PORT}             │
│  Health check  GET  /                            │
│                                                  │
│  Webhook endpoints:                              │
│    POST /webhooks/nomba                          │
│    POST /webhooks/bridgecard  (skeleton)         │
│                                                  │
│  Milestone: M4 — Trust Layer                     │
└─────────────────────────────────────────────────┘
  `);

  bootstrapScheduler();
});

export default app;
// Trivial change to trigger nodemon restart after EADDRINUSE race condition.

