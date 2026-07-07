import { db } from '../src/db';
import crypto from 'crypto';

async function run() {
  const walletId = '6931da8e-22bc-4222-9909-e1d8419ffc18';
  const poolId = '648bd067-e1ba-4014-8d9f-f568796ca567';
  const amount = 26539; // the exact remaining drift
  const txnId = crypto.randomUUID();

  console.log(`Resolving remaining drift of ${amount} kobo...`);

  await db.transaction(async (client) => {
    // Credit Nomba Pool cached balance
    await client.query(
      'UPDATE ledger_accounts SET current_balance = current_balance + $1 WHERE id = $2', 
      [amount, poolId]
    );

    // Debit user wallet in entries (balances out the entries sum to 0)
    await client.query(
      "INSERT INTO ledger_entries (txn_id, account_id, direction, amount, source_type, source_ref) VALUES ($1, $2, 'debit', $3, 'adjustment', 'stress_cleanup')",
      [txnId, walletId, amount]
    );

    // Credit pool in entries
    await client.query(
      "INSERT INTO ledger_entries (txn_id, account_id, direction, amount, source_type, source_ref) VALUES ($1, $2, 'credit', $3, 'adjustment', 'stress_cleanup')",
      [txnId, poolId, amount]
    );
  });

  console.log('✅ Ledger drift adjusted successfully!');
  process.exit(0);
}

run().catch((err) => {
  console.error('Failed to run adjustment:', err);
  process.exit(1);
});
