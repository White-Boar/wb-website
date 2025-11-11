-- Create storage bucket for onboarding uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'onboarding-uploads',
  'onboarding-uploads',
  false,
  10485760, -- 10MB limit
  ARRAY['image/png', 'image/jpg', 'image/jpeg', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for onboarding-uploads bucket
-- Drop existing policies if they exist to make this migration idempotent
DROP POLICY IF EXISTS "Users can upload files for their sessions" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their uploads" ON storage.objects;
DROP POLICY IF EXISTS "Service role full access" ON storage.objects;

-- Allow authenticated users to upload files for their sessions
CREATE POLICY "Users can upload files for their sessions" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'onboarding-uploads'
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to view their own uploads
CREATE POLICY "Users can view their uploads" ON storage.objects
FOR SELECT USING (
  bucket_id = 'onboarding-uploads'
  AND auth.role() = 'authenticated'
);

-- Allow service role full access to all operations
CREATE POLICY "Service role full access" ON storage.objects
FOR ALL USING (
  bucket_id = 'onboarding-uploads'
  AND auth.role() = 'service_role'
);
