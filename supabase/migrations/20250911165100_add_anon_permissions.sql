-- =============================================================================
-- ANON ROLE PERMISSIONS AND SECURITY POLICIES
-- =============================================================================
-- This migration implements secure RLS policies for public onboarding flows
-- following Supabase best practices for anon role usage
--
-- References:
-- - https://supabase.com/docs/guides/database/postgres/row-level-security
-- - https://supabase.com/docs/guides/database/hardening-data-api
--
-- Security Model:
-- - anon role: Limited INSERT/SELECT/UPDATE for active onboarding sessions
-- - authenticated role: Full access to own verified sessions
-- - service_role: Full access for API routes (bypasses RLS)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- STEP 1: Drop existing overly permissive policies
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow public session creation" ON onboarding_sessions;
DROP POLICY IF EXISTS "Allow session access by ID" ON onboarding_sessions;
DROP POLICY IF EXISTS "Allow session updates" ON onboarding_sessions;
DROP POLICY IF EXISTS "Service role full access to sessions" ON onboarding_sessions;
DROP POLICY IF EXISTS "Allow public upload access" ON onboarding_uploads;
DROP POLICY IF EXISTS "Allow public analytics" ON onboarding_analytics;

-- -----------------------------------------------------------------------------
-- STEP 2: Grant minimal permissions to anon role
-- -----------------------------------------------------------------------------
-- Sessions: Allow public to create and manage onboarding sessions
GRANT SELECT, INSERT, UPDATE ON onboarding_sessions TO anon;

-- Uploads: Allow public to manage file uploads during onboarding
GRANT SELECT, INSERT, UPDATE, DELETE ON onboarding_uploads TO anon;

-- Analytics: Allow public to track onboarding events
GRANT SELECT, INSERT ON onboarding_analytics TO anon;

-- Submissions: Allow anon SELECT for RLS policy checks (NOT EXISTS queries)
-- This is required for the UPDATE policy on sessions to check if a submission exists
GRANT SELECT ON onboarding_submissions TO anon;

-- -----------------------------------------------------------------------------
-- STEP 3: Create restrictive RLS policies for onboarding_sessions
-- -----------------------------------------------------------------------------

-- Policy 1: Allow anon to create new unverified sessions only
CREATE POLICY "anon_can_create_unverified_sessions" ON onboarding_sessions
  FOR INSERT
  TO anon
  WITH CHECK (
    email_verified = FALSE AND
    current_step <= 2 AND
    -- Prevent creating sessions with past expiration
    expires_at > now()
  );

-- Policy 2: Allow anon to read any session (needed for loading sessions by ID)
-- Note: Without auth, we cannot restrict to "own" session, but data is not sensitive
CREATE POLICY "anon_can_read_sessions" ON onboarding_sessions
  FOR SELECT
  TO anon
  USING (true);

-- Policy 3: Allow anon to update only non-expired sessions
-- This prevents updating sessions that have already expired
CREATE POLICY "anon_can_update_active_sessions" ON onboarding_sessions
  FOR UPDATE
  TO anon
  USING (
    expires_at > now() AND
    -- Only allow updating sessions that haven't been submitted yet
    NOT EXISTS (
      SELECT 1 FROM onboarding_submissions
      WHERE session_id = onboarding_sessions.id
    )
  )
  WITH CHECK (
    expires_at > now() AND
    NOT EXISTS (
      SELECT 1 FROM onboarding_submissions
      WHERE session_id = onboarding_sessions.id
    )
  );

-- Policy 4: Service role bypasses all restrictions
CREATE POLICY "service_role_full_access_sessions" ON onboarding_sessions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- STEP 4: Create restrictive RLS policies for onboarding_uploads
-- -----------------------------------------------------------------------------

-- Policy 1: Allow anon to insert uploads for active sessions only
CREATE POLICY "anon_can_insert_uploads" ON onboarding_uploads
  FOR INSERT
  TO anon
  WITH CHECK (
    -- Session must exist and not be expired
    EXISTS (
      SELECT 1 FROM onboarding_sessions
      WHERE id = session_id
        AND expires_at > now()
    )
  );

-- Policy 2: Allow anon to read uploads for any session
CREATE POLICY "anon_can_read_uploads" ON onboarding_uploads
  FOR SELECT
  TO anon
  USING (true);

-- Policy 3: Allow anon to update uploads for active sessions
CREATE POLICY "anon_can_update_uploads" ON onboarding_uploads
  FOR UPDATE
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM onboarding_sessions
      WHERE id = session_id
        AND expires_at > now()
    )
  );

-- Policy 4: Allow anon to delete uploads for active sessions
CREATE POLICY "anon_can_delete_uploads" ON onboarding_uploads
  FOR DELETE
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM onboarding_sessions
      WHERE id = session_id
        AND expires_at > now()
    )
  );

-- Policy 5: Service role full access
CREATE POLICY "service_role_full_access_uploads" ON onboarding_uploads
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- STEP 5: Create restrictive RLS policies for onboarding_analytics
-- -----------------------------------------------------------------------------

-- Policy 1: Allow anon to insert analytics events
CREATE POLICY "anon_can_insert_analytics" ON onboarding_analytics
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Policy 2: Deny anon from reading analytics (privacy protection)
-- Only service_role can read analytics data
CREATE POLICY "service_role_can_read_analytics" ON onboarding_analytics
  FOR SELECT
  TO service_role
  USING (true);

-- Policy 3: Service role full access
CREATE POLICY "service_role_full_access_analytics" ON onboarding_analytics
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- STEP 6: Add performance indexes for RLS policy columns
-- -----------------------------------------------------------------------------
-- Per Supabase best practices: "Any column used in policies should be indexed"

-- Index for expires_at checks in multiple policies (if not already exists)
-- Note: We can't use WHERE clause with now() as it's not immutable
CREATE INDEX IF NOT EXISTS idx_sessions_expires_rls ON onboarding_sessions(expires_at);

-- Index for session_id foreign key lookups in uploads
CREATE INDEX IF NOT EXISTS idx_uploads_session_rls ON onboarding_uploads(session_id);

-- Composite index for common query pattern: active sessions
CREATE INDEX IF NOT EXISTS idx_sessions_active ON onboarding_sessions(id, expires_at);

-- -----------------------------------------------------------------------------
-- STEP 7: Add helpful comments for documentation
-- -----------------------------------------------------------------------------

COMMENT ON POLICY "anon_can_create_unverified_sessions" ON onboarding_sessions IS
  'Allow public users to create new onboarding sessions that are unverified and have valid expiration dates';

COMMENT ON POLICY "anon_can_read_sessions" ON onboarding_sessions IS
  'Allow public users to read session data - needed for loading sessions by ID from localStorage';

COMMENT ON POLICY "anon_can_update_active_sessions" ON onboarding_sessions IS
  'Allow public users to update only active (non-expired, non-submitted) sessions';

COMMENT ON POLICY "anon_can_insert_analytics" ON onboarding_analytics IS
  'Allow public users to track analytics events during onboarding flow';

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
