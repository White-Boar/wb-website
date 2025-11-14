-- Migration: Force PostgREST schema cache refresh
-- Reason: Stripe checkout started failing on Vercel because PostgREST
--        was still serving the old schema (missing new Stripe columns).
--        Trigger a schema reload so Supabase/PostgREST picks up the
--        onboarding_submissions payment fields.

NOTIFY pgrst, 'reload schema';
