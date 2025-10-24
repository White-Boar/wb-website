-- Migration: Update onboarding_sessions step constraint to support steps 1-14
-- Feature: 001-two-new-steps
-- Date: 2025-10-20

-- Drop the existing check constraint
ALTER TABLE onboarding_sessions
DROP CONSTRAINT IF EXISTS onboarding_sessions_current_step_check;

-- Add new check constraint for steps 1-14
ALTER TABLE onboarding_sessions
ADD CONSTRAINT onboarding_sessions_current_step_check
CHECK (current_step >= 1 AND current_step <= 14);

-- Add comment
COMMENT ON COLUMN onboarding_sessions.current_step IS 'Current step in onboarding flow (1-14)';
