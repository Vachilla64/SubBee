-- ─────────────────────────────────────────────────────────────────────────────
-- SubBee Database Schema Migration 004 — Withdrawals (wallet -> external bank)
-- ─────────────────────────────────────────────────────────────────────────────

-- New ledger_entries source types for outbound bank transfers.
-- Must run standalone (not batched with statements that use the new label
-- in the same transaction) — fine here since this file only adds schema.
ALTER TYPE ledger_source_type_enum ADD VALUE IF NOT EXISTS 'withdrawal';
ALTER TYPE ledger_source_type_enum ADD VALUE IF NOT EXISTS 'withdrawal_reversal';

CREATE TABLE IF NOT EXISTS withdrawals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount_kobo BIGINT NOT NULL CHECK (amount_kobo > 0),
  bank_code VARCHAR(20) NOT NULL,
  account_number VARCHAR(20) NOT NULL,
  account_name VARCHAR(255) NOT NULL,
  merchant_tx_ref VARCHAR(255) UNIQUE NOT NULL, -- idempotency key sent to Nomba
  provider_transaction_id VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, successful, failed
  failure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);

CREATE TRIGGER trg_withdrawals_updated_at
BEFORE UPDATE ON withdrawals
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
