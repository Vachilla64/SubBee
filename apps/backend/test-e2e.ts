import { db } from './src/db';
import crypto from 'crypto';
import { Queue } from 'bullmq';
import { redisConnection } from './src/workers/queue';

async function runTest() {
  const email = 'alfredvachila@gmail.com';
  
  try {
    // 1. Get User & Virtual Account
    const uRes = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (uRes.rowCount === 0) throw new Error('User not found');
    const user = uRes.rows[0];

    console.log(`\n==============================================`);
    console.log(`🧪 STARTING CORE LOOP E2E TEST`);
    console.log(`==============================================`);
    console.log(`[Test] User ID: ${user.id}`);

    // Check initial balance
    const initBalRes = await db.query("SELECT current_balance FROM ledger_accounts WHERE user_id = $1 AND type = 'wallet'", [user.id]);
    console.log(`[Test] Initial Wallet Balance: ₦${((initBalRes.rows[0]?.current_balance || 0) / 100).toFixed(2)}`);

    // 2. Simulate Nomba Deposit Webhook
    const depositAmountKobo = 5000000; // 50,000 NGN
    const eventId = 'nomba_test_evt_' + crypto.randomBytes(4).toString('hex');
    
    const webhookPayload = {
      eventType: 'transaction.success',
      requestId: 'req_' + crypto.randomBytes(4).toString('hex'),
      data: {
        transaction: {
          transactionId: eventId,
          amount: depositAmountKobo,
          currency: 'NGN',
          status: 'SUCCESS',
          accountRef: user.id
        }
      }
    };

    console.log(`\n💸 [Test] Enqueuing ₦50,000 Deposit...`);
    const depositQueue = new Queue('deposit-queue', { connection: redisConnection });
    
    // We need to write to webhook_events first so idempotency works
    await db.query(
      `INSERT INTO webhook_events (provider, event_id, event_type, raw_payload) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
      ['nomba', eventId, 'transaction.success', JSON.stringify(webhookPayload)]
    );

    await depositQueue.add('process-deposit-webhook', {
      eventId,
      eventType: 'transaction.success',
      payload: webhookPayload
    });

    // Wait a few seconds for deposit to process
    console.log(`[Test] Waiting 3 seconds for deposit worker...`);
    await new Promise(r => setTimeout(r, 3000));

    const balRes = await db.query("SELECT current_balance FROM ledger_accounts WHERE user_id = $1 AND type = 'wallet'", [user.id]);
    console.log(`[Test] Wallet Balance after deposit: ₦${(balRes.rows[0]?.current_balance / 100).toFixed(2)}`);

    // 3. Create Subscription due TODAY
    console.log(`\n📝 [Test] Inserting Netflix Subscription (₦5,000) due TODAY...`);
    const todayDay = new Date().getDate();
    await db.query(
      `INSERT INTO subscriptions (user_id, merchant_name, merchant_id, amount_kobo, billing_day, is_active, reminders_enabled)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [user.id, 'Netflix E2E', 'netflix', 500000, todayDay, true, false]
    );

    // 4. Trigger Scheduler
    console.log(`\n⏰ [Test] Triggering Scheduler Job...`);
    const schedulerQueue = new Queue('scheduler-queue', { connection: redisConnection });
    await schedulerQueue.add('test-scheduler', { runAllForTesting: false });

    console.log(`[Test] Waiting 6 seconds for scheduler and Bridgecard API calls...`);
    await new Promise(r => setTimeout(r, 6000));

    // 5. Verify final state
    console.log(`\n✅ [Test] Final State Verification:`);
    const finalBalRes = await db.query("SELECT current_balance FROM ledger_accounts WHERE user_id = $1 AND type = 'wallet'", [user.id]);
    console.log(`   - Final Wallet Balance: ₦${((finalBalRes.rows[0]?.current_balance || 0) / 100).toFixed(2)}`);
    
    const entriesRes = await db.query("SELECT direction, amount, source_type, created_at FROM ledger_entries WHERE account_id = (SELECT id FROM ledger_accounts WHERE user_id = $1 AND type = 'wallet') ORDER BY created_at ASC", [user.id]);
    console.log('\n   - Wallet Ledger Entries History:');
    console.table(entriesRes.rows.map(r => ({
      ...r,
      amount: '₦' + (Number(r.amount) / 100).toFixed(2)
    })));

  } catch (err) {
    console.error('Test Failed:', err);
  } finally {
    process.exit(0);
  }
}

runTest();
