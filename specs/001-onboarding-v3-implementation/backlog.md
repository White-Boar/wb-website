# Backlog: Onboarding System v3

**Input**: Design documents from `/specs/001-onboarding-v3-implementation/`
**Prerequisites**: plan.md ✓, tasks.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓, quickstart.md ✓

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → LOADED: TypeScript 5.8.4, Next.js 15.4.6, React 19.0.0
   → Stack: react-hook-form 7.62.0, zod 4.1.5, zustand 5.0.8, Supabase, Stripe 4.0.0
2. Load tasks.md from feature directory
   → LOADED: 78 tasks across 5 phases
3. Load optional design documents:
   → data-model.md: 4 entities (sessions, submissions, analytics, uploads)
   → contracts/: 5 API files (session, onboarding, submission, payment, upload)
   → research.md: 10 architectural decisions validated
   → quickstart.md: 10 validation steps
4. Generate backlog by phase:
   → Setup: Next.js structure, dependencies, Supabase migration
   → Tests: 5 contract tests, 13 step component tests, integration tests
   → Core: Zustand store, 13 step components, 5 API routes
   → Integration: Stripe, Supabase, file uploads, email verification
   → Polish: E2E tests, performance tests, accessibility tests
5. Apply backlog rules:
   → Status = [Planned] for all tasks
   → Maintain task order from tasks.md
   → Include file paths, dependencies, parallel execution notes
