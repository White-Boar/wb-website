# Data Model: Onboarding System v3

**Date**: 2025-10-08
**Feature**: Onboarding System v3
**Phase**: Phase 1 - Data Model Design

## Overview

The onboarding system uses 4 primary entities stored in Supabase (PostgreSQL):

1. **Session** - Active onboarding progress with form data
2. **Submission** - Completed onboarding form (created after Step 12)
3. **Analytics** - User behavior tracking events
4. **Upload** - File upload metadata (logo, business photos)

**Key Relationships**:
- One Session → One Submission (created after Step 12)
- One Session → Many Analytics Events
- One Session → Many Uploads (max 1 logo, max 30 photos)

---

## Entity 1: Session

**Purpose**: Track active onboarding sessions with progressive form data collection and email verification.

**Lifecycle**:
1. Created when user starts onboarding
2. Updated as user progresses through steps
3. Links to Submission after Step 12 completes
4. Expires after 7 days of inactivity

### Fields

| Field | Type | Constraints | Default | Description |
|-------|------|-------------|---------|-------------|
| `id` | uuid | PRIMARY KEY | `gen_random_uuid()` | Unique session identifier |
| `email` | text | UNIQUE, nullable | - | User's email address |
| `email_verified` | boolean | nullable | `false` | Email verification status |
| `verification_code` | text | nullable | - | Temporary 6-digit OTP code |
| `verification_attempts` | integer | nullable | `0` | Failed verification attempt count |
| `verification_locked_until` | timestamptz | nullable | - | Lockout timestamp (after 5 failed attempts) |
| `current_step` | integer | CHECK (1-13), nullable | `1` | Current step in onboarding flow |
| `submission_id` | uuid | FK → onboarding_submissions(id), nullable | - | Reference to submission (after Step 12) |
| `form_data` | jsonb | - | `'{}'` | Progressive form data from all steps |
| `locale` | text | nullable | `'en'` | User's selected language (en/it) |
| `ip_address` | inet | nullable | - | Session IP address for analytics |
| `user_agent` | text | nullable | - | Browser user agent string |
| `last_activity` | timestamptz | nullable | `now()` | Last interaction timestamp |
| `expires_at` | timestamptz | nullable | `now() + 7 days` | Session expiration timestamp |
| `created_at` | timestamptz | nullable | `now()` | Session creation timestamp |
| `updated_at` | timestamptz | nullable | `now()` | Last update timestamp |

### Validation Rules

**Email Verification**:
- FR-010: Must send 6-digit verification code to email
- FR-015: Max 5 verification attempts before 15-minute lockout
- FR-016: Verification code expires after 10 minutes

**Session Expiration**:
- FR-004: Sessions expire after 7 days of inactivity
- Expired sessions cannot be recovered

**Form Data Structure** (JSONB):
```json
{
  "_version": "3.0.0",
  "_lastSaved": "2025-10-08T14:30:00Z",

  // Step 1 - Personal Info
  // Design: context/Visual design/onboarding-01-personal-info.png
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",

  // Step 3 - Business Basics
  // Design: context/Visual design/onboarding-03-business-details.png
  "businessName": "Acme Corp",
  "businessEmail": "contact@acme.com",
  "businessPhone": "+39 123 456 7890",
  "physicalAddressStreet": "Via Roma 123",
  "physicalAddressCity": "Milano",
  "physicalAddressProvince": "MI",
  "physicalAddressPostalCode": "20100",
  "physicalAddressCountry": "Italy",
  "physicalAddressPlaceId": "ChIJ...",
  "industry": "retail",
  "vatNumber": "IT12345678901",

  // Step 4 - Brand Definition
  // Design: context/Visual design/onboarding-04-brand-definition.png
  "businessDescription": "We sell...",
  "competitorUrls": ["https://example1.com", "https://example2.com"],
  "competitorAnalysis": "We differentiate by...",

  // Step 5 - Customer Profile
  // Design: context/Visual design/onboarding-05-customer-profile.png
  "customerProfileBudget": 50,
  "customerProfileStyle": 75,
  "customerProfileMotivation": 60,
  "customerProfileDecisionMaking": 40,
  "customerProfileLoyalty": 55,

  // Step 6 - Customer Needs
  // Design: context/Visual design/onboarding-06-customer-needs.png
  "customerProblems": "Our customers struggle with...",
  "customerDelight": "We delight them by...",

  // Step 7 - Visual Inspiration
  // Design: context/Visual design/onboarding-07-visual-inspiration.png
  "websiteReferences": ["https://site1.com", "https://site2.com"],

  // Step 8 - Design Style
  // Design: context/Visual design/onboarding-08-design-style.png
  "designStyle": "minimalist",

  // Step 9 - Image Style
  // Design: context/Visual design/onboarding-09-image-style.png
  "imageStyle": "photorealistic",

  // Step 10 - Color Palette
  // Design: context/Visual design/onboarding-10-color-palette.png
  "colorPalette": "palette-1",

  // Step 11 - Website Structure
  // Design: context/Visual design/onboarding-11-website-structure.png
  "websiteSections": ["about", "services", "contact"],
  "primaryGoal": "generate_calls",
  "offeringType": "both",
  "offerings": ["Product 1", "Service 1"],

  // Step 12 - Business Assets
  // Design: context/Visual design/onboarding-12-business-assets.png
  "logoUploadId": "uuid-of-upload",
  "photoUploadIds": ["uuid-1", "uuid-2"]
}
```

