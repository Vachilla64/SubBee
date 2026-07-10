import { Worker, Job } from 'bullmq';
import { redisConnection } from './queue';
import { db } from '../db';
import { bot } from '../telegram/bot';
import { reverseWithdrawal } from '../ledger/withdrawals';

interface PayoutJobPayload {
  eventId: string;
  eventType: string;
  payload: {
    event_type?: string;
    eventType?: string;
    data: {
      transaction: {
        transactionId: string;
        merchantTxRef: string;
        transactionAmount?: number;
      };
    };
  };
}

const worker = new Worker(
  'withdrawal-queue',
  async (job: Job<PayoutJobPayload>) => {
    const { eventId, eventType, payload } = job.data;
    const merchantTxRef = payload.data?.transaction?.merchantTxRef;

    console.log(`[worker/withdrawal] Processing job ${job.id} for event ${eventId} (${eventType})`);

    if (!merchantTxRef) {
      throw new Error(`[worker/withdrawal] Payout webhook missing merchantTxRef (event ${eventId})`);
    }

    const wdRes = await db.query(
      'SELECT id, user_id, amount_kobo, status FROM withdrawals WHERE merchant_tx_ref = $1',
      [merchantTxRef]
    );
    if (wdRes.rowCount === 0) {
      throw new Error(`[worker/withdrawal] No withdrawal found for merchantTxRef ${merchantTxRef}`);
    }
    const withdrawal = wdRes.rows[0];

    // Already finalized (e.g. the synchronous API call already resolved this) — idempotent no-op.
    if (withdrawal.status !== 'pending') {
      console.log(`[worker/withdrawal] Withdrawal ${withdrawal.id} already ${withdrawal.status}, skipping`);
    } else if (eventType === 'payout_success') {
      await db.query(
        "UPDATE withdrawals SET status = 'successful', provider_transaction_id = $2, updated_at = NOW() WHERE id = $1",
        [withdrawal.id, payload.data.transaction.transactionId]
      );
    } else if (eventType === 'payout_failed' || eventType === 'payout_refund') {
      await reverseWithdrawal(
        withdrawal.id,
        withdrawal.user_id,
        withdrawal.amount_kobo,
        eventType === 'payout_refund' ? 'Transfer was refunded by the bank' : 'Transfer failed'
      );
    } else {
      console.warn(`[worker/withdrawal] Unhandled payout event type: ${eventType}`);
    }

    await db.query(
      'UPDATE webhook_events SET processed_at = NOW() WHERE provider = $1 AND event_id = $2',
      ['nomba', eventId]
    );

    // ── Telegram notification ─────────────────────────────────────────────────
    const userRes = await db.query('SELECT telegram_chat_id FROM users WHERE id = $1', [withdrawal.user_id]);
    const chatId = userRes.rows[0]?.telegram_chat_id;
    if (chatId) {
      const amountNaira = (Number(withdrawal.amount_kobo) / 100).toFixed(2);
      const message =
        eventType === 'payout_success'
          ? `✅ *Withdrawal sent!*\n\n₦${amountNaira} is on its way to your bank account.`
          : `⚠️ *Withdrawal didn't go through*\n\n₦${amountNaira} has been returned to your SubBee wallet. Please try again.`;
      try {
        await bot.api.sendMessage(chatId, message, { parse_mode: 'Markdown' });
      } catch (err) {
        console.error(`[worker/withdrawal] Telegram notification failed for user ${withdrawal.user_id}:`, err);
      }
    }

    console.log(`[worker/withdrawal] Finished processing event ${eventId} for withdrawal ${withdrawal.id}`);
  },
  { connection: redisConnection }
);

worker.on('failed', (job, err) => {
  console.error(`[worker/withdrawal] Job ${job?.id} failed:`, err);
  if (job?.data) {
    db.query(
      'UPDATE webhook_events SET processing_error = $1 WHERE provider = $2 AND event_id = $3',
      [err.message, 'nomba', job.data.eventId]
    ).catch((dbErr) => console.error('[worker/withdrawal] Failed updating error log:', dbErr));
  }
});

console.log('[worker/withdrawal] Worker started.');
export default worker;
