# Implementation Plan: Onboarding System v3

**Branch**: `001-onboarding-v3-implementation` | **Date**: 2025-10-08 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-onboarding-v3-implementation/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → LOADED: 150 functional requirements, 13-step flow with payment
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → NO NEEDS CLARIFICATION - implementation spec provides all details
   → Project Type: web (Next.js 15+ frontend + Supabase backend)
3. Fill the Constitution Check section
   → COMPLETED: All constitutional requirements validated
4. Evaluate Constitution Check section
   → RESULT: PASS - No violations detected
   → Progress updated: Initial Constitution Check ✓
5. Execute Phase 0 → research.md
   → COMPLETED: Technology choices validated, patterns documented
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, CLAUDE.md
   → COMPLETED: All Phase 1 artifacts generated
7. Re-evaluate Constitution Check section
   → RESULT: PASS - Design maintains constitutional compliance
   → Progress updated: Post-Design Constitution Check ✓
8. Plan Phase 2 → Task generation approach documented
9. STOP - Ready for /tasks command
```

**STATUS**: ✅ COMPLETE - Ready for /tasks command

## Summary

The Onboarding System v3 is a 13-step multi-step form that collects business information, design preferences, and payment for WhiteBoar's "Fast & Simple" website package (€40/month). The system uses React Hook Form + Zod for validation, Zustand for session metadata, Supabase for persistence, and Stripe for payment processing. After Step 12, the system creates a submission record with status "unpaid", then Step 13 collects payment and updates the submission to "paid" status. The architecture follows a strict "single source of truth" principle where React Hook Form owns all form data, Zustand stores only session metadata, and validation happens exclusively via Zod schemas.

**Technical Approach**:
- Client-side form state: React Hook Form (`mode: 'onBlur'`) + Zod validation
- Session metadata: Zustand with localStorage persistence
- Database: Supabase (4 tables: sessions, submissions, analytics, uploads)
- Payment: Stripe Elements + Stripe API integration
- Testing: Jest (unit), Playwright (E2E with performance validation)
- Key architectural principle: NO auto-save, NO manual trigger() calls, NO data duplication between RHF and Zustand

## Technical Context

**Language/Version**: TypeScript 5.8.4, Next.js 15.4.6, React 19.0.0
**Primary Dependencies**: react-hook-form 7.62.0, zod 4.1.5, zustand 5.0.8, @supabase/ssr, @stripe/stripe-js 4.0.0, framer-motion 11.11.17
**Storage**: Supabase (PostgreSQL) with 4 tables, Supabase Storage for file uploads
**Testing**: Jest + React Testing Library (unit), Playwright (E2E), axe-core (accessibility)
**Target Platform**: Web browsers (modern Chrome, Firefox, Safari, Edge), mobile-responsive
**Project Type**: web (Next.js frontend + Supabase backend)
**Performance Goals**: LCP ≤ 1.8s, CLS < 0.1, FID < 100ms, step transition < 300ms
**Constraints**: <200KB initial JS (gzipped), WCAG AA accessibility, GDPR compliance
**Scale/Scope**: 13 steps, 150 functional requirements, >25% completion rate target

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. User-First Design
- [x] Feature prioritizes small business needs over technical elegance
  - Simple, guided 13-step flow with clear progress indicators
  - Auto-advance on email verification, auto-fill on address autocomplete
  - Mobile-first design with swipe gestures and bottom-sheet selects
- [x] No unnecessary complexity or technical jargon in UX
  - Natural language labels ("What problems do you solve?" not "Value proposition")
  - Visual style selection with image previews (not technical CSS terms)
  - Plain error messages ("Please enter a valid email" not "Validation failed: RFC 5322")
- [x] Immediate value delivery validated
  - Progress saved every step (7-day session persistence)
  - Email confirmation sent immediately after payment
  - Clear "5 business days" timeline shown on thank-you page

### II. AI-Driven Automation
- [x] AI automation opportunities explored and implemented where possible
  - Address autocomplete via Google Places API (manual entry fallback)
  - Email verification with OTP (prevents spam, validates ownership)
  - Silent fallback to manual entry when autocomplete fails (FR-147)
- [x] Manual processes justified (if any)
  - Email verification: Required for ownership validation and communication
  - Business information collection: Legally required for service delivery
  - Design preferences: User input is the product (cannot be automated)
  - Payment collection: Required for business model

### III. International-Ready by Default
- [x] All user-facing content uses next-intl
  - All step titles, labels, placeholders, error messages use translation keys
  - Progress bar labels localized (e.g., "Step 1 of 13" vs "Passo 1 di 13")
- [x] Translation keys planned for en.json and it.json
  - Namespace: `onboarding.*` (e.g., `onboarding.step1.title`)
  - Error messages: `onboarding.errors.*`
  - Navigation: `onboarding.nav.*`
- [x] URL structure maintains / (English) and /it (Italian)
  - `/[locale]/onboarding/step/[stepNumber]`
  - Server-side translations for metadata via `getTranslations()`

### IV. Performance & Web Standards
- [x] LCP ≤ 1.8s target validated
  - Dynamic imports for heavy components (FileUpload, AddressAutocomplete, OTP, ImageGrid)
  - Lazy loading reduces initial bundle by ~150KB
  - Skeleton loaders prevent layout shift during component loading
- [x] CLS < 0.1 target validated
  - Skeletons for all lazy-loaded components
  - Fixed-height progress bar
  - No auto-navigation that shifts content
- [x] Image optimization strategy defined (Next.js Image)
  - Step 8/9/10 image previews: Next.js Image with responsive sizes
  - Uploaded photos: WebP format with CDN delivery
  - Logo preview: Thumbnail generation via Supabase Storage
- [x] Playwright performance tests planned
  - web-vitals library integration in E2E tests
  - Performance budget validation on Step 1 (first paint)
  - Step transition time measurement (<300ms target)

### V. Accessibility Standards
- [x] Keyboard navigation strategy defined
  - Tab/Shift+Tab: Navigate fields
  - Enter: Submit when Next button enabled
  - Escape: Close modals/dropdowns
  - Arrow keys: Navigate slider values, dropdown options
  - Alt+Left: Back button (browser standard)
- [x] Semantic HTML and heading hierarchy planned
  - Each step: `<h2>` for step title, `<h3>` for subsections
  - Form fields: `<label>` with `htmlFor` + unique IDs
  - Progress bar: `<nav>` with `aria-label="Progress"`
- [x] ARIA labels and localization strategy defined
  - ARIA labels use next-intl: `aria-label={t('onboarding.step1.emailLabel')}`
  - Live region for error announcements: `aria-live="polite"`
  - Progress updates announced to screen readers
- [x] axe-core validation tests planned
  - Playwright E2E tests include `@axe-core/playwright`
  - Validate each step for critical accessibility issues
  - Minimum 48px touch targets on mobile validated

### VI. Design System Consistency
- [x] All styling uses CSS custom properties (--wb-* variables)
  - Form inputs: `--wb-input-border`, `--wb-input-focus`
  - Buttons: `--wb-primary`, `--wb-primary-hover`
  - Progress bar: `--wb-accent`, `--wb-neutral-200`
- [x] No hard-coded colors, spacing, or typography
  - Tailwind config consumes design tokens
  - All spacing uses Tailwind classes (which reference --wb-spacing-*)
  - Typography uses --wb-font-* and --wb-text-* variables
- [x] shadcn/ui component customization follows design tokens
  - Button component uses --wb-primary for primary variant
  - Input component uses --wb-input-* for states
  - Select component uses --wb-dropdown-* for styling

### VII. Test-Driven Development
- [x] Unit tests planned (Jest + RTL)
  - Each step component: Rendering, field interactions, validation display
  - Form fields: TextInput, EmailInput, PhoneInput, AddressAutocomplete, etc.
  - Navigation: StepNavigation button states, keyboard shortcuts
  - Utilities: Data persistence, session management, analytics tracking
- [x] Integration tests planned (if applicable)
  - Multi-step flow: Step 1 → Step 2 → Step 3 with data persistence
  - File upload flow: Upload → preview → delete
  - Payment flow: Submission creation → payment → status update
- [x] E2E tests planned (Playwright)
  - Full onboarding flow: Step 1 through Step 13
  - Session recovery: Fill data, close browser, return
  - Payment retry: Payment fails, retry succeeds
  - Performance validation: LCP, CLS, step transition time
  - Accessibility validation: axe-core on each step
- [x] TDD approach confirmed (tests before implementation)
  - Write schema tests first (Zod validation)
  - Write component tests before component implementation
  - Write E2E tests before wiring up navigation
  - Red-Green-Refactor cycle mandatory

### VIII. Session & State Management
- [x] Schema versioning strategy defined (if using localStorage/sessionStorage)
  - localStorage key includes version: `wb-onboarding-v3-${sessionId}`
  - Version check on load: If v2 data detected, show migration prompt
  - Migration utility: `migrateOnboardingData(v2Data) → v3Data`
- [x] Migration handling for state schema changes planned
  - Version field in persisted data: `{ _version: '3.0.0', ...data }`
  - Graceful degradation: Invalid data → show restart option
  - Clear migration path from v2 to v3 documented in migration guide
- [x] State expiration policies defined
  - Session expires after 7 days of inactivity (FR-004)
  - Unpaid submissions retained for 90 days (FR-140, FR-150)
  - Payment verification window: 24 hours (FR-149)
- [x] Test cleanup utilities planned
  - `ensureFreshOnboardingState(page)` helper for Playwright
  - `clearOnboardingData(sessionId)` for manual cleanup
  - Restart button functionality for user-initiated reset

### IX. Backward Compatibility & Migration
- [x] Migration scripts planned for schema changes (if applicable)
  - Database migrations in `supabase/migrations/` directory
  - Migration script adds `submission_id` column to `onboarding_sessions`
  - Migration script adds payment fields to `onboarding_submissions`
  - Migration updates `current_step` CHECK constraint to include 13
- [x] Backward compatibility strategy defined (support old + new formats)
  - During migration: Support sessions with current_step ≤ 12 (v2) and ≤ 13 (v3)
  - localStorage: Check version field, apply migration if v2 detected
  - API endpoints: Accept both v2 and v3 request formats during transition
- [x] Rollback procedures documented
  - Database: Migration rollback script removes Step 13 fields
  - Code: Feature flag `ENABLE_PAYMENT_STEP` to toggle Step 13
  - Rollback plan: Disable Step 13, complete Step 12 → thank-you page
- [x] Version checks implemented
  - Client: Check localStorage version on mount
  - Server: Check database schema version in session table
  - Version mismatch: Prompt user to refresh or restart

**Constitution Check Result**: ✅ PASS - All constitutional requirements met

## Project Structure

### Documentation (this feature)
```
specs/001-onboarding-v3-implementation/
├── plan.md              # This file (/plan command output)
├── spec.md              # Feature specification (input)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
│   ├── session-api.yaml     # Session creation & loading
│   ├── onboarding-api.yaml  # Step progress saving
│   ├── submission-api.yaml  # Submission creation
│   ├── payment-api.yaml     # Payment processing
│   └── upload-api.yaml      # File upload
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Next.js 15+ App Directory Structure (Web Application)

