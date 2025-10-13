# Sprint 002: Core Onboarding Mechanisms

**Sprint Duration**: 2025-10-12 to 2025-10-14 (2 days)
**Sprint Capacity**: 12 hours (2 days × 6 hours)
**Feature Branch**: `001-onboarding-v3-implementation`
**Status**: Planned

## Sprint Goal

**Goal**: Build the foundational infrastructure that enables the complete onboarding flow—including database schema, API routes, state management hooks, form orchestration, and reusable form components—without implementing the specific content of Steps 1-13.

**Elaboration**:
This sprint delivers the technical backbone that makes the entire onboarding system work end-to-end. We establish the database schema with 4 tables (sessions, submissions, analytics, uploads), implement all 5 API route groups (session, progress, submission, payment, upload), create the core form infrastructure (universal FormField wrapper, basic input components), and build the Step page orchestrator that dynamically loads any step. This infrastructure enables testing the full user journey—session creation → form data persistence → submission creation → payment processing—without needing to implement the 13 individual step forms.

**Who Benefits**: Development team gains the proven technical architecture to rapidly implement steps in parallel; QA team can begin integration testing of core flows; stakeholders can validate system capabilities through API testing and analytics.

**Business Value**: De-risks the implementation by validating the hardest technical challenges (database persistence, session recovery, payment integration, file uploads) before investing in 13 individual steps. Proves the architecture works end-to-end, enabling confident parallel development.

## Execution Flow (sprint scope)
```
1. Load sprint goal and selected tasks
   → Sprint goal defines the value to deliver
   → Tasks are prioritized and estimated
2. Execute tasks in **priority order**
   → In the order listed in the sprint file
3. Track progress against acceptance criteria
   → Each task has specific, measurable criteria
   → Criteria validated before marking complete
4. Update backlog status as tasks complete
   → Move from [WIP] to [Done]
   → Document any blockers or issues
5. Deliver working software at sprint end
   → All P0 tasks must be complete
   → Sprint goal must be achieved
   → Client value must be demonstrable
```

## Selected Tasks

**Total Estimated**: 10.5 hours
**Capacity Available**: 12 hours
**Utilization**: 88%

### Priority Order

---

**T004** [Priority: P0] [Estimate: 1 hour]
**Description**: Create Supabase database migration for onboarding tables
**Acceptance Criteria**:
- [ ] Migration file created with timestamp naming convention (YYYYMMDDHHMMSS_onboarding_v3.sql)
- [ ] All 4 tables created: onboarding_sessions, onboarding_submissions, onboarding_analytics, onboarding_uploads
- [ ] All foreign key relationships defined correctly (sessions ↔ submissions, sessions → analytics, sessions → uploads)
- [ ] All indexes created as specified in data-model.md
- [ ] Row-Level Security (RLS) enabled on all 4 tables
- [ ] RLS policies created: users access own sessions/submissions, admins access all
- [ ] CHECK constraints implemented (current_step 1-13, status values, etc.)
- [ ] Migration executes successfully with `supabase db push` without errors
- [ ] Migration can be rolled back cleanly

**Context**:
Create migration: supabase/migrations/YYYYMMDD_onboarding_v3.sql. Copy migration SQL from data-model.md (4 tables: onboarding_sessions, onboarding_submissions, onboarding_analytics, onboarding_uploads). Include all indexes, foreign keys, RLS policies. Test migration with `supabase db push`.

**Dependencies**: None

**Files**:
- supabase/migrations/YYYYMMDDHHMMSS_onboarding_v3.sql

---

**T005** [Priority: P0] [Estimate: 0.5 hours]
**Description**: Configure Supabase client for onboarding API routes
**Acceptance Criteria**:
- [ ] lib/supabase/server.ts exports createClient() function using @supabase/ssr for server-side operations
- [ ] lib/supabase/client.ts exports createClient() function for client-side operations
- [ ] verifySessionOwnership() helper function validates user can access session
- [ ] Server client uses cookies() from next/headers for auth
- [ ] Client uses browser localStorage for auth persistence
- [ ] TypeScript types properly inferred from database schema
- [ ] Both clients successfully connect to Supabase (tested with simple query)
- [ ] Environment variables (NEXT_PUBLIC_SUPABASE_URL, etc.) properly read

**Context**:
Create lib/supabase/server.ts with createClient() for Server Components and Route Handlers. Create lib/supabase/client.ts with createClient() for Client Components. Add RLS helper functions for session access (verifySessionOwnership).

