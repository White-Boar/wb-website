# Quickstart Guide: Onboarding System v3

**Date**: 2025-10-08
**Feature**: Onboarding System v3
**Phase**: Phase 1 - Implementation Quickstart

## Overview

This guide provides a step-by-step walkthrough to implement and validate the Onboarding System v3. Follow these steps in order to ensure all components work together correctly.

**Estimated Time**: 40-60 minutes for complete validation
**Prerequisites**: Development server running on port 3783, Supabase configured, Stripe test keys set

---

## Step 1: Environment Setup (5 minutes)

### Validate Environment

```bash
# Check Node.js version
node --version  # Should be v18 or higher

# Check pnpm version
pnpm --version  # Should be v8 or higher

# Check Supabase connection
psql $DATABASE_URL -c "SELECT version();"

# Verify environment variables
cat .env.local | grep -E "NEXT_PUBLIC_SUPABASE_URL|NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
```

### Install Dependencies

```bash
# Install all dependencies
pnpm install

# Install Stripe CLI (for webhook testing)
brew install stripe/stripe-cli/stripe  # macOS
# OR
scoop install stripe  # Windows
```

### Start Development Server

```bash
# IMPORTANT: Always use port 3783
PORT=3783 pnpm dev

# Verify server is running
curl http://localhost:3783/api/health
```

**Expected Output**: `{"status":"ok"}`

---

## Step 2: Database Migration (10 minutes)

### Run Migration

```bash
# Create migration file
supabase migration new onboarding_v3

# Copy migration SQL from data-model.md
# File: supabase/migrations/YYYYMMDD_onboarding_v3.sql

# Apply migration
supabase db push

# Verify tables created
supabase db diff
```

### Validate Schema

```sql
-- Run in Supabase SQL Editor or psql

-- Check onboarding_sessions table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'onboarding_sessions'
ORDER BY ordinal_position;

-- Check onboarding_submissions table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'onboarding_submissions'
ORDER BY ordinal_position;

-- Check indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename IN ('onboarding_sessions', 'onboarding_submissions', 'onboarding_analytics', 'onboarding_uploads')
ORDER BY tablename, indexname;
```

**Expected Output**: All 4 tables exist with correct columns and indexes

---

## Step 3: Manual Happy Path Test (15 minutes)

### Navigate to Onboarding

1. Open browser to `http://localhost:3783/onboarding`
2. Verify welcome page loads with "Start Now" button
3. Click "Start Now" → Should navigate to `/onboarding/step/1`

### Step 1: Personal Information
**Design**: [context/Visual design/onboarding-01-personal-info.png](../../../context/Visual%20design/onboarding-01-personal-info.png)

1. Fill in:
   - First Name: `Test`
   - Last Name: `User`
   - Email: `test@example.com`
2. Verify Next button is disabled until all fields valid
3. Click Next → Should navigate to `/onboarding/step/2`

### Step 2: Email Verification
**Design**: [context/Visual design/onboarding-02-email-verification.png](../../../context/Visual%20design/onboarding-02-email-verification.png)

1. Check terminal/Supabase logs for verification code
2. Enter 6-digit code (or use test code `123456` if in dev mode)
3. Verify auto-submit after 6th digit
4. Verify success animation before navigation
5. Should navigate to `/onboarding/step/3`

### Step 3: Business Basics
**Design**: [context/Visual design/onboarding-03-business-details.png](../../../context/Visual%20design/onboarding-03-business-details.png)

1. Fill in:
   - Business Name: `Acme Corp`
   - Business Email: `contact@acme.com`
   - Business Phone: `+39 123 456 7890`
   - Business Address: Start typing "Via Roma, Milano"
     - Verify autocomplete dropdown appears
     - Select address from dropdown
     - Verify all fields auto-filled
   - Industry: `Retail`
   - VAT Number: `IT12345678901` (optional)
2. Click Next → Should navigate to `/onboarding/step/4`

### Steps 4-11: Complete Remaining Steps

**Step 4 - Brand Definition**:
**Design**: [context/Visual design/onboarding-04-brand-definition.png](../../../context/Visual%20design/onboarding-04-brand-definition.png)
- Business Description: "We sell..."
- Competitor URLs: Add 2-3 URLs
- Click Next

**Step 5 - Customer Profile**:
**Design**: [context/Visual design/onboarding-05-customer-profile.png](../../../context/Visual%20design/onboarding-05-customer-profile.png)
- Adjust all 5 sliders to different values
- Click Next

**Step 6 - Customer Needs**:
**Design**: [context/Visual design/onboarding-06-customer-needs.png](../../../context/Visual%20design/onboarding-06-customer-needs.png)
- Customer Problems: "Customers struggle with..."
- Click Next