src/
├── app/[locale]/onboarding/
│   ├── layout.tsx                      # Onboarding layout wrapper
│   ├── page.tsx                        # Welcome/landing page
│   └── step/
│       └── [stepNumber]/
│           └── page.tsx                # Step controller (1-13)
│
├── components/onboarding/
│   ├── providers/
│   │   └── OnboardingFormProvider.tsx  # FormProvider setup
│   ├── form-fields/
│   │   ├── FormField.tsx              # Universal wrapper
│   │   ├── TextInput.tsx              # Text input
│   │   ├── EmailInput.tsx             # Email input
│   │   ├── PhoneInput.tsx             # Phone with country
│   │   ├── AddressInput.tsx           # Google Places
│   │   ├── SelectInput.tsx            # Dropdown
│   │   ├── SliderInput.tsx            # Range slider
│   │   ├── DynamicList.tsx            # Add/remove items
│   │   ├── ImageGrid.tsx              # Image selection
│   │   └── FileUpload.tsx             # Drag & drop
│   ├── steps/
│   │   ├── index.tsx                  # Step registry
│   │   ├── Step1Welcome.tsx           # Personal info
│   │   ├── Step2EmailVerification.tsx # OTP verification
│   │   ├── Step3BusinessBasics.tsx    # Business details
│   │   ├── Step4BrandDefinition.tsx   # Brand description
│   │   ├── Step5CustomerProfile.tsx   # Customer sliders
│   │   ├── Step6CustomerNeeds.tsx     # Problems & delight
│   │   ├── Step7VisualInspiration.tsx # Website references
│   │   ├── Step8DesignStyle.tsx       # Design style selection
│   │   ├── Step9ImageStyle.tsx        # Image style selection
│   │   ├── Step10ColorPalette.tsx     # Color palette selection
│   │   ├── Step11WebsiteStructure.tsx # Sections & goals
│   │   ├── Step12BusinessAssets.tsx   # File uploads
│   │   └── Step13Payment.tsx          # Stripe payment
│   └── ui/
│       ├── StepNavigation.tsx         # Back/Next buttons
│       ├── ProgressBar.tsx            # Visual progress
│       ├── StepContainer.tsx          # Step wrapper
│       └── AutoSaveIndicator.tsx      # Save status
│
├── hooks/onboarding/
│   ├── useOnboardingForm.ts           # Form setup
│   ├── useStepNavigation.ts           # Navigation logic
│   ├── useSessionManagement.ts        # Session handling
│   └── useStepValidation.ts           # Validation helpers
│
├── stores/
│   └── onboarding.ts                  # Zustand store (metadata only)
│
├── schemas/onboarding/
│   ├── index.ts                       # Combined schemas
│   ├── step1.schema.ts                # Personal info
│   ├── step2.schema.ts                # Verification
│   ├── step3.schema.ts                # Business basics
│   ├── step4.schema.ts                # Brand definition
│   ├── step5.schema.ts                # Customer profile
│   ├── step6.schema.ts                # Customer needs
│   ├── step7.schema.ts                # Visual inspiration
│   ├── step8.schema.ts                # Design style
│   ├── step9.schema.ts                # Image style
│   ├── step10.schema.ts               # Color palette
│   ├── step11.schema.ts               # Website structure
│   ├── step12.schema.ts               # Business assets
│   └── step13.schema.ts               # Payment (Stripe validation)
│
├── services/onboarding/
│   ├── client.ts                      # Client-side API
│   ├── server.ts                      # Server actions
│   └── supabase.ts                    # Database layer
│
├── types/
│   └── onboarding.ts                  # TypeScript types
│
└── lib/
    ├── constants.ts                   # Config values
    └── utils.ts                       # Helper functions

