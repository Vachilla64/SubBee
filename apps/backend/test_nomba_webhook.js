const crypto = require('crypto');
const { Client } = require('pg');

// This script securely simulates a Nomba webhook to your local server.
// It auto-fetches your user ID from the database to ensure the transaction
// routes to the correct wallet.

const NOMBA_WEBHOOK_SECRET = 'NombaHackathon2026'; // From .env
const TARGET_URL = 'http://localhost:3000/webhooks/nomba';

async function sendTestWebhook() {
  // 1. Fetch a real user ID from the database
  let userId;
  const dbClient = new Client({
    connectionString: 'postgresql://postgres:password@localhost:5432/subbee'
  });
  
  try {
    await dbClient.connect();
    const res = await dbClient.query('SELECT id FROM users LIMIT 1');
    if (res.rows.length === 0) {
      console.error('❌ No users found in database. Please log in to SubBee Web Dashboard first.');
      process.exit(1);
    }
    userId = res.rows[0].id;
  } catch (err) {
    console.error('❌ Database connection failed. Is PostgreSQL running?', err.message);
    process.exit(1);
  } finally {
    await dbClient.end();
  }

  console.log(`\n👤 Using User ID (accountRef): ${userId}`);

  // 2. Prepare Webhook Payload
  const transactionId = 'txn_' + Date.now();
  
  // Notice that accountRef is embedded in the transaction object as expected by deposit.worker.ts
  const payload = {
    eventType: "transaction.success",
    requestId: "req_" + Date.now(),
    data: {
      transaction: {
        transactionId: transactionId,
        amount: 5000.00, // This is expected in kobo usually, wait, SubBee worker treats it directly as kobo. So 5000 kobo = ₦50. Wait, Bridgecard/Nomba sends amounts in 2 decimals? Let's send 500000 (₦5000)
        currency: "NGN",
        status: "SUCCESS",
        accountRef: userId,
        timeCreated: new Date().toISOString()
      }
    }
  };

  const rawBody = JSON.stringify(payload);

  // 3. Generate HMAC SHA-512 signature
  const signature = crypto
    .createHmac('sha512', NOMBA_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');

  console.log(`🚀 Sending simulated Nomba webhook to ${TARGET_URL}...`);
  console.log(`   Transaction ID: ${transactionId}`);
  
  // 4. Send HTTP Request
  try {
    const response = await fetch(TARGET_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-nomba-signature': signature
      },
      body: rawBody
    });

    const text = await response.text();
    console.log(`\n✅ Response [${response.status}]:`, text);
    
    if (response.ok) {
      console.log('\n🐝 Webhook accepted! Check the backend terminal to see BullMQ process the deposit.');
    } else {
      console.log('\n❌ Webhook failed. Is the backend running?');
    }
  } catch (error) {
    console.error('\n💥 Error connecting to backend:', error.message);
    console.log('   Make sure you are running `pnpm run dev` in the backend folder.');
  }
}

sendTestWebhook();