**Step 7 - Visual Inspiration**:
**Design**: [context/Visual design/onboarding-07-visual-inspiration.png](../../../context/Visual%20design/onboarding-07-visual-inspiration.png)
- Add 2-3 website references
- Click Next

**Step 8 - Design Style**:
**Design**: [context/Visual design/onboarding-08-design-style.png](../../../context/Visual%20design/onboarding-08-design-style.png)
- Select one design style (e.g., "minimalist")
- Click Next

**Step 9 - Image Style**:
**Design**: [context/Visual design/onboarding-09-image-style.png](../../../context/Visual%20design/onboarding-09-image-style.png)
- Select one image style (e.g., "photorealistic")
- Click Next

**Step 10 - Color Palette**:
**Design**: [context/Visual design/onboarding-10-color-palette.png](../../../context/Visual%20design/onboarding-10-color-palette.png)
- Select one color palette
- Click Next

**Step 11 - Website Structure**:
**Design**: [context/Visual design/onboarding-11-website-structure.png](../../../context/Visual%20design/onboarding-11-website-structure.png)
- Check 2-3 website sections
- Select primary goal
- If "Services/Products" selected, add offerings
- Click Next

### Step 12: Business Assets Upload
**Design**: [context/Visual design/onboarding-12-business-assets.png](../../../context/Visual%20design/onboarding-12-business-assets.png)

1. Upload logo:
   - Click "Upload Logo" or drag file
   - Verify preview appears
   - Verify file size shown
2. Upload 2-3 business photos:
   - Click "Upload Photos" or drag files
   - Verify thumbnails appear
   - Verify photo count updates
3. Click Next → **CRITICAL VALIDATION POINT**

**Expected Behavior**:
- Loading spinner appears
- Form data validated
- Submission created in database with status "unpaid"
- Navigate to `/onboarding/step/13` (payment)

**Verify in Database**:
```sql
-- Check submission created
SELECT id, session_id, email, business_name, status, created_at
FROM onboarding_submissions
ORDER BY created_at DESC
LIMIT 1;

-- Check session updated
SELECT id, current_step, submission_id
FROM onboarding_sessions
WHERE current_step = 13
ORDER BY updated_at DESC
LIMIT 1;
```

### Step 13: Payment

1. Verify Stripe Elements rendered
2. Use Stripe test card: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/25`)
   - CVC: Any 3 digits (e.g., `123`)
   - ZIP: Any 5 digits (e.g., `12345`)
3. Click "Complete Payment"
4. Verify loading state
5. Verify success message
6. Navigate to `/onboarding/thank-you`

**Verify in Database**:
```sql
-- Check submission updated to "paid"
SELECT id, status, payment_transaction_id, payment_status, payment_completed_at
FROM onboarding_submissions
ORDER BY created_at DESC
LIMIT 1;
```

**Expected Output**: `status = 'paid'`, `payment_status = 'succeeded'`, `payment_transaction_id` populated

---

## Step 3a: Unpaid Submission Follow-Up Test (5 minutes)

### Test Unpaid Submission Workflow

**Purpose**: Validate that unpaid submissions are tracked and follow-up can be initiated

1. Complete Steps 1-12 to create a submission with status "unpaid"
2. **Do NOT complete Step 13 payment**
3. Close browser/abandon session

**Verify in Database**:
```sql
-- Check submission created with unpaid status
SELECT id, email, business_name, status, created_at
FROM onboarding_submissions
WHERE status = 'unpaid'
ORDER BY created_at DESC
LIMIT 1;

-- Expected: status = 'unpaid', payment fields NULL
```

**Track unpaid submission event**:
```sql
-- Insert analytics event for unpaid follow-up
INSERT INTO onboarding_analytics (session_id, event_type, category, metadata)
SELECT
  session_id,
  'onboarding_unpaid_followup',
  'system_event',
  jsonb_build_object('business_name', business_name, 'email', email, 'hours_since_submission', EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600)
FROM onboarding_submissions
WHERE status = 'unpaid' AND created_at > NOW() - INTERVAL '24 hours';