__tests__/
├── components/
│   ├── Step1Welcome.test.tsx
│   ├── Step2EmailVerification.test.tsx
│   └── ... (all 13 steps)
└── e2e/
    ├── onboarding-flow.spec.ts        # Full flow
    ├── session-recovery.spec.ts       # Progress persistence
    ├── payment-flow.spec.ts           # Payment & retry
    └── performance.spec.ts            # LCP, CLS validation

supabase/
└── migrations/
    └── 20250108_onboarding_v3.sql # Database schema
```

**Structure Decision**: Web application structure chosen based on Next.js 15+ app directory with TypeScript. Frontend components in `src/components/onboarding/`, backend logic in `src/services/onboarding/`, database schema in `supabase/migrations/`. All form state managed client-side with React Hook Form, server-side persistence via Supabase server actions. Clear separation between UI (components), business logic (services), data schemas (schemas), and state management (stores).

## Phase 0: Outline & Research

**Objective**: Validate technology choices, document architectural decisions, and establish implementation patterns.

**Process**:
1. Extract technology choices from implementation spec
2. Validate choices against Next.js 15 best practices
3. Document key architectural patterns from implementation spec
4. Identify anti-patterns to avoid
5. Consolidate into research.md

**Key Research Areas**:
- React Hook Form + Zod integration patterns
- Zustand persistence with localStorage
- Supabase server actions with Next.js 15
- Stripe Elements integration in Next.js
- Dynamic imports for code splitting
- Playwright E2E testing with web-vitals

**Output**: [research.md](./research.md) with validated technology stack and architectural patterns

**Status**: ✅ COMPLETE

## Phase 1: Design & Contracts

**Objective**: Define data models, API contracts, and implementation quickstart guide.

**Process**:
1. **Extract entities from spec** → data-model.md:
   - Session: Active onboarding session (current_step, form_data, email_verified)
   - Submission: Completed form submission (status: unpaid → paid)
   - Payment: Stripe transaction (transaction_id, amount, status)
   - Analytics: User behavior events (step_view, step_complete, payment_succeeded)
   - Upload: File uploads (logo, photos)

2. **Generate API contracts** from functional requirements:
   - Session API: Create, load, update session
   - Onboarding API: Save step progress
   - Submission API: Create submission (after Step 12)
   - Payment API: Process payment, update submission (Step 13)
   - Upload API: Upload files to Supabase Storage

3. **Generate contract tests** from contracts:
   - One test file per contract in `__tests__/contracts/`
   - Tests written before implementation (TDD)
   - Tests must fail initially (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Happy path: Step 1 → Step 13 → thank-you page
   - Session recovery: Close browser → return → continue
   - Payment retry: Payment fails → retry → success
   - Offline handling: Fill form offline → sync when online

5. **Update CLAUDE.md incrementally**:
   - Add onboarding-specific patterns to existing file
   - Document RHF + Zustand architecture
   - Add anti-patterns section
   - Keep under 150 lines for token efficiency

**Output**:
- [data-model.md](./data-model.md) - Entity definitions with validation rules
- [contracts/](./contracts/) - OpenAPI specs for all APIs
- Contract tests in `__tests__/contracts/` (failing initially)
- [quickstart.md](./quickstart.md) - Implementation quickstart guide
- CLAUDE.md updated with onboarding-specific context

**Status**: ✅ COMPLETE

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
1. Load `.specify/templates/tasks-template.md` as base template
2. Generate tasks from Phase 1 design docs in this order:

**Database & Schema Tasks** (Foundation):
- Task 1: Create Supabase migration for onboarding tables [P]
- Task 2: Write Zod schemas for all 13 steps [P]
- Task 3: Create TypeScript types from schemas [P]

**Contract Test Tasks** (TDD - Write Tests First):
- Task 4: Write contract tests for Session API [P]
- Task 5: Write contract tests for Onboarding API [P]
- Task 6: Write contract tests for Submission API [P]
- Task 7: Write contract tests for Payment API [P]
- Task 8: Write contract tests for Upload API [P]

**Service Layer Tasks** (Make Contract Tests Pass):
- Task 9: Implement Session API (server actions)
- Task 10: Implement Onboarding API (save progress)
- Task 11: Implement Submission API (create submission)
- Task 12: Implement Payment API (Stripe integration)
- Task 13: Implement Upload API (Supabase Storage)

**State Management Tasks**:
- Task 14: Create Zustand store (metadata only) [P]
- Task 15: Implement persistence service (localStorage) [P]
- Task 16: Implement session management hook [P]

**Component Test Tasks** (TDD - Write Tests First):
- Task 17-29: Write unit tests for Step1-Step13 components [P]
- Task 30-38: Write tests for form field components [P]
- Task 39: Write tests for StepNavigation component [P]
- Task 40: Write tests for ProgressBar component [P]

**Component Implementation Tasks** (Make Component Tests Pass):
- Task 41-53: Implement Step1-Step13 components (following tests)
- Task 54-62: Implement form field components (TextInput, EmailInput, etc.)
- Task 63: Implement StepNavigation component
- Task 64: Implement ProgressBar component

**Integration & E2E Test Tasks** (TDD - Write Tests First):
- Task 65: Write E2E test for full onboarding flow [P]
- Task 66: Write E2E test for session recovery [P]
- Task 67: Write E2E test for payment flow [P]
- Task 68: Write E2E test for performance validation [P]
- Task 69: Write E2E test for accessibility validation [P]

**Integration Tasks** (Wire Everything Together):
- Task 70: Create step page controller (app/[locale]/onboarding/step/[stepNumber]/page.tsx)
- Task 71: Wire up FormProvider with RHF
- Task 72: Implement step navigation logic
- Task 73: Connect payment flow to Stripe

**Validation Tasks** (Make E2E Tests Pass):
- Task 74: Run quickstart.md validation
- Task 75: Fix any failing E2E tests
- Task 76: Validate performance metrics (LCP, CLS)
- Task 77: Validate accessibility with axe-core
- Task 78: Final constitution compliance check

**Ordering Strategy**:
- **TDD order**: Tests before implementation (contract tests → services, component tests → components, E2E tests → integration)
- **Dependency order**: Database → Schemas → Services → State → Components → Integration
- **Parallel execution**: Mark [P] for tasks that can run in parallel (independent files)

**Estimated Output**: ~78 numbered, ordered tasks in tasks.md following TDD Red-Green-Refactor cycle

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)
**Phase 4**: Implementation (execute tasks.md following TDD and constitutional principles)
**Phase 5**: Validation (run all tests, execute quickstart.md, validate performance and accessibility)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

**No violations detected** - All constitutional requirements met without compromise.

## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (none)

---
*Based on Constitution v2.0.0 - See `.specify/memory/constitution.md`*
