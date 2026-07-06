-- ─────────────────────────────────────────────────────────────────────────────
-- SubBee Database Schema Migration 001
--
-- Design Notes:
--  - Double-entry ledger architecture.
--  - All money values stored in BIGINT as kobo (1 Naira = 100 kobo) to prevent
--    floating point rounding errors.
--  - Unique indices for idempotency webhooks and unique house accounts.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Enable UUID Extension (standard practice for secure non-sequential keys)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Core Users
CREATE TYPE kyc_status_enum AS ENUM ('none', 'pending', 'manual_review', 'verified', 'failed');

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(50) UNIQUE,
  telegram_chat_id VARCHAR(100) UNIQUE,
  whatsapp_number VARCHAR(100) UNIQUE,
  kyc_status kyc_status_enum NOT NULL DEFAULT 'none',
  bvn_ref VARCHAR(255),  -- Reference or encrypted hash of BVN
  nin_ref VARCHAR(255),  -- Reference or encrypted hash of NIN
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Ledger Accounts
-- Tracks balances for user wallets, cards, and house clearing accounts.
CREATE TYPE ledger_account_type_enum AS ENUM (
  'wallet',
  'card',
  'card_pending',
  'float_pool',     -- House account: holds SubBee's Bridgecard float pool
  'nomba_pool',     -- House account: holds incoming Nomba deposits
  'fees',           -- House account: tracks SubBee fee revenue
  'merchant_spend'  -- House account: counter-party account for merchant charges
);

CREATE TABLE IF NOT EXISTS ledger_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type ledger_account_type_enum NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'NGN',
  current_balance BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- In PostgreSQL, UNIQUE constraints allow multiple NULLs, which means multiple
-- house accounts with NULL user_id could be created. We prevent this via two indices:
-- Index 1: Enforce unique ledger types per USER
CREATE UNIQUE INDEX IF NOT EXISTS idx_ledger_accounts_user_type_currency 
  ON ledger_accounts (user_id, type, currency) 
  WHERE user_id IS NOT NULL;

-- Index 2: Enforce unique house (clearing) accounts globally
CREATE UNIQUE INDEX IF NOT EXISTS idx_ledger_accounts_house_unique 
  ON ledger_accounts (type, currency) 
  WHERE user_id IS NULL;


-- 4. Ledger Entries (APPEND ONLY - no UPDATE or DELETE permitted)
CREATE TYPE ledger_direction_enum AS ENUM ('debit', 'credit');
CREATE TYPE ledger_source_type_enum AS ENUM (
  'deposit',
  'card_funding',
  'card_funding_reversal',
  'card_spend',
  'card_unload',
  'float_topup',
  'maintenance_fee',
  'refund',
  'adjustment'
);

CREATE TABLE IF NOT EXISTS ledger_entries (
  id BIGSERIAL PRIMARY KEY,
  txn_id UUID NOT NULL, -- UUID that groups balanced ledger legs (e.g. debit user, credit pending)
  account_id UUID NOT NULL REFERENCES ledger_accounts(id) ON DELETE RESTRICT,
  direction ledger_direction_enum NOT NULL,
  amount BIGINT NOT NULL CHECK (amount > 0),
  source_type ledger_source_type_enum NOT NULL,
  source_ref VARCHAR(255) NOT NULL, -- The provider's transaction ID (e.g., Nomba transactionId)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Prevent any updates/deletes to ledger entries via trigger functions
CREATE OR REPLACE FUNCTION block_ledger_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Ledger entries are read-only and cannot be altered or removed.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_block_ledger_update
BEFORE UPDATE ON ledger_entries
FOR EACH ROW EXECUTE FUNCTION block_ledger_mutation();

CREATE TRIGGER trg_block_ledger_delete
BEFORE DELETE ON ledger_entries
FOR EACH ROW EXECUTE FUNCTION block_ledger_mutation();


-- 5. Nomba Virtual Accounts (static collections)
CREATE TABLE IF NOT EXISTS virtual_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL DEFAULT 'nomba',
  account_ref VARCHAR(255) UNIQUE NOT NULL, -- Internal unique identifier passed to provider
  bank_account_number VARCHAR(50) UNIQUE NOT NULL,
  bank_name VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- 6. Webhook Idempotency Registry
CREATE TABLE IF NOT EXISTS webhook_events (
  id BIGSERIAL PRIMARY KEY,
  provider VARCHAR(50) NOT NULL,
  event_id VARCHAR(255) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  raw_payload JSONB NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  processing_error TEXT,
  CONSTRAINT unique_provider_event UNIQUE (provider, event_id)
);
