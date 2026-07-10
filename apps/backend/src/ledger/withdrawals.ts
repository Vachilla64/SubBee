import crypto from 'crypto';
import { db } from '../db';

/**
 * Credits the wallet back and marks the withdrawal failed. Shared by the
 * synchronous API-rejection path (server.ts) and the async payout_failed /
 * payout_refund webhook path (workers/withdrawal.worker.ts) — both mean
 * the same thing: Nomba never delivered the money, give it back.
 */
export async function reverseWithdrawal(
  withdrawalId: string,
  userId: string,
  amountKobo: bigint | string,
  reason: string
): Promise<void> {
  await db.transaction(async (client) => {
    const walletRes = await client.query(
      "SELECT id FROM ledger_accounts WHERE user_id = $1 AND type = 'wallet' AND currency = 'NGN'",
      [userId]
    );
    if (walletRes.rowCount === 0) {
      throw new Error(`[ledger/withdrawals] Wallet account missing for user ${userId}`);
    }
    const walletId = walletRes.rows[0].id;

    const poolRes = await client.query(
      "SELECT id FROM ledger_accounts WHERE user_id IS NULL AND type = 'nomba_pool' AND currency = 'NGN'"
    );
    if (poolRes.rowCount === 0) {
      throw new Error('[ledger/withdrawals] nomba_pool house account missing');
    }
    const poolId = poolRes.rows[0].id;

    const txnId = crypto.randomUUID();

    await client.query(
      'INSERT INTO ledger_entries (txn_id, account_id, direction, amount, source_type, source_ref) VALUES ($1, $2, $3, $4, $5, $6)',
      [txnId, poolId, 'debit', amountKobo, 'withdrawal_reversal', withdrawalId]
    );
    await client.query(
      'INSERT INTO ledger_entries (txn_id, account_id, direction, amount, source_type, source_ref) VALUES ($1, $2, $3, $4, $5, $6)',
      [txnId, walletId, 'credit', amountKobo, 'withdrawal_reversal', withdrawalId]
    );

    await client.query(
      'UPDATE ledger_accounts SET current_balance = current_balance - $1 WHERE id = $2',
      [amountKobo, poolId]
    );
    await client.query(
      'UPDATE ledger_accounts SET current_balance = current_balance + $1 WHERE id = $2',
      [amountKobo, walletId]
    );

    await client.query(
      "UPDATE withdrawals SET status = 'failed', failure_reason = $2, updated_at = NOW() WHERE id = $1",
      [withdrawalId, reason]
    );
  });
}
