-- Migration: Create stripe_webhook_events table for idempotency
-- Feature: 001-two-new-steps (Stripe webhook handler)
-- Date: 2025-10-20

-- Create table for tracking webhook events (idempotency)
CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for fast event_id lookups
CREATE INDEX idx_stripe_webhook_events_event_id ON stripe_webhook_events(event_id);

-- Create index for event type queries
CREATE INDEX idx_stripe_webhook_events_event_type ON stripe_webhook_events(event_type);

-- Create index for status queries
CREATE INDEX idx_stripe_webhook_events_status ON stripe_webhook_events(status);

-- Add comments
COMMENT ON TABLE stripe_webhook_events IS 'Tracks processed Stripe webhook events for idempotency';
COMMENT ON COLUMN stripe_webhook_events.event_id IS 'Unique Stripe event ID (evt_xxx)';
COMMENT ON COLUMN stripe_webhook_events.event_type IS 'Stripe event type (e.g., invoice.paid, subscription.created)';
COMMENT ON COLUMN stripe_webhook_events.status IS 'Processing status: processing, completed, or failed';
