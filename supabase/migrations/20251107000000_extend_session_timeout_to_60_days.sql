-- Extend onboarding session timeout from 7 days to 60 days
-- This change allows B2B customers more time to complete the multi-step onboarding process
-- which requires gathering business materials, stakeholder approvals, and budget allocation

-- Update the default expiration time for new sessions
ALTER TABLE onboarding_sessions
  ALTER COLUMN expires_at SET DEFAULT (NOW() + INTERVAL '60 days');

-- Optionally extend existing active sessions to give current users the benefit
-- This only extends sessions that haven't expired yet and are still active
UPDATE onboarding_sessions
SET expires_at = CASE
  -- If session expires within next 7 days, extend to 60 days from now
  WHEN expires_at < (NOW() + INTERVAL '7 days') AND expires_at > NOW()
  THEN NOW() + INTERVAL '60 days'
  -- If session is still far from expiring, extend proportionally
  WHEN expires_at > (NOW() + INTERVAL '7 days')
  THEN expires_at + INTERVAL '53 days'  -- Adds the difference (60-7 = 53 days)
  ELSE expires_at
END
WHERE expires_at > NOW()  -- Only update non-expired sessions
  AND email_verified = FALSE;  -- Only update incomplete sessions

-- Add comment documenting the change
COMMENT ON COLUMN onboarding_sessions.expires_at IS
  'Session expiration timestamp. Set to 60 days from creation to accommodate B2B decision-making cycles, budget approvals, and multi-stakeholder coordination. Extended from 7 days on 2025-11-07.';
