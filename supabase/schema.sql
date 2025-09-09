-- WhiteBoar Onboarding System Database Schema
-- This file contains the complete database schema for the onboarding system

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- ONBOARDING SESSIONS TABLE
-- =============================================================================
-- Stores active onboarding sessions with form progress
CREATE TABLE onboarding_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  current_step INTEGER DEFAULT 1 CHECK (current_step >= 1 AND current_step <= 13),
  form_data JSONB DEFAULT '{}' NOT NULL,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Email verification tracking
  email_verified BOOLEAN DEFAULT FALSE,
  verification_code TEXT,
  verification_attempts INTEGER DEFAULT 0,
  verification_locked_until TIMESTAMP WITH TIME ZONE,
  
  -- Session metadata
  ip_address INET,
  user_agent TEXT,
  locale TEXT DEFAULT 'en'
);

-- =============================================================================
-- COMPLETED SUBMISSIONS TABLE
-- =============================================================================
-- Stores finalized onboarding submissions
CREATE TABLE onboarding_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES onboarding_sessions(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  business_name TEXT NOT NULL,
  form_data JSONB NOT NULL,
  
  -- Workflow tracking
  preview_sent_at TIMESTAMP WITH TIME ZONE,
  preview_viewed_at TIMESTAMP WITH TIME ZONE,
  payment_completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Completion metadata
  completion_time_seconds INTEGER, -- Total time to complete
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Admin notes
  admin_notes TEXT,
  status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'preview_sent', 'paid', 'completed', 'cancelled'))
);

-- =============================================================================
-- ANALYTICS EVENTS TABLE
-- =============================================================================
-- Tracks user behavior and conversion funnel
CREATE TABLE onboarding_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES onboarding_sessions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  step_number INTEGER CHECK (step_number >= 1 AND step_number <= 13),
  field_name TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Event categorization
  category TEXT DEFAULT 'user_action' CHECK (category IN ('user_action', 'system_event', 'error', 'performance')),
  
  -- Performance tracking
  duration_ms INTEGER,
  
  -- User context
  ip_address INET,
  user_agent TEXT
);

-- =============================================================================
-- FILE UPLOADS TABLE
-- =============================================================================
-- Manages uploaded files (logos, photos)
CREATE TABLE onboarding_uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES onboarding_sessions(id) ON DELETE CASCADE,
  file_type TEXT NOT NULL CHECK (file_type IN ('logo', 'photo')),
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  
  -- Image metadata (if applicable)
  width INTEGER,
  height INTEGER,
  
  -- Upload tracking
  upload_completed BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- File validation
  virus_scan_status TEXT DEFAULT 'pending' CHECK (virus_scan_status IN ('pending', 'clean', 'infected', 'failed')),
  is_processed BOOLEAN DEFAULT FALSE
);

-- =============================================================================
-- PERFORMANCE INDEXES
-- =============================================================================

-- Sessions indexes
CREATE INDEX idx_sessions_email ON onboarding_sessions(email);
CREATE INDEX idx_sessions_expires ON onboarding_sessions(expires_at);
CREATE INDEX idx_sessions_activity ON onboarding_sessions(last_activity);
CREATE INDEX idx_sessions_step ON onboarding_sessions(current_step);
CREATE INDEX idx_sessions_verified ON onboarding_sessions(email_verified);

-- Composite indexes for common query patterns
CREATE INDEX idx_sessions_email_expires ON onboarding_sessions(email, expires_at);
CREATE INDEX idx_sessions_email_verified ON onboarding_sessions(email, email_verified);
CREATE INDEX idx_sessions_verified_step ON onboarding_sessions(email_verified, current_step);

-- GIN index for JSONB form_data queries
CREATE INDEX CONCURRENTLY idx_sessions_form_data_gin ON onboarding_sessions USING gin(form_data);

-- Submissions indexes  
CREATE INDEX idx_submissions_email ON onboarding_submissions(email);
CREATE INDEX idx_submissions_created ON onboarding_submissions(created_at);
CREATE INDEX idx_submissions_status ON onboarding_submissions(status);
CREATE INDEX idx_submissions_business ON onboarding_submissions(business_name);

-- Composite indexes for submissions
CREATE INDEX idx_submissions_status_created ON onboarding_submissions(status, created_at);
CREATE INDEX idx_submissions_email_created ON onboarding_submissions(email, created_at);

-- GIN index for JSONB form_data in submissions
CREATE INDEX CONCURRENTLY idx_submissions_form_data_gin ON onboarding_submissions USING gin(form_data);

-- Analytics indexes
CREATE INDEX idx_analytics_session ON onboarding_analytics(session_id);
CREATE INDEX idx_analytics_event ON onboarding_analytics(event_type);
CREATE INDEX idx_analytics_step ON onboarding_analytics(step_number);
CREATE INDEX idx_analytics_created ON onboarding_analytics(created_at);
CREATE INDEX idx_analytics_category ON onboarding_analytics(category);

-- Composite indexes for analytics queries
CREATE INDEX idx_analytics_session_created ON onboarding_analytics(session_id, created_at);
CREATE INDEX idx_analytics_event_step ON onboarding_analytics(event_type, step_number);
CREATE INDEX idx_analytics_category_created ON onboarding_analytics(category, created_at);

-- GIN index for analytics metadata
CREATE INDEX CONCURRENTLY idx_analytics_metadata_gin ON onboarding_analytics USING gin(metadata);

-- Uploads indexes
CREATE INDEX idx_uploads_session ON onboarding_uploads(session_id);
CREATE INDEX idx_uploads_type ON onboarding_uploads(file_type);
CREATE INDEX idx_uploads_created ON onboarding_uploads(created_at);

