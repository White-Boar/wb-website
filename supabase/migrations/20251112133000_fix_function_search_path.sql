-- Ensure critical maintenance functions run with a fixed search_path
-- This avoids role-dependent resolution when the functions are invoked
-- via scheduled jobs or SECURITY DEFINER triggers.
ALTER FUNCTION public.update_updated_at_column()
  SET search_path = public;

ALTER FUNCTION public.cleanup_expired_sessions()
  SET search_path = public;

ALTER FUNCTION public.anonymize_old_submissions(integer)
  SET search_path = public;
