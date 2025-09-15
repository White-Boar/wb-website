-- Fix RLS policies to allow service role session creation
-- Service role should have full access for API operations

-- Add service role policy for sessions
CREATE POLICY "Service role full access to sessions" ON onboarding_sessions
  FOR ALL USING (auth.role() = 'service_role');

-- Make service role policy take precedence by dropping and recreating more permissive insert policy
DROP POLICY "Allow session creation for email verification" ON onboarding_sessions;

CREATE POLICY "Allow session creation" ON onboarding_sessions
  FOR INSERT WITH CHECK (
    auth.role() = 'service_role' OR 
    (email_verified = FALSE AND current_step <= 2)
  );