-- Verify event logged
SELECT event_type, metadata
FROM onboarding_analytics
WHERE event_type = 'onboarding_unpaid_followup'
ORDER BY created_at DESC
LIMIT 1;
```

**Expected Behavior**:
- Submission exists in database with status "unpaid"
- Analytics event logged for follow-up tracking
- Admin dashboard can list unpaid submissions for manual follow-up
- Optional: Automated email reminder sent after 24 hours (if configured)

### Test Payment Verification Window (24 hours)

**Purpose**: Validate 24-hour payment verification window enforcement

1. Create submission with status "unpaid"
2. Manually update `created_at` to 25 hours ago:
   ```sql
   UPDATE onboarding_submissions
   SET created_at = NOW() - INTERVAL '25 hours'
   WHERE status = 'unpaid'
   AND id = '<submission-id>';
   ```
3. Attempt to check payment status via API:
   ```bash
   curl http://localhost:3783/api/onboarding/payment/status/<submission-id>
   ```

**Expected Response**:
```json
{
  "error": "Payment Verification Expired",
  "message": "Payment verification window has expired (24 hours). Please contact support.",
  "code": "VERIFICATION_EXPIRED",
  "submissionId": "<submission-id>"
}
```

**Verify Behavior**:
- API stops polling Stripe after 24 hours
- User sees appropriate message if returning after 24 hours
- Admin can manually verify via dashboard if needed

---

## Step 3b: Email Verification Lockout Test (5 minutes)

### Test Email Verification Attempt Limits

**Purpose**: Validate 5-attempt limit with 15-minute lockout

1. Navigate to `/onboarding/step/1`
2. Fill in personal info with email: `lockout-test@example.com`
3. Click Next to reach Step 2 (Email Verification)
4. Enter incorrect code 5 times (e.g., `000000`, `111111`, etc.)

**Expected Behavior After 5th Failed Attempt**:
- Error message: "Too many failed attempts. Please try again in 15 minutes."
- Verification code input disabled
- Timer displayed showing remaining lockout time
- 6th attempt blocked by UI and API

**Verify in Database**:
```sql
-- Check verification attempts and lockout
SELECT
  email,
  verification_attempts,
  verification_locked_until,
  verification_locked_until > NOW() as is_locked
FROM onboarding_sessions
WHERE email = 'lockout-test@example.com'
ORDER BY created_at DESC
LIMIT 1;

-- Expected: verification_attempts = 5, is_locked = true
```

**Test Lockout Enforcement**:
1. Try to submit verification code via API:
   ```bash
   curl -X POST http://localhost:3783/api/onboarding/email/verify/confirm \
     -H "Content-Type: application/json" \
     -d '{"sessionId":"<session-id>","code":"123456"}'
   ```

**Expected API Response** (during lockout):
```json
{
  "error": "Too Many Attempts",
  "message": "Maximum verification attempts exceeded. Please try again in 15 minutes.",
  "code": "ATTEMPTS_EXCEEDED",
  "lockedUntil": "2025-10-08T14:45:00Z"
}
```

**Test Lockout Expiration**:
1. Manually expire lockout in database:
   ```sql
   UPDATE onboarding_sessions
   SET verification_locked_until = NOW() - INTERVAL '1 minute',
       verification_attempts = 0
   WHERE email = 'lockout-test@example.com';
   ```
2. Return to Step 2
3. Verify new code can be entered
4. Verify attempt counter reset to 0

**Verify Analytics Event**:
```sql
-- Check lockout event logged
SELECT event_type, metadata
FROM onboarding_analytics
WHERE session_id IN (
  SELECT id FROM onboarding_sessions WHERE email = 'lockout-test@example.com'
)
AND event_type = 'onboarding_field_error'
ORDER BY created_at DESC
LIMIT 5;

-- Expected: Multiple field_error events with metadata showing verification failures
```

---

## Step 4: Session Recovery Test (5 minutes)

### Test Progress Persistence

1. Navigate to `/onboarding/step/1`
2. Fill in Step 1 fields
3. Click Next to Step 2
4. **Close browser tab** (do not click Next)
5. Wait 5 seconds
6. Re-open `http://localhost:3783/onboarding`
7. Verify session restored to Step 2
8. Verify Step 1 data still present

**Expected Behavior**: User returns to Step 2 with all Step 1 data intact

### Test Session Expiration

```bash
# Manually expire session in database
psql $DATABASE_URL -c "UPDATE onboarding_sessions SET expires_at = NOW() - INTERVAL '1 day' WHERE id = '<session-id>';"

# Return to onboarding page
open http://localhost:3783/onboarding

# Expected: New session created, start from Step 1
```

---

## Step 5: Payment Retry Test (5 minutes)

### Simulate Payment Failure

1. Complete Steps 1-12 (use different email)
2. On Step 13, use Stripe test card that declines: `4000 0000 0000 0002`
3. Click "Complete Payment"
4. Verify error message displayed
5. Verify Back button is **disabled**
6. Use successful test card: `4242 4242 4242 4242`
7. Click "Complete Payment"
8. Verify payment succeeds