-- Composite indexes for uploads
CREATE INDEX idx_uploads_session_type ON onboarding_uploads(session_id, file_type);
CREATE INDEX idx_uploads_type_created ON onboarding_uploads(file_type, created_at);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE onboarding_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_uploads ENABLE ROW LEVEL SECURITY;

-- Sessions: Allow users to access their own sessions by email (verified sessions only)
CREATE POLICY "Users can access their own verified sessions" ON onboarding_sessions
  FOR ALL USING (
    email = auth.jwt() ->> 'email' AND email_verified = TRUE
  );

-- Allow creation of new sessions for email verification (insert only, not verified yet)
CREATE POLICY "Allow session creation for email verification" ON onboarding_sessions
  FOR INSERT WITH CHECK (
    email_verified = FALSE AND 
    current_step <= 2 AND
    verification_code IS NOT NULL
  );

-- Submissions: Read-only access for users, full access for service role
CREATE POLICY "Users can read their own submissions" ON onboarding_submissions
  FOR SELECT USING (email = auth.jwt() ->> 'email');

CREATE POLICY "Service role full access to submissions" ON onboarding_submissions
  FOR ALL USING (auth.role() = 'service_role');

-- Analytics: Service role only (no user access to analytics data)
CREATE POLICY "Service role only analytics" ON onboarding_analytics
  FOR ALL USING (auth.role() = 'service_role');

-- Uploads: Users can access uploads for their verified sessions only
CREATE POLICY "Users can access their uploads" ON onboarding_uploads
  FOR ALL USING (
    session_id IN (
      SELECT id FROM onboarding_sessions 
      WHERE email = auth.jwt() ->> 'email' AND email_verified = TRUE
    )
  );

-- =============================================================================
-- AUTOMATIC TRIGGERS
-- =============================================================================

-- Auto-update updated_at timestamp on sessions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_sessions_updated_at 
  BEFORE UPDATE ON onboarding_sessions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- CLEANUP FUNCTIONS
-- =============================================================================

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete expired sessions and their related data
  DELETE FROM onboarding_sessions 
  WHERE expires_at < NOW() AND email_verified = FALSE;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log cleanup
  INSERT INTO onboarding_analytics (event_type, metadata, category)
  VALUES ('cleanup_expired_sessions', jsonb_build_object('deleted_count', deleted_count), 'system_event');
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to anonymize old submissions (GDPR compliance)
CREATE OR REPLACE FUNCTION anonymize_old_submissions(months_old INTEGER DEFAULT 36)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- Anonymize submissions older than specified months
  UPDATE onboarding_submissions 
  SET 
    email = 'anonymized@example.com',
    business_name = 'Anonymized Business',
    form_data = jsonb_set(form_data, '{personal_info}', '"[ANONYMIZED]"'::jsonb),
    admin_notes = CASE 
      WHEN admin_notes IS NOT NULL 
      THEN admin_notes || ' [ANONYMIZED ON ' || NOW()::DATE || ']'
      ELSE '[ANONYMIZED ON ' || NOW()::DATE || ']'
    END
  WHERE created_at < (NOW() - (months_old || ' months')::INTERVAL)
    AND email != 'anonymized@example.com';
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  -- Log anonymization
  INSERT INTO onboarding_analytics (event_type, metadata, category)
  VALUES ('anonymize_old_submissions', jsonb_build_object('updated_count', updated_count), 'system_event');
  
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- INITIAL DATA / SEED VALUES
-- =============================================================================

-- Create initial analytics event types for reference
INSERT INTO onboarding_analytics (event_type, metadata, category) VALUES
  ('system_initialized', '{"version": "1.0.0"}', 'system_event')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE onboarding_sessions IS 'Active onboarding sessions with form progress and email verification';
COMMENT ON TABLE onboarding_submissions IS 'Completed onboarding forms ready for processing';
COMMENT ON TABLE onboarding_analytics IS 'User behavior and conversion tracking events';
COMMENT ON TABLE onboarding_uploads IS 'File uploads associated with onboarding sessions';

COMMENT ON COLUMN onboarding_sessions.form_data IS 'JSONB storage for progressive form data across all steps';
COMMENT ON COLUMN onboarding_sessions.verification_code IS 'Temporary OTP code for email verification';
COMMENT ON COLUMN onboarding_sessions.verification_attempts IS 'Number of failed verification attempts';
COMMENT ON COLUMN onboarding_sessions.verification_locked_until IS 'Timestamp when verification attempts can resume';

COMMENT ON COLUMN onboarding_submissions.completion_time_seconds IS 'Total time from start to completion in seconds';
COMMENT ON COLUMN onboarding_submissions.status IS 'Workflow status: submitted -> preview_sent -> paid -> completed';

COMMENT ON COLUMN onboarding_analytics.event_type IS 'Event identifier: step_view, step_complete, field_error, etc.';
COMMENT ON COLUMN onboarding_analytics.category IS 'Event categorization for reporting and filtering';
COMMENT ON COLUMN onboarding_analytics.duration_ms IS 'Duration of the event/action in milliseconds';

COMMENT ON COLUMN onboarding_uploads.virus_scan_status IS 'Security scan status for uploaded files';
COMMENT ON COLUMN onboarding_uploads.is_processed IS 'Whether file has been processed (resized, optimized, etc.)';

-- =============================================================================
-- GRANTS AND PERMISSIONS
-- =============================================================================

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON onboarding_sessions TO authenticated;
GRANT SELECT ON onboarding_submissions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON onboarding_uploads TO authenticated;

-- Grant full access to service role (for API routes)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;