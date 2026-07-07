import { db } from '../db';
import { bridgecard } from './bridgecard/client';
import crypto from 'crypto';

/**
 * Sweeps money from the user's wallet ledger into their Bridgecard virtual card.
 * Throws an error if the user has no card or has insufficient balance.
 */
export async function fundVirtualCard(userId: string, amountKobo: number): Promise<{ reference: string; cardId: string }> {
  // 1. Resolve virtual card
  const cardRes = await db.query('SELECT id, bridgecard_card_id FROM cards WHERE user_id = $1', [userId]);
  if (cardRes.rowCount === 0) {
    throw new Error('User does not have an active virtual card.');
  }
  const card = cardRes.rows[0];

  // 2. Enforce balance checks
  const walletRes = await db.query(
    "SELECT current_balance FROM ledger_accounts WHERE user_id = $1 AND type = 'wallet'",
    [userId]
  );
  const balanceKobo = BigInt(walletRes.rows[0]?.current_balance ?? 0);

  if (balanceKobo < BigInt(amountKobo)) {
    const balanceNaira = (Number(balanceKobo) / 100).toFixed(2);
    throw new Error(`Insufficient wallet balance. Current: ₦${balanceNaira}`);
  }

  // 3. Create pending transfer record
  const reference = `tf_${crypto.randomBytes(8).toString('hex')}`;
  await db.query(
    `INSERT INTO pending_transfers (user_id, card_id, amount_kobo, reference, status) 
     VALUES ($1, $2, $3, $4, 'pending')`,
    [userId, card.id, amountKobo, reference]
  );

  // 4. Trigger Bridgecard API call (settled asynchronously via webhook)
  await bridgecard.fundCard(card.bridgecard_card_id, amountKobo, reference);
  
  return { reference, cardId: card.bridgecard_card_id };
}
