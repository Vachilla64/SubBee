/**
 * SubBee Backend — Express server (M1 deposits)
 */

import { config } from './config';
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import crypto from 'crypto';
import { db } from './db';
import { depositQueue, cardQueue } from './workers/queue';

// Import workers to ensure they register and start listening to Redis
import './workers/deposit.worker';
import './workers/card.worker';
import './telegram/bot';

const PORT = config.PORT;
const NOMBA_WEBHOOK_SECRET = config.NOMBA_WEBHOOK_SECRET;

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

app.post(
  '/webhooks/nomba',
  express.raw({ type: 'application/json' }),
  async (req: Request, res: Response) => {
    // ── Step 1: signature verification ────────────────────────────────────────
    const incomingSignature = (req.headers['nomba-signature'] ??
      req.headers['x-nomba-signature']) as string | undefined;

    if (!incomingSignature) {
      console.warn('[webhook/nomba] Missing signature header — 401');
      res.status(401).json({ error: 'Missing signature header' });
      return;
    }

    const rawBody = req.body as Buffer;
    const computedHmac = crypto
      .createHmac('sha512', NOMBA_WEBHOOK_SECRET)
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
      console.warn('[webhook/nomba] Invalid HMAC signature — 401');
      res.status(401).json({ error: 'Invalid signature' });
      return;
    }

    // ── Step 2: Parse payload ─────────────────────────────────────────────────
    let payload: any;
    try {
      payload = JSON.parse(rawBody.toString('utf-8'));
    } catch {
      res.status(400).json({ error: 'Invalid JSON payload' });
      return;
    }

    const data = payload['data'];
    const transaction = data?.['transaction'];
    const eventId =
      transaction?.['transactionId'] ??
      payload['requestId'] ??
      'unknown';
    const eventType = payload['eventType'] ?? 'unknown';

    try {
      // ── Step 3: Idempotency check via DB Unique Constraint ───────────────────
      // Saves the event first; does nothing if we already received it.
      const dbInsert = await db.query(
        `INSERT INTO webhook_events (provider, event_id, event_type, raw_payload) 
         VALUES ($1, $2, $3, $4) 
         ON CONFLICT (provider, event_id) DO NOTHING`,
        ['nomba', eventId, eventType, JSON.stringify(payload)]
      );

      if (dbInsert.rowCount === 0) {
        console.log(`[webhook/nomba] Duplicate event ignored: ${eventId}`);
        res.status(200).json({ received: true, duplicate: true });
        return;
      }

      // ── Step 4: Enqueue job to BullMQ ────────────────────────────────────────
      await depositQueue.add('process-deposit', {
        eventId,
        eventType,
        payload,
      });

      console.log('[webhook/nomba] Webhook enqueued successfully', { eventId, eventType });

      // ── Step 5: Acknowledge Nomba immediately ──────────────────────────────
      res.status(200).json({ received: true });
    } catch (error: any) {
      console.error('[webhook/nomba] Error handling webhook:', error);
      res.status(500).json({ error: 'Internal processing failure' });
    }
  }
);

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
import { bridgecard } from './services/bridgecard/client';

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

      // Create static virtual account details (Nomba MFB simulation)
      const mockAccountNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();
      await client.query(
        'INSERT INTO virtual_accounts (user_id, provider, account_ref, bank_account_number, bank_name) VALUES ($1, $2, $3, $4, $5)',
        [newUser.id, 'nomba', 'ref_' + newUser.id.substring(0, 8), mockAccountNumber, 'Nomba MFB']
      );

      return newUser;
    });

    res.json({ name: name || email.split('@')[0], email: user.email, id: user.id });
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

    await db.transaction(async (client) => {
      // Create cardholder profile record
      await client.query(
        `INSERT INTO cardholders (user_id, bridgecard_cardholder_id, status, first_name, last_name, phone, email, dob, bvn, address_street, address_state, address_lga, address_postal_code) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [user.id, bridgecardId, 'active', firstName, lastName, phone, email, dob, bvn, address, state, lga, postalCode]
      );

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
      telegramConnected: !!user.telegram_chat_id
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
  const { email } = req.body;
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
    const cardData = await bridgecard.createVirtualCard(cardholder.bridgecard_cardholder_id);

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
│  Milestone: M0 — skeleton                        │
└─────────────────────────────────────────────────┘
  `);
});

export default app;
