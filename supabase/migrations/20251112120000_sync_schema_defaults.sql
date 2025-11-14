-- Ensure onboarding session expiration aligns with 60-day business requirement
ALTER TABLE onboarding_sessions
  ALTER COLUMN expires_at SET DEFAULT (NOW() + INTERVAL '60 days');

-- Force PostgREST to pick up the updated default right away
NOTIFY pgrst, 'reload schema';

-- Align stripe_webhook_events primary key generation to gen_random_uuid()
ALTER TABLE stripe_webhook_events
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Normalize Stripe-related indexes (drop legacy names, ensure canonical ones exist)
DROP INDEX IF EXISTS idx_submissions_stripe_customer_id;
DROP INDEX IF EXISTS idx_submissions_stripe_subscription_schedule_id;

CREATE INDEX IF NOT EXISTS idx_onboarding_submissions_stripe_customer_id
  ON onboarding_submissions(stripe_customer_id);

CREATE INDEX IF NOT EXISTS idx_onboarding_submissions_stripe_subscription_schedule_id
  ON onboarding_submissions(stripe_subscription_schedule_id);

-- Ensure onboarding-uploads bucket and its storage policies exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'onboarding-uploads',
  'onboarding-uploads',
  false,
  10485760,
  ARRAY['image/png', 'image/jpg', 'image/jpeg', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users can upload files for their sessions" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their uploads" ON storage.objects;
DROP POLICY IF EXISTS "Service role full access" ON storage.objects;

CREATE POLICY "Users can upload files for their sessions" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'onboarding-uploads'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can view their uploads" ON storage.objects
FOR SELECT USING (
  bucket_id = 'onboarding-uploads'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Service role full access" ON storage.objects
FOR ALL USING (
  bucket_id = 'onboarding-uploads'
  AND auth.role() = 'service_role'
);

-- Refresh PostgREST again so policy changes take effect immediately
NOTIFY pgrst, 'reload schema';
