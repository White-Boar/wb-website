# Research: Onboarding System v3 Technology Stack

**Date**: 2025-10-08
**Feature**: Onboarding System v3 (13-step multi-step form with payment)
**Phase**: Phase 0 - Technology Validation & Architectural Decisions

## Executive Summary

All technology choices have been validated against the implementation specification (`context/onboarding-implementation-spec-v3.md`). The stack follows Next.js 15 best practices, React Hook Form's design philosophy, and WhiteBoar's constitutional principles. No NEEDS CLARIFICATION items remain. All architectural patterns are documented below.

---

## 1. Form State Management: React Hook Form + Zod

### Decision
Use **React Hook Form 7.62.0** with **mode: 'onBlur'** validation, integrated with **Zod 4.1.5** schemas via `@hookform/resolvers`.

### Rationale
- **Single Source of Truth**: RHF owns ALL form data; Zustand stores ONLY metadata (sessionId, currentStep, lastSaved)
- **No Manual Validation**: Zod schemas + `zodResolver` handle validation; NO manual `trigger()` calls needed
- **Optimal UX**: `onBlur` mode validates when user leaves field (not on every keystroke), reducing visual noise
- **Performance**: `shouldUnregister: false` preserves data across step navigation without re-rendering

### Alternatives Considered
- **Formik**: More verbose API, lacks Zod integration, requires manual validation logic
- **mode: 'onChange'**: Validates on every keystroke (annoying UX, causes performance issues)
- **mode: 'onSubmit'**: Delays validation until Next button click (poor UX, user doesn't see errors until too late)

### Implementation Pattern
```typescript
const methods = useForm({
  mode: 'onBlur',              // ✅ Validate on blur
  reValidateMode: 'onBlur',    // ✅ Re-validate on blur
  shouldUnregister: false,     // ✅ Keep data between steps
  resolver: zodResolver(schema),
  defaultValues: loadPersistedData(stepNumber)
})
```

### Anti-Patterns to AVOID
- ❌ `mode: 'onChange'` - causes validation on every keystroke
- ❌ Manual `trigger()` calls - never needed if mode is correct
- ❌ Syncing RHF to Zustand with `watch()` - creates infinite loops
- ❌ Duplicate validation in multiple places - Zod + RHF is enough

**Source**: Implementation spec sections "Development Principles" and "Step Page Component (Correct Pattern)"

---

## 2. Session State Management: Zustand

### Decision
Use **Zustand 5.0.8** with **persistence middleware** for metadata ONLY (NOT form data).

### Rationale
- **Metadata Only**: Zustand stores `sessionId`, `currentStep`, `lastSaved` - NO form data
- **Simple API**: Zustand's minimal API reduces boilerplate vs Redux/Recoil
- **localStorage Persistence**: Built-in persistence middleware handles localStorage sync
- **No Re-renders**: Zustand updates don't trigger unnecessary React re-renders

### What Goes in Zustand
- ✅ `sessionId`: UUID for current session
- ✅ `currentStep`: Current step number (1-13)
- ✅ `lastSaved`: Timestamp of last save
- ❌ Form data (belongs in React Hook Form)
- ❌ Validation state (belongs in React Hook Form)

### Alternatives Considered
- **Redux**: Too complex for metadata-only state, requires actions/reducers/thunks
- **React Context**: Causes re-renders on every state change, no persistence middleware
- **Recoil**: Still experimental, larger bundle size, more complex atom management

### Implementation Pattern
```typescript
export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set, get) => ({
      sessionId: null,
      currentStep: 1,
      lastSaved: null,
      // Actions omitted for brevity
    }),
    {
      name: 'wb-onboarding-meta',
      partialize: (state) => ({
        sessionId: state.sessionId,
        currentStep: state.currentStep,
        // NO formData here
      })
    }
  )
)
```

**Source**: Implementation spec section "Zustand Store (Metadata Only - NO Form Data)"

---

## 3. Data Persistence: localStorage + Supabase

### Decision
- **Client-side**: localStorage for draft data (fast, offline-capable)
- **Server-side**: Supabase server actions for cross-device sync

### Rationale
- **Fast Local Saves**: localStorage writes are synchronous, no network latency
- **Offline Support**: Users can fill form offline, sync when online
- **Cross-Device**: Supabase enables session recovery on different devices
- **7-Day Retention**: Sessions persist for 7 days (configurable via expires_at)

### Save Strategy
- ❌ NO auto-save on every keystroke (annoying, unnecessary writes)
- ✅ Save on navigation (user clicks Next/Back button)
- ✅ Save on window blur (user switches tabs/apps)
- ✅ Save every 30 seconds if form is dirty (background save)

### Alternatives Considered
- **Auto-save on keystroke**: Wasteful writes, poor performance, user has no control
- **SessionStorage only**: Lost on tab close, no cross-device support
- **Supabase only**: Requires network, fails offline, slower UX

### Implementation Pattern
```typescript
// Save ONLY when user clicks Next/Back
const handleNext = async (data: any) => {
  await saveStepData(stepNumber, data)  // localStorage + server
  router.push(`/step/${stepNumber + 1}`)
}
```

**Source**: Implementation spec section "Data Persistence (Simplified - NO Auto-Save)"

---

## 4. Database: Supabase (PostgreSQL)

### Decision
Use **Supabase** with 4 tables: `onboarding_sessions`, `onboarding_submissions`, `onboarding_analytics`, `onboarding_uploads`.

### Rationale
- **PostgreSQL Features**: JSONB for flexible form_data storage, CHECK constraints for data integrity
- **Row-Level Security**: Built-in RLS for multi-tenant isolation
- **Realtime**: Enables future features (admin dashboard with live updates)
- **Storage**: Integrated file storage for logo/photo uploads
- **TypeScript SDK**: Excellent Next.js integration via `@supabase/ssr`

### Schema Design
- **onboarding_sessions**: Current step, form_data (JSONB), email verification, expiration
- **onboarding_submissions**: Final submitted data, payment status (unpaid → paid), workflow tracking
- **onboarding_analytics**: User behavior events (step_view, payment_succeeded, etc.)
- **onboarding_uploads**: Logo and business photos metadata

### Alternatives Considered
- **Firebase Firestore**: NoSQL limitations (no JOIN queries), vendor lock-in
- **MongoDB**: No native Next.js integration, separate hosting required
- **Planetscale**: MySQL lacks JSONB, more expensive at scale

### Key Tables
```sql
-- Sessions: Active onboarding progress
CREATE TABLE onboarding_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE,
  current_step integer CHECK (current_step BETWEEN 1 AND 13),
  submission_id uuid REFERENCES onboarding_submissions(id),
  form_data jsonb DEFAULT '{}'::jsonb,
  expires_at timestamptz DEFAULT now() + interval '7 days'
);

-- Submissions: Completed forms
CREATE TABLE onboarding_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES onboarding_sessions(id),
  status text CHECK (status IN ('unpaid', 'paid', 'preview_sent', 'completed', 'cancelled')),
  payment_transaction_id text,
  form_data jsonb NOT NULL
);
```

**Source**: Implementation spec section "Database Schema"

---

## 5. Payment Processing: Stripe

### Decision
Use **Stripe Elements** (`@stripe/stripe-js 4.0.0`, `@stripe/react-stripe-js 3.0.0`) for Step 13 payment collection.

### Rationale
- **PCI Compliance**: Stripe Elements handles card data, WhiteBoar never touches sensitive info
- **European Support**: Strong EUR support, popular in Italian market
- **Subscription Billing**: Native recurring billing for €40/month subscription
- **Security**: Stripe's fraud detection and 3D Secure support
- **Next.js Integration**: Official React library with TypeScript support

### Payment Flow
1. Step 12 completes → system creates submission (status: "unpaid")
2. User navigates to Step 13
3. Stripe Elements collects payment info
4. Payment succeeds → update submission (status: "paid")
5. Navigate to thank-you page

### Alternatives Considered
- **PayPal**: Less popular in Italy, poor developer experience, higher fees
- **Square**: Limited European support, primarily US-focused
- **Custom Payment Gateway**: PCI compliance nightmare, legal liability, high development cost

### Implementation Pattern
```typescript
// Step13Payment.tsx
<Elements stripe={stripePromise}>
  <PaymentForm submissionId={submissionId} />
</Elements>

// On success
await completePayment(submissionId, {
  transactionId: paymentIntent.id,
  amount: 4000, // €40 in cents
  cardLast4: paymentMethod.card.last4
})
```

**Source**: Implementation spec section "Step 13: Payment"

---

## 6. Code Splitting: Dynamic Imports

### Decision
Lazy load heavy components with **Next.js dynamic()** to reduce initial bundle size by ~150KB.

### Rationale
- **Performance**: Meets LCP ≤ 1.8s target by reducing initial JS payload
- **User Experience**: Skeleton loaders prevent layout shift (CLS < 0.1)
- **Incremental Loading**: Components load only when user reaches relevant steps

### Components to Lazy Load
- **FileUpload** (Step 12): Uses react-dropzone (~30KB)
- **AddressAutocomplete** (Step 3): Uses Google Maps API (~50KB)
- **OTPInput** (Step 2): Uses react-otp-input (~10KB)
- **ImageGrid** (Steps 8/9/10): Heavy image assets (~40KB)
- **Stripe Elements** (Step 13): Stripe SDK (~30KB)

### Alternatives Considered
- **Eager Loading**: Simple but violates performance budget (>200KB initial JS)
- **Route-Based Splitting**: Not granular enough (entire step loads at once)
- **Manual Code Splitting**: More control but complex, easy to get wrong

### Implementation Pattern
```typescript
const FileUpload = dynamic(
  () => import('@/components/onboarding/form-fields/FileUpload'),
  {
    loading: () => <Skeleton className="h-32" />,
    ssr: false  // Client-only (uses browser File API)
  }
)
```

**Source**: Implementation spec section "Performance & Optimization" → "Code Splitting"

---

## 7. Testing Strategy: Jest + Playwright + axe-core

### Decision
- **Unit Tests**: Jest + React Testing Library for components
- **E2E Tests**: Playwright for user flows
- **Accessibility**: axe-core integration in Playwright tests
- **Performance**: web-vitals library in Playwright

### Rationale
- **TDD Compliance**: Write tests before implementation (constitutional requirement)
- **Fast Feedback**: Jest runs in milliseconds for rapid iteration
- **Real Browser Testing**: Playwright tests actual user flows in Chrome/Firefox/Safari
- **Performance Validation**: Automated LCP/CLS checks prevent regressions
- **Accessibility Compliance**: axe-core ensures WCAG AA compliance

### Test Coverage
1. **Unit**: Each step component, form fields, navigation, utilities
2. **Integration**: Multi-step flows, file upload, payment
3. **E2E**: Full onboarding flow, session recovery, payment retry
4. **Performance**: LCP ≤ 1.8s, CLS < 0.1 on Step 1
5. **Accessibility**: axe-core passes on all 13 steps

### Alternatives Considered
- **Cypress**: Slower than Playwright, less browser coverage, more flaky
- **Testing Library only**: No E2E coverage, can't validate performance
- **Manual Testing only**: Not scalable, misses regressions, no CI integration

### Implementation Pattern
```typescript
// Unit test
test('Step1 validates email format', async () => {
  render(<Step1Welcome />)
  await userEvent.type(screen.getByLabelText(/email/i), 'invalid')
  await userEvent.tab()
  expect(screen.getByText(/valid email/i)).toBeVisible()
})

// E2E test
test('Full onboarding flow', async ({ page }) => {
  await page.goto('/onboarding/step/1')
  await page.fill('[name="email"]', 'test@example.com')
  await page.click('button:has-text("Next")')
  // ... continue through all 13 steps
})
```

**Source**: Implementation spec section "Testing Strategy"

---

## 8. Internationalization: next-intl

### Decision
Use **next-intl** for server-side translations with English (`/`) and Italian (`/it`) support.

### Rationale
- **Server-Side Rendering**: SEO-friendly translations for metadata and content
- **Type Safety**: TypeScript integration prevents missing translation keys
- **Performance**: Translations bundled at build time, no runtime overhead
- **Next.js 15 Compatibility**: Official Next.js recommended solution

### Translation Structure
- **Namespace**: `onboarding.*` (e.g., `onboarding.step1.title`)
- **Error Messages**: `onboarding.errors.*`
- **Navigation**: `onboarding.nav.next`, `onboarding.nav.back`
- **Placeholders**: `onboarding.step1.emailPlaceholder`

### Alternatives Considered
- **react-i18next**: Client-side only, SEO issues, runtime overhead
- **FormatJS (react-intl)**: More complex API, larger bundle size
- **Custom solution**: Reinventing the wheel, no TypeScript support

### Implementation Pattern
```typescript
// Server Component (metadata)
export async function generateMetadata({ params: { locale } }) {
  const t = await getTranslations({ locale, namespace: 'onboarding' })
  return {
    title: t('step1.metaTitle'),
    description: t('step1.metaDescription')
  }
}

// Client Component (UI)
const t = useTranslations('onboarding')
<label>{t('step1.emailLabel')}</label>
```

**Source**: Implementation spec section "Internationalization" and Constitution principle III

---

## 9. Analytics: Supabase + Custom Events

### Decision
Store analytics events in **onboarding_analytics** table with event-driven tracking.

### Rationale
- **Conversion Tracking**: Measure completion rate (target >25%), drop-off points
- **Performance Monitoring**: Track step transition times, identify slow steps
- **Error Analysis**: Log validation errors to identify UX problems
- **Payment Funnel**: Track payment_initiated, payment_failed, payment_succeeded events

### Key Events
1. `onboarding_step_viewed` - User lands on step
2. `onboarding_step_completed` - User clicks Next successfully
3. `onboarding_field_error` - Validation error occurs
4. `onboarding_form_submitted` - Submission created (after Step 12)
5. `onboarding_payment_initiated` - User reaches Step 13
6. `onboarding_payment_succeeded` - Payment completes
7. `onboarding_payment_failed` - Payment fails
8. `onboarding_completed` - Full flow done

### Alternatives Considered
- **Google Analytics**: Privacy concerns (GDPR), client-side only, blocked by ad blockers
- **Mixpanel**: Expensive at scale, external dependency, data residency issues
- **PostHog**: Self-hosted complexity, separate infrastructure to maintain

**Source**: Implementation spec section "Analytics & Tracking"

---

## 10. Accessibility: Keyboard Navigation + ARIA + axe-core

### Decision
Implement **full keyboard navigation**, **localized ARIA labels**, and **axe-core automated testing**.

### Rationale
- **Legal Compliance**: WCAG AA required in European markets
- **Market Reach**: Expands accessibility to users with disabilities
- **SEO Benefit**: Semantic HTML improves search engine indexing
- **Constitutional Requirement**: Non-negotiable principle V

### Keyboard Shortcuts
- **Tab/Shift+Tab**: Navigate fields
- **Enter**: Submit when Next enabled
- **Escape**: Close modals/dropdowns
- **Arrow keys**: Slider values, dropdown options
- **Alt+Left**: Back button

### ARIA Strategy
- Labels use translations: `aria-label={t('onboarding.step1.emailLabel')}`
- Live regions for errors: `aria-live="polite"`
- Progress updates announced to screen readers
- Minimum 48px touch targets on mobile

### Alternatives Considered
- **Minimal Accessibility**: Legal risk, excludes users, poor SEO
- **Manual Testing Only**: Doesn't scale, misses regressions
- **ARIA without testing**: No validation, easy to break

**Source**: Implementation spec section "Accessibility Features" and Constitution principle V

---

## Summary Table

| Technology | Version | Purpose | Justification |
|------------|---------|---------|---------------|
| React Hook Form | 7.62.0 | Form state | Single source of truth, Zod integration, onBlur mode |
| Zod | 4.1.5 | Validation | Type-safe schemas, composable, RHF integration |
| Zustand | 5.0.8 | Session metadata | Minimal API, localStorage persistence, no re-renders |
| Supabase | Latest | Database + Storage | PostgreSQL + RLS + Realtime + File storage |
| Stripe | 4.0.0 | Payment | PCI compliance, EUR support, subscription billing |
| next-intl | Latest | i18n | Server-side, SEO-friendly, TypeScript support |
| Jest + RTL | Latest | Unit tests | Fast feedback, React-specific assertions |
| Playwright | Latest | E2E tests | Multi-browser, performance, accessibility |
| axe-core | Latest | a11y testing | WCAG validation, automated checks |
| Framer Motion | 11.11.17 | Animations | Reduced motion support, performance |

---

## Architectural Principles (Implementation)

1. **Single Source of Truth**: React Hook Form owns form data, Zustand owns metadata
2. **No Auto-Save**: Save only on user intent (Next/Back clicks)
3. **No Manual Validation**: Zod + RHF handle validation, no manual `trigger()` calls
4. **Explicit State Transitions**: User controls navigation, no auto-navigation
5. **Data Shape Consistency**: Flat field naming (e.g., `physicalAddressStreet`), no nested objects
6. **Fail Fast, Fail Loud**: Error boundaries + toast notifications, no silent failures
7. **Test Behavior, Not Implementation**: Test user flows, not internal state
8. **Progressive Enhancement**: Start simple, add complexity only when proven necessary
9. **Delete First, Build Second**: Remove workarounds before adding features
10. **Optimize for Change**: Small components, clear interfaces, easy to modify

**Source**: Implementation spec section "Development Principles"

---

## Next Steps

Phase 0 is complete. All technology choices are validated and documented. Proceed to:

**Phase 1**: Generate data-model.md, contracts/, quickstart.md, and update CLAUDE.md

---

*Research completed: 2025-10-08*
*Based on: context/onboarding-implementation-spec-v3.md v3.1*
