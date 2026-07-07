import { Worker, Job } from 'bullmq';
import { redisConnection } from './queue';
import { db } from '../db';
import { bot } from '../telegram/bot';
import { fundVirtualCard } from '../services/funding';

interface SchedulerJobPayload {
  runAllForTesting?: boolean; // If true, triggers billing for all active subscriptions regardless of billing day
}

const worker = new Worker(
  'scheduler-queue',
  async (job: Job<SchedulerJobPayload>) => {
    console.log(`[worker/scheduler] Starting subscription check job ${job.id}`);
    const { runAllForTesting } = job.data || {};

    const today = new Date();
    const todayDay = today.getDate();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDay = tomorrow.getDate();

    // Query active subscriptions with their owner's telegram info
    const queryRes = await db.query(
      `SELECT s.*, u.telegram_chat_id 
       FROM subscriptions s 
       JOIN users u ON s.user_id = u.id 
       WHERE s.is_active = true`
    );

    const subscriptions = queryRes.rows;
    console.log(`[worker/scheduler] Found ${subscriptions.length} active subscriptions to check.`);

    for (const sub of subscriptions) {
      const billingDay = sub.billing_day;
      const amountNaira = (Number(sub.amount_kobo) / 100).toFixed(2);
      const isBillingDay = runAllForTesting || (billingDay === todayDay);
      const isReminderDay = !isBillingDay && (billingDay === tomorrowDay);

      // ── Step 1: Send Telegram Reminder (24 hours before billing) ────────────────
      if (isReminderDay && sub.reminders_enabled && sub.telegram_chat_id) {
        try {
          await bot.api.sendMessage(
            sub.telegram_chat_id,
            `⏰ *Subscription Reminder!*\n\n` +
            `Your subscription for *${sub.merchant_name}* (₦${amountNaira}) is due tomorrow.\n\n` +
            `Please ensure your SubBee wallet has sufficient balance to cover this automatic transfer.`,
            { parse_mode: 'Markdown' }
          );
          console.log(`[worker/scheduler] Reminder sent to user ${sub.user_id} for ${sub.merchant_name}`);
        } catch (botErr) {
          console.error(`[worker/scheduler] Failed to send reminder bot message to ${sub.user_id}:`, botErr);
        }
      }

      // ── Step 2: Trigger JIT Funding (On billing day) ───────────────────────────
      if (isBillingDay) {
        console.log(`[worker/scheduler] Processing billing for subscription ${sub.id} (user ${sub.user_id}, merchant ${sub.merchant_name}, amount ₦${amountNaira})`);
        
        try {
          const { reference } = await fundVirtualCard(sub.user_id, Number(sub.amount_kobo));
          console.log(`[worker/scheduler] JIT funding triggered successfully. Ref: ${reference}`);

          if (sub.telegram_chat_id) {
            try {
              await bot.api.sendMessage(
                sub.telegram_chat_id,
                `🐝 *JIT Funding Triggered!*\n\n` +
                `We have automatically transferred ₦${amountNaira} from your SubBee wallet to your virtual card to cover your *${sub.merchant_name}* subscription.\n\n` +
                `• *Status:* Pending Settlement\n` +
                `• *Reference:* \`${reference}\``,
                { parse_mode: 'Markdown' }
              );
            } catch (botErr) {
              console.error(`[worker/scheduler] Failed to send success bot message to ${sub.user_id}:`, botErr);
            }
          }
        } catch (fundErr: any) {
          console.error(`[worker/scheduler] JIT funding failed for subscription ${sub.id}:`, fundErr.message);

          if (sub.telegram_chat_id) {
            try {
              await bot.api.sendMessage(
                sub.telegram_chat_id,
                `⚠️ *Action Required: Subscription Payment Failed!*\n\n` +
                `We were unable to fund your virtual card for your *${sub.merchant_name}* subscription of ₦${amountNaira}.\n\n` +
                `🔴 *Reason:* ${fundErr.message || 'Unknown funding error'}\n\n` +
                `Please top up your SubBee wallet as soon as possible to keep your subscriptions active.`,
                { parse_mode: 'Markdown' }
              );
            } catch (botErr) {
              console.error(`[worker/scheduler] Failed to send failure bot message to ${sub.user_id}:`, botErr);
            }
          }
        }
      }
    }
  },
  {
    connection: redisConnection,
    concurrency: 1,
  }
);

console.log('[worker/scheduler] Scheduler worker started.');

export default worker;
