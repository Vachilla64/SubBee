import { db } from '../db';
import { bot } from '../telegram/bot';

export class InvariantError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvariantError';
  }
}

/**
 * Sends a high-priority alert to the dev/admin telegram group.
 * In a real scenario, this would go to a specific admin chat ID.
 * For this hackathon, we fetch the first user's chat ID or log it.
 */
async function sendUrgentAlert(message: string) {
  console.error(`[CRITICAL] INVARIANT FAILURE: ${message}`);
  
  try {
    // For hackathon, just send to the first registered user who has a telegram_chat_id
    const userRes = await db.query('SELECT telegram_chat_id FROM users WHERE telegram_chat_id IS NOT NULL LIMIT 1');
    if (userRes.rowCount && userRes.rowCount > 0) {
      const chatId = userRes.rows[0].telegram_chat_id;
      await bot.api.sendMessage(
        chatId,
        `🚨 <b>SYSTEM INVARIANT FAILED</b> 🚨\n\n${message}`,
        { parse_mode: 'HTML' }
      );
    }
  } catch (err) {
    console.error('[invariants] Failed to send telegram alert:', err);
  }
}

/**
 * 1. Balance Integrity
 * Verifies SUM(ledger_entries.amount) matches ledger_accounts.current_balance for every account.
 */
export async function checkBalanceIntegrity() {
  const query = `
    SELECT 
      a.id, 
      a.type, 
      a.current_balance,
      COALESCE(SUM(
        CASE 
          WHEN e.direction = 'credit' THEN e.amount 
          WHEN e.direction = 'debit' THEN -e.amount 
          ELSE 0 
        END
      ), 0) as calculated_balance
    FROM ledger_accounts a
    LEFT JOIN ledger_entries e ON a.id = e.account_id
    GROUP BY a.id, a.type, a.current_balance
    HAVING a.current_balance != COALESCE(SUM(
      CASE 
        WHEN e.direction = 'credit' THEN e.amount 
        WHEN e.direction = 'debit' THEN -e.amount 
        ELSE 0 
      END
    ), 0)
  `;

  const res = await db.query(query);

  if (res.rowCount && res.rowCount > 0) {
    const offender = res.rows[0];
    const msg = `Balance Integrity Check Failed for account <code>${offender.id}</code> (${offender.type}).\nExpected: ${offender.calculated_balance}\nActual: ${offender.current_balance}`;
    await sendUrgentAlert(msg);
    throw new InvariantError(msg);
  }
}

/**
 * 2. Zero-Sum Validation
 * Verifies that total system credits exactly equal total system debits across all accounts globally.
 */
export async function checkZeroSum() {
  const query = `
    SELECT 
      SUM(CASE WHEN direction = 'credit' THEN amount ELSE 0 END) as total_credits,
      SUM(CASE WHEN direction = 'debit' THEN amount ELSE 0 END) as total_debits
    FROM ledger_entries
  `;

  const res = await db.query(query);
  const row = res.rows[0];
  const totalCredits = BigInt(row.total_credits || 0);
  const totalDebits = BigInt(row.total_debits || 0);

  if (totalCredits !== totalDebits) {
    const msg = `Zero-Sum Check Failed!\nTotal Credits: ${totalCredits}\nTotal Debits: ${totalDebits}\nDelta: ${totalCredits - totalDebits}`;
    await sendUrgentAlert(msg);
    throw new InvariantError(msg);
  }
}

/**
 * 3. Overdraft Guard
 * Checks for any wallet with a negative balance.
 */
export async function checkOverdrafts() {
  const query = `
    SELECT id, type, current_balance 
    FROM ledger_accounts 
    WHERE current_balance < 0
    AND type NOT IN ('nomba_pool', 'float_pool')
  `;

  const res = await db.query(query);

  if (res.rowCount && res.rowCount > 0) {
    const offender = res.rows[0];
    const msg = `Overdraft Check Failed!\nAccount <code>${offender.id}</code> (${offender.type}) has a negative balance of ${offender.current_balance}`;
    await sendUrgentAlert(msg);
    throw new InvariantError(msg);
  }
}

/**
 * Runs all invariant checks sequentially.
 */
export async function runAllInvariants() {
  console.log('[invariants] Running system integrity checks...');
  await checkBalanceIntegrity();
  await checkZeroSum();
  await checkOverdrafts();
  console.log('[invariants] All integrity checks passed.');
}
