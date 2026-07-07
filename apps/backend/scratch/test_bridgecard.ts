import 'dotenv/config';

const token = process.env.BRIDGECARD_TOKEN;
const baseURL = 'https://issuecards.api.bridgecard.co/v1/issuing/sandbox';

async function testEndpoint(path: string) {
  try {
    const res = await fetch(`${baseURL}${path}`, {
      headers: {
        'token': `Bearer ${token}`,
        'accept': 'application/json'
      }
    });
    console.log(`GET ${path} -> Status: ${res.status}`);
    console.log(await res.text());
  } catch (err) {
    console.error(`Error on ${path}:`, err);
  }
}

async function run() {
  await testEndpoint('/issuing_wallet?currency=NGN');
  await testEndpoint('/cards/issuing_wallet?currency=NGN');
  await testEndpoint('/cards/get_issuing_wallet_balance?currency=NGN');
  await testEndpoint('/naira_cards/issuing_wallet?currency=NGN');
}

run();
