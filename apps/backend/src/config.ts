import 'dotenv/config';

// Define the shape of our validated backend environment variables
interface Config {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  DATABASE_URL: string;
  REDIS_URL: string;
  NOMBA_BASE_URL: string;
  NOMBA_CLIENT_ID: string;
  NOMBA_CLIENT_SECRET: string;
  NOMBA_ACCOUNT_ID: string;
  NOMBA_SUB_ACCOUNT_ID: string;
  NOMBA_WEBHOOK_SECRET: string;
  TELEGRAM_BOT_TOKEN: string;
  BRIDGECARD_BASE_URL: string;
  BRIDGECARD_TOKEN: string;
  BRIDGECARD_SECRET_KEY: string;
  BRIDGECARD_WEBHOOK_SECRET: string;
}

// Read raw environment variables
const rawConfig = {
  NODE_ENV: (process.env.NODE_ENV ?? 'development') as 'development' | 'production' | 'test',
  PORT: parseInt(process.env.PORT ?? '3000', 10),
  DATABASE_URL: process.env.DATABASE_URL,
  REDIS_URL: process.env.REDIS_URL,
  NOMBA_BASE_URL: process.env.NOMBA_BASE_URL ?? 'https://sandbox.nomba.com',
  NOMBA_CLIENT_ID: process.env.NOMBA_CLIENT_ID,
  NOMBA_CLIENT_SECRET: process.env.NOMBA_CLIENT_SECRET,
  NOMBA_ACCOUNT_ID: process.env.NOMBA_ACCOUNT_ID,
  NOMBA_SUB_ACCOUNT_ID: process.env.NOMBA_SUB_ACCOUNT_ID,
  NOMBA_WEBHOOK_SECRET: process.env.NOMBA_WEBHOOK_SECRET ?? 'NombaHackathon2026',
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  BRIDGECARD_BASE_URL: process.env.BRIDGECARD_BASE_URL ?? 'https://issuecards.api.bridgecard.co/v1/issuing/sandbox',
  BRIDGECARD_TOKEN: process.env.BRIDGECARD_TOKEN ?? '',
  BRIDGECARD_SECRET_KEY: process.env.BRIDGECARD_SECRET_KEY ?? '',
  BRIDGECARD_WEBHOOK_SECRET: process.env.BRIDGECARD_WEBHOOK_SECRET ?? '',
};

// Define variables that MUST be populated for the server to operate safely
const REQUIRED_KEYS: Array<keyof typeof rawConfig> = [
  'DATABASE_URL',
  'REDIS_URL',
  'NOMBA_CLIENT_ID',
  'NOMBA_CLIENT_SECRET',
  'NOMBA_ACCOUNT_ID',
  'NOMBA_SUB_ACCOUNT_ID',
  'TELEGRAM_BOT_TOKEN',
];

const missingKeys = REQUIRED_KEYS.filter((key) => !rawConfig[key]);

if (missingKeys.length > 0) {
  // timingSafe — fail immediately at boot so deployment crashes early if variables are missing
  throw new Error(`[config] Boot failed. Missing required environment variables: ${missingKeys.join(', ')}`);
}

export const config: Config = rawConfig as Config;