### Indexes
- Primary key on `id`
- Unique index on `email`
- Index on `expires_at` (for cleanup queries)
- Index on `current_step` (for analytics)

### Row-Level Security
- Users can only access their own session (matched by session ID in cookie)
- Admin users can access all sessions

---

## Entity 2: Submission

**Purpose**: Store completed onboarding forms with payment tracking and workflow status.

**Lifecycle**:
1. Created after Step 12 validation succeeds (status: "unpaid")
2. Updated with payment details after Step 13 (status: "paid")
3. Progresses through workflow: paid → preview_sent → completed
4. Retained for 90 days if unpaid, indefinitely if paid

### Fields

| Field | Type | Constraints | Default | Description |
|-------|------|-------------|---------|-------------|
| `id` | uuid | PRIMARY KEY | `gen_random_uuid()` | Unique submission identifier |
| `session_id` | uuid | FK → onboarding_sessions(id) | - | Reference to original session |
| `email` | text | NOT NULL | - | Business contact email |
| `business_name` | text | NOT NULL | - | Business name from form |
| `form_data` | jsonb | NOT NULL | - | Complete form data from all steps |
| `status` | text | CHECK | `'unpaid'` | Workflow status |
| `payment_transaction_id` | text | nullable | - | Stripe transaction ID |
| `payment_amount` | integer | nullable | - | Payment amount in cents (4000 = €40) |
| `payment_currency` | text | nullable | `'EUR'` | Payment currency |
| `payment_card_last4` | text | nullable | - | Last 4 digits of payment card |
| `payment_status` | text | CHECK, nullable | - | Payment status: pending, succeeded, failed |
| `payment_completed_at` | timestamptz | nullable | - | When payment succeeded |
| `completion_time_seconds` | integer | nullable | - | Total time from start to completion |
| `preview_sent_at` | timestamptz | nullable | - | When preview was sent to client |
| `preview_viewed_at` | timestamptz | nullable | - | When client viewed preview |
| `admin_notes` | text | nullable | - | Internal notes for processing team |
| `created_at` | timestamptz | nullable | `now()` | Submission timestamp |

### Validation Rules

**Status Transitions**:
```
unpaid → paid → preview_sent → completed
  ↓
cancelled (any time)
```

**Status Constraints**:
- `status` CHECK: Must be one of: unpaid, paid, preview_sent, completed, cancelled
- `payment_status` CHECK: Must be one of: pending, succeeded, failed

**Payment Validation**:
- FR-127: Must update with payment transaction ID on success
- FR-128: Must update status from "unpaid" to "paid" on successful payment
- FR-140: Unpaid submissions retained for 90 days before deletion
- FR-149: Only verify payment status for 24 hours after initiation
  - After 24 hours from `created_at`, stop polling Stripe API for payment status updates
  - Display appropriate message to user if payment not completed within 24 hours
  - Admin can manually verify payment status via dashboard if needed
- FR-150: All PII data must comply with GDPR (encryption at rest, right to deletion)

### State Machine

| Current Status | Valid Next States | Trigger |
|----------------|-------------------|---------|
| `unpaid` | `paid`, `cancelled` | Payment success / Manual cancellation |
| `paid` | `preview_sent`, `cancelled` | Preview email sent / Refund |
| `preview_sent` | `completed`, `cancelled` | Client approval / Refund |
| `completed` | - | Final state |
| `cancelled` | - | Final state |

### Indexes
- Primary key on `id`
- Index on `session_id`
- Index on `email` (for admin lookup)
- Index on `status` (for workflow queries)
- Index on `created_at` (for retention cleanup)

### Row-Level Security
- Users can access their own submission (matched by session)
- Admin users can access all submissions

