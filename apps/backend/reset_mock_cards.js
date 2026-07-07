const { Client } = require('pg');

async function cleanMockCards() {
  const client = new Client({ connectionString: 'postgresql://postgres:password@localhost:5432/subbee' });
  await client.connect();

  console.log('Cleaning up mock card data...\n');

  // Must delete in dependency order: cards -> cardholders
  const cards = await client.query("DELETE FROM cards WHERE bridgecard_card_id LIKE 'mock_%' RETURNING id, bridgecard_card_id");
  console.log(`Deleted ${cards.rowCount} mock card(s):`, cards.rows.map(r => r.bridgecard_card_id));

  const ch = await client.query("DELETE FROM cardholders WHERE bridgecard_cardholder_id LIKE 'mock_%' RETURNING id, bridgecard_cardholder_id");
  console.log(`Deleted ${ch.rowCount} mock cardholder(s):`, ch.rows.map(r => r.bridgecard_cardholder_id));

  // Also reset the user KYC status so they can redo it
  const userId = 'da95395a-fb9e-4489-b0eb-54f50b3ea98b';
  await client.query("UPDATE users SET kyc_status = 'none' WHERE id = $1", [userId]);
  console.log(`\nReset KYC status to 'none' for user ${userId}`);

  console.log('\n✅ Done! You can now redo KYC from the web dashboard to create a real Bridgecard cardholder and card.');
  await client.end();
}

cleanMockCards().catch(console.error);
