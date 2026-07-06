-- ─────────────────────────────────────────────────────────────────────────────
-- SubBee Database Schema Migration 002 — Card + Funding
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Cardholders (stores Bridgecard onboarding KYC details)
CREATE TABLE IF NOT EXISTS cardholders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bridgecard_cardholder_id VARCHAR(255) UNIQUE, -- nullable initially if mock/lazy pending
  status VARCHAR(50) NOT NULL DEFAULT 'verification_pending', -- verification_pending, active, rejected
  
  -- KYC details
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL,
  dob VARCHAR(50) NOT NULL,
  bvn VARCHAR(11) NOT NULL,
  address_street VARCHAR(255) NOT NULL,
  address_state VARCHAR(255) NOT NULL,
  address_lga VARCHAR(255) NOT NULL,
  address_postal_code VARCHAR(50) NOT NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for querying cardholders by user
CREATE INDEX IF NOT EXISTS idx_cardholders_user_id ON cardholders(user_id);

-- 2. Cards (stores metadata only — never PAN or CVV)
CREATE TABLE IF NOT EXISTS cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cardholder_id UUID NOT NULL REFERENCES cardholders(id) ON DELETE CASCADE,
  bridgecard_card_id VARCHAR(255) UNIQUE, -- nullable if lazy creation in progress
  last4 VARCHAR(4) NOT NULL,
  brand VARCHAR(50) NOT NULL DEFAULT 'mastercard',
  status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, frozen, inactive
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for card lookups
CREATE INDEX IF NOT EXISTS idx_cards_user_id ON cards(user_id);

-- 3. Pending Transfers (tracks asynchronous virtual card funding states)
CREATE TABLE IF NOT EXISTS pending_transfers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  amount_kobo BIGINT NOT NULL CHECK (amount_kobo > 0),
  reference VARCHAR(255) UNIQUE NOT NULL, -- Unique transfer reference passed to Bridgecard
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, completed, failed
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger function to auto-update updated_at timestamp columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_cardholders_updated_at
BEFORE UPDATE ON cardholders
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_pending_transfers_updated_at
BEFORE UPDATE ON pending_transfers
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
