import { Worker, Job } from 'bullmq';
import { redisConnection } from './queue';
import { db } from '../db';
import crypto from 'crypto';
import { bot } from '../telegram/bot';

interface DepositJobPayload {
  eventId: string;
  eventType: string;
  payload: {
    eventType: string;
    requestId: string;
    data: {
      transaction: {
        transactionId: string;
        amount: number; // in kobo (from payload)
        currency: string;
        status: string;
        accountRef: string; // Internal User UUID mapped to virtual account
      };
    };
  };
}

const worker = new Worker(
  'deposit-queue',
  async (job: Job<DepositJobPayload>) => {
    const { eventId, payload } = job.data;
    const { amount, currency, accountRef, transactionId } = payload.data.transaction;

    console.log(`[worker/deposit] Processing job ${job.id} for event ${eventId}`);

    // ── Step 1: Resolve User ──────────────────────────────────────────────────
    const userResult = await db.query(
      'SELECT id, telegram_chat_id FROM users WHERE id = $1',
      [accountRef]
    );

    if (userResult.rowCount === 0) {
      throw new Error(`[worker/deposit] User with reference ID ${accountRef} not found.`);
    }
    const user = userResult.rows[0];

    // ── Step 2: Open DB Transaction ───────────────────────────────────────────
    await db.transaction(async (client) => {
      // 1. Get user's wallet account (create if missing)
      let walletResult = await client.query(
        'SELECT id, current_balance FROM ledger_accounts WHERE user_id = $1 AND type = $2 AND currency = $3',
        [user.id, 'wallet', currency]
      );

      if (walletResult.rowCount === 0) {
        walletResult = await client.query(
          'INSERT INTO ledger_accounts (user_id, type, currency) VALUES ($1, $2, $3) RETURNING id, current_balance',
          [user.id, 'wallet', currency]
        );
      }
      const userWallet = walletResult.rows[0];

      // 2. Get house nomba_pool clearing account (create if missing)
      let poolResult = await client.query(
        'SELECT id, current_balance FROM ledger_accounts WHERE user_id IS NULL AND type = $1 AND currency = $2',
        ['nomba_pool', currency]
      );

      if (poolResult.rowCount === 0) {
        poolResult = await client.query(
          'INSERT INTO ledger_accounts (user_id, type, currency) VALUES (NULL, $1, $2) RETURNING id, current_balance',
          ['nomba_pool', currency]
        );
      }
      const nombaPool = poolResult.rows[0];

      // 3. Generate transaction grouping UUID
      const txnId = crypto.randomUUID();

      // 4. Create Ledger Entries (balanced legs)
      // Leg A: Debit clearing pool
      await client.query(
        'INSERT INTO ledger_entries (txn_id, account_id, direction, amount, source_type, source_ref) VALUES ($1, $2, $3, $4, $5, $6)',
        [txnId, nombaPool.id, 'debit', amount, 'deposit', transactionId]
      );

      // Leg B: Credit user wallet
      await client.query(
        'INSERT INTO ledger_entries (txn_id, account_id, direction, amount, source_type, source_ref) VALUES ($1, $2, $3, $4, $5, $6)',
        [txnId, userWallet.id, 'credit', amount, 'deposit', transactionId]
      );

      // 5. Update cached current balances on both accounts
      // Overdraft protection rule: update balances using atomic offsets
      await client.query(
        'UPDATE ledger_accounts SET current_balance = current_balance - $1 WHERE id = $2',
        [amount, nombaPool.id]
      );

      await client.query(
        'UPDATE ledger_accounts SET current_balance = current_balance + $1 WHERE id = $2',
        [amount, userWallet.id]
      );

      // 6. Update webhook_events processed timestamp
      await client.query(
        'UPDATE webhook_events SET processed_at = NOW() WHERE provider = $1 AND event_id = $2',
        ['nomba', eventId]
      );
    });

    console.log(`[worker/deposit] Ledger entry applied for event ${eventId}. User: ${user.id}`);

    // ── Step 3: Send Telegram Notification ────────────────────────────────────
    if (user.telegram_chat_id) {
      const amountNaira = (amount / 100).toFixed(2);
      try {
        await bot.api.sendMessage(
          user.telegram_chat_id,
          `🍯 *Honey Pot Topped Up!*\n\nWe safely received your deposit! ₦${amountNaira} has been added to your SubBee wallet. 🐝`,
          { parse_mode: 'Markdown' }
        );
        console.log(`[worker/deposit] Telegram notification sent to user ${user.id}`);
      } catch (err) {
        console.error(`[worker/deposit] Telegram notification failed for user ${user.id}:`, err);
      }
    }
  },
  { connection: redisConnection }
);

worker.on('failed', (job, err) => {
  console.error(`[worker/deposit] Job ${job?.id} failed:`, err);
  // Log failure details to webhook registry if available
  if (job?.data) {
    db.query(
      'UPDATE webhook_events SET processing_error = $1 WHERE provider = $2 AND event_id = $3',
      [err.message, 'nomba', job.data.eventId]
    ).catch((dbErr) => console.error('[worker/deposit] Failed updating error log:', dbErr));
  }
});

console.log('[worker/deposit] Worker started.');
export default worker;
