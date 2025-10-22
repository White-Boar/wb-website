-- Migration: Fix stripe_webhook_events table permissions
-- Feature: 001-two-new-steps (Fix webhook permission denied error)
-- Date: 2025-10-22
-- Issue: Webhook handler needs INSERT/UPDATE permissions on stripe_webhook_events table

-- Enable RLS on the table
ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;

-- Grant service role full access (used by webhook handler with service client)
GRANT ALL ON stripe_webhook_events TO service_role;

-- Allow service role to use sequences if any
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Create policy to allow service role to manage webhook events
CREATE POLICY "Service role can manage webhook events"
  ON stripe_webhook_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- No policies needed for authenticated/anon roles since this is internal only
-- Webhook events should only be accessible via service role

-- Add comment
COMMENT ON POLICY "Service role can manage webhook events" ON stripe_webhook_events
  IS 'Allows webhook handler (via service role) to insert and update webhook event records for idempotency tracking';
