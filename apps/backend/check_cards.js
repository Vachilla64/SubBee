const { Client } = require('pg');

async function checkCards() {
  const client = new Client({ connectionString: 'postgresql://postgres:password@localhost:5432/subbee' });
  await client.connect();

  console.log('\n--- CARDHOLDERS ---');
  const ch = await client.query('SELECT id, user_id, bridgecard_cardholder_id, status FROM cardholders');
  console.table(ch.rows);

  console.log('\n--- CARDS ---');
  const cards = await client.query('SELECT id, user_id, bridgecard_card_id, last4, status FROM cards');
  console.table(cards.rows);

  await client.end();
}

checkCards().catch(console.error);
