-- Create onboarding_sessions table
CREATE TABLE onboarding_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE,
  email_verified boolean DEFAULT false,
  verification_code text,
  verification_attempts integer DEFAULT 0,
  verification_locked_until timestamptz,
  current_step integer CHECK (current_step BETWEEN 1 AND 13) DEFAULT 1,
  submission_id uuid,
  form_data jsonb DEFAULT '{}'::jsonb,
  locale text DEFAULT 'en',
  ip_address inet,
  user_agent text,
  last_activity timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT now() + interval '7 days',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create onboarding_submissions table
CREATE TABLE onboarding_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES onboarding_sessions(id) ON DELETE RESTRICT,
  email text NOT NULL,
  business_name text NOT NULL,
  form_data jsonb NOT NULL,
  status text CHECK (status IN ('unpaid', 'paid', 'preview_sent', 'completed', 'cancelled')) DEFAULT 'unpaid',
  payment_transaction_id text,
  payment_amount integer,
  payment_currency text DEFAULT 'EUR',
  payment_card_last4 text,
  payment_status text CHECK (payment_status IN ('pending', 'succeeded', 'failed')),
  payment_completed_at timestamptz,
  completion_time_seconds integer,
  preview_sent_at timestamptz,
  preview_viewed_at timestamptz,
  admin_notes text,
  created_at timestamptz DEFAULT now()
);

-- Add foreign key from sessions to submissions
ALTER TABLE onboarding_sessions
ADD CONSTRAINT fk_submission
FOREIGN KEY (submission_id)
REFERENCES onboarding_submissions(id)
ON DELETE SET NULL;

-- Create onboarding_analytics table
CREATE TABLE onboarding_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES onboarding_sessions(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  category text CHECK (category IN ('user_action', 'system_event', 'error', 'performance')) DEFAULT 'user_action',
  step_number integer CHECK (step_number BETWEEN 1 AND 13),
  field_name text,
  duration_ms integer,
  metadata jsonb DEFAULT '{}'::jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Create onboarding_uploads table
CREATE TABLE onboarding_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES onboarding_sessions(id) ON DELETE CASCADE,
  file_type text CHECK (file_type IN ('logo', 'photo')) NOT NULL,
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_size integer NOT NULL,
  mime_type text NOT NULL,
  width integer,
  height integer,
  upload_completed boolean DEFAULT true,
  virus_scan_status text CHECK (virus_scan_status IN ('pending', 'clean', 'infected', 'failed')) DEFAULT 'pending',
  is_processed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_sessions_email ON onboarding_sessions(email);
CREATE INDEX idx_sessions_expires_at ON onboarding_sessions(expires_at);
CREATE INDEX idx_sessions_current_step ON onboarding_sessions(current_step);

CREATE INDEX idx_submissions_session_id ON onboarding_submissions(session_id);
CREATE INDEX idx_submissions_email ON onboarding_submissions(email);
CREATE INDEX idx_submissions_status ON onboarding_submissions(status);
CREATE INDEX idx_submissions_created_at ON onboarding_submissions(created_at);

CREATE INDEX idx_analytics_session_id ON onboarding_analytics(session_id);
CREATE INDEX idx_analytics_event_type ON onboarding_analytics(event_type);
CREATE INDEX idx_analytics_created_at ON onboarding_analytics(created_at);
CREATE INDEX idx_analytics_session_created ON onboarding_analytics(session_id, created_at);

CREATE INDEX idx_uploads_session_id ON onboarding_uploads(session_id);
CREATE INDEX idx_uploads_file_type ON onboarding_uploads(file_type);
CREATE INDEX idx_uploads_virus_scan ON onboarding_uploads(virus_scan_status);
CREATE INDEX idx_uploads_session_file_type ON onboarding_uploads(session_id, file_type);

-- Enable Row-Level Security
ALTER TABLE onboarding_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_uploads ENABLE ROW LEVEL SECURITY;
