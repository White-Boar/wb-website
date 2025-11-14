-- Migration: Restore missing payment schema pieces
-- Context: Production database drift dropped the Stripe-related columns and tables.
--          Recreate them idempotently so repeated runs are safe.

-- Ensure payment columns exist on onboarding_submissions
ALTER TABLE onboarding_submissions
  ADD COLUMN IF NOT EXISTS stripe_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_schedule_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_amount INTEGER,
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'EUR',
  ADD COLUMN IF NOT EXISTS discount_code TEXT,
  ADD COLUMN IF NOT EXISTS discount_amount INTEGER,
  ADD COLUMN IF NOT EXISTS payment_metadata JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ;

-- Backfill comments (no-op if they already exist)
COMMENT ON COLUMN onboarding_submissions.payment_amount IS 'Total amount charged in cents (base subscription + add-ons)';
COMMENT ON COLUMN onboarding_submissions.stripe_subscription_schedule_id IS 'Stripe subscription schedule ID for 12-month annual commitment';
COMMENT ON COLUMN onboarding_submissions.payment_metadata IS 'Additional payment details from Stripe (payment method, invoice ID, etc.)';
COMMENT ON COLUMN onboarding_submissions.refunded_at IS 'Timestamp when payment was refunded (if applicable)';

-- Recreate indexes for the payment columns
CREATE INDEX IF NOT EXISTS idx_onboarding_submissions_stripe_payment_id
  ON onboarding_submissions(stripe_payment_id);

CREATE INDEX IF NOT EXISTS idx_onboarding_submissions_stripe_customer_id
  ON onboarding_submissions(stripe_customer_id);

CREATE INDEX IF NOT EXISTS idx_onboarding_submissions_stripe_subscription_id
  ON onboarding_submissions(stripe_subscription_id);

CREATE INDEX IF NOT EXISTS idx_onboarding_submissions_stripe_subscription_schedule_id
  ON onboarding_submissions(stripe_subscription_schedule_id);

CREATE INDEX IF NOT EXISTS idx_onboarding_submissions_payment_completed_at
  ON onboarding_submissions(payment_completed_at);

-- Ensure stripe_webhook_events table exists for idempotent webhook handling
CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_event_id
  ON stripe_webhook_events(event_id);

CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_event_type
  ON stripe_webhook_events(event_type);

CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_status
  ON stripe_webhook_events(status);

COMMENT ON TABLE stripe_webhook_events IS 'Tracks processed Stripe webhook events for idempotency';
COMMENT ON COLUMN stripe_webhook_events.event_id IS 'Unique Stripe event ID (evt_xxx)';
COMMENT ON COLUMN stripe_webhook_events.event_type IS 'Stripe event type (e.g., invoice.paid, subscription.created)';
COMMENT ON COLUMN stripe_webhook_events.status IS 'Processing status: processing, completed, or failed';

-- Force PostgREST to pick up the restored schema
NOTIFY pgrst, 'reload schema';
