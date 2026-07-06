import { config } from '../../config';

interface NombaTokenResponse {
  code: string;
  description: string;
  data: {
    accessToken: string;
    tokenType: string;
    expiresIn: number; // in seconds
    refreshToken: string;
  };
}

class NombaTokenManager {
  private accessToken: string | null = null;
  private tokenExpiryTime: number | null = null; // timestamp in ms

  /**
   * Returns a valid Nomba access token.
   * If cached token is missing or near expiry, requests a new one.
   */
  async getAccessToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiryTime && Date.now() < this.tokenExpiryTime) {
      return this.accessToken;
    }

    await this.refreshAccessToken();
    if (!this.accessToken) {
      throw new Error('[nomba/auth] Failed to retrieve access token.');
    }
    return this.accessToken;
  }

  /**
   * Requests a fresh JWT access token using Nomba Client Credentials
   */
  private async refreshAccessToken(): Promise<void> {
    const start = Date.now();
    const url = `${config.NOMBA_BASE_URL}/v1/auth/token/issue`;

    try {
      console.log('[nomba/auth] Requesting new access token...');
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Parent account ID must be sent in header
          'accountId': config.NOMBA_ACCOUNT_ID,
        },
        body: JSON.stringify({
          grantType: 'client_credentials',
          clientId: config.NOMBA_CLIENT_ID,
          clientSecret: config.NOMBA_CLIENT_SECRET,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      // cast through Record so we can safely probe field names before trusting the shape
      const raw = (await response.json()) as Record<string, unknown>;
      const payload = raw as unknown as NombaTokenResponse;

      if (payload.code !== '00') {
        throw new Error(`API error code ${payload.code}: ${payload.description}`);
      }

      // Nomba sometimes nests token under data.access_token (snake_case) — handle both
      const dataObj = raw['data'] as Record<string, unknown> | undefined;
      const token: string | undefined =
        (dataObj?.['accessToken'] as string | undefined) ??
        (dataObj?.['access_token'] as string | undefined);

      if (!token) {
        throw new Error(`Token missing in response: ${JSON.stringify(raw)}`);
      }

      this.accessToken = token;

      // Caching logic: Refresh 10 minutes before actual expiry
      const bufferMs = 10 * 60 * 1000;
      const expiresIn = (dataObj?.['expiresIn'] as number | undefined) ?? 3600;
      const lifespanMs = expiresIn * 1000;
      this.tokenExpiryTime = Date.now() + lifespanMs - bufferMs;

      console.log('[nomba/auth] Access token refreshed successfully', {
        duration: `${Date.now() - start}ms`,
        expiresIn: `${expiresIn}s`,
      });
    } catch (error) {
      console.error('[nomba/auth] Token acquisition failed:', error);
      // Reset state so next request attempts to acquire fresh token
      this.accessToken = null;
      this.tokenExpiryTime = null;
      throw error;
    }
  }
}

export const nombaAuth = new NombaTokenManager();
