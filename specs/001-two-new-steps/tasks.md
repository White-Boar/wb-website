# Tasks: Add-ons Selection & Stripe Checkout Steps

**Input**: Design documents from `/specs/001-two-new-steps/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/create-checkout-session.md, contracts/stripe-webhook.md, quickstart.md

**Tests**: Tests are included per TDD approach specified in plan.md (constitution check confirms TDD is required).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions
- Web app structure: Next.js 15+ with app directory
- Components: `src/components/onboarding/steps/`
- API routes: `app/api/stripe/`
- Data/types: `src/data/`, `src/types/`, `src/schemas/`
- Translations: `messages/en.json`, `messages/it.json`
- Tests: `__tests__/components/`, `__tests__/e2e/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies and configure environment for Stripe integration

- [ ] T001 Install Stripe dependencies via `pnpm add stripe @stripe/stripe-js`
- [ ] T002 [P] Add Stripe environment variables to `.env.local` (NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_BASE_PACKAGE_PRICE_ID, STRIPE_LANGUAGE_ADDON_PRICE_ID, NOTIFICATION_ADMIN_EMAIL)
- [ ] T003 [P] Create Stripe client initialization in `src/lib/stripe.ts`
- [ ] T004 [P] Update TypeScript config to include new directories if needed in `tsconfig.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database schema, types, and shared data structures that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T005 Create database migration for onboarding_sessions current_step constraint update (1-14) in `supabase/migrations/[timestamp]_update_step_constraint.sql`
- [ ] T006 Create database migration for onboarding_submissions payment fields in `supabase/migrations/[timestamp]_add_payment_fields.sql`
- [ ] T007 Run database migrations via `pnpm supabase db push`
- [ ] T007a Configure Stripe auto-invoice emails via Dashboard → Settings → Emails → Invoice emails (enable automatic invoice sending)
- [ ] T008 [P] Create European languages static data file with 27 languages in `src/data/european-languages.ts`
- [ ] T009 [P] Add Step 13 schema (step13Schema) to `src/schemas/onboarding.ts`
- [ ] T010 [P] Add Step 14 schema (step14Schema) to `src/schemas/onboarding.ts`
- [ ] T011 [P] Add PaymentDetails interface to `src/types/onboarding.ts`
- [ ] T012 [P] Add CheckoutSession interface to `src/types/onboarding.ts`
- [ ] T013 [P] Add Stripe webhook event types to `src/types/stripe.ts` (new file)
- [ ] T014 Update step navigation to support steps 1-14 in `src/lib/step-navigation.ts`
- [ ] T015 [P] Add Step 13 translations to `messages/en.json`
- [ ] T016 [P] Add Step 13 translations to `messages/it.json`
- [ ] T017 [P] Add Step 14 translations to `messages/en.json`
- [ ] T018 [P] Add Step 14 translations to `messages/it.json`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Additional Language Selection (Priority: P1) 🎯 MVP

**Goal**: Enable users to select additional European languages as add-ons on Step 13 and persist selections to database

**Independent Test**: Navigate to Step 13, select one or more European languages, verify selection persists, click "Next", and confirm all form data (Steps 1-13) is submitted to database

### Tests for User Story 1

**NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T019 [P] [US1] Unit test for Step13AddOns component rendering in `__tests__/components/Step13AddOns.test.tsx`
- [ ] T020 [P] [US1] Unit test for language selection interactions in `__tests__/components/Step13AddOns.test.tsx`
- [ ] T021 [P] [US1] Unit test for price calculation logic in `__tests__/components/Step13AddOns.test.tsx`
- [ ] T022 [P] [US1] Integration test for Step 13 form submission in `__tests__/integration/step13-submission.test.ts`
- [ ] T023 [P] [US1] E2E test for complete Step 13 flow in `__tests__/e2e/onboarding-step13.spec.ts`

### Implementation for User Story 1

**⚠️ TDD Checkpoint**: Before proceeding, verify T019-T023 tests are written and FAILING. Do not implement until tests fail.

- [ ] T024 [US1] Create Step13AddOns component file in `src/components/onboarding/steps/Step13AddOns.tsx`
- [ ] T025 [US1] Implement language selection UI with checkboxes and pricing display in `src/components/onboarding/steps/Step13AddOns.tsx`
- [ ] T026 [US1] Add real-time subtotal calculation for selected languages in `src/components/onboarding/steps/Step13AddOns.tsx`
- [ ] T027 [US1] Implement form persistence using localStorage in `src/components/onboarding/steps/Step13AddOns.tsx`
- [ ] T028 [US1] Add form validation (exclude EN/IT, validate language codes) in `src/components/onboarding/steps/Step13AddOns.tsx`
- [ ] T029 [US1] Implement "Next" button handler to submit Steps 1-13 to database in `src/components/onboarding/steps/Step13AddOns.tsx`
- [ ] T030 [US1] Update onboarding service to handle Step 13 submission in `src/services/onboarding-client.ts`
- [ ] T031 [US1] Export Step13AddOns from `src/components/onboarding/steps/index.tsx`
- [ ] T032 [US1] Update step routing to include Step 13 in `app/[locale]/onboarding/step/[stepNumber]/page.tsx`
- [ ] T033 [US1] Add accessibility attributes (ARIA labels, keyboard navigation) to Step 13 component
- [ ] T034 [US1] Add Framer Motion animations with reduced motion support to Step 13
- [ ] T035 [US1] Run Playwright visual validation for Step 13 component (light/dark themes, mobile/desktop)

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently - users can select languages and submit form data

---

## Phase 4: User Story 2 - Secure Stripe Checkout (Priority: P1) 🎯 MVP

**Goal**: Enable users to complete payment on Step 14 via Stripe with clear pricing breakdown, optional discount codes, and proper webhook handling

**Independent Test**: Reach Step 14 with test session (with/without add-ons), verify payment breakdown accuracy, process test payment via Stripe test mode, confirm redirect to thank-you page, verify database records and admin notifications

### Tests for User Story 2

**NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T036 [P] [US2] Contract test for POST /api/stripe/create-checkout-session in `__tests__/contract/create-checkout-session.test.ts`
- [ ] T037 [P] [US2] Contract test for POST /api/stripe/webhook in `__tests__/contract/stripe-webhook.test.ts`
- [ ] T038 [P] [US2] Unit test for Step14Checkout component rendering in `__tests__/components/Step14Checkout.test.tsx`
- [ ] T039 [P] [US2] Unit test for discount code validation in `__tests__/components/Step14Checkout.test.tsx`
- [ ] T040 [P] [US2] Integration test for complete payment flow in `__tests__/integration/payment-flow.test.ts`
- [ ] T041 [P] [US2] E2E test for Stripe checkout with test card in `__tests__/e2e/onboarding-checkout.spec.ts`
- [ ] T042 [P] [US2] E2E test for webhook delivery and database updates in `__tests__/e2e/webhook-processing.spec.ts`
- [ ] T042a [P] [US2] E2E test for payment failure scenarios (card declined, insufficient funds, network timeout) in `__tests__/e2e/payment-errors.spec.ts`
- [ ] T042b [P] [US2] E2E test for invalid discount code handling in `__tests__/e2e/discount-validation.spec.ts`
- [ ] T042c [P] [US2] Integration test for rate limiting (5 attempts per hour) in `__tests__/integration/rate-limiting.test.ts`

### Implementation for User Story 2

**⚠️ TDD Checkpoint**: Before proceeding, verify T036-T042c tests are written and FAILING. Do not implement until tests fail.

- [ ] T043 [P] [US2] Create POST /api/stripe/create-checkout-session route in `app/api/stripe/create-checkout-session/route.ts`
- [ ] T044 [P] [US2] Create POST /api/stripe/webhook route in `app/api/stripe/webhook/route.ts`
- [ ] T045 [US2] Implement Stripe Subscription Schedule creation logic in `app/api/stripe/create-checkout-session/route.ts` (depends on T043)
- [ ] T046 [US2] Implement invoice items creation for language add-ons in `app/api/stripe/create-checkout-session/route.ts`
- [ ] T047 [US2] Implement discount code validation against Stripe Coupons API in `app/api/stripe/create-checkout-session/route.ts`
- [ ] T048 [US2] Implement rate limiting (5 attempts per hour per session) in `app/api/stripe/create-checkout-session/route.ts`
- [ ] T049 [US2] Implement webhook signature verification in `app/api/stripe/webhook/route.ts` (depends on T044)
- [ ] T050 [US2] Implement invoice.paid event handler in `app/api/stripe/webhook/route.ts`
- [ ] T051 [US2] Implement subscription_schedule.completed event handler in `app/api/stripe/webhook/route.ts`
- [ ] T052 [US2] Implement subscription_schedule.canceled event handler in `app/api/stripe/webhook/route.ts`
- [ ] T053 [US2] Implement charge.refunded event handler in `app/api/stripe/webhook/route.ts`
- [ ] T054 [US2] Implement payment_intent.payment_failed event handler in `app/api/stripe/webhook/route.ts`
- [ ] T055 [US2] Implement idempotency checking for webhook events in `app/api/stripe/webhook/route.ts`
- [ ] T056 [US2] Implement admin notification email sending logic in `app/api/stripe/webhook/route.ts`
- [ ] T057 [US2] Create Step14Checkout component file in `src/components/onboarding/steps/Step14Checkout.tsx`
- [ ] T058 [US2] Implement pricing breakdown display (base + add-ons + total) in `src/components/onboarding/steps/Step14Checkout.tsx`
- [ ] T059 [US2] Integrate Stripe Elements for payment form in `src/components/onboarding/steps/Step14Checkout.tsx`
- [ ] T060 [US2] Implement discount code input and validation UI in `src/components/onboarding/steps/Step14Checkout.tsx`
- [ ] T061 [US2] Implement payment submission and error handling in `src/components/onboarding/steps/Step14Checkout.tsx`
- [ ] T062 [US2] Implement redirect to thank-you page on success in `src/components/onboarding/steps/Step14Checkout.tsx`
- [ ] T063 [US2] Export Step14Checkout from `src/components/onboarding/steps/index.tsx`
- [ ] T064 [US2] Update step routing to include Step 14 in `app/[locale]/onboarding/step/[stepNumber]/page.tsx`
- [ ] T065 [US2] Add accessibility attributes to Step 14 payment form (ARIA labels, screen reader announcements)
- [ ] T066 [US2] Add loading states and error messages with proper i18n in Step 14
- [ ] T067 [US2] Run Playwright visual validation for Step 14 component (light/dark themes, mobile/desktop)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - complete onboarding flow from Step 1 through payment

---

## Phase 5: User Story 3 - Navigate Back from Checkout (Priority: P2)

**Goal**: Allow users to navigate back from Step 14 to Step 13, modify language selections, and see updated checkout total

**Independent Test**: Navigate to Step 14, click Previous, modify selections on Step 13, return to Step 14, verify checkout total reflects changes

### Tests for User Story 3

- [ ] T068 [P] [US3] E2E test for backward navigation from Step 14 to Step 13 in `__tests__/e2e/navigation-flow.spec.ts`
- [ ] T069 [P] [US3] Integration test for form data persistence across navigation in `__tests__/integration/navigation-persistence.test.ts`

### Implementation for User Story 3

**⚠️ TDD Checkpoint**: Before proceeding, verify T068-T069 tests are written and FAILING. Do not implement until tests fail.

- [ ] T070 [US3] Implement "Previous" button handler in Step 14 in `src/components/onboarding/steps/Step14Checkout.tsx`
- [ ] T071 [US3] Add navigation state preservation logic in `src/lib/step-navigation.ts`
- [ ] T072 [US3] Verify pricing recalculation on return to Step 14 works correctly
- [ ] T073 [US3] Add visual feedback for modified selections in Step 14
- [ ] T074 [US3] Run Playwright validation for navigation flow

**Checkpoint**: All user stories 1, 2, and 3 should now be independently functional

---

## Phase 6: User Story 4 - Resume Incomplete Checkout Session (Priority: P3)

**Goal**: Allow users to resume checkout from Step 14 after closing browser, with previous selections intact

**Independent Test**: Start checkout session, close browser, clear cookies, reopen onboarding URL, verify system resumes at Step 14 with correct state

### Tests for User Story 4

- [ ] T075 [P] [US4] E2E test for session resumption after browser close in `__tests__/e2e/session-resumption.spec.ts`
- [ ] T076 [P] [US4] Integration test for expired session handling in `__tests__/integration/session-expiry.test.ts`

### Implementation for User Story 4

**⚠️ TDD Checkpoint**: Before proceeding, verify T075-T076 tests are written and FAILING. Do not implement until tests fail.

- [ ] T077 [US4] Verify localStorage persistence works correctly for Steps 13-14 in existing session management
- [ ] T078 [US4] Implement session expiry check (>7 days) in `src/lib/session-manager.ts`
- [ ] T079 [US4] Add redirect logic for completed payments in `app/[locale]/onboarding/page.tsx`
- [ ] T080 [US4] Run Playwright validation for session resumption scenarios

**Checkpoint**: All user stories should now be independently functional

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and production readiness

- [ ] T081 [P] Add comprehensive error logging to analytics for payment events
- [ ] T081a [P] Implement conversion metrics tracking for Steps 13-14: completion rate (target ≥25%), time-to-complete (target ≤15min), mobile completion rate (target ≥40%), drop-off analysis per step in `src/lib/analytics.ts`
- [ ] T082 [P] Implement performance monitoring for Step 13/14 load times
- [ ] T083 [P] Add security headers and CSRF protection to payment endpoints
- [ ] T084 [P] Create Stripe configuration documentation in `docs/STRIPE_CONFIGURATION.md` including: (1) API keys setup, (2) Product/Price creation for monthly recurring at €35 and one-time language add-on at €75, (3) Subscription Schedule configuration with iterations: 12, (4) Webhook endpoint setup with event selection, (5) Auto-invoice email configuration, (6) Coupon creation for discount codes, (7) Test mode vs production mode differences - following quickstart.md structure
- [ ] T085 [P] Run axe-core accessibility validation on Steps 13-14
- [ ] T086 [P] Validate LCP ≤1.8s and CLS <0.1 for Steps 13-14
- [ ] T087 Code cleanup and remove any console.log statements
- [ ] T088 Run full test suite (Jest + Playwright) via `pnpm test && pnpm test:e2e`
- [ ] T089 Run production build and verify no TypeScript errors via `pnpm build`
- [ ] T090 Validate quickstart.md test scenarios work end-to-end

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phases 3-6)**: All depend on Foundational phase completion
  - User Story 1 (P1): Can start after Foundational - No dependencies on other stories
  - User Story 2 (P1): Can start after Foundational - No dependencies on other stories (can run parallel with US1)
  - User Story 3 (P2): Depends on US1 and US2 completion (needs both Step 13 and Step 14)
  - User Story 4 (P3): Depends on US1 and US2 completion (needs session persistence)
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories (implements independent Step 14)
- **User Story 3 (P2)**: Requires US1 AND US2 - Implements navigation between Steps 13 and 14
- **User Story 4 (P3)**: Requires US1 AND US2 - Tests session resumption for existing functionality

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Database schema before components
- Static data before components
- API routes can be parallel with components
- Component logic before integration
- Accessibility and visual validation after component is functional

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- User Story 1 and User Story 2 can be worked on in parallel (independent steps)
- All tests within a story marked [P] can run in parallel
- API routes for US2 can be developed in parallel
- Translation files can be updated in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
# T019, T020, T021, T022, T023 can run in parallel

# Launch static data and schema together after foundation:
# T008 (european-languages.ts), T009 (step13Schema), T015, T016 (translations)
```