6. Number tasks sequentially (T001, T002...)
7. Return: SUCCESS (78 tasks ready for execution)
```

## Format: `[ID] [Phase] Description [Status]`
- **[Status]**: Tasks can be in `[Planned]` phase (work has not started), `[WIP]` phase (work has started) or `[Done]` phase (work has finished).

## Path Conventions
- **Frontend**: `app/[locale]/onboarding/`, `components/onboarding/`, `lib/`
- **API Routes**: `app/api/onboarding/`
- **Tests**: `__tests__/onboarding/`
- **Database**: `supabase/migrations/`

---

## Backlog

- **T001** [Phase 3.1: Setup] Create Next.js app directory structure for onboarding feature [Done]
  → Sprint 001
  - Paths: `app/[locale]/onboarding/`, `app/[locale]/onboarding/step/[stepNumber]/`, `app/[locale]/onboarding/thank-you/`
  - Create layout.tsx with progress bar component
  - Create loading.tsx and error.tsx for each route
  - Dependencies: None
  - Files: app/[locale]/onboarding/layout.tsx, app/[locale]/onboarding/page.tsx, app/[locale]/onboarding/step/[stepNumber]/page.tsx

- **T002** [Phase 3.1: Setup] Install and configure onboarding dependencies [Done]
  → Sprint 001
  - Install: react-hook-form@7.62.0, zod@4.1.5, @hookform/resolvers, zustand@5.0.8
  - Install: @supabase/ssr, @stripe/stripe-js@4.0.0, @stripe/react-stripe-js
  - Install dev: @testing-library/react, @testing-library/user-event, @playwright/test
  - Update package.json with correct versions
  - Dependencies: None (can run in parallel with T001)
  - Parallel: [P]
  - Files: package.json, pnpm-lock.yaml

- **T003** [Phase 3.1: Setup] Configure TypeScript types for onboarding domain [Done]
  → Sprint 001
  - Create types/onboarding.ts with FormData, SessionState, SubmissionStatus, AnalyticsEvent types
  - Add Zod schemas for all 13 steps in lib/validation/onboarding-schemas.ts
  - Export type definitions matching data-model.md (flat field names: physicalAddressStreet, customerProfileBudget, etc.)
  - Dependencies: None
  - Parallel: [P]
  - Files: types/onboarding.ts, lib/validation/onboarding-schemas.ts

- **T004** [Phase 3.1: Setup] Create Supabase database migration for onboarding tables [Done]
  → Sprint 002 - Completed 2025-10-12
  - Create migration: supabase/migrations/YYYYMMDD_onboarding_v3.sql
  - Copy migration SQL from data-model.md (4 tables: onboarding_sessions, onboarding_submissions, onboarding_analytics, onboarding_uploads)
  - Include all indexes, foreign keys, RLS policies
  - Test migration with `supabase db push`
  - Dependencies: None
  - Files: supabase/migrations/20251012122748_onboarding_v3.sql, supabase/migrations/20251012122749_rollback_onboarding_v3.sql, __tests__/database/onboarding-migration.test.ts

- **T005** [Phase 3.1: Setup] Configure Supabase client for onboarding API routes [Done]
  → Sprint 002 - Completed 2025-10-12
  - Create lib/supabase/server.ts with createClient() for Server Components and Route Handlers
  - Create lib/supabase/client.ts with createClient() for Client Components
  - Add RLS helper functions for session access (verifySessionOwnership)
  - Dependencies: T004 (migration must exist)
  - Files: lib/supabase/server.ts, lib/supabase/client.ts

- **T006** [Phase 3.1: Setup] Configure Stripe client and webhook handling [Done]
  → Sprint 002 - Completed 2025-10-12
  - Create lib/stripe/client.ts with loadStripe() initialization
  - Create lib/stripe/server.ts with Stripe SDK initialization (STRIPE_SECRET_KEY)
  - Add webhook signature verification helper
  - Add types for Stripe PaymentIntent and webhook events
  - Dependencies: None
  - Parallel: [P]
  - Files: lib/stripe/client.ts, lib/stripe/server.ts, __tests__/lib/stripe/client.test.ts

- **T007** [Phase 3.1: Setup] Add onboarding translations to messages/en.json and messages/it.json [Done]
  → Sprint 001
  - Add namespace onboarding.* with all step titles, field labels, placeholders, error messages
  - Add onboarding.nav.* for Next/Back buttons, progress bar
  - Add onboarding.errors.* for validation messages (matching Zod schemas)
  - Ensure Italian translations match English structure exactly
  - Dependencies: T003 (needs schema structure)
  - Parallel: [P]
  - Files: messages/en.json, messages/it.json

- **T008** [Phase 3.1: Setup] Configure environment variables for onboarding [Done]
  → Sprint 001
  - Add to .env.local: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
  - Add: SUPABASE_SERVICE_ROLE_KEY (for server-side operations)
  - Add: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
  - Add: NEXT_PUBLIC_GOOGLE_PLACES_API_KEY (for address autocomplete)
  - Validate all required env vars with schema validation
  - Dependencies: None
  - Files: .env.local, .env.example

- **T009** [Phase 3.2: Tests First] Contract test for Session API (session-api.yaml) [Planned]
  - Test file: `__tests__/api/onboarding/session.test.ts`
  - Test POST /api/onboarding/session (create session)
  - Test GET /api/onboarding/session/[sessionId] (load session)
  - Test PATCH /api/onboarding/session/[sessionId] (update metadata)
  - Verify: 201 on create, 200 on load/update, 404 on missing session, 400 on invalid locale
  - Dependencies: T005 (Supabase client), T003 (types)
  - Parallel: [P]
  - Files: __tests__/api/onboarding/session.test.ts

- **T010** [Phase 3.2: Tests First] Contract test for Onboarding Progress API (onboarding-api.yaml) [Planned]
  - Test file: `__tests__/api/onboarding/save.test.ts`
  - Test POST /api/onboarding/save (save step progress)
  - Test POST /api/onboarding/email/verify (send OTP)
  - Test POST /api/onboarding/email/verify/confirm (verify OTP)
  - Verify: 200 on save, 200 on OTP send, 200 on verify success, 429 on rate limit/lockout
  - Dependencies: T005, T003
  - Parallel: [P]
  - Files: __tests__/api/onboarding/save.test.ts, __tests__/api/onboarding/email/verify.test.ts

- **T011** [Phase 3.2: Tests First] Contract test for Submission API (submission-api.yaml) [Planned]
  - Test file: `__tests__/api/onboarding/submit.test.ts`
  - Test POST /api/onboarding/submit (create unpaid submission after Step 12)
  - Test GET /api/onboarding/submission/[id] (get submission status)
  - Verify: 201 with status="unpaid", 409 if submission exists, 404 if session not found
  - Dependencies: T005, T003
  - Parallel: [P]
  - Files: __tests__/api/onboarding/submit.test.ts

- **T012** [Phase 3.2: Tests First] Contract test for Payment API (payment-api.yaml) [Planned]
  - Test file: `__tests__/api/onboarding/payment.test.ts`
  - Test POST /api/onboarding/payment/intent (create Stripe PaymentIntent)
  - Test POST /api/onboarding/payment/complete (update submission to paid)
  - Test GET /api/onboarding/payment/status/[id] (check payment status)
  - Test POST /api/onboarding/payment/webhook (Stripe webhook handler)
  - Verify: 201 with clientSecret, 200 on complete, 400 on 24-hour expiry, 200 on webhook
  - Dependencies: T006 (Stripe client), T005, T003
  - Parallel: [P]
  - Files: __tests__/api/onboarding/payment.test.ts

- **T013** [Phase 3.2: Tests First] Contract test for Upload API (upload-api.yaml) [Planned]
  - Test file: `__tests__/api/onboarding/upload.test.ts`
  - Test POST /api/onboarding/upload (upload logo or photo)
  - Test DELETE /api/onboarding/upload/[id] (delete uploaded file)
  - Verify: 201 with fileUrl, 400 if exceeds limits (1 logo, 30 photos, 10MB each), 200 on delete
  - Verify virus_scan_status = "pending" initially
  - Dependencies: T005, T003
  - Parallel: [P]
  - Files: __tests__/api/onboarding/upload.test.ts

- **T014** [Phase 3.2: Tests First] Unit test for Step 1 - Personal Info component [Planned]
  - Test file: `__tests__/components/onboarding/Step01PersonalInfo.test.tsx`
  - Test rendering with React Hook Form
  - Test validation: firstName (required), lastName (required), email (required, valid format)
  - Test Next button disabled until all fields valid
  - Verify no manual trigger() calls
  - Dependencies: T003 (schemas), T007 (translations)
  - Parallel: [P]
  - Files: __tests__/components/onboarding/Step01PersonalInfo.test.tsx

- **T015** [Phase 3.2: Tests First] Unit test for Step 2 - Email Verification component [Planned]
  - Test file: `__tests__/components/onboarding/Step02EmailVerification.test.tsx`
  - Test 6-digit OTP input with auto-submit on 6th digit
  - Test verification attempt counter (max 5)
  - Test 15-minute lockout after 5 failed attempts
  - Test code expiry (10 minutes)
  - Dependencies: T003, T007
  - Parallel: [P]
  - Files: __tests__/components/onboarding/Step02EmailVerification.test.tsx

- **T016** [Phase 3.2: Tests First] Unit test for Step 3 - Business Basics component [Planned]
  - Test file: `__tests__/components/onboarding/Step03BusinessBasics.test.tsx`
  - Test Google Places autocomplete for address fields
  - Test flat field naming: physicalAddressStreet, physicalAddressCity, etc.
  - Test validation: businessName (required), businessEmail (email format), businessPhone (E.164 format)
  - Test VAT number optional field
  - Dependencies: T003, T007
  - Parallel: [P]
  - Files: __tests__/components/onboarding/Step03BusinessBasics.test.tsx

- **T017** [Phase 3.2: Tests First] Unit test for Step 4 - Brand Definition component [Planned]
  - Test file: `__tests__/components/onboarding/Step04BrandDefinition.test.tsx`
  - Test businessDescription textarea (required, min 50 chars)
  - Test competitorUrls array input (min 1, max 5 URLs)
  - Test URL validation for competitor URLs
  - Dependencies: T003, T007
  - Parallel: [P]
  - Files: __tests__/components/onboarding/Step04BrandDefinition.test.tsx

- **T018** [Phase 3.2: Tests First] Unit test for Step 5 - Customer Profile component [Planned]
  - Test file: `__tests__/components/onboarding/Step05CustomerProfile.test.tsx`
  - Test 5 slider inputs with flat field naming: customerProfileBudget, customerProfileStyle, etc.
  - Test range validation (0-100 for each slider)
  - Test slider visual feedback and labels
  - Dependencies: T003, T007
  - Parallel: [P]
  - Files: __tests__/components/onboarding/Step05CustomerProfile.test.tsx

- **T019** [Phase 3.2: Tests First] Unit test for Step 6 - Customer Needs component [Planned]
  - Test file: `__tests__/components/onboarding/Step06CustomerNeeds.test.tsx`
  - Test customerProblems textarea (required)
  - Test customerDelight textarea (optional)
  - Test character count display
  - Dependencies: T003, T007
  - Parallel: [P]
  - Files: __tests__/components/onboarding/Step06CustomerNeeds.test.tsx

- **T020** [Phase 3.2: Tests First] Unit test for Step 7 - Visual Inspiration component [Planned]
  - Test file: `__tests__/components/onboarding/Step07VisualInspiration.test.tsx`
  - Test websiteReferences array input (min 1, max 5 URLs)
  - Test URL validation and preview generation
  - Dependencies: T003, T007
  - Parallel: [P]
  - Files: __tests__/components/onboarding/Step07VisualInspiration.test.tsx

- **T021** [Phase 3.2: Tests First] Unit test for Step 8 - Design Style component [Planned]
  - Test file: `__tests__/components/onboarding/Step08DesignStyle.test.tsx`
  - Test single-select radio group for design style
  - Test image preview for each style option
  - Test required field validation
  - Dependencies: T003, T007
  - Parallel: [P]
  - Files: __tests__/components/onboarding/Step08DesignStyle.test.tsx

- **T022** [Phase 3.2: Tests First] Unit test for Step 9 - Image Style component [Planned]
  - Test file: `__tests__/components/onboarding/Step09ImageStyle.test.tsx`
  - Test single-select radio group for image style
  - Test image preview for each option
  - Test required field validation
  - Dependencies: T003, T007
  - Parallel: [P]
  - Files: __tests__/components/onboarding/Step09ImageStyle.test.tsx

- **T023** [Phase 3.2: Tests First] Unit test for Step 10 - Color Palette component [Planned]
  - Test file: `__tests__/components/onboarding/Step10ColorPalette.test.tsx`
  - Test single-select radio group for color palette
  - Test color swatch preview for each palette
  - Test required field validation
  - Dependencies: T003, T007
  - Parallel: [P]
  - Files: __tests__/components/onboarding/Step10ColorPalette.test.tsx

- **T024** [Phase 3.2: Tests First] Unit test for Step 11 - Website Structure component [Planned]
  - Test file: `__tests__/components/onboarding/Step11WebsiteStructure.test.tsx`
  - Test multi-select checkbox group for website sections
  - Test conditional offerings input (if "Services/Products" selected)
  - Test primary goal selection (required)
  - Dependencies: T003, T007
  - Parallel: [P]
  - Files: __tests__/components/onboarding/Step11WebsiteStructure.test.tsx

- **T025** [Phase 3.2: Tests First] Unit test for Step 12 - Business Assets component [Planned]
  - Test file: `__tests__/components/onboarding/Step12BusinessAssets.test.tsx`
  - Test logo upload (max 1 file, 10MB, PNG/JPG/SVG)
  - Test photo upload (max 30 files, 10MB each, PNG/JPG)
  - Test file preview and delete functionality
  - Test upload progress indication
  - Dependencies: T003, T007, T013 (upload API test)
  - Parallel: [P]
  - Files: __tests__/components/onboarding/Step12BusinessAssets.test.tsx

- **T026** [Phase 3.2: Tests First] Unit test for Step 13 - Payment component [Planned]
  - Test file: `__tests__/components/onboarding/Step13Payment.test.tsx`
  - Test Stripe Elements rendering
  - Test payment submission with test card
  - Test Back button disabled on Step 13
  - Test error handling for failed payments
  - Test retry functionality
  - Dependencies: T006 (Stripe client), T003, T007
  - Parallel: [P]
  - Files: __tests__/components/onboarding/Step13Payment.test.tsx

- **T027** [Phase 3.2: Tests First] Integration test: Full onboarding flow (Steps 1-13) [Planned]
  - Test file: `__tests__/integration/onboarding-full-flow.test.tsx`
  - Test complete flow: Start → Step 1-12 → Submit → Step 13 → Payment → Thank You
  - Verify submission created with status="unpaid" after Step 12
  - Verify submission updated to status="paid" after payment
  - Verify analytics events logged at each step
  - Dependencies: T009-T013 (all contract tests), T014-T026 (all step tests)
  - Parallel: [P]
  - Files: __tests__/integration/onboarding-full-flow.test.tsx

- **T028** [Phase 3.2: Tests First] Integration test: Session recovery and persistence [Planned]
  - Test file: `__tests__/integration/onboarding-session-recovery.test.tsx`
  - Test localStorage persistence of Zustand metadata
  - Test session reload from Supabase after browser close
  - Test session expiry (7 days)
  - Test form data restoration on step navigation
  - Dependencies: T009 (session API test)
  - Parallel: [P]
  - Files: __tests__/integration/onboarding-session-recovery.test.tsx

- **T029** [Phase 3.2: Tests First] Integration test: Payment retry flow [Planned]
  - Test file: `__tests__/integration/onboarding-payment-retry.test.tsx`
  - Test failed payment with declined card
  - Test retry functionality without re-submitting form
  - Test successful payment after retry
  - Test analytics events for payment failures and retries
  - Dependencies: T012 (payment API test), T026 (payment component test)
  - Parallel: [P]
  - Files: __tests__/integration/onboarding-payment-retry.test.tsx

- **T030** [Phase 3.3: Core Implementation] Create Zustand store for onboarding session metadata [Done]
  → Sprint 001
  - File: `lib/store/onboarding-store.ts`
  - Store ONLY metadata: sessionId (uuid | null), currentStep (1-13), lastSaved (timestamp | null)
  - DO NOT store form data (belongs in React Hook Form)
  - Add persistence middleware with key "wb-onboarding-meta"
  - Add actions: setSessionId(), setCurrentStep(), setLastSaved(), resetSession()
  - Dependencies: T002 (zustand installed), T003 (types)
  - Files: lib/store/onboarding-store.ts

- **T031** [Phase 3.3: Core Implementation] Implement Session API route handlers [Done]
  → Sprint 002 | Completed: 2025-10-12
  - File: `src/app/api/onboarding/session/route.ts` (POST)
  - File: `src/app/api/onboarding/session/[sessionId]/route.ts` (GET, PATCH)
  - POST: Create session with locale, ipAddress, userAgent ✅
  - GET: Load session with form_data and metadata ✅
  - PATCH: Update currentStep, locale, emailVerified ✅
  - Verify RLS policies enforced (session owner only) ✅
  - E2E Tests: `src/__tests__/e2e/api/onboarding-session.spec.ts` (12 tests passing)
  - Dependencies: T005 (Supabase client), T004 (migration)
  - Files: src/app/api/onboarding/session/route.ts, src/app/api/onboarding/session/[sessionId]/route.ts, src/__tests__/e2e/api/onboarding-session.spec.ts

- **T032** [Phase 3.3: Core Implementation] Implement Onboarding Progress API route handlers [Done]
  → Sprint 002 | Completed: 2025-10-12
  - File: `src/app/api/onboarding/save/route.ts` (POST) ✅
  - File: `src/app/api/onboarding/email/verify/route.ts` (POST) ✅
  - File: `src/app/api/onboarding/email/verify/confirm/route.ts` (POST) ✅
  - POST /save: Merge form data with existing session.form_data (JSONB) ✅
  - POST /verify: Generate 6-digit OTP, send email, store in verification_code ✅
  - POST /verify/confirm: Verify code, check attempts (max 5), check lockout (15 min), check expiry (60 sec) ✅
  - E2E Tests: `src/__tests__/e2e/api/onboarding-progress.spec.ts` (9 tests passing)
  - Note: Changed OTP expiry from 10 min to 60 sec, using updated_at timestamp (no extra column)
  - Dependencies: T005, T004
  - Files: src/app/api/onboarding/save/route.ts, src/app/api/onboarding/email/verify/route.ts, src/app/api/onboarding/email/verify/confirm/route.ts, src/__tests__/e2e/api/onboarding-progress.spec.ts

- **T033** [Phase 3.3: Core Implementation] Implement Submission API route handlers [Done]
  → Sprint 002 - Completed 2025-10-12
  - File: `app/api/onboarding/submit/route.ts` (POST)
  - File: `app/api/onboarding/submission/[id]/route.ts` (GET)
  - POST: Create submission with status="unpaid", link to session via submission_id FK
  - GET: Return submission status, payment details, created_at
  - Verify: 409 if submission already exists for session
  - Calculate completion_time_seconds from session.created_at to submission.created_at
  - Dependencies: T011 (test must fail first), T005, T004
  - Files: app/api/onboarding/submit/route.ts, app/api/onboarding/submission/[id]/route.ts

- **T034** [Phase 3.3: Core Implementation] Implement Payment API route handlers [Done]
  → Sprint 002 - Completed 2025-10-12
  - File: `app/api/onboarding/payment/intent/route.ts` (POST)
  - File: `app/api/onboarding/payment/complete/route.ts` (POST)
  - File: `app/api/onboarding/payment/status/[id]/route.ts` (GET)
  - File: `app/api/onboarding/payment/webhook/route.ts` (POST)
  - POST /intent: Create Stripe PaymentIntent for €40 (4000 cents), return clientSecret
  - POST /complete: Update submission status="paid", store payment_transaction_id, payment_completed_at
  - GET /status: Check payment status, enforce 24-hour verification window
  - POST /webhook: Handle payment_intent.succeeded, payment_intent.payment_failed events
  - Dependencies: T012 (test must fail first), T006 (Stripe), T005, T004
  - Files: app/api/onboarding/payment/intent/route.ts, app/api/onboarding/payment/complete/route.ts, app/api/onboarding/payment/status/[id]/route.ts, app/api/onboarding/payment/webhook/route.ts

- **T035** [Phase 3.3: Core Implementation] Implement Upload API route handlers [Done]
  → Sprint 002 - Completed 2025-10-12
  - File: `app/api/onboarding/upload/route.ts` (POST)
  - File: `app/api/onboarding/upload/[id]/route.ts` (DELETE)
  - POST: Upload file to Supabase Storage (bucket: onboarding-assets)
  - Enforce limits: 1 logo (10MB, PNG/JPG/SVG), 30 photos (10MB each, PNG/JPG)
  - Create upload record with file_url, file_size, mime_type, virus_scan_status="pending"
  - File naming: {sessionId}/{fileType}-{timestamp}-{originalFilename}
  - DELETE: Remove file from Supabase Storage and delete upload record
  - Dependencies: T013 (test must fail first), T005, T004
  - Files: app/api/onboarding/upload/route.ts, app/api/onboarding/upload/[id]/route.ts

- **T035A** [Phase 3.3: Core Implementation] Create Welcome component for onboarding landing page [Done]
  → Sprint 001
  - File: `components/onboarding/Welcome.tsx`
  - Design reference: context/Visual design/onboarding-00-welcome.png
  - Render welcome/landing content matching visual design
  - Display value proposition and "Start Your Website" CTA
  - Implement restart functionality for returning users
  - Uses design tokens (--wb-*) for all styling
  - Responsive design for mobile and desktop
  - All text uses next-intl translations
  - Dependencies: T007 (translations)
  - Files: components/onboarding/Welcome.tsx

- **T036** [Phase 3.3: Core Implementation] Implement Step 1 - Personal Info component [Planned]
  - File: `components/onboarding/Step01PersonalInfo.tsx`
  - Design reference: context/Visual design/onboarding-01-personal-info.png
  - Fields: firstName, lastName, email (all required)
  - Use React Hook Form with mode: 'onBlur', zodResolver(step1Schema)
  - Add field-level error display
  - Next button disabled until form valid
  - Dependencies: T014 (test must fail first), T030 (Zustand store), T003 (schemas)
  - Parallel: [P]
  - Files: components/onboarding/Step01PersonalInfo.tsx

- **T037** [Phase 3.3: Core Implementation] Implement Step 2 - Email Verification component [Planned]
  - File: `components/onboarding/Step02EmailVerification.tsx`
  - Design reference: context/Visual design/onboarding-02-email-verification.png
  - 6-digit OTP input with auto-submit on 6th digit
  - Display verification attempt counter (5 max)
  - Show 15-minute lockout timer if attempts exceeded
  - Resend code button with 60-second cooldown
  - Dependencies: T015 (test must fail first), T032 (email verification API)
  - Parallel: [P]
  - Files: components/onboarding/Step02EmailVerification.tsx

- **T038** [Phase 3.3: Core Implementation] Implement Step 3 - Business Basics component [Planned]
  - File: `components/onboarding/Step03BusinessBasics.tsx`
  - Design reference: context/Visual design/onboarding-03-business-details.png
  - Fields: businessName, businessEmail, businessPhone, address fields (flat: physicalAddressStreet, etc.), industry, vatNumber (optional)
  - Integrate Google Places Autocomplete API for address
  - Auto-fill all address fields on place selection
  - Manual entry fallback if autocomplete fails
  - Dependencies: T016 (test must fail first), T030, T003, T008 (Google API key)
  - Parallel: [P]
  - Files: components/onboarding/Step03BusinessBasics.tsx

- **T039** [Phase 3.3: Core Implementation] Implement Step 4 - Brand Definition component [Planned]
  - File: `components/onboarding/Step04BrandDefinition.tsx`
  - Design reference: context/Visual design/onboarding-04-brand-definition.png
  - Fields: businessDescription (textarea, min 50 chars), competitorUrls (array, 1-5 URLs), competitorAnalysis (optional)
  - Add URL validation and preview generation
  - Character counter for businessDescription
  - Dependencies: T017 (test must fail first), T030, T003
  - Parallel: [P]
  - Files: components/onboarding/Step04BrandDefinition.tsx

- **T040** [Phase 3.3: Core Implementation] Implement Step 5 - Customer Profile component [Planned]
  - File: `components/onboarding/Step05CustomerProfile.tsx`
  - Design reference: context/Visual design/onboarding-05-customer-profile.png
  - 5 sliders: customerProfileBudget, customerProfileStyle, customerProfileMotivation, customerProfileDecisionMaking, customerProfileLoyalty
  - Range: 0-100 for each slider
  - Visual feedback with labels ("Budget-Conscious" ↔ "Premium")
  - Dependencies: T018 (test must fail first), T030, T003
  - Parallel: [P]
  - Files: components/onboarding/Step05CustomerProfile.tsx

- **T041** [Phase 3.3: Core Implementation] Implement Step 6 - Customer Needs component [Planned]
  - File: `components/onboarding/Step06CustomerNeeds.tsx`
  - Design reference: context/Visual design/onboarding-06-customer-needs.png
  - Fields: customerProblems (required), customerDelight (optional)
  - Character counter for both fields
  - Auto-expand textareas
  - Dependencies: T019 (test must fail first), T030, T003
  - Parallel: [P]
  - Files: components/onboarding/Step06CustomerNeeds.tsx

- **T042** [Phase 3.3: Core Implementation] Implement Step 7 - Visual Inspiration component [Planned]
  - File: `components/onboarding/Step07VisualInspiration.tsx`
  - Design reference: context/Visual design/onboarding-07-visual-inspiration.png
  - Field: websiteReferences (array, 1-5 URLs)
  - URL validation with preview generation
  - Add/remove URL inputs dynamically
  - Dependencies: T020 (test must fail first), T030, T003
  - Parallel: [P]
  - Files: components/onboarding/Step07VisualInspiration.tsx

- **T043** [Phase 3.3: Core Implementation] Implement Step 8 - Design Style component [Planned]
  - File: `components/onboarding/Step08DesignStyle.tsx`
  - Design reference: context/Visual design/onboarding-08-design-style.png
  - Single-select radio group with image previews
  - Options: minimalist, modern, classic, bold (with preview images)
  - Dependencies: T021 (test must fail first), T030, T003
  - Parallel: [P]
  - Files: components/onboarding/Step08DesignStyle.tsx

- **T044** [Phase 3.3: Core Implementation] Implement Step 9 - Image Style component [Planned]
  - File: `components/onboarding/Step09ImageStyle.tsx`
  - Design reference: context/Visual design/onboarding-09-image-style.png
  - Single-select radio group with image previews
  - Options: photorealistic, illustrated, abstract, minimalist (with preview images)
  - Dependencies: T022 (test must fail first), T030, T003
  - Parallel: [P]
  - Files: components/onboarding/Step09ImageStyle.tsx

- **T045** [Phase 3.3: Core Implementation] Implement Step 10 - Color Palette component [Planned]
  - File: `components/onboarding/Step10ColorPalette.tsx`
  - Design reference: context/Visual design/onboarding-10-color-palette.png
  - Single-select radio group with color swatch previews
  - Multiple palette options with visual color swatches
  - Dependencies: T023 (test must fail first), T030, T003
  - Parallel: [P]
  - Files: components/onboarding/Step10ColorPalette.tsx

- **T046** [Phase 3.3: Core Implementation] Implement Step 11 - Website Structure component [Planned]
  - File: `components/onboarding/Step11WebsiteStructure.tsx`
  - Design reference: context/Visual design/onboarding-11-website-structure.png
  - Multi-select checkbox group for website sections
  - Conditional offerings input (show if "Services/Products" selected)
  - Primary goal selection (required): generate_leads, generate_calls, online_sales, brand_awareness
  - Dependencies: T024 (test must fail first), T030, T003
  - Parallel: [P]
  - Files: components/onboarding/Step11WebsiteStructure.tsx

- **T047** [Phase 3.3: Core Implementation] Implement Step 12 - Business Assets component [Planned]
  - File: `components/onboarding/Step12BusinessAssets.tsx`
  - Design reference: context/Visual design/onboarding-12-business-assets.png
  - Logo upload: max 1 file, 10MB, PNG/JPG/SVG (drag & drop + file picker)
  - Photo upload: max 30 files, 10MB each, PNG/JPG (drag & drop + file picker)
  - File preview with thumbnails
  - Delete uploaded file functionality
  - Upload progress indication
  - Call T035 (Upload API) for file uploads
  - Dependencies: T025 (test must fail first), T035 (Upload API), T030, T003
  - Files: components/onboarding/Step12BusinessAssets.tsx

- **T048** [Phase 3.3: Core Implementation] Implement Step 13 - Payment component [Planned]
  - File: `components/onboarding/Step13Payment.tsx`
  - Design reference: Not available (no onboarding-13-payment.png - use thank-you design as reference)
  - Integrate Stripe Elements (CardElement)
  - Display €40/month subscription price
  - Disable Back button on Step 13
  - Call T034 (Payment API) to create PaymentIntent
  - Handle payment success/failure with error messages
  - Show retry button on failure
  - Dependencies: T026 (test must fail first), T034 (Payment API), T030, T003, T006 (Stripe)
  - Files: components/onboarding/Step13Payment.tsx

- **T049** [Phase 3.3: Core Implementation] Create ProgressBar component for onboarding layout [Done]
  → Sprint 001
  - File: `components/onboarding/ProgressBar.tsx`
  - Display current step (1-13) with visual progress indicator
  - Show step titles from translations
  - Highlight completed steps, current step, and upcoming steps
  - Mobile-responsive design
  - Dependencies: T007 (translations), T030 (Zustand for currentStep)
  - Files: components/onboarding/ProgressBar.tsx

- **T050** [Phase 3.3: Core Implementation] Create StepNavigation component (Next/Back buttons) [Done]
  → Sprint 001
  - File: `components/onboarding/StepNavigation.tsx`
  - Next button: disabled if form invalid, calls save API then navigates
  - Back button: navigates to previous step, disabled on Step 1 and Step 13
  - Loading state during save operation
  - Trigger form validation on Next click (via RHF handleSubmit)
  - Dependencies: T032 (save API), T030 (Zustand)
  - Files: components/onboarding/StepNavigation.tsx

- **T051** [Phase 3.3: Core Implementation] Create analytics tracking utility [Done]
  → Sprint 002 - Completed 2025-10-12
  - File: `lib/analytics/onboarding-analytics.ts`
  - Helper functions: trackStepViewed(), trackStepCompleted(), trackFieldError(), trackPaymentInitiated(), etc.
  - Insert events into onboarding_analytics table
  - Include session_id, event_type, step_number, metadata (JSONB)
  - Dependencies: T005 (Supabase client), T004 (analytics table migration)
  - Files: lib/analytics/tracker.ts, __tests__/lib/analytics/tracker.test.ts

- **T052** [Phase 3.4: Integration] Integrate analytics tracking into all step components [Planned]
  - Add trackStepViewed() on component mount for Steps 1-13
  - Add trackStepCompleted() on successful Next button click
  - Add trackFieldError() on validation errors
  - Add trackPaymentInitiated(), trackPaymentSucceeded(), trackPaymentFailed() in Step 13
  - Dependencies: T051 (analytics utility), T036-T048 (all steps implemented)
  - Files: components/onboarding/Step01PersonalInfo.tsx through Step13Payment.tsx

- **T053** [Phase 3.4: Integration] Implement session recovery on onboarding page load [Planned]
  - File: `app/[locale]/onboarding/page.tsx`
  - On mount: Check Zustand for sessionId
  - If sessionId exists: Load session from Supabase via T031 (Session API)
  - Restore currentStep and navigate to /onboarding/step/[stepNumber]
  - If session expired or not found: Create new session via T031
  - Dependencies: T031 (Session API), T030 (Zustand store)
  - Files: app/[locale]/onboarding/page.tsx

- **T054** [Phase 3.4: Integration] Implement form data persistence on step navigation [Planned]
  - Modify T050 (StepNavigation) to call POST /api/onboarding/save before navigation
  - Save ONLY on Next/Back clicks (no auto-save)
  - Merge new form data with existing session.form_data (JSONB)
  - Update last_activity timestamp
  - Dependencies: T050 (StepNavigation), T032 (save API)
  - Files: components/onboarding/StepNavigation.tsx

- **T055** [Phase 3.4: Integration] Implement submission creation after Step 12 [Planned]
  - Modify T047 (Step 12 component) to call POST /api/onboarding/submit after file uploads complete
  - Create submission with status="unpaid"
  - Store submission_id in session via PATCH /api/onboarding/session/[sessionId]
  - Navigate to Step 13 only after submission created
  - Dependencies: T047 (Step 12), T033 (Submission API), T031 (Session API)
  - Files: components/onboarding/Step12BusinessAssets.tsx

- **T056** [Phase 3.4: Integration] Implement payment completion and submission update in Step 13 [Planned]
  - Modify T048 (Step 13 component) to call POST /api/onboarding/payment/complete after Stripe payment succeeds
  - Update submission status="paid", payment_transaction_id, payment_completed_at
  - Track analytics: trackPaymentSucceeded()
  - Navigate to /onboarding/thank-you
  - Dependencies: T048 (Step 13), T034 (Payment API), T051 (analytics)
  - Files: components/onboarding/Step13Payment.tsx

- **T057** [Phase 3.4: Integration] Create Thank You page with completion summary [Done]
  → Sprint 001
  - File: `app/[locale]/onboarding/thank-you/page.tsx`
  - Design reference: context/Visual design/onboarding-13-thank-you.png
  - Display: Submission ID, business name, email, "5 business days" timeline
  - Send confirmation email via email service (if configured)
  - Clear Zustand session metadata (resetSession())
  - Dependencies: T030 (Zustand), T033 (Submission API to fetch details)
  - Files: app/[locale]/onboarding/thank-you/page.tsx

- **T058** [Phase 3.5: Polish] Unit test for Zustand store actions [Planned]
  - Test file: `__tests__/lib/store/onboarding-store.test.ts`
  - Test setSessionId(), setCurrentStep(), setLastSaved(), resetSession()
  - Test localStorage persistence
  - Verify NO form data stored in Zustand
  - Dependencies: T030 (Zustand store)
  - Parallel: [P]
  - Files: __tests__/lib/store/onboarding-store.test.ts

- **T059** [Phase 3.5: Polish] Unit test for Zod validation schemas [Planned]
  - Test file: `__tests__/lib/validation/onboarding-schemas.test.ts`
  - Test all 13 step schemas: required fields, format validation, array limits
  - Test flat field naming: physicalAddressStreet, customerProfileBudget, etc.
  - Test error messages match translations
  - Dependencies: T003 (schemas)
  - Parallel: [P]
  - Files: __tests__/lib/validation/onboarding-schemas.test.ts

- **T060** [Phase 3.5: Polish] Unit test for analytics utility [Planned]
  - Test file: `__tests__/lib/analytics/onboarding-analytics.test.ts`
  - Test trackStepViewed(), trackStepCompleted(), trackFieldError()
  - Test trackPaymentInitiated(), trackPaymentSucceeded(), trackPaymentFailed()
  - Verify correct event_type, metadata structure
  - Dependencies: T051 (analytics utility)
  - Parallel: [P]
  - Files: __tests__/lib/analytics/onboarding-analytics.test.ts

- **T061** [Phase 3.5: Polish] Unit test for Supabase RLS policies [Planned]
  - Test file: `__tests__/lib/supabase/rls-policies.test.ts`
  - Test session owner can access own session/submission/uploads
  - Test non-owner cannot access other sessions
  - Test admin role can access all sessions (if admin implemented)
  - Dependencies: T005 (Supabase client), T004 (migration with RLS)
  - Parallel: [P]
  - Files: __tests__/lib/supabase/rls-policies.test.ts

- **T062** [Phase 3.5: Polish] E2E test: Happy path - Complete flow Steps 1-13 with payment [Planned]
  - Test file: `__tests__/e2e/onboarding-happy-path.spec.ts`
  - Start onboarding → Fill all 13 steps → Submit → Pay → Thank You
  - Use Stripe test card: 4242 4242 4242 4242
  - Verify submission status changes: null → unpaid → paid
  - Verify analytics events logged
  - Dependencies: T027 (integration test), all implementation complete
  - Parallel: [P]
  - Files: __tests__/e2e/onboarding-happy-path.spec.ts

- **T063** [Phase 3.5: Polish] E2E test: Session recovery after browser close [Planned]
  - Test file: `__tests__/e2e/onboarding-session-recovery.spec.ts`
  - Fill Steps 1-5 → Close browser → Reopen → Verify resume at Step 5
  - Verify form data restored from Supabase
  - Test with localStorage cleared (force DB reload)
  - Dependencies: T028 (integration test), T053 (session recovery)
  - Parallel: [P]
  - Files: __tests__/e2e/onboarding-session-recovery.spec.ts

- **T064** [Phase 3.5: Polish] E2E test: Payment retry after failure [Planned]
  - Test file: `__tests__/e2e/onboarding-payment-retry.spec.ts`
  - Complete Steps 1-12 → Use declining card (4000 0000 0000 0002) → Retry with successful card
  - Verify error message displayed
  - Verify Back button disabled on Step 13
  - Verify submission remains unpaid until successful payment
  - Dependencies: T029 (integration test), T056 (payment completion)
  - Parallel: [P]
  - Files: __tests__/e2e/onboarding-payment-retry.spec.ts

- **T065** [Phase 3.5: Polish] E2E test: Email verification lockout after 5 attempts [Planned]
  - Test file: `__tests__/e2e/onboarding-email-lockout.spec.ts`
  - Reach Step 2 → Enter wrong code 5 times → Verify 15-minute lockout
  - Verify lockout timer displayed
  - Verify API blocks 6th attempt with 429 status
  - Dependencies: T032 (email verification API), T037 (Step 2 component)
  - Parallel: [P]
  - Files: __tests__/e2e/onboarding-email-lockout.spec.ts

- **T066** [Phase 3.5: Polish] E2E test: File upload limits (1 logo, 30 photos) [Planned]
  - Test file: `__tests__/e2e/onboarding-file-upload.spec.ts`
  - Upload 1 logo → Verify success
  - Try uploading 2nd logo → Verify 400 error
  - Upload 30 photos → Verify success
  - Try uploading 31st photo → Verify 400 error
  - Dependencies: T035 (Upload API), T047 (Step 12 component)
  - Parallel: [P]
  - Files: __tests__/e2e/onboarding-file-upload.spec.ts

- **T067** [Phase 3.5: Polish] E2E test: Address autocomplete with Google Places API [Planned]
  - Test file: `__tests__/e2e/onboarding-address-autocomplete.spec.ts`
  - Type "Via Roma, Milano" → Select from dropdown → Verify all fields auto-filled
  - Test with invalid address → Verify manual entry fallback
  - Dependencies: T038 (Step 3 component), T008 (Google API key)
  - Parallel: [P]
  - Files: __tests__/e2e/onboarding-address-autocomplete.spec.ts

- **T068** [Phase 3.5: Polish] E2E test: 24-hour payment verification window [Planned]
  - Test file: `__tests__/e2e/onboarding-payment-verification-window.spec.ts`
  - Create submission → Manually update created_at to 25 hours ago in DB
  - Try checking payment status → Verify 400 error with "verification expired" message
  - Dependencies: T034 (Payment API status endpoint)
  - Files: __tests__/e2e/onboarding-payment-verification-window.spec.ts

- **T069** [Phase 3.5: Polish] E2E test: Unpaid submission follow-up tracking [Planned]
  - Test file: `__tests__/e2e/onboarding-unpaid-submission.spec.ts`
  - Complete Steps 1-12 → Create unpaid submission → Do NOT pay
  - Close browser
  - Verify analytics event "onboarding_unpaid_followup" logged
  - Verify submission visible in admin dashboard (if admin implemented)
  - Dependencies: T033 (Submission API), T051 (analytics)
  - Files: __tests__/e2e/onboarding-unpaid-submission.spec.ts

- **T070** [Phase 3.5: Polish] Performance test: LCP ≤ 1.8s on Step 1 [Planned]
  - Test file: `__tests__/performance/onboarding-lcp.spec.ts`
  - Measure LCP on /onboarding/step/1 (first contentful step)
  - Verify dynamic imports for heavy components (FileUpload, AddressAutocomplete)
  - Verify skeleton loaders prevent layout shift
  - Dependencies: T036 (Step 1 component)
  - Parallel: [P]
  - Files: __tests__/performance/onboarding-lcp.spec.ts

- **T071** [Phase 3.5: Polish] Performance test: CLS < 0.1 across all steps [Planned]
  - Test file: `__tests__/performance/onboarding-cls.spec.ts`
  - Measure CLS on Steps 1-13
  - Verify no layout shifts during component loading
  - Verify skeleton loaders used for async components
  - Dependencies: T036-T048 (all steps)
  - Parallel: [P]
  - Files: __tests__/performance/onboarding-cls.spec.ts

- **T072** [Phase 3.5: Polish] Performance test: Step transition < 300ms [Planned]
  - Test file: `__tests__/performance/onboarding-step-transition.spec.ts`
  - Measure time from Next button click to next step render
  - Include API save call + navigation
  - Target: < 300ms per step
  - Dependencies: T050 (StepNavigation), T032 (save API)
  - Parallel: [P]
  - Files: __tests__/performance/onboarding-step-transition.spec.ts

- **T073** [Phase 3.5: Polish] Accessibility test: WCAG AA compliance for all steps [Planned]
  - Test file: `__tests__/accessibility/onboarding-wcag.spec.ts`
  - Run axe-core on Steps 1-13
  - Verify: keyboard navigation, focus management, ARIA labels
  - Verify color contrast ratios
  - Dependencies: T036-T048 (all steps)
  - Parallel: [P]
  - Files: __tests__/accessibility/onboarding-wcag.spec.ts

- **T074** [Phase 3.5: Polish] Accessibility test: Screen reader support [Planned]
  - Test file: `__tests__/accessibility/onboarding-screen-reader.spec.ts`
  - Verify ARIA live regions for dynamic content (progress bar, error messages)
  - Verify form labels and descriptions
  - Verify error messages announced
  - Dependencies: T036-T048 (all steps), T049 (ProgressBar)
  - Parallel: [P]
  - Files: __tests__/accessibility/onboarding-screen-reader.spec.ts

- **T075** [Phase 3.5: Polish] Accessibility test: Keyboard navigation [Planned]
  - Test file: `__tests__/accessibility/onboarding-keyboard.spec.ts`
  - Verify Tab order logical
  - Verify Enter submits form
  - Verify Escape closes modals (if any)
  - Verify focus-visible styles applied
  - Dependencies: T036-T048 (all steps), T050 (StepNavigation)
  - Parallel: [P]
  - Files: __tests__/accessibility/onboarding-keyboard.spec.ts

- **T076** [Phase 3.5: Polish] Update API documentation in docs/api/onboarding.md [Planned]
  - Document all 5 API endpoints with request/response examples
  - Document error codes and messages
  - Document rate limits and lockout behavior
  - Document Stripe webhook setup
  - Dependencies: T031-T035 (all APIs implemented)
  - Files: docs/api/onboarding.md

- **T077** [Phase 3.5: Polish] Run manual-testing.md validation from quickstart.md [Planned]
  - Follow Step 3: Manual Happy Path Test (15 minutes)
  - Follow Step 3a: Unpaid Submission Follow-Up Test (5 minutes)
  - Follow Step 3b: Email Verification Lockout Test (5 minutes)
  - Follow Step 4: Session Recovery Test (5 minutes)
  - Follow Step 5: Payment Retry Test (5 minutes)
  - Follow Step 6: Stripe Webhook Test (5 minutes)
  - Document any issues found
  - Dependencies: All implementation complete
  - Files: None (manual testing checklist)

- **T078** [Phase 3.5: Polish] Remove any workarounds and refactor duplicated code [Planned]
  - Search for TODOs and FIXMEs in onboarding codebase
  - Identify and remove any temporary workarounds
  - Refactor duplicated validation logic
  - Ensure single source of truth for form data (RHF only)
  - Dependencies: All implementation complete
  - Files: Multiple (across components, API routes, utilities)

- **T079** [Phase 3.1: Setup] Install missing UI utility dependencies [Planned]
  - Install: react-dropzone@^14.3.8 (file uploads with drag & drop)
  - Install: react-otp-input@^3.1.1 (Step 2 email verification)
  - Install: react-international-phone@^4.6.0 (Step 3 phone input)
  - Install: @react-google-maps/api@^2.20.7 (Step 3 address autocomplete)
  - Install: lodash.debounce@^4.0.8 (form input debouncing)
  - Install: sonner@^2.0.7 (toast notifications)
  - Update package.json with correct versions
  - Dependencies: None (can run in parallel with T002)
  - Parallel: [P]
  - Files: package.json, pnpm-lock.yaml

- **T080** [Phase 3.1: Setup] Configure email service for OTP and notifications [Planned]
  - Choose email provider: Resend (recommended) or SendGrid or Nodemailer
  - Add env vars: EMAIL_SERVICE_API_KEY, EMAIL_FROM_ADDRESS, EMAIL_FROM_NAME
  - Create lib/email/client.ts with send() function
  - Test email sending with test recipient
  - Dependencies: None
  - Parallel: [P]
  - Files: lib/email/client.ts, .env.local, .env.example

- **T081** [Phase 3.1: Setup] Create email templates for onboarding [Planned]
  - Create lib/email/templates/otp-verification.tsx (Step 2 email verification code)
  - Create lib/email/templates/payment-confirmation.tsx (payment success confirmation)
  - Create lib/email/templates/admin-notification.tsx (notify admin of new paid submission)
  - Use React Email or plain HTML templates
  - Include WhiteBoar branding, logo, footer
  - Dependencies: T080 (email service)
  - Files: lib/email/templates/otp-verification.tsx, lib/email/templates/payment-confirmation.tsx, lib/email/templates/admin-notification.tsx

- **T082** [Phase 3.3: Core Implementation] Create FormField universal wrapper component [Done]
  → Sprint 002 - Completed 2025-10-12
  - File: `components/onboarding/form-fields/FormField.tsx`
  - Universal wrapper for all form inputs with label, error display, description
  - Integrates with React Hook Form Controller
  - Props: name, label, description, required, error, children
  - Displays validation errors from Zod schemas
  - Accessible with proper ARIA labels and error announcements
  - Dependencies: T003 (types), T007 (translations)
  - Parallel: [P]
  - Files: components/onboarding/form-fields/FormField.tsx

- **T083** [Phase 3.3: Core Implementation] Create TextInput component [Done]
  → Sprint 002 - Completed 2025-10-12
  - File: `components/onboarding/form-fields/TextInput.tsx`
  - Standard text input field wrapped in FormField
  - Props: type (text/password), placeholder, maxLength, autoComplete
  - Character counter if maxLength provided
  - Dependencies: T082 (FormField)
  - Parallel: [P]
  - Files: components/onboarding/form-fields/TextInput.tsx

- **T084** [Phase 3.3: Core Implementation] Create EmailInput component [Planned]
  - File: `components/onboarding/form-fields/EmailInput.tsx`
  - Email input with validation indicator
  - Props: placeholder, autoComplete
  - Visual feedback for valid/invalid email format
  - Dependencies: T082 (FormField)
  - Parallel: [P]
  - Files: components/onboarding/form-fields/EmailInput.tsx

- **T085** [Phase 3.3: Core Implementation] Create PhoneInput component with country selector [Planned]
  - File: `components/onboarding/form-fields/PhoneInput.tsx`
  - Phone input with country code dropdown using react-international-phone
  - Formats to E.164 format for submission
  - Default country: IT (Italy)
  - Props: placeholder, defaultCountry
  - Dependencies: T082 (FormField), T079 (react-international-phone installed)
  - Files: components/onboarding/form-fields/PhoneInput.tsx

- **T086** [Phase 3.3: Core Implementation] Create AddressInput component with Google Places [Planned]
  - File: `components/onboarding/form-fields/AddressInput.tsx`
  - Google Places Autocomplete integration using @react-google-maps/api
  - Auto-fills: street, city, state/province, postal code, country
  - Manual entry fallback if autocomplete fails or unavailable
  - Returns flat field structure: physicalAddressStreet, physicalAddressCity, etc.
  - Props: onPlaceSelected callback
  - Dependencies: T082 (FormField), T079 (@react-google-maps/api installed), T008 (Google API key)
  - Files: components/onboarding/form-fields/AddressInput.tsx

- **T087** [Phase 3.3: Core Implementation] Create SelectInput component [Done]
  → Sprint 002 - Completed 2025-10-12
  - File: `components/onboarding/form-fields/SelectInput.tsx`
  - Dropdown select using shadcn/ui Select
  - Props: options (array of {value, label}), placeholder
  - Keyboard navigation support
  - Dependencies: T082 (FormField)
  - Parallel: [P]
  - Files: components/onboarding/form-fields/SelectInput.tsx

- **T088** [Phase 3.3: Core Implementation] Create SliderInput component [Planned]
  - File: `components/onboarding/form-fields/SliderInput.tsx`
  - Range slider (0-100) using Radix UI Slider
  - Props: min, max, step, leftLabel, rightLabel (e.g., "Budget-Conscious" ↔ "Premium")
  - Visual feedback with current value display
  - Used in Step 5 (Customer Profile) for 5 slider fields
  - Dependencies: T082 (FormField)
  - Parallel: [P]
  - Files: components/onboarding/form-fields/SliderInput.tsx

- **T089** [Phase 3.3: Core Implementation] Create DynamicList component [Planned]
  - File: `components/onboarding/form-fields/DynamicList.tsx`
  - Add/remove list items with validation (e.g., competitor URLs, website references)
  - Props: minItems, maxItems, itemType (text/url), placeholder
  - Visual feedback for array limits
  - Used in Step 4 (competitorUrls), Step 7 (websiteReferences), Step 11 (offerings)
  - Dependencies: T082 (FormField)
  - Parallel: [P]
  - Files: components/onboarding/form-fields/DynamicList.tsx

- **T090** [Phase 3.3: Core Implementation] Create ImageGrid component for design/image style selection [Planned]
  - File: `components/onboarding/form-fields/ImageGrid.tsx`
  - Grid of selectable images with radio/checkbox behavior
  - Props: options (array of {value, label, imageUrl}), selectionMode (single/multiple)
  - Visual indicator for selected option
  - Lazy loading for images
  - Used in Step 8 (Design Style), Step 9 (Image Style), Step 10 (Color Palette)
  - Dependencies: T082 (FormField)
  - Parallel: [P]
  - Files: components/onboarding/form-fields/ImageGrid.tsx

- **T091** [Phase 3.3: Core Implementation] Create FileUpload component with drag & drop [Planned]
  - File: `components/onboarding/form-fields/FileUpload.tsx`
  - Drag & drop + file picker using react-dropzone
  - Props: maxFiles, maxSizeBytes, acceptedFileTypes, uploadType (logo/photo)
  - File preview with thumbnails
  - Delete uploaded file button
  - Upload progress indicator
  - Validates file limits before upload
  - Calls T035 (Upload API) for actual upload
  - Used in Step 12 (Business Assets)
  - Dependencies: T082 (FormField), T079 (react-dropzone installed)
  - Files: components/onboarding/form-fields/FileUpload.tsx

- **T092** [Phase 3.3: Core Implementation] Implement Step page route handler [Done]
  → Sprint 002 - Completed 2025-10-12
  - File: `app/[locale]/onboarding/step/[stepNumber]/page.tsx`
  - Central orchestrator for all 13 steps
  - Validate stepNumber param (1-13)
  - Setup React Hook Form with mode: 'onBlur', resolver: zodResolver
  - Dynamic component loading based on stepNumber
  - Load form data from session on mount
  - Render: ProgressBar + StepComponent + StepNavigation
  - Handle Next/Back navigation with form validation
  - Call POST /api/onboarding/save before navigation
  - Note: Sprint 002 implemented minimal infrastructure, full step components in later sprints
  - Dependencies: T031 (Session API), T032 (save API), T036-T048 (all step components), T082-T091 (form field components)
  - Files: app/[locale]/onboarding/step/[stepNumber]/page.tsx

- **T093** [Phase 3.3: Core Implementation] Create form field utility helpers [Planned]
  - File: `lib/utils/form-helpers.ts`
  - validateUrl(url: string): boolean - URL validation beyond Zod
  - formatPhoneNumber(phone: string): string - E.164 formatting
  - validateFileSize(file: File, maxBytes: number): boolean
  - validateFileType(file: File, allowedTypes: string[]): boolean
  - formatBytes(bytes: number): string - "10.5 MB" formatting
  - Dependencies: None
  - Parallel: [P]
  - Files: lib/utils/form-helpers.ts

- **T094** [Phase 3.3: Core Implementation] Create Skeleton loading component [Planned]
  - File: `components/ui/skeleton.tsx`
  - Reusable skeleton loader component (if not already from shadcn/ui)
  - Used for dynamic imports and async content loading
  - Prevents layout shift (CLS)
  - Props: className for sizing
  - Dependencies: None
  - Parallel: [P]
  - Files: components/ui/skeleton.tsx

- **T095** [Phase 3.3: Core Implementation] Configure Google Maps API script loading [Planned]
  - File: `lib/google/maps-loader.ts`
  - Load Google Maps JavaScript API script dynamically
  - Use LoadScript from @react-google-maps/api
  - Load only when AddressInput component mounts
  - Handle loading states and errors
  - Dependencies: T079 (@react-google-maps/api installed), T008 (Google API key)
  - Files: lib/google/maps-loader.ts

- **T096** [Phase 3.4: Integration] Implement email sending in Step 2 verification API [Planned]
  - Modify T032 (POST /api/onboarding/email/verify) to send OTP email
  - Generate 6-digit code and store in session.verification_code with expiry
  - Send email using lib/email/client.ts with otp-verification template
  - Include user's firstName in email greeting
  - Track email sent event in analytics
  - Dependencies: T080 (email service), T081 (email templates), T032 (verification API exists)
  - Files: app/api/onboarding/email/verify/route.ts

- **T097** [Phase 3.4: Integration] Enhance Stripe webhook handler with signature verification [Planned]
  - Modify T034 (POST /api/onboarding/payment/webhook) to verify Stripe signature
  - Add idempotency handling (check payment_transaction_id before processing)
  - Handle payment_intent.succeeded event
  - Handle payment_intent.payment_failed event
  - Log webhook events to onboarding_analytics table
  - Add retry logic for failed webhook processing
  - Dependencies: T034 (webhook route exists), T006 (Stripe client)
  - Files: app/api/onboarding/payment/webhook/route.ts

- **T098** [Phase 3.4: Integration] Add payment confirmation email sending [Planned]
  - Modify T034 (POST /api/onboarding/payment/complete) to send confirmation email
  - Send to user's email with submission details
  - Include: submission ID, business name, amount paid, next steps (5 business days)
  - Use payment-confirmation email template
  - Track email sent event in analytics
  - Dependencies: T080 (email service), T081 (email templates), T034 (payment complete API exists)
  - Files: app/api/onboarding/payment/complete/route.ts

- **T099** [Phase 3.4: Integration] Add admin notification email on payment success [Planned]
  - Modify T034 (POST /api/onboarding/payment/complete) to send admin notification
  - Send to ADMIN_EMAIL env var with new paid submission details
  - Include: submission ID, business name, email, phone, industry, submission timestamp
  - Link to admin dashboard (if exists)
  - Use admin-notification email template
  - Dependencies: T080 (email service), T081 (email templates), T034 (payment complete API exists)
  - Files: app/api/onboarding/payment/complete/route.ts

- **T100** [Phase 3.4: Integration] Add file upload progress tracking [Planned]
  - Modify T091 (FileUpload component) to track upload progress
  - Use XMLHttpRequest or fetch with progress events
  - Display progress bar (0-100%) during upload
  - Show upload speed and estimated time remaining
  - Handle pause/resume functionality (optional)
  - Dependencies: T091 (FileUpload component exists), T035 (Upload API)
  - Files: components/onboarding/form-fields/FileUpload.tsx

- **T101** [Phase 3.4: Integration] Add image thumbnail generation for uploads [Planned]
  - Modify T035 (POST /api/onboarding/upload) to generate thumbnails
  - Create 200x200px thumbnails for photo uploads
  - Store thumbnail URL in onboarding_uploads.thumbnail_url field
  - Use sharp or Next.js Image optimization
  - Async processing (don't block upload response)
  - Dependencies: T035 (Upload API exists)
  - Files: app/api/onboarding/upload/route.ts

- **T102** [Phase 3.4: Integration] Add virus scan status tracking placeholder [Planned]
  - Modify T035 (POST /api/onboarding/upload) to set virus_scan_status = "pending"
  - Add virus_scan_status to upload response
  - Document future virus scan integration point (ClamAV/VirusTotal)
  - Display scan status in FileUpload component
  - Block form submission if any file has status = "infected"
  - Dependencies: T035 (Upload API exists), T091 (FileUpload component)
  - Files: app/api/onboarding/upload/route.ts, components/onboarding/form-fields/FileUpload.tsx

- **T103** [Phase 3.5: Polish] Implement session expiry cleanup job [Planned]
  - Create app/api/cron/cleanup-sessions/route.ts (Vercel Cron or manual trigger)
  - Delete sessions older than 7 days with no submission
  - Delete submissions with status="unpaid" older than 90 days (GDPR)
  - Delete associated uploads from Supabase Storage
  - Log cleanup actions to analytics
  - Schedule: Daily at 2am UTC
  - Dependencies: T004 (migration), T005 (Supabase client)
  - Files: app/api/cron/cleanup-sessions/route.ts, vercel.json (cron config)

- **T104** [Phase 3.5: Polish] Add session expiry warning UI [Planned]
  - Modify T092 (Step page) to check session age on mount
  - Show warning toast if session > 6 days old: "Session expires in X hours"
  - Provide "Extend session" button (updates last_activity timestamp)
  - Redirect to /onboarding with error message if session expired
  - Dependencies: T092 (Step page exists), T031 (Session API)
  - Files: app/[locale]/onboarding/step/[stepNumber]/page.tsx

- **T105** [Phase 3.5: Polish] Configure Vercel Analytics (optional) [Planned]
  - Install @vercel/analytics (if not already installed)
  - Add Analytics component to root layout
  - Track custom events: step_viewed, step_completed, payment_succeeded
  - Add VERCEL_ANALYTICS_ID to env vars
  - Optional: Only enable in production
  - Dependencies: None
  - Parallel: [P]
  - Files: app/[locale]/layout.tsx, package.json, .env.local

- **T106** [Phase 3.5: Polish] Create analytics dashboard queries [Planned]
  - Create lib/analytics/dashboard-queries.ts
  - Query 1: Completion rate by step (funnel analysis)
  - Query 2: Average time spent per step
  - Query 3: Common validation errors by field
  - Query 4: Payment success/failure rates
  - Query 5: Session recovery statistics
  - Query 6: Unpaid submission follow-up list
  - Document query usage in docs/analytics.md
  - Dependencies: T004 (onboarding_analytics table)
  - Files: lib/analytics/dashboard-queries.ts, docs/analytics.md

- **T107** [Phase 3.5: Polish] Configure Next.js production optimizations [Planned]
  - Update next.config.js with production settings
  - Add: experimental.optimizeCss: true
  - Add: compiler.removeConsole: { exclude: ['error', 'warn'] }
  - Configure bundle splitting for onboarding routes
  - Set output: 'standalone' for Docker deployment (optional)
  - Dependencies: None
  - Files: next.config.js

- **T108** [Phase 3.5: Polish] Configure image optimization settings [Planned]
  - Update next.config.js images config
  - Add Supabase Storage domain to remotePatterns
  - Set deviceSizes and imageSizes for responsive images
  - Configure formats: ['image/avif', 'image/webp']
  - Set minimumCacheTTL for uploaded assets
  - Dependencies: None
  - Files: next.config.js

- **T109** [Phase 3.5: Polish] Unit test for all 9 reusable form field components [Planned]
  - Test files: __tests__/components/form-fields/*.test.tsx
  - Test FormField, TextInput, EmailInput, PhoneInput, AddressInput, SelectInput, SliderInput, DynamicList, ImageGrid, FileUpload
  - Test rendering with React Hook Form integration
  - Test validation error display
  - Test accessibility (ARIA labels, keyboard navigation)
  - Test user interactions (typing, selecting, uploading)
  - Dependencies: T082-T091 (all form field components)
  - Parallel: [P]
  - Files: __tests__/components/form-fields/FormField.test.tsx, __tests__/components/form-fields/TextInput.test.tsx, etc.

- **T110** [Phase 3.5: Polish] Unit test for Step page route handler [Planned]
  - Test file: __tests__/app/onboarding/step/[stepNumber]/page.test.tsx
  - Test dynamic step loading (Steps 1-13)
  - Test invalid stepNumber (404 or redirect)
  - Test session loading on mount
  - Test form data restoration
  - Test navigation flow (Next/Back)
  - Dependencies: T092 (Step page exists)
  - Files: __tests__/app/onboarding/step/[stepNumber]/page.test.tsx

- **T111** [Phase 3.5: Polish] E2E test for Google Places autocomplete [Planned]
  - Test file: __tests__/e2e/onboarding-google-places.spec.ts
  - Navigate to Step 3 (Business Basics)
  - Type "Via Roma, Milano" in address field
  - Select autocomplete suggestion
  - Verify all address fields auto-filled (street, city, postal code, country)
  - Test manual entry fallback if autocomplete unavailable
  - Dependencies: T086 (AddressInput component), T038 (Step 3 component)
  - Files: __tests__/e2e/onboarding-google-places.spec.ts

- **T112** [Phase 3.5: Polish] E2E test for file upload with progress [Planned]
  - Test file: __tests__/e2e/onboarding-file-upload-progress.spec.ts
  - Navigate to Step 12 (Business Assets)
  - Upload 5MB test image
  - Verify progress bar appears and updates (0% → 100%)
  - Verify thumbnail generated after upload
  - Verify file preview displays
  - Test delete uploaded file
  - Dependencies: T091 (FileUpload component), T100 (progress tracking)
  - Files: __tests__/e2e/onboarding-file-upload-progress.spec.ts

- **T113** [Phase 3.6: Future] Implement ARIA live regions for save indicators [Planned]
  - Modify T050 (StepNavigation) to add ARIA live region
  - Announce "Saving..." and "Saved" to screen readers
  - Use role="status" aria-live="polite"
  - Visual indicator for sighted users (checkmark icon)
  - Dependencies: T050 (StepNavigation component)
  - Files: components/onboarding/StepNavigation.tsx

- **T114** [Phase 3.6: Future] Add high contrast mode support [Planned]
  - Add CSS media query for @media (prefers-contrast: high)
  - Increase contrast ratios for all form fields
  - Enhance focus indicators with thicker borders
  - Test with Windows High Contrast Mode
  - Dependencies: T082-T091 (all form field components)
  - Files: components/onboarding/form-fields/*.tsx, globals.css

- **T115** [Phase 3.6: Future] Implement mobile swipe gestures for step navigation [Planned]
  - Add swipe left/right gesture support on mobile
  - Swipe right = Back, Swipe left = Next (if form valid)
  - Visual feedback during swipe (slide preview)
  - Disable swipe on Step 13 (payment)
  - Use framer-motion or react-swipeable
  - Dependencies: T092 (Step page exists)
  - Files: app/[locale]/onboarding/step/[stepNumber]/page.tsx

- **T116** [Phase 3.7: Future] Create admin dashboard for unpaid submission follow-up [Planned]
  - File: app/admin/onboarding/submissions/page.tsx
  - List all submissions with status="unpaid"
  - Filter by date, industry, amount
  - Show time since submission created
  - Provide "Send reminder email" action
  - Require admin authentication
  - Dependencies: T033 (Submission API), T080 (email service)
  - Files: app/admin/onboarding/submissions/page.tsx

- **T117** [Phase 3.7: Future] Implement GDPR data retention and deletion APIs [Planned]
  - File: app/api/gdpr/export/route.ts (export user data)
  - File: app/api/gdpr/delete/route.ts (delete user data)
  - POST /export: Return all session, submission, upload data as JSON
  - POST /delete: Delete user's session, submission, uploads (with confirmation token)
  - Verify user identity before export/deletion
  - Log GDPR actions to audit table
  - Dependencies: T004 (migration), T005 (Supabase client)
  - Files: app/api/gdpr/export/route.ts, app/api/gdpr/delete/route.ts

---

## Notes

- **TDD Enforcement**: Phase 3.2 tests MUST be written and MUST FAIL before ANY Phase 3.3 implementation
- **Flat Field Naming**: All form fields use flat naming (physicalAddressStreet, customerProfileBudget) - NO nested objects
- **Single Source of Truth**: React Hook Form owns ALL form data, Zustand stores ONLY metadata (sessionId, currentStep, lastSaved)
- **No Auto-Save**: Save ONLY on Next/Back button clicks, NO onChange auto-save
- **No Manual Validation**: Zod + RHF handle validation, NO manual trigger() calls
- **Stripe Test Cards**: Use 4242 4242 4242 4242 (success), 4000 0000 0000 0002 (decline)
- **Port 3783**: Always run dev server on PORT=3783 for Playwright tests
- **Visual Designs**: Reference context/Visual design/onboarding-XX-*.png for each step
- **Performance Targets**: LCP ≤ 1.8s, CLS < 0.1, FID < 100ms, step transition < 300ms
- **Accessibility**: WCAG AA compliance, keyboard navigation, screen reader support
- **GDPR**: PII in sessions/submissions, 90-day retention for unpaid, indefinite for paid

## Validation Checklist
*GATE: Checked before marking backlog.md complete*

- [x] All 78 tasks from tasks.md exist in backlog.md
- [x] All tasks have status [Planned]
- [x] All tasks maintain original order from tasks.md
- [x] All file paths included
- [x] All dependencies noted
- [x] Parallel execution markers [P] included where applicable
- [x] Additional 39 tasks (T079-T117) added from spec analysis

---

**Total Tasks**: 117 (78 original + 39 from spec analysis)
**Estimated Duration**: 10-14 weeks (assuming 2-3 developers working in parallel)
**Ready for Execution**: ✅ YES

**Additional Tasks Summary**:
- T079-T081: Missing dependencies and email service (3 tasks)
- T082-T091: Reusable form field components (10 tasks)
- T092: Step page route handler (1 task)
- T093-T095: Form utilities and loading states (3 tasks)
- T096-T099: Email and Stripe integration enhancements (4 tasks)
- T100-T102: File upload enhancements (3 tasks)
- T103-T106: Session management and analytics (4 tasks)
- T107-T108: Next.js optimizations (2 tasks)
- T109-T112: Testing for new components (4 tasks)
- T113-T117: Future enhancements (5 tasks)
