import { db } from './src/db';

async function reset() {
  try {
    await db.query("UPDATE users SET kyc_status = 'none'");
    await db.query('DELETE FROM cardholders');
    await db.query('DELETE FROM cards');
    console.log('Reset complete');
  } catch (err) {
    console.error('Reset error:', err);
  } finally {
    process.exit(0);
  }
}

reset();
