-- ─────────────────────────────────────────────────────────────────────────────
-- SubBee Database Schema Migration 003 — Subscriptions Table
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  merchant_id VARCHAR(100) NOT NULL,
  merchant_name VARCHAR(255) NOT NULL,
  amount_kobo BIGINT NOT NULL CHECK (amount_kobo > 0),
  billing_day INT NOT NULL CHECK (billing_day >= 1 AND billing_day <= 28),
  reminders_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for user lookup
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);

CREATE TRIGGER trg_subscriptions_updated_at
BEFORE UPDATE ON subscriptions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
