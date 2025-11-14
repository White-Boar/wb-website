-- Remove duplicate indexes introduced by anon/RLS backfill migration
-- Base schema already maintains idx_sessions_expires / idx_uploads_session
-- so the *_rls variants are redundant and can be safely dropped.
DROP INDEX IF EXISTS idx_sessions_expires_rls;
DROP INDEX IF EXISTS idx_uploads_session_rls;