**Admin Authentication**:
- Admin access requires authentication via Supabase Auth
- Admin role assigned via `auth.users` metadata: `{ role: 'admin' }`
- RLS policies check `auth.jwt() ->> 'role' = 'admin'` for admin access
- Admin dashboard accessible at `/admin/onboarding` (protected route)

---

## Entity 3: Analytics Event

**Purpose**: Track user behavior during onboarding for conversion optimization and error analysis.

**Lifecycle**:
1. Created when user triggers trackable event
2. Immutable once created (append-only log)
3. Aggregated for reporting and dashboards

### Fields

| Field | Type | Constraints | Default | Description |
|-------|------|-------------|---------|-------------|
| `id` | uuid | PRIMARY KEY | `gen_random_uuid()` | Unique event identifier |
| `session_id` | uuid | FK → onboarding_sessions(id), nullable | - | Associated session |
| `event_type` | text | NOT NULL | - | Event identifier (see list below) |
| `category` | text | CHECK | `'user_action'` | Event category |
| `step_number` | integer | CHECK (1-13), nullable | - | Step number if applicable |
| `field_name` | text | nullable | - | Field name for field-level events |
| `duration_ms` | integer | nullable | - | Duration of event/action in milliseconds |
| `metadata` | jsonb | nullable | `'{}'` | Additional event-specific data |
| `ip_address` | inet | nullable | - | User's IP address |
| `user_agent` | text | nullable | - | Browser user agent |
| `created_at` | timestamptz | nullable | `now()` | Event timestamp |

### Event Types

**Navigation Events**:
- `onboarding_step_viewed` - User lands on step (FR-096)
- `onboarding_step_completed` - User clicks Next successfully (FR-097)

**Validation Events**:
- `onboarding_field_error` - Validation error occurs (FR-098)

**Form Submission Events**:
- `onboarding_form_submitted` - Submission created after Step 12 (FR-141)

**Payment Events**:
- `onboarding_payment_initiated` - User reaches Step 13 (FR-142)
- `onboarding_payment_succeeded` - Payment completes (FR-143)
- `onboarding_payment_failed` - Payment fails (FR-144)
- `onboarding_payment_retried` - User retries payment (FR-145)

**Completion Events**:
- `onboarding_completed` - Full flow completed (FR-099)
- `onboarding_abandoned` - User leaves before completion (FR-100)
- `onboarding_session_resumed` - User returns to continue (FR-101)

**Unpaid Submission Events**:
- `onboarding_unpaid_followup` - Track unpaid submissions for follow-up (FR-146)

### Event Category Constraints
- `category` CHECK: Must be one of: user_action, system_event, error, performance

### Metadata Examples

**Step Viewed**:
```json
{
  "step_name": "Personal Information",
  "referrer": "/onboarding"
}
```

**Field Error**:
```json
{
  "error_type": "validation",
  "error_message": "Please enter a valid email address",
  "field_value_length": 15
}
```

**Payment Failed**:
```json
{
  "error_code": "card_declined",
  "stripe_error": "Your card was declined",
  "attempt_number": 1
}
```

### Indexes
- Primary key on `id`
- Index on `session_id`
- Index on `event_type` (for aggregation queries)
- Index on `created_at` (for time-series analysis)
- Composite index on (`session_id`, `created_at`)

---

## Entity 4: Upload

**Purpose**: Track file uploads (logo and business photos) with security scanning and processing status.

**Lifecycle**:
1. Created when user uploads file in Step 12
2. File uploaded to Supabase Storage
3. Security scan runs (virus detection)
4. Image processing (resize, optimize) if needed
5. Linked to submission when form is submitted

### Fields

| Field | Type | Constraints | Default | Description |
|-------|------|-------------|---------|-------------|
| `id` | uuid | PRIMARY KEY | `gen_random_uuid()` | Unique upload identifier |
| `session_id` | uuid | FK → onboarding_sessions(id), nullable | - | Associated session |
| `file_type` | text | NOT NULL, CHECK | - | File category: 'logo' or 'photo' |
| `file_url` | text | NOT NULL | - | Public URL to uploaded file |
| `file_name` | text | NOT NULL | - | Original filename |
| `file_size` | integer | NOT NULL | - | File size in bytes |
| `mime_type` | text | NOT NULL | - | MIME type (image/png, image/jpeg, etc.) |
| `width` | integer | nullable | - | Image width in pixels |
| `height` | integer | nullable | - | Image height in pixels |
| `upload_completed` | boolean | nullable | `true` | Upload success status |
| `virus_scan_status` | text | CHECK | `'pending'` | Security scan status |
| `is_processed` | boolean | nullable | `false` | Whether file has been processed (resized, optimized) |
| `created_at` | timestamptz | nullable | `now()` | Upload timestamp |

