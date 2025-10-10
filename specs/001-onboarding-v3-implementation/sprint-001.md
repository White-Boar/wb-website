# Sprint 001: Foundation Onboarding Experience

**Sprint Duration**: 2025-10-10 to 2025-10-10 (completed in 1 day)
**Sprint Capacity**: 12 hours
**Feature Branch**: `001-onboarding-v3-implementation`
**Status**: Complete ✅

## Sprint Goal

**Goal**: Create a foundation onboarding experience with a welcome screen and thank you page, without intermediate steps.

**Elaboration**:
Deliver a minimal viable onboarding flow consisting of a welcome landing page and a thank you completion page. This sprint establishes the core infrastructure including the Next.js app directory structure, Zustand state management, basic navigation components, and the visual design implementation for entry and exit points. This foundation enables stakeholders to visualize the onboarding user experience and provides the technical scaffolding for future step implementations.

**Who Benefits**: Product stakeholders and design team can validate the visual design and user flow; development team gains the foundational architecture for step-by-step implementation.

**Business Value**: Validates the onboarding design system and navigation patterns before investing in the full 13-step implementation, reducing risk of costly design changes later.

## Execution Flow (sprint scope)
```
1. Load sprint goal and selected tasks
   → Sprint goal defines the value to deliver
   → Tasks are prioritized and estimated
2. Execute tasks in **priority order**
   → In the order listed in the spring file 
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

**Total Estimated**: 11 hours
**Capacity Available**: 12 hours
**Utilization**: 92%

### Priority Order

---

**T001** [Priority: P0] [Estimate: 1.5 hours]
**Description**: Create Next.js app directory structure for onboarding feature
**Acceptance Criteria**:
- [ ] Directory structure created for `/onboarding/` route
- [ ] layout.tsx renders navigation and progress bar
- [ ] page.tsx renders welcome screen matching design (onboarding-00-welcome.png)
- [ ] thank-you/page.tsx renders thank you screen matching design (onboarding-13-thank-you.png)
- [ ] loading.tsx and error.tsx exist for graceful states

**Context**:
- Paths: `app/[locale]/onboarding/`, `app/[locale]/onboarding/thank-you/`
- Create layout.tsx with progress bar component
- Create loading.tsx and error.tsx for each route

**Dependencies**: None

**Files**:
- app/[locale]/onboarding/layout.tsx
- app/[locale]/onboarding/page.tsx
- app/[locale]/onboarding/thank-you/page.tsx

---

**T002** [Priority: P0] [Estimate: 0.5 hours]
**Description**: Install and configure onboarding dependencies
**Acceptance Criteria**:
- [ ] All production dependencies installed with exact versions specified
- [ ] All dev dependencies installed
- [ ] `pnpm install` completes without errors
- [ ] No dependency conflicts in pnpm-lock.yaml
- [ ] TypeScript types for all libraries available

**Context**:
- Install: react-hook-form@7.62.0, zod@4.1.5, @hookform/resolvers, zustand@5.0.8
- Install: @supabase/ssr, @stripe/stripe-js@4.0.0, @stripe/react-stripe-js
- Install dev: @testing-library/react, @testing-library/user-event, @playwright/test
- Update package.json with correct versions

**Dependencies**: None (can run in parallel with T001)

**Files**:
- package.json
- pnpm-lock.yaml

---

**T003** [Priority: P0] [Estimate: 1 hour]
**Description**: Configure TypeScript types for onboarding domain
**Acceptance Criteria**:
- [ ] types/onboarding.ts exports all necessary TypeScript interfaces
- [ ] SessionState type includes sessionId, currentStep, lastSaved
- [ ] Zod schemas defined for welcome page data (if any)
- [ ] All types use flat field naming (no nested objects)
- [ ] TypeScript compilation passes with no errors

**Context**:
- Create types/onboarding.ts with FormData, SessionState, SubmissionStatus, AnalyticsEvent types
- Add Zod schemas in lib/validation/onboarding-schemas.ts
- Export type definitions matching data-model.md (flat field names)

**Dependencies**: None

**Files**:
- types/onboarding.ts
- lib/validation/onboarding-schemas.ts

---

**T007** [Priority: P0] [Estimate: 1 hour]
**Description**: Add onboarding translations to messages/en.json and messages/it.json
**Acceptance Criteria**:
- [ ] onboarding.welcome.* translations added (title, subtitle, startButton)
- [ ] onboarding.thankYou.* translations added (title, message, timeline)
- [ ] onboarding.nav.* translations added (next, back, restart)
- [ ] English and Italian structures match exactly (same keys)
- [ ] All translation keys use consistent naming convention

**Context**:
- Add namespace onboarding.* with step titles, field labels, placeholders, error messages
- Add onboarding.nav.* for Next/Back buttons, progress bar
- Add onboarding.errors.* for validation messages (matching Zod schemas)
- Ensure Italian translations match English structure exactly

**Dependencies**: T003 (needs schema structure)

**Files**:
- messages/en.json
- messages/it.json

---

**T008** [Priority: P1] [Estimate: 0.5 hours]
**Description**: Configure environment variables for onboarding
**Acceptance Criteria**:
- [ ] .env.example includes all required environment variables with placeholder values
- [ ] .env.local configured with actual development credentials
- [ ] Environment variable validation schema created
- [ ] Server starts without missing environment variable errors
- [ ] Documentation added for obtaining each API key

**Context**:
- Add to .env.local: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
- Add: SUPABASE_SERVICE_ROLE_KEY (for server-side operations)
- Add: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
- Add: NEXT_PUBLIC_GOOGLE_PLACES_API_KEY (for address autocomplete)
- Validate all required env vars with schema validation

**Dependencies**: None

**Files**:
- .env.local
- .env.example

---

**T030** [Priority: P0] [Estimate: 1 hour]
**Description**: Create Zustand store for onboarding session metadata
**Acceptance Criteria**:
- [ ] Zustand store created with persistence middleware
- [ ] Store contains ONLY metadata (sessionId, currentStep, lastSaved)
- [ ] No form data stored in Zustand (violates single source of truth)
- [ ] Actions implemented: setSessionId, setCurrentStep, setLastSaved, resetSession
- [ ] localStorage key is "wb-onboarding-meta"
- [ ] Store hydrates correctly from localStorage on page load

**Context**:
- File: `lib/store/onboarding-store.ts`
- Store ONLY metadata: sessionId (uuid | null), currentStep (1-13), lastSaved (timestamp | null)
- DO NOT store form data (belongs in React Hook Form)
- Add persistence middleware with key "wb-onboarding-meta"
- Add actions: setSessionId(), setCurrentStep(), setLastSaved(), resetSession()

**Dependencies**: T002 (zustand installed), T003 (types)

**Files**:
- lib/store/onboarding-store.ts

---

**T049** [Priority: P0] [Estimate: 1.5 hours]
**Description**: Create ProgressBar component for onboarding layout
**Acceptance Criteria**:
- [ ] ProgressBar component renders with current step highlighted
- [ ] Component reads currentStep from Zustand store
- [ ] Uses design tokens (--wb-*) for styling
- [ ] Responsive design (collapses on mobile)
- [ ] ARIA labels for accessibility
- [ ] For foundation sprint: Shows simplified progress (Welcome → Thank You)
- [ ] Visual design matches progress bar shown in onboarding-01-personal-info.png

**Context**:
- File: `components/onboarding/ProgressBar.tsx`
- Display current step (1-13) with visual progress indicator
- Show step titles from translations
- Highlight completed steps, current step, and upcoming steps
- Mobile-responsive design
- **Visual Reference**: context/Visual design/onboarding-01-personal-info.png

**Dependencies**: T007 (translations), T030 (Zustand for currentStep)

**Files**:
- components/onboarding/ProgressBar.tsx

---

**T050** [Priority: P0] [Estimate: 1.5 hours]
**Description**: Create StepNavigation component (Next/Back buttons)
**Acceptance Criteria**:
- [ ] StepNavigation component renders Next and Back buttons
- [ ] Next button navigates from Welcome to Thank You page
- [ ] Back button disabled on Welcome page
- [ ] Loading state shown during navigation
- [ ] Uses design tokens (--wb-*) for button styling
- [ ] Keyboard accessible (Enter key triggers Next)
- [ ] For foundation sprint: Simplified navigation (no form validation, no API calls)
- [ ] Visual design matches navigation buttons shown in onboarding-01-personal-info.png

**Context**:
- File: `components/onboarding/StepNavigation.tsx`
- Next button: disabled if form invalid, calls save API then navigates
- Back button: navigates to previous step, disabled on Step 1 and Step 13
- Loading state during save operation
- Trigger form validation on Next click (via RHF handleSubmit)
- **Visual Reference**: context/Visual design/onboarding-01-personal-info.png

**Dependencies**: T030 (Zustand)

**Files**:
- components/onboarding/StepNavigation.tsx

---

**NEW-T001** [Priority: P0] [Estimate: 2 hours]
**Description**: Create Welcome component for onboarding landing page
**Acceptance Criteria**:
- [ ] Welcome component renders matching onboarding-00-welcome.png design
- [ ] Component displays title, subtitle, and value proposition cards
- [ ] "Start Your Website" button navigates to thank you page (simplified for foundation sprint)
- [ ] Restart button clears Zustand state and starts fresh
- [ ] Uses design tokens (--wb-*) for all styling
- [ ] Responsive design for mobile and desktop
- [ ] All text uses next-intl translations
- [ ] ARIA labels for accessibility
- [ ] Visual design matches context/Visual design/onboarding-00-welcome.png

**Context**:
- NEW TASK (not in original backlog)
- File: `components/onboarding/Welcome.tsx`
- Render welcome/landing content matching visual design
- Display value proposition and "Start Your Website" CTA
- Implement restart functionality for returning users
- **Visual Reference**: context/Visual design/onboarding-00-welcome.png

**Dependencies**: T007 (translations)

**Files**:
- components/onboarding/Welcome.tsx

---

**T057** [Priority: P0] [Estimate: 1.5 hours]
**Description**: Create Thank You page with completion summary
**Acceptance Criteria**:
- [ ] Thank you page renders matching onboarding-13-thank-you.png design
- [ ] Page displays success message and next steps
- [ ] "5 business days" timeline clearly shown
- [ ] Restart/Back to Homepage button navigates correctly
- [ ] Zustand session metadata cleared on mount (resetSession())
- [ ] Uses design tokens (--wb-*) for styling
- [ ] Responsive design for mobile and desktop
- [ ] All text uses next-intl translations
- [ ] For foundation sprint: Simplified content (no submission ID, no email)
- [ ] Visual design matches context/Visual design/onboarding-13-thank-you.png

**Context**:
- File: `app/[locale]/onboarding/thank-you/page.tsx`
- Display: Submission ID, business name, email, "5 business days" timeline
- Send confirmation email via email service (if configured)
- Clear Zustand session metadata (resetSession())
- **Visual Reference**: context/Visual design/onboarding-13-thank-you.png

**Dependencies**: T030 (Zustand)

**Files**:
- app/[locale]/onboarding/thank-you/page.tsx

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

**Foundation Sprint Scope**:
- This sprint delivers ONLY the welcome and thank you pages
- No intermediate form steps are included
- No Supabase database integration in this sprint
- No Stripe payment integration in this sprint
- Focus is on establishing the visual design system and navigation structure

**Visual Design References**:
- Welcome page: `context/Visual design/onboarding-00-welcome.png`
- Thank you page: `context/Visual design/onboarding-13-thank-you.png`
- Progress bar / navigation: `context/Visual design/onboarding-01-personal-info.png`

**Technical Decisions**:
- Zustand store created but will only manage basic state (no session persistence yet)
- Navigation is simplified (no form validation, no API calls)
- ProgressBar shows simplified 2-step flow for foundation sprint

**New Tasks Created**:
- NEW-T001: Welcome component (not in original backlog, needed for foundation sprint)
- T057: Thank You page (from backlog, adapted for foundation sprint)

## Risk Register

**Risk**: Visual designs may not match current design system tokens
**Mitigation**: Review design tokens before implementation, update if needed
**Probability**: Medium
**Impact**: Low

**Risk**: Dependencies may have version conflicts
**Mitigation**: Use exact versions specified, test after installation
**Probability**: Low
**Impact**: Low

**Risk**: Zustand persistence may behave unexpectedly in development
**Mitigation**: Test localStorage hydration thoroughly, clear between tests
**Probability**: Medium
**Impact**: Low

---

*Sprint generated on 2025-10-10 using /plan-sprint command*