## Parallel Example: User Story 2

```bash
# Launch contract tests together:
# T036 (create-checkout-session test), T037 (webhook test)

# Launch both API routes together:
# T043 (create-checkout-session route), T044 (webhook route)

# Then implement logic in each route independently
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2 Only)

1. Complete Phase 1: Setup (T001-T004)
2. Complete Phase 2: Foundational (T005-T018) - CRITICAL blocker
3. Complete Phase 3: User Story 1 (T019-T035) - Language selection
4. Complete Phase 4: User Story 2 (T036-T067) - Payment processing
5. **STOP and VALIDATE**: Test both stories independently
6. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (partial MVP)
3. Add User Story 2 → Test independently → Deploy/Demo (full MVP!)
4. Add User Story 3 → Test independently → Deploy/Demo (enhanced UX)
5. Add User Story 4 → Test independently → Deploy/Demo (conversion optimization)
6. Add Polish → Production ready

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (critical path)
2. Once Foundational is done:
   - Developer A: User Story 1 (Step 13 component)
   - Developer B: User Story 2 (Step 14 component + Stripe APIs)
3. Once US1 & US2 complete:
   - Developer A: User Story 3 (navigation)
   - Developer B: User Story 4 (session resumption)
4. Both developers: Polish tasks in parallel

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- TDD approach: Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Run `PORT=3783 pnpm dev` for development server
- Use Stripe test mode with test cards for payment testing
- Run Playwright MCP after UI changes to validate visually
- Stripe CLI required for local webhook testing: `stripe listen --forward-to localhost:3783/api/stripe/webhook`

**Total Tasks**: 95
**Setup**: 4 tasks
**Foundational**: 15 tasks (added T007a for Stripe auto-invoice config)
**User Story 1**: 17 tasks (5 tests + 12 implementation)
**User Story 2**: 35 tasks (10 tests + 25 implementation, added T042a-c for error handling)
**User Story 3**: 7 tasks (2 tests + 5 implementation)
**User Story 4**: 6 tasks (2 tests + 4 implementation)
**Polish**: 11 tasks (added T081a for conversion metrics)

**Parallel Opportunities**: 46 tasks marked [P] can run in parallel within their phases
**MVP Scope**: User Stories 1 & 2 (52 tasks after foundation) = Steps 13 & 14 fully functional with comprehensive error handling