**Verify in Database**:
```sql
-- Check analytics events logged
SELECT event_type, metadata
FROM onboarding_analytics
WHERE session_id = '<session-id>'
ORDER BY created_at DESC
LIMIT 5;

-- Expected events:
-- 1. onboarding_payment_failed (first attempt)
-- 2. onboarding_payment_retried (second attempt)
-- 3. onboarding_payment_succeeded (second attempt)
```

---

## Step 6: Stripe Webhook Test (5 minutes)

### Start Stripe CLI

```bash
# Forward webhooks to local server
stripe listen --forward-to localhost:3783/api/onboarding/payment/webhook

# Copy webhook signing secret from output
# Add to .env.local: STRIPE_WEBHOOK_SECRET=whsec_...
```

### Trigger Test Webhook

```bash
# Simulate payment success webhook
stripe trigger payment_intent.succeeded

# Check server logs for webhook processing
```

**Expected Output**: Server logs show "Webhook received: payment_intent.succeeded"

### CI/CD Automation for Stripe Webhooks

**Production Deployment Considerations**:

When deploying to production, Stripe webhooks require additional setup beyond local development:

1. **Register Webhook Endpoint**:
   - Log in to Stripe Dashboard → Developers → Webhooks
   - Add endpoint: `https://yourdomain.com/api/onboarding/payment/webhook`
   - Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
   - Copy webhook signing secret → Add to environment variables: `STRIPE_WEBHOOK_SECRET=whsec_...`

2. **Environment Variable Management**:
   - Development: Use Stripe CLI (`stripe listen`) for local testing
   - Staging: Register separate webhook endpoint for staging environment
   - Production: Register production webhook with production Stripe account
   - Store webhook secrets securely (e.g., Vercel environment variables, AWS Secrets Manager)

3. **CI/CD Pipeline Integration**:
   - Add environment variable validation step in CI/CD pipeline:
     ```bash
     # Example GitHub Actions step
     - name: Validate Stripe Environment Variables
       run: |
         if [ -z "$STRIPE_WEBHOOK_SECRET" ]; then
           echo "Error: STRIPE_WEBHOOK_SECRET not set"
           exit 1
         fi
     ```
   - Test webhook endpoint accessibility after deployment:
     ```bash
     # Example post-deployment test
     curl -I https://yourdomain.com/api/onboarding/payment/webhook
     # Expected: 405 Method Not Allowed (POST required)
     ```

4. **Monitoring and Alerting**:
   - Set up monitoring for webhook failures in Stripe Dashboard
   - Configure alerts for failed webhook deliveries
   - Log all webhook events to analytics for debugging
   - Track webhook processing time (target: < 3 seconds)

5. **Testing in CI/CD**:
   - Use Stripe test mode for all CI/CD test runs
   - Mock webhook events in E2E tests (do not trigger real Stripe events)
   - Validate webhook signature verification in unit tests

**Important Notes**:
- Stripe webhooks are **critical** for payment flow reliability
- Always verify webhook signatures to prevent fraud
- Handle webhook idempotency (Stripe may retry failed webhooks)
- Return 200 status immediately, process asynchronously if needed

---

## Step 7: E2E Test Validation (10 minutes)

### Run Playwright Tests

```bash
# Run full E2E test suite
pnpm test:e2e

# Run specific test
pnpm exec playwright test onboarding-flow.spec.ts

# Run with UI (watch mode)
pnpm exec playwright test --ui
```

**Expected Output**: All tests pass ✅

### Key Tests to Verify

1. **Full Flow Test**: Complete all 13 steps → payment → thank-you page
2. **Session Recovery Test**: Fill data → close browser → return → continue
3. **Payment Retry Test**: Failed payment → retry → success
4. **Performance Test**: LCP ≤ 1.8s, CLS < 0.1 on Step 1
5. **Accessibility Test**: axe-core passes on all steps

---

## Step 8: Analytics Validation (5 minutes)

### Check Analytics Events

```sql
-- Get event summary for session
SELECT
  event_type,
  COUNT(*) as count,
  AVG(duration_ms) as avg_duration_ms
FROM onboarding_analytics
WHERE session_id = '<session-id>'
GROUP BY event_type
ORDER BY count DESC;

-- Expected events:
-- - onboarding_step_viewed (13 times, one per step)
-- - onboarding_step_completed (12 times, Steps 1-12)
-- - onboarding_form_submitted (1 time, after Step 12)
-- - onboarding_payment_initiated (1 time, Step 13 viewed)
-- - onboarding_payment_succeeded (1 time, payment completed)
-- - onboarding_completed (1 time, final success)
```

### Validate Completion Time

