-- Rollback migration for onboarding v3
-- This script removes all onboarding tables and their dependencies

-- Drop RLS policies first
DROP POLICY IF EXISTS "Allow service_role full access to sessions" ON onboarding_sessions;
DROP POLICY IF EXISTS "Allow anon to create sessions" ON onboarding_sessions;
DROP POLICY IF EXISTS "Allow service_role full access to submissions" ON onboarding_submissions;
DROP POLICY IF EXISTS "Allow service_role full access to analytics" ON onboarding_analytics;
DROP POLICY IF EXISTS "Allow service_role full access to uploads" ON onboarding_uploads;

-- Drop tables in reverse order of dependencies
DROP TABLE IF EXISTS onboarding_uploads CASCADE;
DROP TABLE IF EXISTS onboarding_analytics CASCADE;
DROP TABLE IF EXISTS onboarding_submissions CASCADE;
DROP TABLE IF EXISTS onboarding_sessions CASCADE;
