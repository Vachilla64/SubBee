// Using native fetch

async function run() {
  const email = 'alfredvachila@gmail.com';
  const name = 'Valentine Alfred';

  console.log('1. Authenticating...');
  const authRes = await fetch('http://localhost:3000/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, name })
  });
  const user = await authRes.json();
  console.log('User:', user);

  console.log('\n2. Submitting KYC...');
  const kycRes = await fetch('http://localhost:3000/api/kyc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      firstName: 'Valentine',
      lastName: 'Alfred',
      phone: '08168233481',
      dob: '1995-10-10',
      address: 'No 23 Asajor Way Sangotedo Ajash',
      state: 'Lagos',
      lga: 'Eti-Osa',
      postalCode: '106104',
      bvn: '22416434444',
      selfieUrl: 'https://subbee.app/default-selfie.png'
    })
  });
  
  const kycData = await kycRes.json();
  if (!kycRes.ok) {
    console.error('KYC Failed:', kycData);
    return;
  }
  console.log('KYC Success:', kycData);

  console.log('\n3. Requesting Virtual Card (with PIN)...');
  const cardRes = await fetch('http://localhost:3000/api/card', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, pin: '1234' })
  });
  
  const cardData = await cardRes.json();
  if (!cardRes.ok) {
    console.error('Card Failed:', cardData);
    return;
  }
  console.log('Card Issued Successfully:', cardData);
}

run();
