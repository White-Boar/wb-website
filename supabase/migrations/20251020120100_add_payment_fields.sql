-- Migration: Add payment-related fields to onboarding_submissions
-- Feature: 001-two-new-steps (Stripe checkout integration)
-- Date: 2025-10-20

-- Add payment fields to onboarding_submissions table
ALTER TABLE onboarding_submissions
ADD COLUMN stripe_payment_id TEXT,
ADD COLUMN stripe_customer_id TEXT,
ADD COLUMN stripe_subscription_id TEXT,
ADD COLUMN stripe_subscription_schedule_id TEXT,
ADD COLUMN payment_amount INTEGER, -- in cents (e.g., 3500 = €35.00)
ADD COLUMN currency TEXT DEFAULT 'EUR',
ADD COLUMN discount_code TEXT,
ADD COLUMN discount_amount INTEGER, -- in cents
ADD COLUMN payment_metadata JSONB DEFAULT '{}'::jsonb,
ADD COLUMN payment_completed_at TIMESTAMPTZ,
ADD COLUMN refunded_at TIMESTAMPTZ;

-- Update status enum to include payment statuses
-- Note: status column is TEXT, no enum constraint to update

-- Create indexes for efficient payment lookups
CREATE INDEX idx_onboarding_submissions_stripe_payment_id
ON onboarding_submissions(stripe_payment_id);

CREATE INDEX idx_onboarding_submissions_stripe_customer_id
ON onboarding_submissions(stripe_customer_id);

CREATE INDEX idx_onboarding_submissions_stripe_subscription_id
ON onboarding_submissions(stripe_subscription_id);

CREATE INDEX idx_onboarding_submissions_stripe_subscription_schedule_id
ON onboarding_submissions(stripe_subscription_schedule_id);

CREATE INDEX idx_onboarding_submissions_payment_completed_at
ON onboarding_submissions(payment_completed_at);

-- Add comments
COMMENT ON COLUMN onboarding_submissions.payment_amount IS 'Total amount charged in cents (base subscription + add-ons)';
COMMENT ON COLUMN onboarding_submissions.stripe_subscription_schedule_id IS 'Stripe subscription schedule ID for 12-month annual commitment';
COMMENT ON COLUMN onboarding_submissions.payment_metadata IS 'Additional payment details from Stripe (payment method, invoice ID, etc.)';
COMMENT ON COLUMN onboarding_submissions.refunded_at IS 'Timestamp when payment was refunded (if applicable)';
