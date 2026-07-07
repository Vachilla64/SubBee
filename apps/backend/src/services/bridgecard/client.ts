import { config } from '../../config';
import crypto from 'crypto';

export interface CardholderKYCPayload {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  dob: string; // YYYY-MM-DD
  bvn: string;
  addressStreet: string;
  addressState: string;
  addressLga: string;
  addressPostalCode: string;
  selfieUrl?: string;
}

export interface BridgecardCardResponse {
  cardId: string;
  last4: string;
  brand: string;
  status: 'active' | 'frozen' | 'inactive';
}

export interface CardSecureDetails {
  pan: string;
  cvv: string;
  expiryMonth: string;
  expiryYear: string;
}

class BridgecardClient {
  private baseURL: string;
  private token: string;
  private secretKey: string;
  private mockMode: boolean;

  constructor() {
    this.baseURL = config.BRIDGECARD_BASE_URL;
    this.token = config.BRIDGECARD_TOKEN;
    this.secretKey = config.BRIDGECARD_SECRET_KEY;
    // Activate Mock Mode if either credential is empty
    this.mockMode = !this.token || !this.secretKey;

    if (this.mockMode) {
      console.log('[bridgecard/client] ℹ️ API credentials missing. Initializing in MOCK MODE.');
    }
  }

  // Onboard Cardholder (KYC)
  async registerCardholder(payload: CardholderKYCPayload): Promise<string> {
    if (this.mockMode) {
      const mockId = `mock_ch_${crypto.randomUUID().substring(0, 8)}`;
      console.log('[bridgecard/client] [MOCK] Registering cardholder:', { payload, generatedId: mockId });
      return mockId;
    }

    const response = await fetch(`${this.baseURL}/cardholder`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        first_name: payload.firstName,
        last_name: payload.lastName,
        email: payload.email,
        phone_number: payload.phone,
        dob: payload.dob,
        id_type: 'BVN',
        id_no: payload.bvn,
        address: {
          street: payload.addressStreet,
          city: payload.addressLga,
          state: payload.addressState,
          country: 'NG',
          postal_code: payload.addressPostalCode
        },
        selfie_image: payload.selfieUrl || 'https://subbee.app/default-selfie.png'
      })
    });

    const result = await this.handleResponse<{ cardholder_id: string }>(response, 'registerCardholder');
    return result.cardholder_id;
  }

  // Create Virtual Card (Lazy creation)
  async createVirtualCard(cardholderId: string): Promise<BridgecardCardResponse> {
    if (this.mockMode) {
      const mockCardId = `mock_card_${crypto.randomUUID().substring(0, 8)}`;
      console.log('[bridgecard/client] [MOCK] Creating virtual card for cardholder:', cardholderId);
      return {
        cardId: mockCardId,
        last4: '2345',
        brand: 'mastercard',
        status: 'active'
      };
    }

    const response = await fetch(`${this.baseURL}/card`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        cardholder_id: cardholderId,
        card_type: 'virtual',
        card_brand: 'mastercard',
        currency: 'NGN',
        pin: '1234' // Default activation pin
      })
    });

    const result = await this.handleResponse<any>(response, 'createVirtualCard');
    return {
      cardId: result.card_id,
      last4: result.last_4 || '2345',
      brand: result.card_brand || 'mastercard',
      status: 'active'
    };
  }

  // Reveal secure card details (PAN/CVV)
  async getCardSecureDetails(cardId: string): Promise<CardSecureDetails> {
    if (this.mockMode) {
      console.log('[bridgecard/client] [MOCK] Fetching secure card details:', cardId);
      return {
        pan: '5123456789012345',
        cvv: '731',
        expiryMonth: '08',
        expiryYear: '29'
      };
    }

    const response = await fetch(`${this.baseURL}/card/secure-details/${cardId}`, {
      method: 'GET',
      headers: this.getHeaders()
    });

    const result = await this.handleResponse<any>(response, 'getCardSecureDetails');
    return {
      pan: result.pan,
      cvv: result.cvv,
      expiryMonth: result.expiry_month,
      expiryYear: result.expiry_year
    };
  }

  // Freeze Virtual Card
  async freezeCard(cardId: string): Promise<boolean> {
    if (this.mockMode) {
      console.log('[bridgecard/client] [MOCK] Freezing card:', cardId);
      return true;
    }

    const response = await fetch(`${this.baseURL}/card/${cardId}/freeze`, {
      method: 'PATCH',
      headers: this.getHeaders()
    });

    await this.handleResponse<any>(response, 'freezeCard');
    return true;
  }

  // Unfreeze Virtual Card
  async unfreezeCard(cardId: string): Promise<boolean> {
    if (this.mockMode) {
      console.log('[bridgecard/client] [MOCK] Unfreezing card:', cardId);
      return true;
    }

    const response = await fetch(`${this.baseURL}/card/${cardId}/unfreeze`, {
      method: 'PATCH',
      headers: this.getHeaders()
    });

    await this.handleResponse<any>(response, 'unfreezeCard');
    return true;
  }

  // Fund Virtual Card (JIT funding)
  async fundCard(cardId: string, amountKobo: number, reference: string): Promise<boolean> {
    const amountNaira = amountKobo / 100;

    if (this.mockMode) {
      console.log('[bridgecard/client] [MOCK] Triggering async card funding request:', { cardId, amountNaira, reference });
      
      // Simulate Bridgecard asynchronous webhook response after 2 seconds
      setTimeout(async () => {
        try {
          const webhookPayload = {
            event: 'card.transaction.success',
            data: {
              card_id: cardId,
              transaction_reference: reference,
              amount: amountNaira,
              currency: 'NGN',
              status: 'success'
            }
          };

          console.log('[bridgecard/client] [MOCK] Dispatching simulated webhook call...');
          await fetch(`http://localhost:${config.PORT}/webhooks/bridgecard`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-bridgecard-mock': 'true' // Helper for signature bypass in Mock Mode
            },
            body: JSON.stringify(webhookPayload)
          });
        } catch (e: any) {
          console.error('[bridgecard/client] [MOCK] Webhook simulation failed:', e.message);
        }
      }, 2000);

      return true;
    }

    const response = await fetch(`${this.baseURL}/card/fund`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        card_id: cardId,
        amount: amountNaira,
        transaction_reference: reference
      })
    });

    await this.handleResponse<any>(response, 'fundCard');
    return true;
  }

  // Private helpers
  private getHeaders(): Record<string, string> {
    const formattedToken = this.token.startsWith('Bearer ') ? this.token : `Bearer ${this.token}`;
    return {
      'Content-Type': 'application/json',
      'token': formattedToken,
      'clientSecret': this.secretKey
    };
  }

  private async handleResponse<T>(response: Response, methodName: string): Promise<T> {
    const text = await response.text();
    if (!response.ok) {
      throw new Error(`[bridgecard/${methodName}] API request failed: HTTP ${response.status}. Response: ${text}`);
    }
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new Error(`[bridgecard/${methodName}] API returned invalid JSON. Response: ${text}`);
    }
  }
}

export const bridgecard = new BridgecardClient();