```sql
-- Calculate total completion time
SELECT
  business_name,
  email,
  completion_time_seconds,
  completion_time_seconds / 60.0 as completion_time_minutes
FROM onboarding_submissions
WHERE status = 'paid'
ORDER BY created_at DESC
LIMIT 5;

-- Expected: < 15 minutes (900 seconds) for manual testing
```

---

## Step 9: File Upload Validation (5 minutes)

### Check Uploads in Supabase Storage

1. Open Supabase Dashboard → Storage → `onboarding-assets` bucket
2. Navigate to folder: `<session-id>/`
3. Verify logo file present (if uploaded)
4. Verify photo files present (if uploaded)
5. Check file naming convention: `{file_type}-{timestamp}-{original_filename}`

### Validate Upload Records

```sql
-- Check upload metadata
SELECT
  id,
  file_type,
  file_name,
  file_size,
  mime_type,
  virus_scan_status,
  created_at
FROM onboarding_uploads
WHERE session_id = '<session-id>'
ORDER BY created_at;

-- Expected: All uploads have virus_scan_status = 'clean' (or 'pending' if scan not yet run)
```

---

## Step 10: Cleanup (Optional)

### Delete Test Data

```sql
-- Delete test submissions
DELETE FROM onboarding_submissions WHERE email LIKE 'test@%';

-- Delete test sessions
DELETE FROM onboarding_sessions WHERE email LIKE 'test@%';

-- Delete test analytics
DELETE FROM onboarding_analytics WHERE session_id NOT IN (SELECT id FROM onboarding_sessions);

-- Delete test uploads
DELETE FROM onboarding_uploads WHERE session_id NOT IN (SELECT id FROM onboarding_sessions);
```

### Clear Supabase Storage

```bash
# List all test session folders
supabase storage ls onboarding-assets

# Remove test session folders
supabase storage rm onboarding-assets/<session-id>
```

---

## Troubleshooting

### Issue: Port 3783 Already in Use

```bash
# Find and kill process on port 3783
lsof -ti:3783 | xargs kill -9

# Restart server
PORT=3783 pnpm dev
```

### Issue: Supabase Connection Failed

```bash
# Check Supabase status
supabase status

# Restart Supabase (if using local)
supabase stop
supabase start
```

### Issue: Stripe Webhook Not Receiving Events

```bash
# Verify Stripe CLI is running
stripe listen --forward-to localhost:3783/api/onboarding/payment/webhook

# Check webhook secret in .env.local
grep STRIPE_WEBHOOK_SECRET .env.local

# Verify endpoint is accessible
curl -X POST http://localhost:3783/api/onboarding/payment/webhook \
  -H "Content-Type: application/json" \
  -d '{"type":"test"}'
```

### Issue: Email Verification Code Not Sent

```bash
# Check server logs for email sending
# Development mode: Code logged to console
# Production: Check email service logs (e.g., SendGrid, Resend)

# Bypass verification in development (optional)
# Set environment variable: SKIP_EMAIL_VERIFICATION=true
```

### Issue: File Upload Fails

```bash
# Check Supabase Storage permissions
supabase storage get onboarding-assets

# Verify bucket policies (RLS)
supabase db inspect policies --schema storage

# Check file size limit (10MB for logo, 10MB per photo)
```

---

## Success Criteria

✅ **All steps completed**: User can navigate through all 13 steps
✅ **Form data persists**: Data saved on each step, restored on reload
✅ **Email verification works**: OTP sent and verified
✅ **Address autocomplete works**: Google Places API populates address fields
✅ **File upload works**: Logo and photos uploaded to Supabase Storage
✅ **Submission created**: Database record created after Step 12 with status "unpaid"
✅ **Payment works**: Stripe payment processes successfully
✅ **Submission updated**: Status changes to "paid" after payment
✅ **Analytics logged**: All events tracked in database
✅ **Session recovery works**: User can resume from last step
✅ **Payment retry works**: Failed payment can be retried without re-submitting form
✅ **E2E tests pass**: All Playwright tests pass
✅ **Performance meets targets**: LCP ≤ 1.8s, CLS < 0.1
✅ **Accessibility passes**: axe-core validation passes on all steps

---

## Next Steps

Once quickstart validation passes:

1. **Run `/tasks` command** to generate tasks.md
2. **Execute tasks** in order following TDD (tests before implementation)
3. **Deploy to staging** for QA validation
4. **Run full regression suite** including performance and accessibility tests
5. **Deploy to production** after stakeholder approval

---

*Quickstart guide complete. For detailed implementation patterns, see `research.md` and `context/onboarding-implementation-spec-v3.md`.*
