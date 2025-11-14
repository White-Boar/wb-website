-- Optimize onboarding_submissions RLS policies to avoid redundant evaluations
-- and restrict them to the intended Supabase roles.

-- Helper function to obtain the current JWT email once per statement.
CREATE OR REPLACE FUNCTION public.current_jwt_email()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.email', true), '');
$$;

COMMENT ON FUNCTION public.current_jwt_email IS 'Returns the request JWT email claim for use in RLS policies (NULL if missing).';

-- Recreate policies with explicit role scoping to prevent duplicate evaluations.
DROP POLICY IF EXISTS "Users can read their own submissions" ON onboarding_submissions;
DROP POLICY IF EXISTS "Service role full access to submissions" ON onboarding_submissions;

CREATE POLICY "Users can read their own submissions" ON onboarding_submissions
  FOR SELECT
  TO authenticated
  USING (email = public.current_jwt_email());

CREATE POLICY "Service role full access to submissions" ON onboarding_submissions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Dashboard can read submissions" ON onboarding_submissions
  FOR SELECT
  TO dashboard_user
  USING (true);
