import { Worker, Job } from 'bullmq';
import { redisConnection } from './queue';
import { runAllInvariants } from '../ledger/invariants';
import { bridgecard } from '../services/bridgecard/client';
import { bot } from '../telegram/bot';
import { db } from '../db';
import crypto from 'crypto';

// --- Invariant Worker ---
const invWorker = new Worker(
  'invariant-queue',
  async (job: Job) => {
    if (job.name === 'invariant-check') {
      console.log(`[worker/invariant] Running scheduled invariants check...`);
      await runAllInvariants();
    }
  },
  { connection: redisConnection }
);

invWorker.on('failed', (job, err) => {
  console.error(`[worker/invariant] Job ${job?.id} failed:`, err);
});

// --- Reconciliation & Float Worker ---
const recWorker = new Worker(
  'reconciliation-queue',
  async (job: Job) => {
    
    if (job.name === 'float-monitor') {
      console.log(`[worker/reconciliation] Checking Bridgecard issuing wallet float...`);
      try {
        const balanceKobo = await bridgecard.getIssuingWalletBalance();
        const thresholdKobo = 2000000; // ₦20,000 alert threshold
        
        if (balanceKobo < thresholdKobo) {
          const balanceNaira = (balanceKobo / 100).toFixed(2);
          const msg = `⚠️ *LOW FLOAT ALERT* ⚠️\n\nThe Bridgecard Issuing Wallet balance has dropped below ₦20,000.00!\nCurrent Balance: ₦${balanceNaira}\n\nPlease top up immediately to prevent failed card fundings.`;
          
          const userRes = await db.query('SELECT telegram_chat_id FROM users WHERE telegram_chat_id IS NOT NULL LIMIT 1');
          if (userRes.rowCount && userRes.rowCount > 0) {
            await bot.api.sendMessage(userRes.rows[0].telegram_chat_id, msg, { parse_mode: 'Markdown' });
          }
        } else {
          console.log(`[worker/reconciliation] Float is healthy: ₦${(balanceKobo / 100).toFixed(2)}`);
        }
      } catch (err) {
        console.error('[worker/reconciliation] Failed to fetch float balance:', err);
      }
    }

    if (job.name === 'sweep-back') {
      console.log(`[worker/reconciliation] Running sweep-back for idle card funds...`);
      
      // Find cards with a balance > 0
      const cardsRes = await db.query(`
        SELECT a.id as account_id, a.user_id, a.current_balance, c.card_id 
        FROM ledger_accounts a
        JOIN virtual_cards c ON a.user_id = c.user_id
        WHERE a.type = 'card' AND a.current_balance > 0
      `);

      for (const cardAcc of cardsRes.rows) {
        // Check if user has subscriptions due within the next 3 days
        const dueRes = await db.query(`
          SELECT id FROM subscriptions 
          WHERE user_id = $1 AND next_billing_date <= NOW() + INTERVAL '3 days'
        `, [cardAcc.user_id]);

        if (dueRes.rowCount === 0) {
          // No upcoming subscriptions, safe to sweep back!
          const amountKobo = Number(cardAcc.current_balance);
          const amountNaira = (amountKobo / 100).toFixed(2);
          console.log(`[worker/reconciliation] Sweeping ₦${amountNaira} back from card ${cardAcc.card_id} for user ${cardAcc.user_id}`);
          
          try {
            await bridgecard.unloadVirtualCard(cardAcc.card_id, amountKobo);
            
            // Bridgecard API succeeded, update local ledgers
            await db.transaction(async (client) => {
              // Get wallet
              const walletRes = await client.query(
                "SELECT id FROM ledger_accounts WHERE user_id = $1 AND type = 'wallet' FOR UPDATE",
                [cardAcc.user_id]
              );
              const walletAcc = walletRes.rows[0];

              // Lock card
              await client.query(
                "SELECT id FROM ledger_accounts WHERE id = $1 FOR UPDATE",
                [cardAcc.account_id]
              );

              // Debit card
              const debitRes = await client.query(
                "UPDATE ledger_accounts SET current_balance = current_balance - $1 WHERE id = $2 AND current_balance >= $1",
                [amountKobo, cardAcc.account_id]
              );

              if (debitRes.rowCount && debitRes.rowCount > 0) {
                // Credit wallet
                await client.query(
                  "UPDATE ledger_accounts SET current_balance = current_balance + $1 WHERE id = $2",
                  [amountKobo, walletAcc.id]
                );

                const txnId = crypto.randomUUID();
                const ref = `sweep_${Date.now()}`;

                await client.query(
                  "INSERT INTO ledger_entries (txn_id, account_id, direction, amount, source_type, source_ref) VALUES ($1, $2, 'debit', $3, 'card_sweep', $4)",
                  [txnId, cardAcc.account_id, amountKobo, ref]
                );
                await client.query(
                  "INSERT INTO ledger_entries (txn_id, account_id, direction, amount, source_type, source_ref) VALUES ($1, $2, 'credit', $3, 'card_sweep', $4)",
                  [txnId, walletAcc.id, amountKobo, ref]
                );

                // Send Telegram Notification
                const userQuery = await client.query('SELECT telegram_chat_id FROM users WHERE id = $1', [cardAcc.user_id]);
                if (userQuery.rows[0]?.telegram_chat_id) {
                  await bot.api.sendMessage(
                    userQuery.rows[0].telegram_chat_id,
                    `♻️ *Funds Swept Back*\n\n₦${amountNaira} has been returned to your SubBee wallet from your virtual card since you have no immediate subscriptions due.`,
                    { parse_mode: 'Markdown' }
                  ).catch(() => {});
                }
              }
            });
          } catch (err) {
            console.error(`[worker/reconciliation] Failed to sweep card ${cardAcc.card_id}:`, err);
          }
        }
      }
    }
  },
  { connection: redisConnection }
);

recWorker.on('failed', (job, err) => {
  console.error(`[worker/reconciliation] Job ${job?.id} failed:`, err);
});

console.log('[worker/reconciliation] Workers started.');