**Dependencies**: T004 (migration must exist)

**Files**:
- lib/supabase/server.ts
- lib/supabase/client.ts

---

**T006** [Priority: P0] [Estimate: 0.5 hours]
**Description**: Configure Stripe client and webhook handling
**Acceptance Criteria**:
- [ ] lib/stripe/client.ts exports loadStripe() initialized with NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
- [ ] lib/stripe/server.ts exports Stripe instance initialized with STRIPE_SECRET_KEY
- [ ] verifyWebhookSignature() helper function validates Stripe webhook signatures using STRIPE_WEBHOOK_SECRET
- [ ] TypeScript types defined for PaymentIntent, PaymentMethod, webhook events (payment_intent.succeeded, payment_intent.payment_failed)
- [ ] Client-side Stripe loads lazily (dynamic import)
- [ ] Server-side Stripe configured with API version and error handling
- [ ] Environment variables properly validated on initialization
- [ ] Both clients initialize successfully without errors

**Context**:
Create lib/stripe/client.ts with loadStripe() initialization. Create lib/stripe/server.ts with Stripe SDK initialization (STRIPE_SECRET_KEY). Add webhook signature verification helper. Add types for Stripe PaymentIntent and webhook events.

**Dependencies**: None (can run in parallel)

**Files**:
- lib/stripe/client.ts
- lib/stripe/server.ts

---

**T082** [Priority: P0] [Estimate: 0.5 hours]
**Description**: Create FormField universal wrapper component
**Acceptance Criteria**:
- [ ] FormField component accepts name, label, description, required, error, children props
- [ ] Integrates with React Hook Form Controller for field registration
- [ ] Displays field label with proper htmlFor association to input
- [ ] Shows validation errors below field when error prop provided
- [ ] Required indicator (*) shown when required prop is true
- [ ] Optional description text displayed when description prop provided
- [ ] ARIA labels properly set (aria-describedby for errors, aria-required for required fields)
- [ ] Error messages announced to screen readers via aria-live="polite"
- [ ] Uses design tokens (--wb-*) for all styling
- [ ] TypeScript types properly defined for all props

**Context**:
Universal wrapper for all form inputs with label, error display, description. Integrates with React Hook Form Controller. Props: name, label, description, required, error, children. Displays validation errors from Zod schemas. Accessible with proper ARIA labels and error announcements.

**Dependencies**: T003 (types), T007 (translations)

**Files**:
- components/onboarding/form-fields/FormField.tsx

---

**T083** [Priority: P0] [Estimate: 0.5 hours]
**Description**: Create TextInput component
**Acceptance Criteria**:
- [ ] TextInput component wraps FormField with text/password input element
- [ ] Accepts type prop (text or password) with proper input type attribute
- [ ] Placeholder text displayed when placeholder prop provided
- [ ] maxLength attribute applied when maxLength prop provided
- [ ] Character counter displays "X / Y characters" when maxLength provided
- [ ] autoComplete attribute applied for browser autofill (e.g., "name", "email")
- [ ] Input integrates with React Hook Form via Controller
- [ ] Uses design tokens (--wb-input-*, --wb-text-*) for styling
- [ ] Focus state properly styled with --wb-input-focus
- [ ] Component is fully keyboard accessible

**Context**:
Standard text input field wrapped in FormField. Props: type (text/password), placeholder, maxLength, autoComplete. Character counter if maxLength provided.

**Dependencies**: T082 (FormField)

**Files**:
- components/onboarding/form-fields/TextInput.tsx

---

**T087** [Priority: P0] [Estimate: 0.5 hours]
**Description**: Create SelectInput component
**Acceptance Criteria**:
- [ ] SelectInput component wraps FormField with Radix UI Select primitive
- [ ] Accepts options prop as array of {value: string, label: string} objects
- [ ] Placeholder text displayed when no value selected
- [ ] Selected value displayed in trigger button
- [ ] Dropdown opens/closes on click and keyboard interaction
- [ ] Keyboard navigation: Arrow keys move through options, Enter selects, Escape closes
- [ ] Integrates with React Hook Form via Controller
- [ ] Uses design tokens (--wb-dropdown-*, --wb-input-*) for styling
- [ ] ARIA labels properly set for accessibility (aria-label, aria-expanded)
- [ ] Mobile-responsive (bottom sheet on mobile, dropdown on desktop)

