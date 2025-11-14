-- Migration: Ensure onboarding_submissions has updated_at tracking
ALTER TABLE onboarding_submissions
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Backfill any existing rows so updated_at is not null
UPDATE onboarding_submissions
SET updated_at = COALESCE(updated_at, created_at, NOW())
WHERE updated_at IS NULL;

-- PostgREST cache refresh so new column is exposed immediately
NOTIFY pgrst, 'reload schema';
