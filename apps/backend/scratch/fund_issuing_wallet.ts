import 'dotenv/config';
import { config } from '../src/config';

async function fundIssuingWallet() {
  console.log('Funding Bridgecard Sandbox Issuing Wallet...');
  
  const token = process.env.BRIDGECARD_TOKEN || config.BRIDGECARD_TOKEN;
  
  if (!token) {
    console.error('No Bridgecard API token found in environment.');
    process.exit(1);
  }

  try {
    const response = await fetch('https://issuecards.api.bridgecard.co/v1/issuing/sandbox/cards/fund_issuing_wallet?currency=NGN', {
      method: 'PATCH',
      headers: {
        'token': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: 50000000 // 500,000 Naira
      })
    });

    const data = await response.json();
    console.log('Response Status:', response.status);
    console.log('Response Body:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Request failed:', error);
  }
}

fundIssuingWallet();
