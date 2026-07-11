import { config } from '../../config';
import { nombaAuth } from './auth';

export interface BankOption {
  code: string;
  name: string;
}

interface NombaBanksResponse {
  code: string;
  description: string;
  data: BankOption[];
}

// Bank codes rarely change — cache in-process rather than round-tripping Nomba on every load.
let cachedBanks: BankOption[] | null = null;

export async function listBanks(): Promise<BankOption[]> {
  if (cachedBanks) return cachedBanks;

  const token = await nombaAuth.getAccessToken();
  const response = await fetch(`${config.NOMBA_BASE_URL}/v1/transfers/banks`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'accountId': config.NOMBA_ACCOUNT_ID,
    },
  });

  if (!response.ok) {
    throw new Error(`Unable to fetch bank list: ${await response.text()}`);
  }

  const result = (await response.json()) as NombaBanksResponse;
  if (result.code !== '00' || !result.data) {
    throw new Error(result.description || `API error code ${result.code}`);
  }

  cachedBanks = result.data;
  return cachedBanks;
}

interface LookupResult {
  accountNumber: string;
  accountName: string;
}

interface NombaLookupResponse {
  code: string;
  description: string;
  data: LookupResult;
}

export async function lookupBankAccount(accountNumber: string, bankCode: string): Promise<LookupResult> {
  const token = await nombaAuth.getAccessToken();

  const response = await fetch(`${config.NOMBA_BASE_URL}/v1/transfers/bank/lookup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'accountId': config.NOMBA_ACCOUNT_ID,
    },
    body: JSON.stringify({ accountNumber, bankCode }),
  });

  if (!response.ok) {
    throw new Error(`Could not verify that account: ${await response.text()}`);
  }

  const result = (await response.json()) as NombaLookupResponse;
  if (result.code !== '00' || !result.data) {
    throw new Error(result.description || `API error code ${result.code}`);
  }

  return result.data;
}

interface SendTransferParams {
  amountKobo: bigint;
  accountNumber: string;
  accountName: string;
  bankCode: string;
  merchantTxRef: string;
  narration?: string;
}

interface NombaTransferResponse {
  code: string;
  description: string;
  message: string;
  status: boolean;
  data?: {
    id: string;
    status: string;
    type: string;
    amount: number;
    meta: Record<string, unknown>;
    timeCreated: string;
  };
}

export type TransferOutcome =
  | { outcome: 'success'; providerTransactionId: string }
  | { outcome: 'pending' };

/**
 * Nomba's transfer API takes amount in Naira, not kobo — every other Nomba
 * call in this codebase avoids amounts entirely, so this is the first place
 * that conversion happens.
 */
export async function sendBankTransfer(params: SendTransferParams): Promise<TransferOutcome> {
  const token = await nombaAuth.getAccessToken();
  const amountNaira = Number(params.amountKobo) / 100;

  const response = await fetch(`${config.NOMBA_BASE_URL}/v2/transfers/bank/${config.NOMBA_SUB_ACCOUNT_ID}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'accountId': config.NOMBA_ACCOUNT_ID,
    },
    body: JSON.stringify({
      amount: amountNaira,
      accountNumber: params.accountNumber,
      accountName: params.accountName,
      bankCode: params.bankCode,
      merchantTxRef: params.merchantTxRef,
      narration: params.narration ?? 'SubBee wallet withdrawal',
      senderName: 'SubBee',
    }),
  });

  // Nomba's own docs: 201 means "unable to process response, rely on the webhook" —
  // the transfer was accepted, not rejected. Never treat this as a failure.
  if (response.status === 201) {
    return { outcome: 'pending' };
  }

  if (!response.ok) {
    throw new Error(`Transfer failed: ${await response.text()}`);
  }

  const result = (await response.json()) as NombaTransferResponse;
  if (!result.status || (result.code !== '00' && result.code !== '200')) {
    throw new Error(result.description || result.message || `API error code ${result.code}`);
  }

  if (result.data?.status === 'SUCCESS') {
    return { outcome: 'success', providerTransactionId: result.data.id };
  }
  return { outcome: 'pending' };
}
