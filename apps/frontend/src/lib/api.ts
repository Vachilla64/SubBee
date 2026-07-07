export const api = {
  async getBalance(email: string) {
    const res = await fetch(`/api/balance?email=${email}`, { headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' } });
    return res.json();
  },
  async getCard(email: string) {
    const res = await fetch(`/api/card?email=${email}`, { headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' } });
    return res.json();
  },
  async getSubscriptions(email: string) {
    const res = await fetch(`/api/subscriptions?email=${email}`, { headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' } });
    return res.json();
  },
  async auth(name: string, email: string) {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email })
    });
    return res.json();
  },
  async getDepositInfo(email: string) {
    const res = await fetch(`/api/deposit/info?email=${email}`, { headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' } });
    return res.json();
  },
  async deposit(email: string, amountNaira: number) {
    const res = await fetch('/api/deposit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, amountNaira })
    });
    return res.json();
  },
  async submitKyc(email: string, kycData: any) {
    const res = await fetch('/api/kyc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, ...kycData })
    });
    return res.json();
  },
  async requestCard(email: string, pin: string = '1234') {
    const res = await fetch('/api/card', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, pin })
    });
    return res.json();
  },
  async toggleCardFreeze(cardId: string, isFrozen: boolean) {
    const endpoint = isFrozen ? '/api/card/unfreeze' : '/api/card/freeze';
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardId })
    });
    return res.json();
  },
  async addSubscription(data: any) {
    const res = await fetch('/api/subscriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  async deleteSubscription(id: string) {
    const res = await fetch(`/api/subscriptions/${id}`, { method: 'DELETE' });
    return res.json();
  },
  async getTrustMetrics() {
    const res = await fetch('/api/ops/trust-metrics', { headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' } });
    return res.json();
  }
};
