# Tasks: Onboarding System v3

**Input**: Design documents from `/specs/001-onboarding-v3-implementation/`
**Prerequisites**: plan.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓, quickstart.md ✓

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → LOADED: TypeScript 5.8.4, Next.js 15.4.6, React 19.0.0
   → Stack: react-hook-form 7.62.0, zod 4.1.5, zustand 5.0.8, Supabase, Stripe 4.0.0
2. Load optional design documents:
   → data-model.md: 4 entities (sessions, submissions, analytics, uploads)
   → contracts/: 5 API files (session, onboarding, submission, payment, upload)
   → research.md: 10 architectural decisions validated
   → quickstart.md: 10 validation steps
3. Generate tasks by category:
   → Setup: Next.js structure, dependencies, Supabase migration
   → Tests: 5 contract tests, 13 step component tests, integration tests
   → Core: Zustand store, 13 step components, 5 API routes
   → Integration: Stripe, Supabase, file uploads, email verification
   → Polish: E2E tests, performance tests, accessibility tests
4. Apply task rules:
   → Different step components = mark [P] for parallel
   → Same file (e.g., Zustand store) = sequential
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   → All 5 contracts have tests ✓
   → All 4 entities have migration tasks ✓
   → All 5 API routes implemented ✓
   → All 13 steps implemented ✓