### Validation Rules

**File Type Constraints**:
- `file_type` CHECK: Must be 'logo' or 'photo'
- FR-063: Logo upload max 10MB, PNG/JPG/SVG
- FR-064: Business photos max 30 files, 10MB each

**Logo Limits**:
- Max 1 logo per session
- Accepted formats: PNG, JPG, SVG
- Max size: 10MB

**Photo Limits**:
- Max 30 photos per session
- Accepted formats: PNG, JPG
- Max size per photo: 10MB
- Total storage limit: Track in session metadata

**Virus Scan**:
- `virus_scan_status` CHECK: Must be one of: pending, clean, infected, failed
- Files marked 'infected' must be deleted immediately
- Files marked 'failed' can be retried or deleted

### File Naming Convention
```
{session_id}/{file_type}-{timestamp}-{original_filename}

Example:
550e8400-e29b-41d4-a716-446655440000/logo-1696800000-acme-logo.png
550e8400-e29b-41d4-a716-446655440000/photo-1696800001-office-1.jpg
```

### Indexes
- Primary key on `id`
- Index on `session_id`
- Index on `file_type`
- Index on `virus_scan_status` (for cleanup queries)
- Composite index on (`session_id`, `file_type`)

### Row-Level Security
- Users can only access uploads for their own session
- Admin users can access all uploads

---

## Relationships Diagram

```
┌─────────────────────┐
│  onboarding_sessions│
│  - id (PK)          │
│  - submission_id (FK)│◄────┐
│  - form_data (JSONB)│      │
│  - current_step     │      │
│  - expires_at       │      │
└──────┬──────────────┘      │
       │                     │
       │ 1:Many              │ 1:1
       │                     │
       ├─────────────────────┼────────┐
       │                     │        │
       ▼                     │        ▼
┌──────────────────┐         │  ┌──────────────────────┐
│onboarding_uploads│         │  │onboarding_submissions│
│- id (PK)         │         │  │- id (PK)             │
│- session_id (FK) │         │  │- session_id (FK)     │
│- file_type       │         │  │- status              │
│- file_url        │         │  │- payment_*           │
│- virus_scan_*    │         │  │- form_data (JSONB)   │
└──────────────────┘         │  └──────────────────────┘
                             │
       ┌─────────────────────┘
       │
       │ 1:Many
       │
       ▼
┌─────────────────────┐
│onboarding_analytics │
│- id (PK)            │
│- session_id (FK)    │
│- event_type         │
│- metadata (JSONB)   │
└─────────────────────┘
```

---

## Foreign Key Cascades

**On Session Deletion**:
- `onboarding_analytics` → CASCADE (delete all events)
- `onboarding_uploads` → CASCADE (delete all files + Supabase Storage cleanup)
- `onboarding_submissions` → RESTRICT (prevent deletion if submission exists)

**On Submission Deletion**:
- `onboarding_sessions.submission_id` → SET NULL (allow session to exist without submission)

---

## Data Retention Policies

**Sessions**:
- Active sessions: 7 days from last_activity (FR-004)
- Cleanup job runs daily to delete expired sessions

**Submissions**:
- Unpaid submissions: 90 days from created_at (FR-140)
- Paid submissions: Indefinite retention
- Cleanup job runs weekly to delete old unpaid submissions

**Analytics Events**:
- Retain for 1 year for trend analysis
- Aggregate to monthly summaries after 90 days

**Uploads**:
- Deleted when parent session is deleted (CASCADE)
- Infected files: Immediate deletion
- Orphaned files: Cleanup job runs weekly

---

## GDPR Compliance (FR-150)

**PII Data**:
- Email addresses (sessions, submissions)
- Names (form_data)
- Phone numbers (form_data)
- Business addresses (form_data)
- IP addresses (sessions, analytics)

**Compliance Measures**:
- Encryption at rest (Supabase default)
- Right to deletion (implement delete endpoint)
- Data export (implement export endpoint)
- Retention limits (90 days for unpaid submissions)
- Audit log (track all PII access)

**User Rights**:
1. **Right to Access**: API endpoint to retrieve all user data
2. **Right to Deletion**: API endpoint to delete session + submission + analytics
3. **Right to Portability**: JSON export of all user data
4. **Right to Rectification**: Update form_data via re-submission

---

## Migration Script

```sql
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
```

---

*Data model complete. Next: Generate API contracts.*
