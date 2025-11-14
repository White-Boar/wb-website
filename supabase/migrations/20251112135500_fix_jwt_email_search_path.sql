-- Ensure helper function executes with deterministic search path
ALTER FUNCTION public.current_jwt_email()
  SET search_path = public;
