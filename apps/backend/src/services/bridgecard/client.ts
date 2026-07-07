import { config } from '../../config';
import crypto from 'crypto';
const AES256 = require('aes-everywhere');

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
    this.secretKey = config.BRIDGECARD_SECRET_KEY;
    this.token = config.BRIDGECARD_TOKEN;
    this.mockMode = false; // We use actual sandbox APIs for M2

    if (this.mockMode) {
      console.log('[bridgecard/client] ℹ️ API credentials missing. Initializing in MOCK MODE.');
    }
  }

  // Onboard Cardholder (KYC)
  // POST /cardholder/register_cardholder_synchronously
  // Can take up to 45 seconds — caller should handle a long timeout
  async registerCardholder(payload: CardholderKYCPayload): Promise<string> {
    if (this.mockMode) {
      const mockId = `mock_ch_${crypto.randomUUID().substring(0, 8)}`;
      console.log('[bridgecard/client] [MOCK] Registering cardholder:', { payload, generatedId: mockId });
      return mockId;
    }

    // --- DEVELOPER NOTES for Bridgecard KYC Requirements ---
    // 1. Phone MUST be international format (e.g., +234...)
    // 2. house_no MUST be provided and valid
    // 3. Address MUST have a minimum of 3 characters
    
    // Format phone to international if it starts with 0
    let formattedPhone = payload.phone.trim();
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '+234' + formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+' + formattedPhone;
    }

    // Bridgecard requires house number to be present
    const houseNoMatch = payload.addressStreet.match(/\d+/);
    const houseNo = houseNoMatch ? houseNoMatch[0] : '1';

    // Address must be >= 3 characters
    const address = payload.addressStreet.length >= 3 ? payload.addressStreet : `${payload.addressStreet} str`;

    const response = await fetch(
      `${this.baseURL}/cardholder/register_cardholder_synchronously`,
      {
        method: 'POST',
        headers: this.getHeaders(),
        // docs: https://docs.bridgecard.co/reference/api-reference
        body: JSON.stringify({
          first_name: payload.firstName,
          last_name: payload.lastName,
          phone: formattedPhone,
          email_address: payload.email,  // field is email_address, not email
          address: {
            address: address,
            city: payload.addressLga,
            state: payload.addressState,
            country: 'Nigeria',
            postal_code: payload.addressPostalCode,
            house_no: houseNo
          },
          identity: {
            id_type: 'NIGERIAN_BVN_VERIFICATION',
            bvn: payload.bvn,
            selfie_image: payload.selfieUrl || 'https://subbee.app/default-selfie.png'
          },
          meta_data: {}
        }),
        signal: AbortSignal.timeout(50_000) // KYC can take up to 45s
      }
    );

    const text = await response.text();
    if (!response.ok) {
      try {
        const errorData = JSON.parse(text);
        if (errorData.message?.includes('already exists') && errorData.data?.cardholder_id) {
          console.log('[bridgecard/registerCardholder] Cardholder already exists, recovering gracefully:', errorData.data.cardholder_id);
          return errorData.data.cardholder_id;
        }
      } catch {}
      throw new Error(`[bridgecard/registerCardholder] API request failed: HTTP ${response.status}. Response: ${text}`);
    }

    try {
      const result = JSON.parse(text) as { data: { cardholder_id: string } };
      return result.data.cardholder_id;
    } catch {
      throw new Error(`[bridgecard/registerCardholder] API returned invalid JSON. Response: ${text}`);
    }
  }

  // Create Virtual Card (Lazy creation after KYC)
  // POST /cards/create_card
  async createVirtualCard(cardholderId: string, pin: string = '1234'): Promise<BridgecardCardResponse> {
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

    const encryptedPin = AES256.encrypt(pin, this.secretKey);

    const response = await fetch(`${this.baseURL}/cards/create_card`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        cardholder_id: cardholderId,
        card_type: 'virtual',
        card_brand: 'Mastercard',
        card_currency: 'NGN',
        pin: encryptedPin // AES encrypted activation pin
      })
    });

    const result = await this.handleResponse<{ data: { card_id: string; last_4: string; card_brand: string } }>(response, 'createVirtualCard');
    return {
      cardId: result.data.card_id,
      last4: result.data.last_4 || '0000',
      brand: result.data.card_brand || 'mastercard',
      status: 'active'
    };
  }

  // Reveal secure card details via Evervault relay (PAN/CVV for display only)
  // GET /cards/get_card_details (via relay for decrypted sensitive data)
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

    // Evervault relay decrypts sensitive fields on the fly
    const isProduction = !this.baseURL.includes('sandbox');
    const relayBase = isProduction
      ? 'https://issuecards-api-bridgecard-co.relay.evervault.com/v1/issuing'
      : 'https://issuecards-api-bridgecard-co.relay.evervault.com/v1/issuing/sandbox';

    const response = await fetch(`${relayBase}/cards/get_card_details?card_id=${cardId}`, {
      method: 'GET',
      headers: this.getHeaders()
    });

    const result = await this.handleResponse<{ data: Record<string, string> }>(response, 'getCardSecureDetails');
    return {
      pan: result.data['pan'] ?? '',
      cvv: result.data['cvv'] ?? '',
      expiryMonth: result.data['expiry_month'] ?? '',
      expiryYear: result.data['expiry_year'] ?? ''
    };
  }

  // Freeze Virtual Card
  // PATCH /cards/freeze_card?card_id=<id>
  async freezeCard(cardId: string): Promise<boolean> {
    if (this.mockMode) {
      console.log('[bridgecard/client] [MOCK] Freezing card:', cardId);
      return true;
    }

    const response = await fetch(`${this.baseURL}/cards/freeze_card?card_id=${cardId}`, {
      method: 'PATCH',
      headers: this.getHeaders()
    });

    await this.handleResponse<unknown>(response, 'freezeCard');
    return true;
  }

  // Unfreeze Virtual Card
  // PATCH /cards/unfreeze_card?card_id=<id>
  async unfreezeCard(cardId: string): Promise<boolean> {
    if (this.mockMode) {
      console.log('[bridgecard/client] [MOCK] Unfreezing card:', cardId);
      return true;
    }

    const response = await fetch(`${this.baseURL}/cards/unfreeze_card?card_id=${cardId}`, {
      method: 'PATCH',
      headers: this.getHeaders()
    });

    await this.handleResponse<unknown>(response, 'unfreezeCard');
    return true;
  }

  // Fund Virtual Card from issuing wallet (JIT funding)
  // POST /naira_cards/fund_card — amount is in kobo, async (confirmed by webhook)
  async fundCard(cardId: string, amountKobo: number, _reference: string): Promise<boolean> {
    if (this.mockMode) {
      const amountNaira = amountKobo / 100;
      console.log('[bridgecard/client] [MOCK] Triggering async card funding request:', { cardId, amountNaira });

      // Simulate the async webhook response after 2 seconds
      setTimeout(async () => {
        try {
          const webhookPayload = {
            event: 'naira_card_credit_event.successful',
            data: {
              card_id: cardId,
              transaction_reference: _reference,
              amount: amountKobo,
              currency: 'NGN',
              status: 'success'
            }
          };

          console.log('[bridgecard/client] [MOCK] Dispatching simulated webhook...');
          await fetch(`http://localhost:${config.PORT}/webhooks/bridgecard`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-bridgecard-mock': 'true'
            },
            body: JSON.stringify(webhookPayload)
          });
        } catch (e: any) {
          console.error('[bridgecard/client] [MOCK] Webhook simulation failed:', e.message);
        }
      }, 2000);

      return true;
    }

    // API docs: amount is in kobo, no transaction_reference field on this endpoint
    const response = await fetch(`${this.baseURL}/naira_cards/fund_naira_card`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        card_id: cardId,
        amount: amountKobo
      })
    });

    await this.handleResponse<unknown>(response, 'fundCard');
    return true;
  }

  // Fund the sandbox issuing wallet (sandbox prerequisite before any card can be funded)
  // PATCH /cards/fund_issuing_wallet?currency=NGN
  async fundIssuingWallet(amountKobo: number): Promise<void> {
    if (this.mockMode) {
      console.log('[bridgecard/client] [MOCK] Funding issuing wallet:', amountKobo);
      return;
    }

    const response = await fetch(`${this.baseURL}/cards/fund_issuing_wallet?currency=NGN`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ amount: String(amountKobo) })
    });

    await this.handleResponse<unknown>(response, 'fundIssuingWallet');
  }

  // Private helpers
  private getHeaders(): Record<string, string> {
    // Docs confirm: header key is 'token', value is 'Bearer <token>'
    // clientSecret is NOT a header — it's only used for AES PIN encryption and webhook verification
    const formattedToken = this.token.startsWith('Bearer ') ? this.token : `Bearer ${this.token}`;
    return {
      'Content-Type': 'application/json',
      'accept': 'application/json',
      'token': formattedToken
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
