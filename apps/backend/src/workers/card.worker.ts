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

    if (eventType !== 'naira_card_credit_event.successful' && eventType !== 'transaction.successful') {
      console.log(`[worker/card] Ignoring unhandled event type: ${eventType}`);
      return;
    }

    if (status !== 'success') {
      console.warn(`[worker/card] Card transaction status is not success: ${status}`);
      return;
    }

    // The amount in Bridgecard's webhook payload is already in Kobo
    const amountKobo = Math.round(Number(amount));

    // ── INTERCEPT: AUTO-DETECT SUBSCRIPTIONS (Discovery Mode) ───────────────
    if (eventType === 'transaction.successful') {
      console.log(`[worker/card] Detected a successful merchant charge. Auto-registering subscription...`);
      
      const merchantName = (payload.data as any).merchant_name || 'Unknown Merchant';
      const cardId = payload.data.card_id;

      // Find user who owns this card
      const userRes = await db.query('SELECT user_id FROM virtual_cards WHERE card_id = $1', [cardId]);
      if (userRes.rowCount === 0) {
        console.warn(`[worker/card] Could not find user for card ${cardId}. Cannot auto-detect subscription.`);
        return;
      }
      const userId = userRes.rows[0].user_id;

      // Check for existing subscriptions for the same merchant
      const existingSub = await db.query(
        'SELECT id, needs_confirmation, is_auto_detected FROM subscriptions WHERE user_id = $1 AND merchant_name ILIKE $2', 
        [userId, `%${merchantName}%`]
      );

      const billingDay = new Date().getDate(); // Default billing day to today
      const telegramRes = await db.query('SELECT telegram_chat_id FROM users WHERE id = $1', [userId]);
      const telegramChatId = telegramRes.rows[0]?.telegram_chat_id;

      if (existingSub.rowCount === 0) {
        // Pure discovery mode: Create a brand new subscription from scratch
        await db.query(
          `INSERT INTO subscriptions (user_id, merchant_id, merchant_name, amount_kobo, billing_day, reminders_enabled, is_active, is_auto_detected, needs_confirmation) 
           VALUES ($1, $2, $3, $4, $5, TRUE, TRUE, TRUE, TRUE)`,
          [userId, `auto_${crypto.randomUUID()}`, merchantName, amountKobo, billingDay]
        );

        if (telegramChatId) {
          bot.api.sendMessage(
            telegramChatId,
            `🐝 *Subscription Detected!*\n\nWe noticed a ₦${(amountKobo / 100).toFixed(2)} charge from *${merchantName}*.\nWe've automatically added this to your subscriptions! Please visit the web dashboard to confirm the billing cycle.`,
            { parse_mode: 'Markdown' }
          ).catch(err => console.error(err));
        }
      } else {
        // A user might have set this up manually via "Auto-Detect" toggle and we are waiting for the first charge to lock it in
        const pendingSub = existingSub.rows.find(sub => sub.needs_confirmation && sub.is_auto_detected);
        if (pendingSub) {
          console.log(`[worker/card] Locking in auto-detect details for subscription ${pendingSub.id}...`);
          await db.query(
            'UPDATE subscriptions SET amount_kobo = $1, billing_day = $2 WHERE id = $3',
            [amountKobo, billingDay, pendingSub.id]
          );

          if (telegramChatId) {
            bot.api.sendMessage(
              telegramChatId,
              `✅ *Auto-Detect Successful!*\n\nWe just locked in your *${merchantName}* subscription at ₦${(amountKobo / 100).toFixed(2)} based on their latest charge. Please open the SubBee app to review and confirm these details!`,
              { parse_mode: 'Markdown' }
            ).catch(err => console.error(err));
          }
        }
      }

      // Mark webhook processed and exit (since we don't manipulate ledgers for raw Bridgecard debits yet in M1)
      await db.query(
        'UPDATE webhook_events SET processed_at = NOW() WHERE provider = $1 AND event_id = $2',
        ['bridgecard', eventId]
      );
      return;
    }

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
          `🌻 *Virtual Card Funded!*\n\n₦${amountNairaFormatted} has been successfully loaded onto your card and is ready to use! 🐝`,
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
