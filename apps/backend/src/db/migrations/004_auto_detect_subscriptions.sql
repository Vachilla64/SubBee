BEGIN;

ALTER TABLE subscriptions 
ADD COLUMN is_auto_detected BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN needs_confirmation BOOLEAN NOT NULL DEFAULT false;

COMMIT;
