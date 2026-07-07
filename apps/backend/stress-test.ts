import { db } from './src/db';
import crypto from 'crypto';
import { runAllInvariants } from './src/ledger/invariants';

async function setupTestUser(email: string) {
  // Check if test user exists, otherwise create
  let userRes = await db.query('SELECT id FROM users WHERE email = $1', [email]);
  let userId: string;

  if (userRes.rowCount === 0) {
    const newId = crypto.randomUUID();
    await db.query(
      `INSERT INTO users (id, email, phone, telegram_chat_id) 
       VALUES ($1, $2, $3, $4)`,
      [newId, email, '+2348000000000', null]
    );
    userId = newId;
  } else {
    userId = userRes.rows[0].id;
  }

  // Ensure wallet exists and reset balance to 0
  let walletRes = await db.query("SELECT id FROM ledger_accounts WHERE user_id = $1 AND type = 'wallet'", [userId]);
  let walletId: string;

  if (walletRes.rowCount === 0) {
    const newWallet = await db.query(
      "INSERT INTO ledger_accounts (user_id, type, currency, current_balance) VALUES ($1, 'wallet', 'NGN', 0) RETURNING id",
      [userId]
    );
    walletId = newWallet.rows[0].id;
  } else {
    walletId = walletRes.rows[0].id;
    await db.query("UPDATE ledger_accounts SET current_balance = 0 WHERE id = $1", [walletId]);
  }

  return { userId, walletId };
}

