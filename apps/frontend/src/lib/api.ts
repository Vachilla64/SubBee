/**
 * SubBee Frontend-Backend API Integration Layer
 * 
 * FRONTEND AGENT NOTES:
 * This file contains the pre-wired API calls to the Express backend.
 * Use these functions when building the 3-tab UI layout.
 * 
 * CRITICAL RULE: The backend expects money in KOBO for all GET responses, 
 * but accepts NAIRA for some POST requests (like Add Subscription). 
 * The comments below specify the exact behavior for each endpoint.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';

export const api = {
  /**
   * 1. AUTHENTICATION (Welcome Screen)
   * ---------------------------------------------------------
   * Call this when the user enters their email on the login/signup screen.
   * It creates the user and provisions their ledger accounts.
   * Store the returned email in React Context/State for subsequent calls.
   */
  async auth(name: string, email: string) {
    const res = await fetch(`${API_BASE_URL}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email })
    });
    if (!res.ok) throw new Error(await res.text());
    // Returns: { id, name, email, kycStatus }
    return res.json();
  },

  /**
   * 2. KYC ONBOARDING (Identity Verification Form)
   * ---------------------------------------------------------
   * Call this when the user submits their BVN and address details.
   * This registers them with Bridgecard and spins up a Nomba deposit account.
   */
  async submitKyc(email: string, kycData: any) {
    const res = await fetch(`${API_BASE_URL}/kyc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, ...kycData })
    });
    if (!res.ok) throw new Error(await res.text());
    // Returns: { status: 'success', cardholderId: 'uuid' }
    return res.json();
  },

  /**
   * 3. DASHBOARD HERO (Balance & Profile Data)
   * ---------------------------------------------------------
   * Call this on mount of the Dashboard (Tab 1).
   * NOTE: balanceKobo must be divided by 100 to show Naira in the UI.
   * The bankAccount object is used for the "Fund Wallet" screen in Tab 2.
   */
  async getBalance(email: string) {
    const res = await fetch(`${API_BASE_URL}/balance?email=${encodeURIComponent(email)}`, { headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' } });
    if (!res.ok) throw new Error(await res.text());
    // Returns: { balanceKobo, bankAccount: { bankName, accountNumber }, kycStatus, telegramConnected, telegramBotUsername }
    return res.json();
  },

  /**
   * 4. DASHBOARD VIRTUAL CARD (Card Block)
   * ---------------------------------------------------------
   * Call this on mount of the Dashboard (Tab 1) to render the card block.
   * If status is 'inactive', show the "Get a Card" UI.
   * If status is 'active', show the masked card (last4, brand) and balance.
   */
  async getCard(email: string) {
    const res = await fetch(`${API_BASE_URL}/card?email=${encodeURIComponent(email)}`, { headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' } });
    if (!res.ok) throw new Error(await res.text());
    // Returns: { status: 'active' | 'inactive' | 'frozen', cardId, last4, brand, balanceKobo }
    return res.json();
  },

  /**
   * 5. CREATE VIRTUAL CARD
   * ---------------------------------------------------------
   * Call this when the user clicks "Get a Card" and sets a PIN.
   * User MUST have completed KYC first.
   */
  async requestCard(email: string, pin: string = '1234') {
    const res = await fetch(`${API_BASE_URL}/card`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, pin })
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  /**
   * 5.1 DISCOVERY MODE (Unlock Card)
   * ---------------------------------------------------------
   * Call this to temporarily fund the card with a safety float
   * so the user can bind it to Netflix, Spotify, etc., for auto-detection.
   */
  async unlockCard(email: string) {
    const res = await fetch(`${API_BASE_URL}/card/unlock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  /**
   * 6. CARD MANAGEMENT (Freeze/Unfreeze/Reveal)
   * ---------------------------------------------------------
   * Use these for the card settings modal.
   * REVEAL: Returns the full PAN and CVV. Do NOT store these in state longer than needed.
   */
  async toggleCardFreeze(cardId: string, isFrozen: boolean) {
    const endpoint = isFrozen ? `${API_BASE_URL}/card/unfreeze` : `${API_BASE_URL}/card/freeze`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardId })
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async revealCardDetails(cardId: string) {
    const res = await fetch(`${API_BASE_URL}/card/reveal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardId })
    });
    if (!res.ok) throw new Error(await res.text());
    // Returns raw Bridgecard secure data (card_number, cvv, expiry_month, expiry_year)
    return res.json();
  },

  /**
   * 7. SUBSCRIPTIONS (Tab 1 - Bottom Half)
   * ---------------------------------------------------------
   * List, Create, Edit, and Delete subscriptions.
   */
  async getSubscriptions(email: string) {
    const res = await fetch(`${API_BASE_URL}/subscriptions?email=${encodeURIComponent(email)}`, { headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' } });
    if (!res.ok) throw new Error(await res.text());
    // Returns: Array of { id, merchantId, merchantName, amountKobo, billingDay, remindersEnabled, isActive, isAutoDetected, needsConfirmation }
    return res.json();
  },

  // NOTE: amountNaira is expected here by the backend (it converts to Kobo internally)
  async addSubscription(data: any) {
    const res = await fetch(`${API_BASE_URL}/subscriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  // Use to Pause (isActive: false) or Resume (isActive: true)
  async editSubscription(id: string, updates: { isActive?: boolean; amountNaira?: number; billingDay?: number; remindersEnabled?: boolean }) {
    const res = await fetch(`${API_BASE_URL}/subscriptions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async deleteSubscription(id: string) {
    const res = await fetch(`${API_BASE_URL}/subscriptions/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  /**
   * 8. ACTIVITY & LEDGER (Tab 2)
   * ---------------------------------------------------------
   * Call this on mount of the Activity tab to show the transaction history.
   */
  async getTransactions(email: string) {
    const res = await fetch(`${API_BASE_URL}/transactions?email=${encodeURIComponent(email)}`, { headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' } });
    if (!res.ok) throw new Error(await res.text());
    // Returns: Array of { id, direction ('credit'|'debit'), amountKobo, sourceType ('deposit'|'card_funding'|etc), createdAt }
    return res.json();
  },

  /**
   * 9. DEPOSIT SIMULATOR (Debug/Helper)
   * ---------------------------------------------------------
   */
  async getDepositInfo(email: string) {
    const res = await fetch(`${API_BASE_URL}/deposit/info?email=${encodeURIComponent(email)}`, { headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' } });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async deposit(email: string, amountNaira: number) {
    const res = await fetch(`${API_BASE_URL}/deposit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, amountNaira })
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async getTrustMetrics() {
    const res = await fetch(`${API_BASE_URL}/ops/trust-metrics`, { headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' } });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
};