**Context**:
Dropdown select using Radix UI Select. Props: options (array of {value, label}), placeholder. Keyboard navigation support.

**Dependencies**: T082 (FormField)

**Files**:
- components/onboarding/form-fields/SelectInput.tsx

---

**T092** [Priority: P0] [Estimate: 2 hours]
**Description**: Implement Step page route handler
**Acceptance Criteria**:
- [ ] Route handler accepts [stepNumber] dynamic param and validates it's between 1-13
- [ ] Invalid stepNumber (< 1 or > 13) redirects to /onboarding with error message
- [ ] React Hook Form initialized with mode: 'onBlur', shouldUnregister: false
- [ ] Correct Zod schema loaded based on stepNumber via zodResolver
- [ ] Step component dynamically imported based on stepNumber (e.g., stepNumber = 1 → Step01PersonalInfo)
- [ ] Form data loaded from session on mount and set as defaultValues
- [ ] ProgressBar component rendered showing current step
- [ ] StepNavigation component rendered with Next/Back buttons
- [ ] Next button triggers form validation via handleSubmit, then calls POST /api/onboarding/save, then navigates to next step
- [ ] Back button calls POST /api/onboarding/save (no validation), then navigates to previous step
- [ ] Loading state displayed during save operation
- [ ] Error boundary catches and displays errors gracefully
- [ ] For Sprint 002: Works with minimal test step component (doesn't require all 13 steps implemented)

**Context**:
Central orchestrator for all 13 steps. Validate stepNumber param (1-13). Setup React Hook Form with mode: 'onBlur', resolver: zodResolver. Dynamic component loading based on stepNumber. Load form data from session on mount. Render: ProgressBar + StepComponent + StepNavigation. Handle Next/Back navigation with form validation. Call POST /api/onboarding/save before navigation.

**Dependencies**: T031 (Session API), T032 (save API), T036-T048 (all step components), T082-T091 (form field components)

**Files**:
- app/[locale]/onboarding/step/[stepNumber]/page.tsx

---

**T031** [Priority: P0] [Estimate: 1 hour]
**Description**: Implement Session API route handlers
**Acceptance Criteria**:
- [ ] POST /api/onboarding/session creates new session with locale, ip_address, user_agent
- [ ] POST returns 201 with session object including id, current_step, expires_at
- [ ] GET /api/onboarding/session/[sessionId] loads session by ID
- [ ] GET returns 200 with session including form_data (JSONB) and metadata
- [ ] GET returns 404 if session not found or expired
- [ ] PATCH /api/onboarding/session/[sessionId] updates currentStep, locale, emailVerified fields
- [ ] PATCH returns 200 with updated session object
- [ ] PATCH returns 400 if invalid data provided (e.g., currentStep out of range)
- [ ] RLS policies enforced: users can only access their own session
- [ ] Session expiry (7 days) validated: expired sessions return 410 Gone
- [ ] All endpoints handle errors gracefully with appropriate status codes

**Context**:
File: `app/api/onboarding/session/route.ts` (POST). File: `app/api/onboarding/session/[sessionId]/route.ts` (GET, PATCH). POST: Create session with locale, ipAddress, userAgent. GET: Load session with form_data and metadata. PATCH: Update currentStep, locale, emailVerified. Verify RLS policies enforced (session owner only).

**Dependencies**: T009 (test must fail first), T005 (Supabase client), T004 (migration)

**Files**:
- app/api/onboarding/session/route.ts
- app/api/onboarding/session/[sessionId]/route.ts

---

**T032** [Priority: P0] [Estimate: 0.5 hours]
**Description**: Implement Onboarding Progress API route handlers
**Acceptance Criteria**:
- [ ] POST /api/onboarding/save accepts sessionId and stepData in request body
- [ ] POST /save merges stepData into existing session.form_data JSONB field (preserves other steps)
- [ ] POST /save updates last_activity timestamp
- [ ] POST /save returns 200 with updated session object
- [ ] POST /api/onboarding/email/verify generates 6-digit OTP and stores in verification_code field
- [ ] POST /verify sends email with OTP (or logs to console if email service not configured)
- [ ] POST /verify sets code expiry to 10 minutes from now
- [ ] POST /verify returns 200 with success message
- [ ] POST /api/onboarding/email/verify/confirm validates OTP matches verification_code
- [ ] POST /verify/confirm checks verification_attempts < 5, returns 429 if exceeded with lockout timestamp
- [ ] POST /verify/confirm checks verification_locked_until hasn't passed, returns 429 if still locked
- [ ] POST /verify/confirm checks code hasn't expired (10 minutes), returns 400 if expired
- [ ] POST /verify/confirm sets email_verified = true on success, returns 200

**Context**:
File: `app/api/onboarding/save/route.ts` (POST). File: `app/api/onboarding/email/verify/route.ts` (POST). File: `app/api/onboarding/email/verify/confirm/route.ts` (POST). POST /save: Merge form data with existing session.form_data (JSONB). POST /verify: Generate 6-digit OTP, send email, store in verification_code. POST /verify/confirm: Verify code, check attempts (max 5), check lockout (15 min), check expiry (10 min).

**Dependencies**: T010 (test must fail first), T005, T004

**Files**:
- app/api/onboarding/save/route.ts
- app/api/onboarding/email/verify/route.ts
- app/api/onboarding/email/verify/confirm/route.ts

---

**T033** [Priority: P0] [Estimate: 0.5 hours]
**Description**: Implement Submission API route handlers
**Acceptance Criteria**:
- [ ] POST /api/onboarding/submit accepts sessionId in request body
- [ ] POST /submit creates submission with status="unpaid", copies form_data from session
- [ ] POST /submit links submission to session by updating session.submission_id
- [ ] POST /submit calculates completion_time_seconds (session.created_at to now)
- [ ] POST /submit extracts email and business_name from form_data for submission fields
- [ ] POST /submit returns 201 with submission object including id and status
- [ ] POST /submit returns 409 if submission already exists for this session (session.submission_id not null)
- [ ] POST /submit returns 400 if session not found or form_data incomplete
- [ ] GET /api/onboarding/submission/[id] returns submission by ID
- [ ] GET returns 200 with submission including status, payment details, created_at
- [ ] GET returns 404 if submission not found
- [ ] RLS policies enforced: users can only access their own submission

**Context**:
File: `app/api/onboarding/submit/route.ts` (POST). File: `app/api/onboarding/submission/[id]/route.ts` (GET). POST: Create submission with status="unpaid", link to session via submission_id FK. GET: Return submission status, payment details, created_at. Verify: 409 if submission already exists for session. Calculate completion_time_seconds from session.created_at to submission.created_at.

**Dependencies**: T011 (test must fail first), T005, T004

**Files**:
- app/api/onboarding/submit/route.ts
- app/api/onboarding/submission/[id]/route.ts

---

**T034** [Priority: P0] [Estimate: 1 hour]
**Description**: Implement Payment API route handlers
**Acceptance Criteria**:
- [ ] POST /api/onboarding/payment/intent accepts submissionId in request body
- [ ] POST /intent creates Stripe PaymentIntent for amount: 4000 (€40), currency: EUR
- [ ] POST /intent returns 201 with clientSecret for Stripe Elements
- [ ] POST /intent returns 400 if submission not found or already paid
- [ ] POST /api/onboarding/payment/complete accepts submissionId and paymentIntentId
- [ ] POST /complete updates submission: status="paid", payment_transaction_id, payment_completed_at, payment_card_last4
- [ ] POST /complete returns 200 with updated submission
- [ ] GET /api/onboarding/payment/status/[id] returns payment status for submission
- [ ] GET /status returns 200 with status (pending/succeeded/failed)
- [ ] GET /status returns 400 if more than 24 hours since submission.created_at (verification window expired)
- [ ] POST /api/onboarding/payment/webhook verifies Stripe signature using verifyWebhookSignature()
- [ ] POST /webhook handles payment_intent.succeeded event: updates submission to paid
- [ ] POST /webhook handles payment_intent.payment_failed event: logs error, keeps submission unpaid
- [ ] POST /webhook returns 200 for valid events, 400 for invalid signature

**Context**:
File: `app/api/onboarding/payment/intent/route.ts` (POST). File: `app/api/onboarding/payment/complete/route.ts` (POST). File: `app/api/onboarding/payment/status/[id]/route.ts` (GET). File: `app/api/onboarding/payment/webhook/route.ts` (POST). POST /intent: Create Stripe PaymentIntent for €40 (4000 cents), return clientSecret. POST /complete: Update submission status="paid", store payment_transaction_id, payment_completed_at. GET /status: Check payment status, enforce 24-hour verification window. POST /webhook: Handle payment_intent.succeeded, payment_intent.payment_failed events.

**Dependencies**: T012 (test must fail first), T006 (Stripe), T005, T004

**Files**:
- app/api/onboarding/payment/intent/route.ts
- app/api/onboarding/payment/complete/route.ts
- app/api/onboarding/payment/status/[id]/route.ts
- app/api/onboarding/payment/webhook/route.ts

---

**T035** [Priority: P0] [Estimate: 1 hour]
**Description**: Implement Upload API route handlers
**Acceptance Criteria**:
- [ ] POST /api/onboarding/upload accepts sessionId, fileType (logo/photo), and file in multipart/form-data
- [ ] POST validates file type: logo accepts PNG/JPG/SVG, photos accept PNG/JPG
- [ ] POST validates file size: max 10MB per file
- [ ] POST enforces logo limit: max 1 logo per session (returns 400 if exceeded)
- [ ] POST enforces photo limit: max 30 photos per session (returns 400 if exceeded)
- [ ] POST uploads file to Supabase Storage bucket "onboarding-assets" with path: {sessionId}/{fileType}-{timestamp}-{filename}
- [ ] POST creates upload record in onboarding_uploads table with file_url, file_size, mime_type, virus_scan_status="pending"
- [ ] POST extracts image dimensions (width, height) if file is image
- [ ] POST returns 201 with upload object including id, file_url, file_size
- [ ] DELETE /api/onboarding/upload/[id] deletes upload record from database
- [ ] DELETE removes file from Supabase Storage
- [ ] DELETE returns 200 on success, 404 if upload not found
- [ ] RLS policies enforced: users can only upload/delete their own session files

**Context**:
File: `app/api/onboarding/upload/route.ts` (POST). File: `app/api/onboarding/upload/[id]/route.ts` (DELETE). POST: Upload file to Supabase Storage (bucket: onboarding-assets). Enforce limits: 1 logo (10MB, PNG/JPG/SVG), 30 photos (10MB each, PNG/JPG). Create upload record with file_url, file_size, mime_type, virus_scan_status="pending". File naming: {sessionId}/{fileType}-{timestamp}-{originalFilename}. DELETE: Remove file from Supabase Storage and delete upload record.

**Dependencies**: T013 (test must fail first), T005, T004

**Files**:
- app/api/onboarding/upload/route.ts
- app/api/onboarding/upload/[id]/route.ts

---

**T051** [Priority: P0] [Estimate: 1 hour]
**Description**: Create analytics tracking utility
**Acceptance Criteria**:
- [ ] trackStepViewed(sessionId, stepNumber, metadata?) function inserts event with event_type="onboarding_step_viewed"
- [ ] trackStepCompleted(sessionId, stepNumber, durationMs?, metadata?) function inserts event with event_type="onboarding_step_completed"
- [ ] trackFieldError(sessionId, stepNumber, fieldName, errorType, metadata?) function inserts event with event_type="onboarding_field_error"
- [ ] trackPaymentInitiated(sessionId, submissionId, metadata?) function inserts event with event_type="onboarding_payment_initiated"
- [ ] trackPaymentSucceeded(sessionId, submissionId, transactionId, metadata?) function inserts event with event_type="onboarding_payment_succeeded"
- [ ] trackPaymentFailed(sessionId, submissionId, errorCode, metadata?) function inserts event with event_type="onboarding_payment_failed"
- [ ] All functions insert into onboarding_analytics table with category="user_action"
- [ ] All functions capture ip_address and user_agent from request (if available)
- [ ] All functions accept optional metadata JSONB parameter for additional context
- [ ] All functions handle errors gracefully (log but don't throw, analytics shouldn't break user flow)
- [ ] TypeScript types defined for all function parameters and return values

**Context**:
File: `lib/analytics/onboarding-analytics.ts`. Helper functions: trackStepViewed(), trackStepCompleted(), trackFieldError(), trackPaymentInitiated(), etc. Insert events into onboarding_analytics table. Include session_id, event_type, step_number, metadata (JSONB).

**Dependencies**: T005 (Supabase client), T004 (analytics table migration)

**Files**:
- lib/analytics/onboarding-analytics.ts

---

## Sprint Execution Checklist

### Pre-Sprint
- [x] Sprint goal clearly defined and achievable
- [x] All selected tasks have acceptance criteria
- [x] Dependencies identified and sequenced
- [x] Total estimate within capacity

### During Sprint
- [ ] Daily progress tracked against plan
- [ ] Blockers identified and addressed immediately
- [ ] Acceptance criteria validated for each task
- [ ] Backlog updated as tasks complete

### Sprint Completion
- [ ] All P0 tasks completed
- [ ] Sprint goal achieved
- [ ] Working software delivered
- [ ] Client value demonstrated
- [ ] Backlog statuses updated
- [ ] Lessons learned documented

## Definition of Done

A task is DONE when:
- [ ] Code implemented and tested
- [ ] All acceptance criteria met
- [ ] Tests pass (unit, integration, e2e as applicable)
- [ ] Code reviewed (if applicable)
- [ ] Documentation updated (if applicable)
- [ ] Deployed to appropriate environment
- [ ] Backlog status updated to [Done]

## Notes

**Sprint 002 Scope**:
- This sprint delivers the **core infrastructure** without implementing individual step content
- Database schema with 4 tables fully operational
- All 5 API route groups functional (session, progress, submission, payment, upload)
- Form orchestration system (Step page handler) ready to load any step dynamically
- Basic reusable form components (FormField, TextInput, SelectInput) available
- Analytics tracking utility ready for instrumentation

**End-to-End Testing Capability**:
With Sprint 002 complete, you can test:
1. Session creation and persistence
2. Form data saving and loading via JSONB
3. Submission creation (after Step 12 simulation)
4. Payment processing with Stripe (Step 13 simulation)
5. File upload and deletion
6. Analytics event tracking
7. Session expiry and recovery

**NOT Included in Sprint 002**:
- Individual step implementations (T036-T048) - Steps 1-13 content
- Step-specific Zod schemas (will use placeholder schemas)
- Email verification UI (API exists, UI comes later)
- File upload UI components (API exists, UI comes later)
- Payment UI with Stripe Elements (API exists, UI comes later)

**Testing Strategy**:
- Use Postman/curl to test API endpoints directly
- Create minimal test step component to validate Step page orchestrator
- Verify database constraints and RLS policies
- Test session recovery by creating session, closing browser, and resuming
- Test payment flow with Stripe test cards

**Technical Decisions**:
- Step page orchestrator uses dynamic imports for step components (lazy loading)
- API routes use Supabase RLS for security (no custom auth middleware)
- Analytics events captured via utility functions (fire-and-forget, non-blocking)
- Form data stored as JSONB in sessions table (flexible schema)
- File uploads go to Supabase Storage (integrated with database)

## Risk Register

**Risk**: Supabase RLS policies may not work as expected with Next.js server actions
**Mitigation**: Test RLS thoroughly with multiple sessions, verify isolation
**Probability**: Medium
**Impact**: High

**Risk**: Stripe webhook signature verification may fail in development environment
**Mitigation**: Use Stripe CLI for local webhook testing, document setup process
**Probability**: Medium
**Impact**: Medium

**Risk**: Step page orchestrator dynamic imports may cause performance issues
**Mitigation**: Implement skeleton loaders, measure LCP with web-vitals
**Probability**: Low
**Impact**: Medium

**Risk**: JSONB form_data merging may have race conditions with concurrent saves
**Mitigation**: Use Supabase optimistic locking or last-write-wins strategy
**Probability**: Medium
**Impact**: Low

**Risk**: File upload limits (1 logo, 30 photos) may not be enforced correctly
**Mitigation**: Write explicit API tests for limit enforcement, check database constraints
**Probability**: Low
**Impact**: Low

## Success Criteria

Sprint 002 is successful when:
- [ ] Database migration executes without errors and creates all 4 tables
- [ ] All 5 API route groups return expected responses (tested with Postman)
- [ ] Step page orchestrator renders with ProgressBar and StepNavigation
- [ ] Session can be created, saved, and recovered across browser sessions
- [ ] Submission can be created with status="unpaid" and linked to session
- [ ] Payment intent can be created with Stripe and returns clientSecret
- [ ] File can be uploaded to Supabase Storage and retrieved
- [ ] Analytics events are logged to database on API calls
- [ ] FormField wrapper renders with label, error, and accessibility features
- [ ] TextInput and SelectInput components work with React Hook Form

---

*Sprint generated on 2025-10-12 using /plan-sprint command*
