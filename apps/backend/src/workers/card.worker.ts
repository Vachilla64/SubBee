import { Worker, Job } from 'bullmq';
import { redisConnection } from './queue';
import { db } from '../db';
import crypto from 'crypto';
import { bot } from '../telegram/bot';

interface CardJobPayload {
  eventId: string;
  eventType: string;
  payload: {
    event: string;
    data: {
      card_id: string;
      transaction_reference: string;
      amount: number; // in Naira (from Bridgecard payload)
      currency: string;
      status: string;
    };
  };
}

const worker = new Worker(
  'card-queue',
  async (job: Job<CardJobPayload>) => {
    const { eventId, eventType, payload } = job.data;
    const { transaction_reference, amount, status } = payload.data;

    console.log(`[worker/card] Processing card webhook job ${job.id} for event ${eventId}`);

    if (eventType !== 'naira_card_credit_event.successful') {
      console.log(`[worker/card] Ignoring unhandled event type: ${eventType}`);
      return;
    }

    if (status !== 'success') {
      console.warn(`[worker/card] Card funding transaction status is not success: ${status}`);
      return;
    }

    // The amount in Bridgecard's webhook payload is already in Kobo
    const amountKobo = Math.round(Number(amount));

    // ── Step 1: Open DB Transaction ──────────────────────────────────────────
    await db.transaction(async (client) => {
      // 1. Fetch the pending transfer to verify it exists and is still pending
      const transferRes = await client.query(
        "SELECT * FROM pending_transfers WHERE reference = $1 AND status = 'pending' FOR UPDATE",
        [transaction_reference]
      );

      if (transferRes.rowCount === 0) {
        console.warn(`[worker/card] Pending transfer with reference ${transaction_reference} not found or already processed.`);
        return;
      }
      const transfer = transferRes.rows[0];

      // 2. Resolve User Ledger Accounts
      const walletRes = await client.query(
        "SELECT id, current_balance FROM ledger_accounts WHERE user_id = $1 AND type = 'wallet' FOR UPDATE",
        [transfer.user_id]
      );
      if (walletRes.rowCount === 0) {
        throw new Error(`[worker/card] Wallet account not found for user: ${transfer.user_id}`);
      }
      const userWallet = walletRes.rows[0];

      const cardRes = await client.query(
        "SELECT id, current_balance FROM ledger_accounts WHERE user_id = $1 AND type = 'card' FOR UPDATE",
        [transfer.user_id]
      );
      if (cardRes.rowCount === 0) {
        throw new Error(`[worker/card] Card account not found for user: ${transfer.user_id}`);
      }
      const userCard = cardRes.rows[0];

      // 3. Apply Overdraft Protection Database Constraint
      // Enforce that we only debit user wallet if they have sufficient balance
      const debitRes = await client.query(
        'UPDATE ledger_accounts SET current_balance = current_balance - $1 WHERE id = $2 AND current_balance >= $1',
        [amountKobo, userWallet.id]
      );

      if (debitRes.rowCount === 0) {
        throw new Error(`[worker/card] Overdraft Protection: Insufficient wallet balance for transfer of ${amountKobo} kobo.`);
      }

      // 4. Credit User Card Account
      await client.query(
        'UPDATE ledger_accounts SET current_balance = current_balance + $1 WHERE id = $2',
        [amountKobo, userCard.id]
      );

      // 5. Generate double-entry transaction legs
      const txnId = crypto.randomUUID();

      // Leg A: Debit User Wallet
      await client.query(
        'INSERT INTO ledger_entries (txn_id, account_id, direction, amount, source_type, source_ref) VALUES ($1, $2, $3, $4, $5, $6)',
        [txnId, userWallet.id, 'debit', amountKobo, 'card_funding', transaction_reference]
      );

      // Leg B: Credit User Card
      await client.query(
        'INSERT INTO ledger_entries (txn_id, account_id, direction, amount, source_type, source_ref) VALUES ($1, $2, $3, $4, $5, $6)',
        [txnId, userCard.id, 'credit', amountKobo, 'card_funding', transaction_reference]
      );

      // 6. Update pending transfer status
      await client.query(
        "UPDATE pending_transfers SET status = 'completed' WHERE id = $1",
        [transfer.id]
      );

      // 7. Update webhook event state
      await client.query(
        'UPDATE webhook_events SET processed_at = NOW() WHERE provider = $1 AND event_id = $2',
        ['bridgecard', eventId]
      );

      // ── Step 2: Send Telegram Alert (after successful transaction block) ────
      const userResult = await client.query('SELECT telegram_chat_id FROM users WHERE id = $1', [transfer.user_id]);
      const telegramChatId = userResult.rows[0]?.telegram_chat_id;

      if (telegramChatId) {
        const amountNairaFormatted = (amountKobo / 100).toFixed(2);
        // Fire message in background without blocking transaction release
        bot.api.sendMessage(
          telegramChatId,
          `💳 *Virtual Card Funded!*\n\n₦${amountNairaFormatted} has been loaded onto your card.\nReference: \`${transaction_reference}\``,
          { parse_mode: 'Markdown' }
        ).catch((err) => console.error('[worker/card] Telegram notification failed:', err));
      }
    });

    console.log(`[worker/card] Card funding processing complete for reference: ${transaction_reference}`);
  },
  { connection: redisConnection }
);

worker.on('failed', (job, err) => {
  console.error(`[worker/card] Job ${job?.id} failed:`, err);
  if (job?.data) {
    db.query(
      'UPDATE webhook_events SET processing_error = $1 WHERE provider = $2 AND event_id = $3',
      [err.message, 'bridgecard', job.data.eventId]
    ).catch((dbErr) => console.error('[worker/card] Failed updating event error status:', dbErr));
  }
});

console.log('[worker/card] Worker started.');
export default worker;