async function runStressTests() {
  console.log('🧪 Starting Extensive Stress Tests...');
  const testEmail = 'stresstest@subbee.test';
  
  // Clean up any old stress test data from previous runs if needed
  const { userId, walletId } = await setupTestUser(testEmail);
  console.log(`[Setup] Stress test user resolved: ${userId}, Wallet: ${walletId}`);

  // Resolve or create Nomba Pool for double-entry counterpart
  let poolRes = await db.query("SELECT id FROM ledger_accounts WHERE user_id IS NULL AND type = 'nomba_pool'");
  let poolId: string;
  if (poolRes.rowCount === 0) {
    const newPool = await db.query(
      "INSERT INTO ledger_accounts (user_id, type, currency, current_balance) VALUES (NULL, 'nomba_pool', 'NGN', 0) RETURNING id"
    );
    poolId = newPool.rows[0].id;
  } else {
    poolId = poolRes.rows[0].id;
  }

  // =========================================================================
  // SCENARIO 1: CONCURRENT OVERDRAFT HAMMER
  // =========================================================================
  console.log('\n🔥 Scenario 1: Concurrent Overdraft Hammer');
  
  // 1. Credit wallet with exactly 100,000 kobo (₦1,000)
  const initialCredit = 100000;
  await db.transaction(async (client) => {
    await client.query("UPDATE ledger_accounts SET current_balance = current_balance + $1 WHERE id = $2", [initialCredit, walletId]);
    await client.query("UPDATE ledger_accounts SET current_balance = current_balance - $1 WHERE id = $2", [initialCredit, poolId]);
    const txnId = crypto.randomUUID();
    await client.query(
      "INSERT INTO ledger_entries (txn_id, account_id, direction, amount, source_type, source_ref) VALUES ($1, $2, 'credit', $3, 'deposit', $4)",
      [txnId, walletId, initialCredit, 'stress_init']
    );
    await client.query(
      "INSERT INTO ledger_entries (txn_id, account_id, direction, amount, source_type, source_ref) VALUES ($1, $2, 'debit', $3, 'deposit', $4)",
      [txnId, poolId, initialCredit, 'stress_init']
    );
  });

  const checkInit = await db.query("SELECT current_balance FROM ledger_accounts WHERE id = $1", [walletId]);
  console.log(`[Scenario 1] Wallet initialized with: ₦${(Number(checkInit.rows[0].current_balance) / 100).toFixed(2)}`);

  // 2. Fire 20 concurrent debits of 15,000 kobo (₦150) each
  const debitAmount = 15000;
  const numRequests = 20;
  console.log(`[Scenario 1] Dispatching ${numRequests} concurrent debits of ₦${(debitAmount / 100).toFixed(2)} each...`);

  const debitPromises = Array.from({ length: numRequests }).map(async (_, idx) => {
    try {
      return await db.transaction(async (client) => {
        // Strict locks and checks
        const accRes = await client.query("SELECT current_balance FROM ledger_accounts WHERE id = $1 FOR UPDATE", [walletId]);
        const current = Number(accRes.rows[0].current_balance);

        if (current < debitAmount) {
          throw new Error('OVERDRAFT');
        }

        const updateRes = await client.query(
          "UPDATE ledger_accounts SET current_balance = current_balance - $1 WHERE id = $2 AND current_balance >= $1",
          [debitAmount, walletId]
        );

        if (updateRes.rowCount === 0) {
          throw new Error('OVERDRAFT');
        }

        await client.query("UPDATE ledger_accounts SET current_balance = current_balance + $1 WHERE id = $2", [debitAmount, poolId]);

        const txnId = crypto.randomUUID();
        await client.query(
          "INSERT INTO ledger_entries (txn_id, account_id, direction, amount, source_type, source_ref) VALUES ($1, $2, 'debit', $3, 'card_funding', $4)",
          [txnId, walletId, debitAmount, `stress_debit_${idx}`]
        );
        await client.query(
          "INSERT INTO ledger_entries (txn_id, account_id, direction, amount, source_type, source_ref) VALUES ($1, $2, 'credit', $3, 'card_funding', $4)",
          [txnId, poolId, debitAmount, `stress_debit_${idx}`]
        );
        return 'SUCCESS';
      });
    } catch (err: any) {
      return err.message;
    }
  });

  const results = await Promise.all(debitPromises);
  const successes = results.filter(r => r === 'SUCCESS').length;
  const failures = results.filter(r => r === 'OVERDRAFT').length;

  console.log(`[Scenario 1] Concurrent results: Successes = ${successes}, Overdraft blocks = ${failures}`);

  const finalBalRes = await db.query("SELECT current_balance FROM ledger_accounts WHERE id = $1", [walletId]);
  const finalBalance = Number(finalBalRes.rows[0].current_balance);
  console.log(`[Scenario 1] Final Wallet Balance: ₦${(finalBalance / 100).toFixed(2)}`);

  // Assertions
  if (successes !== 6) {
    console.error(`❌ FAILURE: Expected exactly 6 successes, got ${successes}`);
  } else if (finalBalance !== 10000) {
    console.error(`❌ FAILURE: Expected final balance of 10000 kobo (₦100.00), got ${finalBalance}`);
  } else {
    console.log('✅ Scenario 1 Passed successfully!');
  }

  // =========================================================================
  // SCENARIO 2: HIGH-CONCURRENCE WEBHOOK IDEMPOTENCY GUARD
  // =========================================================================
  console.log('\n⚡ Scenario 2: High-Concurrence Webhook Idempotency Guard');
  const duplicateEventId = 'stress_evt_' + crypto.randomBytes(6).toString('hex');
  const numIdempotencyRequests = 50;

  console.log(`[Scenario 2] Dispatching ${numIdempotencyRequests} concurrent inserts for event ID: ${duplicateEventId}`);

  const webhookPromises = Array.from({ length: numIdempotencyRequests }).map(async () => {
    try {
      const res = await db.query(
        `INSERT INTO webhook_events (provider, event_id, event_type, raw_payload) 
         VALUES ($1, $2, $3, $4) 
         ON CONFLICT (provider, event_id) DO NOTHING`,
        ['nomba', duplicateEventId, 'transaction.success', JSON.stringify({ stress: true })]
      );
      return res.rowCount; // Will be 1 on insert, 0 or null on conflict
    } catch (err) {
      return 0;
    }
  });

  const webhookResults = await Promise.all(webhookPromises);
  const insertedCount = webhookResults.filter(r => r === 1).length;
  const ignoredCount = webhookResults.filter(r => r === 0 || r === null).length;

  console.log(`[Scenario 2] Webhook Insertion Results: Registered = ${insertedCount}, Ignored = ${ignoredCount}`);

  if (insertedCount !== 1) {
    console.error(`❌ FAILURE: Expected exactly 1 webhook to register, got ${insertedCount}`);
  } else {
    console.log('✅ Scenario 2 Passed successfully!');
  }

  // =========================================================================
  // SCENARIO 3: MULTI-ACCOUNT ZERO-SUM INVARIANT STRESS TEST
  // =========================================================================
  console.log('\n🧩 Scenario 3: Multi-Account Zero-Sum Invariant Stress Test');
  console.log('[Scenario 3] Running 100 rapid random ledger updates across system accounts...');

  const randomTxPromises = Array.from({ length: 100 }).map(async (_, idx) => {
    const isCredit = Math.random() > 0.5;
    const amount = Math.floor(Math.random() * 5000) + 1; // 1 to 5000 kobo

    return db.transaction(async (client) => {
      if (isCredit) {
        // Credit wallet, Debit Nomba Pool
        await client.query("UPDATE ledger_accounts SET current_balance = current_balance + $1 WHERE id = $2", [amount, walletId]);
        await client.query("UPDATE ledger_accounts SET current_balance = current_balance - $1 WHERE id = $2", [amount, poolId]);
        const txnId = crypto.randomUUID();
        await client.query(
          "INSERT INTO ledger_entries (txn_id, account_id, direction, amount, source_type, source_ref) VALUES ($1, $2, 'credit', $3, 'deposit', $4)",
          [txnId, walletId, amount, `stress_rand_${idx}`]
        );
        await client.query(
          "INSERT INTO ledger_entries (txn_id, account_id, direction, amount, source_type, source_ref) VALUES ($1, $2, 'debit', $3, 'deposit', $4)",
          [txnId, poolId, amount, `stress_rand_${idx}`]
        );
      } else {
        // Debit wallet, Credit Nomba Pool (with overdraft protection lock check)
        const check = await client.query("SELECT current_balance FROM ledger_accounts WHERE id = $1 FOR UPDATE", [walletId]);
        if (Number(check.rows[0].current_balance) >= amount) {
          await client.query(
            "UPDATE ledger_accounts SET current_balance = current_balance - $1 WHERE id = $2 AND current_balance >= $1",
            [amount, walletId]
          );
          await client.query("UPDATE ledger_accounts SET current_balance = current_balance + $1 WHERE id = $2", [amount, poolId]);
          const txnId = crypto.randomUUID();
          await client.query(
            "INSERT INTO ledger_entries (txn_id, account_id, direction, amount, source_type, source_ref) VALUES ($1, $2, 'debit', $3, 'card_funding', $4)",
            [txnId, walletId, amount, `stress_rand_${idx}`]
          );
          await client.query(
            "INSERT INTO ledger_entries (txn_id, account_id, direction, amount, source_type, source_ref) VALUES ($1, $2, 'credit', $3, 'card_funding', $4)",
            [txnId, poolId, amount, `stress_rand_${idx}`]
          );
        }
      }
    });
  });

  await Promise.all(randomTxPromises);
  console.log('[Scenario 3] 100 updates completed. Invoking M4 Trust Layer Invariants check...');

  try {
    await runAllInvariants();
    console.log('✅ Scenario 3 Passed successfully! All ledger invariants held.');
  } catch (err: any) {
    console.error('❌ FAILURE: Ledger invariants violated after concurrency load!', err.message);
  }

  // Cleanup stress test user balance to avoid polluting main data
  await db.query("UPDATE ledger_accounts SET current_balance = 0 WHERE id = $1", [walletId]);
  console.log('\n🧹 Stress Test Run Finished.');
  process.exit(0);
}

runStressTests().catch((err) => {
  console.error('Stress test failed to run:', err);
  process.exit(1);
});