9. Return: SUCCESS (78 tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Frontend**: `app/[locale]/onboarding/`, `components/onboarding/`, `lib/`
- **API Routes**: `app/api/onboarding/`
- **Tests**: `__tests__/onboarding/`
- **Database**: `supabase/migrations/`

---

## Phase 3.1: Setup (8 tasks)

- [ ] **T001** Create Next.js app directory structure for onboarding feature
  - Paths: `app/[locale]/onboarding/`, `app/[locale]/onboarding/step/[stepNumber]/`, `app/[locale]/onboarding/thank-you/`
  - Create layout.tsx with progress bar component
  - Create loading.tsx and error.tsx for each route
  - **Dependencies**: None
  - **Files**: app/[locale]/onboarding/layout.tsx, app/[locale]/onboarding/page.tsx, app/[locale]/onboarding/step/[stepNumber]/page.tsx

- [ ] **T002** [P] Install and configure onboarding dependencies
  - Install: react-hook-form@7.62.0, zod@4.1.5, @hookform/resolvers, zustand@5.0.8
  - Install: @supabase/ssr, @stripe/stripe-js@4.0.0, @stripe/react-stripe-js
  - Install dev: @testing-library/react, @testing-library/user-event, @playwright/test
  - Update package.json with correct versions
  - **Dependencies**: None (can run in parallel with T001)
  - **Files**: package.json, pnpm-lock.yaml

- [ ] **T003** [P] Configure TypeScript types for onboarding domain
  - Create types/onboarding.ts with FormData, SessionState, SubmissionStatus, AnalyticsEvent types
  - Add Zod schemas for all 13 steps in lib/validation/onboarding-schemas.ts
  - Export type definitions matching data-model.md (flat field names: physicalAddressStreet, customerProfileBudget, etc.)
  - **Dependencies**: None
  - **Files**: types/onboarding.ts, lib/validation/onboarding-schemas.ts

- [ ] **T004** Create Supabase database migration for onboarding tables
  - Create migration: supabase/migrations/YYYYMMDD_onboarding_v3.sql
  - Copy migration SQL from data-model.md (4 tables: onboarding_sessions, onboarding_submissions, onboarding_analytics, onboarding_uploads)
  - Include all indexes, foreign keys, RLS policies
  - Test migration with `supabase db push`
  - **Dependencies**: None
  - **Files**: supabase/migrations/YYYYMMDD_onboarding_v3.sql

- [ ] **T005** Configure Supabase client for onboarding API routes
  - Create lib/supabase/server.ts with createClient() for Server Components and Route Handlers
  - Create lib/supabase/client.ts with createClient() for Client Components
  - Add RLS helper functions for session access (verifySessionOwnership)
  - **Dependencies**: T004 (migration must exist)
  - **Files**: lib/supabase/server.ts, lib/supabase/client.ts

- [ ] **T006** [P] Configure Stripe client and webhook handling
  - Create lib/stripe/client.ts with loadStripe() initialization
  - Create lib/stripe/server.ts with Stripe SDK initialization (STRIPE_SECRET_KEY)
  - Add webhook signature verification helper
  - Add types for Stripe PaymentIntent and webhook events
  - **Dependencies**: None
  - **Files**: lib/stripe/client.ts, lib/stripe/server.ts

- [ ] **T007** [P] Add onboarding translations to messages/en.json and messages/it.json
  - Add namespace onboarding.* with all step titles, field labels, placeholders, error messages
  - Add onboarding.nav.* for Next/Back buttons, progress bar
  - Add onboarding.errors.* for validation messages (matching Zod schemas)
  - Ensure Italian translations match English structure exactly
  - **Dependencies**: T003 (needs schema structure)
  - **Files**: messages/en.json, messages/it.json

- [ ] **T008** Configure environment variables for onboarding
  - Add to .env.local: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
  - Add: SUPABASE_SERVICE_ROLE_KEY (for server-side operations)
  - Add: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
  - Add: NEXT_PUBLIC_GOOGLE_PLACES_API_KEY (for address autocomplete)
  - Validate all required env vars with schema validation
  - **Dependencies**: None
  - **Files**: .env.local, .env.example

---

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Contract Tests (5 tasks - all parallel)

- [ ] **T009** [P] Contract test for Session API (session-api.yaml)
  - Test file: `__tests__/api/onboarding/session.test.ts`
  - Test POST /api/onboarding/session (create session)
  - Test GET /api/onboarding/session/[sessionId] (load session)
  - Test PATCH /api/onboarding/session/[sessionId] (update metadata)
  - Verify: 201 on create, 200 on load/update, 404 on missing session, 400 on invalid locale
  - **Dependencies**: T005 (Supabase client), T003 (types)
  - **Files**: __tests__/api/onboarding/session.test.ts

- [ ] **T010** [P] Contract test for Onboarding Progress API (onboarding-api.yaml)
  - Test file: `__tests__/api/onboarding/save.test.ts`
  - Test POST /api/onboarding/save (save step progress)
  - Test POST /api/onboarding/email/verify (send OTP)
  - Test POST /api/onboarding/email/verify/confirm (verify OTP)
  - Verify: 200 on save, 200 on OTP send, 200 on verify success, 429 on rate limit/lockout
  - **Dependencies**: T005, T003
  - **Files**: __tests__/api/onboarding/save.test.ts, __tests__/api/onboarding/email/verify.test.ts

- [ ] **T011** [P] Contract test for Submission API (submission-api.yaml)
  - Test file: `__tests__/api/onboarding/submit.test.ts`
  - Test POST /api/onboarding/submit (create unpaid submission after Step 12)
  - Test GET /api/onboarding/submission/[id] (get submission status)
  - Verify: 201 with status="unpaid", 409 if submission exists, 404 if session not found
  - **Dependencies**: T005, T003
  - **Files**: __tests__/api/onboarding/submit.test.ts

- [ ] **T012** [P] Contract test for Payment API (payment-api.yaml)
  - Test file: `__tests__/api/onboarding/payment.test.ts`
  - Test POST /api/onboarding/payment/intent (create Stripe PaymentIntent)
  - Test POST /api/onboarding/payment/complete (update submission to paid)
  - Test GET /api/onboarding/payment/status/[id] (check payment status)
  - Test POST /api/onboarding/payment/webhook (Stripe webhook handler)
  - Verify: 201 with clientSecret, 200 on complete, 400 on 24-hour expiry, 200 on webhook
  - **Dependencies**: T006 (Stripe client), T005, T003
  - **Files**: __tests__/api/onboarding/payment.test.ts

- [ ] **T013** [P] Contract test for Upload API (upload-api.yaml)
  - Test file: `__tests__/api/onboarding/upload.test.ts`
  - Test POST /api/onboarding/upload (upload logo or photo)
  - Test DELETE /api/onboarding/upload/[id] (delete uploaded file)
  - Verify: 201 with fileUrl, 400 if exceeds limits (1 logo, 30 photos, 10MB each), 200 on delete
  - Verify virus_scan_status = "pending" initially
  - **Dependencies**: T005, T003
  - **Files**: __tests__/api/onboarding/upload.test.ts

### Step Component Tests (13 tasks - all parallel)

- [ ] **T014** [P] Unit test for Step 1 - Personal Info component
  - Test file: `__tests__/components/onboarding/Step01PersonalInfo.test.tsx`
  - Test rendering with React Hook Form
  - Test validation: firstName (required), lastName (required), email (required, valid format)
  - Test Next button disabled until all fields valid
  - Verify no manual trigger() calls
  - **Dependencies**: T003 (schemas), T007 (translations)
  - **Files**: __tests__/components/onboarding/Step01PersonalInfo.test.tsx

- [ ] **T015** [P] Unit test for Step 2 - Email Verification component
  - Test file: `__tests__/components/onboarding/Step02EmailVerification.test.tsx`
  - Test 6-digit OTP input with auto-submit on 6th digit
  - Test verification attempt counter (max 5)
  - Test 15-minute lockout after 5 failed attempts
  - Test code expiry (10 minutes)
  - **Dependencies**: T003, T007
  - **Files**: __tests__/components/onboarding/Step02EmailVerification.test.tsx

- [ ] **T016** [P] Unit test for Step 3 - Business Basics component
  - Test file: `__tests__/components/onboarding/Step03BusinessBasics.test.tsx`
  - Test Google Places autocomplete for address fields
  - Test flat field naming: physicalAddressStreet, physicalAddressCity, etc.
  - Test validation: businessName (required), businessEmail (email format), businessPhone (E.164 format)
  - Test VAT number optional field
  - **Dependencies**: T003, T007
  - **Files**: __tests__/components/onboarding/Step03BusinessBasics.test.tsx

- [ ] **T017** [P] Unit test for Step 4 - Brand Definition component
  - Test file: `__tests__/components/onboarding/Step04BrandDefinition.test.tsx`
  - Test businessDescription textarea (required, min 50 chars)
  - Test competitorUrls array input (min 1, max 5 URLs)
  - Test URL validation for competitor URLs
  - **Dependencies**: T003, T007
  - **Files**: __tests__/components/onboarding/Step04BrandDefinition.test.tsx

- [ ] **T018** [P] Unit test for Step 5 - Customer Profile component
  - Test file: `__tests__/components/onboarding/Step05CustomerProfile.test.tsx`
  - Test 5 slider inputs with flat field naming: customerProfileBudget, customerProfileStyle, etc.
  - Test range validation (0-100 for each slider)
  - Test slider visual feedback and labels
  - **Dependencies**: T003, T007
  - **Files**: __tests__/components/onboarding/Step05CustomerProfile.test.tsx

- [ ] **T019** [P] Unit test for Step 6 - Customer Needs component
  - Test file: `__tests__/components/onboarding/Step06CustomerNeeds.test.tsx`
  - Test customerProblems textarea (required)
  - Test customerDelight textarea (optional)
  - Test character count display
  - **Dependencies**: T003, T007
  - **Files**: __tests__/components/onboarding/Step06CustomerNeeds.test.tsx

- [ ] **T020** [P] Unit test for Step 7 - Visual Inspiration component
  - Test file: `__tests__/components/onboarding/Step07VisualInspiration.test.tsx`
  - Test websiteReferences array input (min 1, max 5 URLs)
  - Test URL validation and preview generation
  - **Dependencies**: T003, T007
  - **Files**: __tests__/components/onboarding/Step07VisualInspiration.test.tsx

- [ ] **T021** [P] Unit test for Step 8 - Design Style component
  - Test file: `__tests__/components/onboarding/Step08DesignStyle.test.tsx`
  - Test single-select radio group for design style
  - Test image preview for each style option
  - Test required field validation
  - **Dependencies**: T003, T007
  - **Files**: __tests__/components/onboarding/Step08DesignStyle.test.tsx

- [ ] **T022** [P] Unit test for Step 9 - Image Style component
  - Test file: `__tests__/components/onboarding/Step09ImageStyle.test.tsx`
  - Test single-select radio group for image style
  - Test image preview for each option
  - Test required field validation
  - **Dependencies**: T003, T007
  - **Files**: __tests__/components/onboarding/Step09ImageStyle.test.tsx

- [ ] **T023** [P] Unit test for Step 10 - Color Palette component
  - Test file: `__tests__/components/onboarding/Step10ColorPalette.test.tsx`
  - Test single-select radio group for color palette
  - Test color swatch preview for each palette
  - Test required field validation
  - **Dependencies**: T003, T007
  - **Files**: __tests__/components/onboarding/Step10ColorPalette.test.tsx

- [ ] **T024** [P] Unit test for Step 11 - Website Structure component
  - Test file: `__tests__/components/onboarding/Step11WebsiteStructure.test.tsx`
  - Test multi-select checkbox group for website sections
  - Test conditional offerings input (if "Services/Products" selected)
  - Test primary goal selection (required)
  - **Dependencies**: T003, T007
  - **Files**: __tests__/components/onboarding/Step11WebsiteStructure.test.tsx

- [ ] **T025** [P] Unit test for Step 12 - Business Assets component
  - Test file: `__tests__/components/onboarding/Step12BusinessAssets.test.tsx`
  - Test logo upload (max 1 file, 10MB, PNG/JPG/SVG)
  - Test photo upload (max 30 files, 10MB each, PNG/JPG)
  - Test file preview and delete functionality
  - Test upload progress indication
  - **Dependencies**: T003, T007, T013 (upload API test)
  - **Files**: __tests__/components/onboarding/Step12BusinessAssets.test.tsx

- [ ] **T026** [P] Unit test for Step 13 - Payment component
  - Test file: `__tests__/components/onboarding/Step13Payment.test.tsx`
  - Test Stripe Elements rendering
  - Test payment submission with test card
  - Test Back button disabled on Step 13
  - Test error handling for failed payments
  - Test retry functionality
  - **Dependencies**: T006 (Stripe client), T003, T007
  - **Files**: __tests__/components/onboarding/Step13Payment.test.tsx

### Integration Tests (3 tasks - all parallel)

- [ ] **T027** [P] Integration test: Full onboarding flow (Steps 1-13)
  - Test file: `__tests__/integration/onboarding-full-flow.test.tsx`
  - Test complete flow: Start → Step 1-12 → Submit → Step 13 → Payment → Thank You
  - Verify submission created with status="unpaid" after Step 12
  - Verify submission updated to status="paid" after payment
  - Verify analytics events logged at each step
  - **Dependencies**: T009-T013 (all contract tests), T014-T026 (all step tests)
  - **Files**: __tests__/integration/onboarding-full-flow.test.tsx

- [ ] **T028** [P] Integration test: Session recovery and persistence
  - Test file: `__tests__/integration/onboarding-session-recovery.test.tsx`
  - Test localStorage persistence of Zustand metadata
  - Test session reload from Supabase after browser close
  - Test session expiry (7 days)
  - Test form data restoration on step navigation
  - **Dependencies**: T009 (session API test)
  - **Files**: __tests__/integration/onboarding-session-recovery.test.tsx

- [ ] **T029** [P] Integration test: Payment retry flow
  - Test file: `__tests__/integration/onboarding-payment-retry.test.tsx`
  - Test failed payment with declined card
  - Test retry functionality without re-submitting form
  - Test successful payment after retry
  - Test analytics events for payment failures and retries
  - **Dependencies**: T012 (payment API test), T026 (payment component test)
  - **Files**: __tests__/integration/onboarding-payment-retry.test.tsx

---

## Phase 3.3: Core Implementation (ONLY after tests are failing)

### Zustand Store (1 task)

- [ ] **T030** Create Zustand store for onboarding session metadata
  - File: `lib/store/onboarding-store.ts`
  - Store ONLY metadata: sessionId (uuid | null), currentStep (1-13), lastSaved (timestamp | null)
  - DO NOT store form data (belongs in React Hook Form)
  - Add persistence middleware with key "wb-onboarding-meta"
  - Add actions: setSessionId(), setCurrentStep(), setLastSaved(), resetSession()
  - **Dependencies**: T002 (zustand installed), T003 (types)
  - **Files**: lib/store/onboarding-store.ts

### API Route Handlers (5 tasks)

- [ ] **T031** Implement Session API route handlers
  - File: `app/api/onboarding/session/route.ts` (POST)
  - File: `app/api/onboarding/session/[sessionId]/route.ts` (GET, PATCH)
  - POST: Create session with locale, ipAddress, userAgent
  - GET: Load session with form_data and metadata
  - PATCH: Update currentStep, locale, emailVerified
  - Verify RLS policies enforced (session owner only)
  - **Dependencies**: T009 (test must fail first), T005 (Supabase client), T004 (migration)
  - **Files**: app/api/onboarding/session/route.ts, app/api/onboarding/session/[sessionId]/route.ts

- [ ] **T032** Implement Onboarding Progress API route handlers
  - File: `app/api/onboarding/save/route.ts` (POST)
  - File: `app/api/onboarding/email/verify/route.ts` (POST)
  - File: `app/api/onboarding/email/verify/confirm/route.ts` (POST)
  - POST /save: Merge form data with existing session.form_data (JSONB)
  - POST /verify: Generate 6-digit OTP, send email, store in verification_code
  - POST /verify/confirm: Verify code, check attempts (max 5), check lockout (15 min), check expiry (10 min)
  - **Dependencies**: T010 (test must fail first), T005, T004
  - **Files**: app/api/onboarding/save/route.ts, app/api/onboarding/email/verify/route.ts, app/api/onboarding/email/verify/confirm/route.ts

- [ ] **T033** Implement Submission API route handlers
  - File: `app/api/onboarding/submit/route.ts` (POST)
  - File: `app/api/onboarding/submission/[id]/route.ts` (GET)
  - POST: Create submission with status="unpaid", link to session via submission_id FK
  - GET: Return submission status, payment details, created_at
  - Verify: 409 if submission already exists for session
  - Calculate completion_time_seconds from session.created_at to submission.created_at
  - **Dependencies**: T011 (test must fail first), T005, T004
  - **Files**: app/api/onboarding/submit/route.ts, app/api/onboarding/submission/[id]/route.ts

- [ ] **T034** Implement Payment API route handlers
  - File: `app/api/onboarding/payment/intent/route.ts` (POST)
  - File: `app/api/onboarding/payment/complete/route.ts` (POST)
  - File: `app/api/onboarding/payment/status/[id]/route.ts` (GET)
  - File: `app/api/onboarding/payment/webhook/route.ts` (POST)
  - POST /intent: Create Stripe PaymentIntent for €40 (4000 cents), return clientSecret
  - POST /complete: Update submission status="paid", store payment_transaction_id, payment_completed_at
  - GET /status: Check payment status, enforce 24-hour verification window
  - POST /webhook: Handle payment_intent.succeeded, payment_intent.payment_failed events
  - **Dependencies**: T012 (test must fail first), T006 (Stripe), T005, T004
  - **Files**: app/api/onboarding/payment/intent/route.ts, app/api/onboarding/payment/complete/route.ts, app/api/onboarding/payment/status/[id]/route.ts, app/api/onboarding/payment/webhook/route.ts

- [ ] **T035** Implement Upload API route handlers
  - File: `app/api/onboarding/upload/route.ts` (POST)
  - File: `app/api/onboarding/upload/[id]/route.ts` (DELETE)
  - POST: Upload file to Supabase Storage (bucket: onboarding-assets)
  - Enforce limits: 1 logo (10MB, PNG/JPG/SVG), 30 photos (10MB each, PNG/JPG)
  - Create upload record with file_url, file_size, mime_type, virus_scan_status="pending"
  - File naming: {sessionId}/{fileType}-{timestamp}-{originalFilename}
  - DELETE: Remove file from Supabase Storage and delete upload record
  - **Dependencies**: T013 (test must fail first), T005, T004
  - **Files**: app/api/onboarding/upload/route.ts, app/api/onboarding/upload/[id]/route.ts

### Step Components (13 tasks - some parallel)

- [ ] **T036** [P] Implement Step 1 - Personal Info component
  - File: `components/onboarding/Step01PersonalInfo.tsx`
  - Design reference: context/Visual design/onboarding-01-personal-info.png
  - Fields: firstName, lastName, email (all required)
  - Use React Hook Form with mode: 'onBlur', zodResolver(step1Schema)
  - Add field-level error display
  - Next button disabled until form valid
  - **Dependencies**: T014 (test must fail first), T030 (Zustand store), T003 (schemas)
  - **Files**: components/onboarding/Step01PersonalInfo.tsx

- [ ] **T037** [P] Implement Step 2 - Email Verification component
  - File: `components/onboarding/Step02EmailVerification.tsx`
  - Design reference: context/Visual design/onboarding-02-email-verification.png
  - 6-digit OTP input with auto-submit on 6th digit
  - Display verification attempt counter (5 max)
  - Show 15-minute lockout timer if attempts exceeded
  - Resend code button with 60-second cooldown
  - **Dependencies**: T015 (test must fail first), T032 (email verification API)
  - **Files**: components/onboarding/Step02EmailVerification.tsx

- [ ] **T038** [P] Implement Step 3 - Business Basics component
  - File: `components/onboarding/Step03BusinessBasics.tsx`
  - Design reference: context/Visual design/onboarding-03-business-details.png
  - Fields: businessName, businessEmail, businessPhone, address fields (flat: physicalAddressStreet, etc.), industry, vatNumber (optional)
  - Integrate Google Places Autocomplete API for address
  - Auto-fill all address fields on place selection
  - Manual entry fallback if autocomplete fails
  - **Dependencies**: T016 (test must fail first), T030, T003, T008 (Google API key)
  - **Files**: components/onboarding/Step03BusinessBasics.tsx

- [ ] **T039** [P] Implement Step 4 - Brand Definition component
  - File: `components/onboarding/Step04BrandDefinition.tsx`
  - Design reference: context/Visual design/onboarding-04-brand-definition.png
  - Fields: businessDescription (textarea, min 50 chars), competitorUrls (array, 1-5 URLs), competitorAnalysis (optional)
  - Add URL validation and preview generation
  - Character counter for businessDescription
  - **Dependencies**: T017 (test must fail first), T030, T003
  - **Files**: components/onboarding/Step04BrandDefinition.tsx

- [ ] **T040** [P] Implement Step 5 - Customer Profile component
  - File: `components/onboarding/Step05CustomerProfile.tsx`
  - Design reference: context/Visual design/onboarding-05-customer-profile.png
  - 5 sliders: customerProfileBudget, customerProfileStyle, customerProfileMotivation, customerProfileDecisionMaking, customerProfileLoyalty
  - Range: 0-100 for each slider
  - Visual feedback with labels ("Budget-Conscious" ↔ "Premium")
  - **Dependencies**: T018 (test must fail first), T030, T003
  - **Files**: components/onboarding/Step05CustomerProfile.tsx

- [ ] **T041** [P] Implement Step 6 - Customer Needs component
  - File: `components/onboarding/Step06CustomerNeeds.tsx`
  - Design reference: context/Visual design/onboarding-06-customer-needs.png
  - Fields: customerProblems (required), customerDelight (optional)
  - Character counter for both fields
  - Auto-expand textareas
  - **Dependencies**: T019 (test must fail first), T030, T003
  - **Files**: components/onboarding/Step06CustomerNeeds.tsx

- [ ] **T042** [P] Implement Step 7 - Visual Inspiration component
  - File: `components/onboarding/Step07VisualInspiration.tsx`
  - Design reference: context/Visual design/onboarding-07-visual-inspiration.png
  - Field: websiteReferences (array, 1-5 URLs)
  - URL validation with preview generation
  - Add/remove URL inputs dynamically
  - **Dependencies**: T020 (test must fail first), T030, T003
  - **Files**: components/onboarding/Step07VisualInspiration.tsx

- [ ] **T043** [P] Implement Step 8 - Design Style component
  - File: `components/onboarding/Step08DesignStyle.tsx`
  - Design reference: context/Visual design/onboarding-08-design-style.png
  - Single-select radio group with image previews
  - Options: minimalist, modern, classic, bold (with preview images)
  - **Dependencies**: T021 (test must fail first), T030, T003
  - **Files**: components/onboarding/Step08DesignStyle.tsx

- [ ] **T044** [P] Implement Step 9 - Image Style component
  - File: `components/onboarding/Step09ImageStyle.tsx`
  - Design reference: context/Visual design/onboarding-09-image-style.png
  - Single-select radio group with image previews
  - Options: photorealistic, illustrated, abstract, minimalist (with preview images)
  - **Dependencies**: T022 (test must fail first), T030, T003
  - **Files**: components/onboarding/Step09ImageStyle.tsx

- [ ] **T045** [P] Implement Step 10 - Color Palette component
  - File: `components/onboarding/Step10ColorPalette.tsx`
  - Design reference: context/Visual design/onboarding-10-color-palette.png
  - Single-select radio group with color swatch previews
  - Multiple palette options with visual color swatches
  - **Dependencies**: T023 (test must fail first), T030, T003
  - **Files**: components/onboarding/Step10ColorPalette.tsx

- [ ] **T046** [P] Implement Step 11 - Website Structure component
  - File: `components/onboarding/Step11WebsiteStructure.tsx`
  - Design reference: context/Visual design/onboarding-11-website-structure.png
  - Multi-select checkbox group for website sections
  - Conditional offerings input (show if "Services/Products" selected)
  - Primary goal selection (required): generate_leads, generate_calls, online_sales, brand_awareness
  - **Dependencies**: T024 (test must fail first), T030, T003
  - **Files**: components/onboarding/Step11WebsiteStructure.tsx

- [ ] **T047** Implement Step 12 - Business Assets component
  - File: `components/onboarding/Step12BusinessAssets.tsx`
  - Design reference: context/Visual design/onboarding-12-business-assets.png
  - Logo upload: max 1 file, 10MB, PNG/JPG/SVG (drag & drop + file picker)
  - Photo upload: max 30 files, 10MB each, PNG/JPG (drag & drop + file picker)
  - File preview with thumbnails
  - Delete uploaded file functionality
  - Upload progress indication
  - Call T035 (Upload API) for file uploads
  - **Dependencies**: T025 (test must fail first), T035 (Upload API), T030, T003
  - **Files**: components/onboarding/Step12BusinessAssets.tsx

- [ ] **T048** Implement Step 13 - Payment component
  - File: `components/onboarding/Step13Payment.tsx`
  - Design reference: Not available (no onboarding-13-payment.png - use thank-you design as reference)
  - Integrate Stripe Elements (CardElement)
  - Display €40/month subscription price
  - Disable Back button on Step 13
  - Call T034 (Payment API) to create PaymentIntent
  - Handle payment success/failure with error messages
  - Show retry button on failure
  - **Dependencies**: T026 (test must fail first), T034 (Payment API), T030, T003, T006 (Stripe)
  - **Files**: components/onboarding/Step13Payment.tsx

### Shared Components (3 tasks)

- [ ] **T049** Create ProgressBar component for onboarding layout
  - File: `components/onboarding/ProgressBar.tsx`
  - Display current step (1-13) with visual progress indicator
  - Show step titles from translations
  - Highlight completed steps, current step, and upcoming steps
  - Mobile-responsive design
  - **Dependencies**: T007 (translations), T030 (Zustand for currentStep)
  - **Files**: components/onboarding/ProgressBar.tsx

- [ ] **T050** Create StepNavigation component (Next/Back buttons)
  - File: `components/onboarding/StepNavigation.tsx`
  - Next button: disabled if form invalid, calls save API then navigates
  - Back button: navigates to previous step, disabled on Step 1 and Step 13
  - Loading state during save operation
  - Trigger form validation on Next click (via RHF handleSubmit)
  - **Dependencies**: T032 (save API), T030 (Zustand)
  - **Files**: components/onboarding/StepNavigation.tsx

- [ ] **T051** Create analytics tracking utility
  - File: `lib/analytics/onboarding-analytics.ts`
  - Helper functions: trackStepViewed(), trackStepCompleted(), trackFieldError(), trackPaymentInitiated(), etc.
  - Insert events into onboarding_analytics table
  - Include session_id, event_type, step_number, metadata (JSONB)
  - **Dependencies**: T005 (Supabase client), T004 (analytics table migration)
  - **Files**: lib/analytics/onboarding-analytics.ts

---

## Phase 3.4: Integration (6 tasks)

- [ ] **T052** Integrate analytics tracking into all step components
  - Add trackStepViewed() on component mount for Steps 1-13
  - Add trackStepCompleted() on successful Next button click
  - Add trackFieldError() on validation errors
  - Add trackPaymentInitiated(), trackPaymentSucceeded(), trackPaymentFailed() in Step 13
  - **Dependencies**: T051 (analytics utility), T036-T048 (all steps implemented)
  - **Files**: components/onboarding/Step01PersonalInfo.tsx through Step13Payment.tsx

- [ ] **T053** Implement session recovery on onboarding page load
  - File: `app/[locale]/onboarding/page.tsx`
  - On mount: Check Zustand for sessionId
  - If sessionId exists: Load session from Supabase via T031 (Session API)
  - Restore currentStep and navigate to /onboarding/step/[stepNumber]
  - If session expired or not found: Create new session via T031
  - **Dependencies**: T031 (Session API), T030 (Zustand store)
  - **Files**: app/[locale]/onboarding/page.tsx

- [ ] **T054** Implement form data persistence on step navigation
  - Modify T050 (StepNavigation) to call POST /api/onboarding/save before navigation
  - Save ONLY on Next/Back clicks (no auto-save)
  - Merge new form data with existing session.form_data (JSONB)
  - Update last_activity timestamp
  - **Dependencies**: T050 (StepNavigation), T032 (save API)
  - **Files**: components/onboarding/StepNavigation.tsx

- [ ] **T055** Implement submission creation after Step 12
  - Modify T047 (Step 12 component) to call POST /api/onboarding/submit after file uploads complete
  - Create submission with status="unpaid"
  - Store submission_id in session via PATCH /api/onboarding/session/[sessionId]
  - Navigate to Step 13 only after submission created
  - **Dependencies**: T047 (Step 12), T033 (Submission API), T031 (Session API)
  - **Files**: components/onboarding/Step12BusinessAssets.tsx

- [ ] **T056** Implement payment completion and submission update in Step 13
  - Modify T048 (Step 13 component) to call POST /api/onboarding/payment/complete after Stripe payment succeeds
  - Update submission status="paid", payment_transaction_id, payment_completed_at
  - Track analytics: trackPaymentSucceeded()
  - Navigate to /onboarding/thank-you
  - **Dependencies**: T048 (Step 13), T034 (Payment API), T051 (analytics)
  - **Files**: components/onboarding/Step13Payment.tsx

- [ ] **T057** Create Thank You page with completion summary
  - File: `app/[locale]/onboarding/thank-you/page.tsx`
  - Design reference: context/Visual design/onboarding-13-thank-you.png
  - Display: Submission ID, business name, email, "5 business days" timeline
  - Send confirmation email via email service (if configured)
  - Clear Zustand session metadata (resetSession())
  - **Dependencies**: T030 (Zustand), T033 (Submission API to fetch details)
  - **Files**: app/[locale]/onboarding/thank-you/page.tsx

---

## Phase 3.5: Polish (21 tasks)

### Unit Tests for Utilities (4 tasks - all parallel)

- [ ] **T058** [P] Unit test for Zustand store actions
  - Test file: `__tests__/lib/store/onboarding-store.test.ts`
  - Test setSessionId(), setCurrentStep(), setLastSaved(), resetSession()
  - Test localStorage persistence
  - Verify NO form data stored in Zustand
  - **Dependencies**: T030 (Zustand store)
  - **Files**: __tests__/lib/store/onboarding-store.test.ts

- [ ] **T059** [P] Unit test for Zod validation schemas
  - Test file: `__tests__/lib/validation/onboarding-schemas.test.ts`
  - Test all 13 step schemas: required fields, format validation, array limits
  - Test flat field naming: physicalAddressStreet, customerProfileBudget, etc.
  - Test error messages match translations
  - **Dependencies**: T003 (schemas)
  - **Files**: __tests__/lib/validation/onboarding-schemas.test.ts

- [ ] **T060** [P] Unit test for analytics utility
  - Test file: `__tests__/lib/analytics/onboarding-analytics.test.ts`
  - Test trackStepViewed(), trackStepCompleted(), trackFieldError()
  - Test trackPaymentInitiated(), trackPaymentSucceeded(), trackPaymentFailed()
  - Verify correct event_type, metadata structure
  - **Dependencies**: T051 (analytics utility)
  - **Files**: __tests__/lib/analytics/onboarding-analytics.test.ts

- [ ] **T061** [P] Unit test for Supabase RLS policies
  - Test file: `__tests__/lib/supabase/rls-policies.test.ts`
  - Test session owner can access own session/submission/uploads
  - Test non-owner cannot access other sessions
  - Test admin role can access all sessions (if admin implemented)
  - **Dependencies**: T005 (Supabase client), T004 (migration with RLS)
  - **Files**: __tests__/lib/supabase/rls-policies.test.ts

### E2E Tests with Playwright (8 tasks - some parallel)

- [ ] **T062** [P] E2E test: Happy path - Complete flow Steps 1-13 with payment
  - Test file: `__tests__/e2e/onboarding-happy-path.spec.ts`
  - Start onboarding → Fill all 13 steps → Submit → Pay → Thank You
  - Use Stripe test card: 4242 4242 4242 4242
  - Verify submission status changes: null → unpaid → paid
  - Verify analytics events logged
  - **Dependencies**: T027 (integration test), all implementation complete
  - **Files**: __tests__/e2e/onboarding-happy-path.spec.ts

- [ ] **T063** [P] E2E test: Session recovery after browser close
  - Test file: `__tests__/e2e/onboarding-session-recovery.spec.ts`
  - Fill Steps 1-5 → Close browser → Reopen → Verify resume at Step 5
  - Verify form data restored from Supabase
  - Test with localStorage cleared (force DB reload)
  - **Dependencies**: T028 (integration test), T053 (session recovery)
  - **Files**: __tests__/e2e/onboarding-session-recovery.spec.ts

- [ ] **T064** [P] E2E test: Payment retry after failure
  - Test file: `__tests__/e2e/onboarding-payment-retry.spec.ts`
  - Complete Steps 1-12 → Use declining card (4000 0000 0000 0002) → Retry with successful card
  - Verify error message displayed
  - Verify Back button disabled on Step 13
  - Verify submission remains unpaid until successful payment
  - **Dependencies**: T029 (integration test), T056 (payment completion)
  - **Files**: __tests__/e2e/onboarding-payment-retry.spec.ts

- [ ] **T065** [P] E2E test: Email verification lockout after 5 attempts
  - Test file: `__tests__/e2e/onboarding-email-lockout.spec.ts`
  - Reach Step 2 → Enter wrong code 5 times → Verify 15-minute lockout
  - Verify lockout timer displayed
  - Verify API blocks 6th attempt with 429 status
  - **Dependencies**: T032 (email verification API), T037 (Step 2 component)
  - **Files**: __tests__/e2e/onboarding-email-lockout.spec.ts

- [ ] **T066** [P] E2E test: File upload limits (1 logo, 30 photos)
  - Test file: `__tests__/e2e/onboarding-file-upload.spec.ts`
  - Upload 1 logo → Verify success
  - Try uploading 2nd logo → Verify 400 error
  - Upload 30 photos → Verify success
  - Try uploading 31st photo → Verify 400 error
  - **Dependencies**: T035 (Upload API), T047 (Step 12 component)
  - **Files**: __tests__/e2e/onboarding-file-upload.spec.ts

- [ ] **T067** [P] E2E test: Address autocomplete with Google Places API
  - Test file: `__tests__/e2e/onboarding-address-autocomplete.spec.ts`
  - Type "Via Roma, Milano" → Select from dropdown → Verify all fields auto-filled
  - Test with invalid address → Verify manual entry fallback
  - **Dependencies**: T038 (Step 3 component), T008 (Google API key)
  - **Files**: __tests__/e2e/onboarding-address-autocomplete.spec.ts

- [ ] **T068** E2E test: 24-hour payment verification window
  - Test file: `__tests__/e2e/onboarding-payment-verification-window.spec.ts`
  - Create submission → Manually update created_at to 25 hours ago in DB
  - Try checking payment status → Verify 400 error with "verification expired" message
  - **Dependencies**: T034 (Payment API status endpoint)
  - **Files**: __tests__/e2e/onboarding-payment-verification-window.spec.ts

- [ ] **T069** E2E test: Unpaid submission follow-up tracking
  - Test file: `__tests__/e2e/onboarding-unpaid-submission.spec.ts`
  - Complete Steps 1-12 → Create unpaid submission → Do NOT pay
  - Close browser
  - Verify analytics event "onboarding_unpaid_followup" logged
  - Verify submission visible in admin dashboard (if admin implemented)
  - **Dependencies**: T033 (Submission API), T051 (analytics)
  - **Files**: __tests__/e2e/onboarding-unpaid-submission.spec.ts

### Performance Tests (3 tasks - all parallel)

- [ ] **T070** [P] Performance test: LCP ≤ 1.8s on Step 1
  - Test file: `__tests__/performance/onboarding-lcp.spec.ts`
  - Measure LCP on /onboarding/step/1 (first contentful step)
  - Verify dynamic imports for heavy components (FileUpload, AddressAutocomplete)
  - Verify skeleton loaders prevent layout shift
  - **Dependencies**: T036 (Step 1 component)
  - **Files**: __tests__/performance/onboarding-lcp.spec.ts

- [ ] **T071** [P] Performance test: CLS < 0.1 across all steps
  - Test file: `__tests__/performance/onboarding-cls.spec.ts`
  - Measure CLS on Steps 1-13
  - Verify no layout shifts during component loading
  - Verify skeleton loaders used for async components
  - **Dependencies**: T036-T048 (all steps)
  - **Files**: __tests__/performance/onboarding-cls.spec.ts

- [ ] **T072** [P] Performance test: Step transition < 300ms
  - Test file: `__tests__/performance/onboarding-step-transition.spec.ts`
  - Measure time from Next button click to next step render
  - Include API save call + navigation
  - Target: < 300ms per step
  - **Dependencies**: T050 (StepNavigation), T032 (save API)
  - **Files**: __tests__/performance/onboarding-step-transition.spec.ts

### Accessibility Tests (3 tasks - all parallel)

- [ ] **T073** [P] Accessibility test: WCAG AA compliance for all steps
  - Test file: `__tests__/accessibility/onboarding-wcag.spec.ts`
  - Run axe-core on Steps 1-13
  - Verify: keyboard navigation, focus management, ARIA labels
  - Verify color contrast ratios
  - **Dependencies**: T036-T048 (all steps)
  - **Files**: __tests__/accessibility/onboarding-wcag.spec.ts

- [ ] **T074** [P] Accessibility test: Screen reader support
  - Test file: `__tests__/accessibility/onboarding-screen-reader.spec.ts`
  - Verify ARIA live regions for dynamic content (progress bar, error messages)
  - Verify form labels and descriptions
  - Verify error messages announced
  - **Dependencies**: T036-T048 (all steps), T049 (ProgressBar)
  - **Files**: __tests__/accessibility/onboarding-screen-reader.spec.ts

- [ ] **T075** [P] Accessibility test: Keyboard navigation
  - Test file: `__tests__/accessibility/onboarding-keyboard.spec.ts`
  - Verify Tab order logical
  - Verify Enter submits form
  - Verify Escape closes modals (if any)
  - Verify focus-visible styles applied
  - **Dependencies**: T036-T048 (all steps), T050 (StepNavigation)
  - **Files**: __tests__/accessibility/onboarding-keyboard.spec.ts

### Documentation & Cleanup (3 tasks)

- [ ] **T076** Update API documentation in docs/api/onboarding.md
  - Document all 5 API endpoints with request/response examples
  - Document error codes and messages
  - Document rate limits and lockout behavior
  - Document Stripe webhook setup
  - **Dependencies**: T031-T035 (all APIs implemented)
  - **Files**: docs/api/onboarding.md

- [ ] **T077** Run manual-testing.md validation from quickstart.md
  - Follow Step 3: Manual Happy Path Test (15 minutes)
  - Follow Step 3a: Unpaid Submission Follow-Up Test (5 minutes)
  - Follow Step 3b: Email Verification Lockout Test (5 minutes)
  - Follow Step 4: Session Recovery Test (5 minutes)
  - Follow Step 5: Payment Retry Test (5 minutes)
  - Follow Step 6: Stripe Webhook Test (5 minutes)
  - Document any issues found
  - **Dependencies**: All implementation complete
  - **Files**: None (manual testing checklist)

- [ ] **T078** Remove any workarounds and refactor duplicated code
  - Search for TODOs and FIXMEs in onboarding codebase
  - Identify and remove any temporary workarounds
  - Refactor duplicated validation logic
  - Ensure single source of truth for form data (RHF only)
  - **Dependencies**: All implementation complete
  - **Files**: Multiple (across components, API routes, utilities)

---

## Dependencies Graph

```
Setup (T001-T008)
  ↓
Tests (T009-T029) - MUST FAIL BEFORE IMPLEMENTATION
  ↓
Core Implementation:
  T030 (Zustand) → T036-T048 (Steps)
  T031-T035 (APIs) → T036-T048 (Steps)
  T036-T048 (Steps) → T049-T051 (Shared)
  ↓
Integration (T052-T057)
  T051 → T052
  T031, T030 → T053
  T050, T032 → T054
  T047, T033, T031 → T055
  T048, T034, T051 → T056
  T030, T033 → T057
  ↓
Polish:
  T058-T061 (Unit tests) - parallel
  T062-T069 (E2E tests) - mostly parallel
  T070-T072 (Performance) - parallel
  T073-T075 (Accessibility) - parallel
  T076-T078 (Docs & cleanup) - sequential
```

## Parallel Execution Examples

### Phase 3.1: Setup - Launch T002, T003, T006, T007 together
```bash
# All independent setup tasks (different files, no dependencies)
Task: "Install and configure onboarding dependencies (package.json)"
Task: "Configure TypeScript types for onboarding domain (types/onboarding.ts, lib/validation/onboarding-schemas.ts)"
Task: "Configure Stripe client and webhook handling (lib/stripe/client.ts, lib/stripe/server.ts)"
Task: "Add onboarding translations to messages/en.json and messages/it.json"
```

### Phase 3.2: Contract Tests - Launch T009-T013 together
```bash
# All contract tests (different API endpoints, different files)
Task: "Contract test for Session API (__tests__/api/onboarding/session.test.ts)"
Task: "Contract test for Onboarding Progress API (__tests__/api/onboarding/save.test.ts)"
Task: "Contract test for Submission API (__tests__/api/onboarding/submit.test.ts)"
Task: "Contract test for Payment API (__tests__/api/onboarding/payment.test.ts)"
Task: "Contract test for Upload API (__tests__/api/onboarding/upload.test.ts)"
```

### Phase 3.2: Step Tests - Launch T014-T026 together
```bash
# All step component tests (different components, different files)
Task: "Unit test for Step 1 - Personal Info component"
Task: "Unit test for Step 2 - Email Verification component"
Task: "Unit test for Step 3 - Business Basics component"
# ... (continue for all 13 steps)
Task: "Unit test for Step 13 - Payment component"
```

### Phase 3.3: Step Implementation - Launch T036-T046 together (NOT T047-T048)
```bash
# Steps 1-11 can be parallel (different component files)
# T047 (Step 12) depends on T035 (Upload API) - sequential
# T048 (Step 13) depends on T034 (Payment API) - sequential
Task: "Implement Step 1 - Personal Info component"
Task: "Implement Step 2 - Email Verification component"
Task: "Implement Step 3 - Business Basics component"
# ... (continue for Steps 4-11)
Task: "Implement Step 11 - Website Structure component"
```

### Phase 3.5: Polish - Launch T058-T061, T062-T067, T070-T075 in separate batches
```bash
# Batch 1: Unit tests for utilities (parallel)
Task: "Unit test for Zustand store actions"
Task: "Unit test for Zod validation schemas"
Task: "Unit test for analytics utility"
Task: "Unit test for Supabase RLS policies"

# Batch 2: E2E tests (mostly parallel, except T068-T069 may need DB setup)
Task: "E2E test: Happy path - Complete flow Steps 1-13 with payment"
Task: "E2E test: Session recovery after browser close"
Task: "E2E test: Payment retry after failure"
Task: "E2E test: Email verification lockout after 5 attempts"
Task: "E2E test: File upload limits (1 logo, 30 photos)"
Task: "E2E test: Address autocomplete with Google Places API"

# Batch 3: Performance tests (parallel)
Task: "Performance test: LCP ≤ 1.8s on Step 1"
Task: "Performance test: CLS < 0.1 across all steps"
Task: "Performance test: Step transition < 300ms"

# Batch 4: Accessibility tests (parallel)
Task: "Accessibility test: WCAG AA compliance for all steps"
Task: "Accessibility test: Screen reader support"
Task: "Accessibility test: Keyboard navigation"
```

---

## Validation Checklist
*GATE: Checked before marking tasks.md complete*

- [x] All 5 contracts have corresponding tests (T009-T013)
- [x] All 4 entities have migration task (T004)
- [x] All 13 steps have component tests (T014-T026)
- [x] All tests come before implementation (Phase 3.2 before 3.3)
- [x] Parallel tasks truly independent (verified file paths)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] Integration tests cover: full flow, session recovery, payment retry (T027-T029)
- [x] E2E tests cover: happy path, edge cases, performance, accessibility (T062-T075)
- [x] TDD enforced: Tests in Phase 3.2 MUST FAIL before Phase 3.3 implementation

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

---

**Total Tasks**: 78
**Estimated Duration**: 6-8 weeks (assuming 2-3 developers working in parallel)
**Ready for Execution**: ✅ YES
