import { config } from '../../config';
import { nombaAuth } from './auth';


interface CreateVirtualAccountParams {
  accountRef: string; // Internal User UUID
  accountName: string; // Beneficiary account name (e.g. SubBee - Wisdom Ofogba)
  bvn?: string; // Optional user's BVN
}

interface NombaAccountResponse {
  code: string;
  description: string;
  data: {
    accountReference: string;
    bankName: string;
    bankAccountNumber: string;
    accountName: string;
    currency: string;
    status: string;
  };
}

/**
 * Creates a static virtual account number for collections via Nomba
 */
export async function createNombaVirtualAccount(
  params: CreateVirtualAccountParams
): Promise<NombaAccountResponse['data']> {
  const token = await nombaAuth.getAccessToken();
  const url = `${config.NOMBA_BASE_URL}/v1/accounts/virtual`;

  // Define static account parameters
  // Crucial: Omit expiryDate variables so Nomba generates a permanent (static) account
  const payload = {
    accountRef: params.accountRef,
    accountName: params.accountName,
    currency: 'NGN',
    bvn: params.bvn || undefined,
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'accountId': config.NOMBA_ACCOUNT_ID,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      try {
        const errObj = JSON.parse(errorText);
        if (errObj.description) {
          if (errObj.description.includes('already exists')) {
            throw new Error('A virtual account is already linked to this profile. Please contact support to recover it.');
          }
          throw new Error(errObj.description);
        }
      } catch (e: any) {
        if (e.message !== errorText && !e.message.includes('Unexpected token')) throw e;
      }
      throw new Error(`Unable to verify identity: ${errorText}`);
    }

    const resData = (await response.json()) as NombaAccountResponse;

    if (resData.code !== '00' || !resData.data) {
      throw new Error(resData.description || `API error code ${resData.code}`);
    }

    console.log('[nomba/accounts] Virtual account created successfully', {
      accountRef: params.accountRef,
      bank: resData.data.bankName,
      number: resData.data.bankAccountNumber,
    });

    return resData.data;
  } catch (error) {
    console.error('[nomba/accounts] Virtual account generation failed:', error);
    throw error;
  }
}

/**
 * Expires/Deactivates a static virtual account on Nomba
 */
export async function expireNombaVirtualAccount(accountRef: string): Promise<boolean> {
  const token = await nombaAuth.getAccessToken();
  const url = `${config.NOMBA_BASE_URL}/v1/accounts/virtual/${accountRef}`;

  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'accountId': config.NOMBA_ACCOUNT_ID,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn('[nomba/accounts] Failed to expire virtual account:', errorText);
      return false;
    }

    console.log(`[nomba/accounts] Successfully expired virtual account: ${accountRef}`);
    return true;
  } catch (error) {
    console.error('[nomba/accounts] Error expiring virtual account:', error);
    return false;
  }
}
