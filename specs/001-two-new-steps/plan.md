# Implementation Plan: Add-ons Selection & Stripe Checkout Steps

**Branch**: `001-two-new-steps` | **Date**: 2025-10-20 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-two-new-steps/spec.md`

## Summary

This feature adds two new steps to the onboarding flow:
- **Step 13**: Language add-ons selection (27 European languages at €75 each, extensible for future add-on types)
- **Step 14**: Stripe checkout integration for subscription payment (€35/month yearly subscription + one-time language fees)

All onboarding data (Steps 1-13) is submitted to the database when user completes Step 13. Step 14 handles payment processing using Stripe Subscriptions API with embedded Stripe Elements for PCI compliance. The implementation supports VAT-inclusive pricing, discount codes, automatic invoice generation, and handles payment webhooks for status updates.

**Technical Approach**: Integrate Stripe Subscriptions API with yearly billing (billed monthly), use Stripe Elements for embedded payment UI, implement webhook handlers for payment confirmation, add database migrations for payment fields, and create extensible UI components for future add-on categories.

## Technical Context

**Language/Version**: TypeScript 5.x with Next.js 15+ (app directory)
**Primary Dependencies**:
- Stripe SDK (`stripe`, `@stripe/stripe-js`)
- Next.js 15+, React 18+
- Supabase (PostgreSQL client)
- Zod (schema validation)
- next-intl (internationalization)
- Framer Motion (animations)

**Storage**: Supabase (PostgreSQL)
- `onboarding_sessions`: session state, current_step (update constraint 1-14)
- `onboarding_submissions`: form data + payment fields (stripe_payment_id, stripe_customer_id, stripe_subscription_id, stripe_subscription_schedule_id, payment_amount, currency, discount_code, discount_amount, payment_metadata)
- `onboarding_analytics`: payment event logging

**Testing**:
- Jest + React Testing Library (unit tests)
- Playwright (E2E tests)
- Stripe Test Mode (payment testing)
- axe-core (accessibility validation)

**Target Platform**: Web (responsive, mobile-first)
**Project Type**: Web application (Next.js frontend + API routes)

**Performance Goals**:
- Step 13 interactive in <300ms
- Price updates <200ms
- Form submission from Step 13 in <2s
- Stripe Checkout Session creation <1.5s
- Payment processing <5s (excluding 3DS)
- Webhook processing <500ms

**Constraints**:
- PCI DSS compliance (no card data storage)
- WCAG AA accessibility
- LCP ≤1.8s, CLS <0.1
- EUR currency only, VAT-inclusive pricing
- Yearly commitment (12 months) billed monthly via Subscription Schedules (€35/month × 12 = €420/year)
- After 12 months: converts to regular monthly subscription (cancellable anytime)
- One-time language fees (€75 each, non-recurring)

**Scale/Scope**:
- 27 European languages (extensible)
- Multi-business subscriptions per user allowed
- Stripe webhook handling with idempotency
- Real-time discount code validation
- Automatic invoice generation

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Agile Compliance
- ✅ Sprint goal: Add payment capability to onboarding flow with language add-ons
- ✅ Work pulled from backlog (user-specified feature request)
- ✅ TDD approach: Will write tests first for Step 13 component, Step 14 checkout, webhook handlers
- ✅ Definition of Done includes: tests pass, Playwright visual validation, build passes, deployed
- ✅ Client value: Enable revenue collection from onboarding users
- ✅ Incremental delivery: Step 13 → Step 14 → Webhook integration → Documentation

### Product Development Compliance
- ✅ **User-First Design**: Simple language selection UI, clear pricing breakdown in checkout
- ✅ **AI-Driven Automation**: Stripe handles payment processing, 3DS, fraud detection
- ✅ **International-Ready**: Translations required for Step 13/14 UI in EN/IT (`messages/en.json`, `messages/it.json`)
- ✅ **Performance & Web Standards**: Target LCP ≤1.8s, CLS <0.1, image optimization with Next.js Image
- ✅ **Accessibility Standards**: Keyboard navigation for language checkboxes, screen reader support, axe-core validation
- ✅ **Design System Consistency**: Use `--wb-*` CSS variables from design tokens. Design system located at `/context/design-system`
- ✅ **Test-Driven Development**: Red-Green-Refactor for all components
- ✅ **Session & State Management**: localStorage persistence with schema versioning for language selections
- ✅ **Backward Compatibility**: Database migrations with rollback support
- ⚠️ **Conversion Metrics**: Onboarding completion rate tracking (add to analytics)

### Non-Negotiable Requirements
- ✅ Never store credit card numbers or CVV (Stripe Elements handles this)
- ✅ HTTPS for all payment pages
- ✅ CSRF protection on payment endpoints
- ✅ Webhook signature validation
- ✅ Rate limiting (max 5 payment attempts per hour per session)
- ✅ Audit trail logging to `onboarding_analytics`

## Project Structure

### Documentation (this feature)

```
specs/001-two-new-steps/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0: Stripe integration research
├── data-model.md        # Phase 1: Database schema & types
├── contracts/           # Phase 1: API route contracts
│   ├── create-checkout-session.md
│   └── stripe-webhook.md
├── quickstart.md        # Phase 1: Developer setup guide
└── tasks.md             # Phase 2: Implementation tasks (created by /tasks command)
```

### Source Code (repository root)

```
src/
├── components/onboarding/steps/
│   ├── Step13AddOns.tsx          # Language selection component
│   ├── Step14Checkout.tsx        # Stripe checkout component
│   └── index.tsx                 # Export Step 13 & 14
│
├── app/[locale]/onboarding/step/[stepNumber]/
│   └── page.tsx                  # Update step routing (1-14)
│
├── app/api/stripe/
│   ├── create-checkout-session/route.ts  # Create Stripe subscription
│   └── webhook/route.ts                  # Handle payment webhooks
│
├── lib/
│   └── stripe.ts                 # Stripe client initialization
│
├── data/
│   └── european-languages.ts     # Static language list (27 languages)
│
├── schemas/
│   └── onboarding.ts             # Add step13Schema, step14Schema
│
├── types/
│   └── onboarding.ts             # Add payment-related types
│
├── services/
│   └── onboarding-client.ts      # Update submission logic
│
└── lib/
    └── step-navigation.ts        # Update to support steps 1-14

messages/
├── en.json                       # Add Step 13/14 translations
└── it.json                       # Add Step 13/14 translations

supabase/migrations/
└── [timestamp]_add_payment_fields.sql

docs/
└── STRIPE_CONFIGURATION.md       # Stripe setup guide

__tests__/
├── components/
│   ├── Step13AddOns.test.tsx
│   └── Step14Checkout.test.tsx
├── integration/
│   └── onboarding-payment-flow.test.ts
└── e2e/
    └── onboarding-checkout.spec.ts
```

**Structure Decision**: Web application with Next.js app directory. API routes handle backend logic (Stripe integration, webhooks). Frontend components use shadcn/ui with design tokens. Supabase handles data persistence.

## Complexity Tracking

*No constitutional violations - all complexity justified by business requirements*

| Complexity Point | Why Needed | Simpler Alternative Rejected |
|-----------------|------------|------------------------------|
| Stripe Subscriptions API | Yearly billing billed monthly + one-time fees requires Subscriptions with invoice items | Payment Intents API cannot handle recurring subscriptions |
| Webhook handlers | Asynchronous payment confirmation required for reliable status updates | Polling Stripe API is unreliable and violates best practices |
| Idempotency keys | Prevent duplicate charges if webhook retries | No alternative - Stripe requires this for production |
| Two-step flow (Step 13 → Step 14) | Form submission must complete before payment attempt | Single-step would lose form data on payment failure |

---

## Phase 0: Research & Analysis

**Goal**: Understand existing onboarding flow, Stripe integration requirements, and identify integration points.

**Status**: ✅ Complete

### 1. Existing Onboarding Architecture

**Current Flow** (Steps 1-12):
- Steps defined in `src/components/onboarding/steps/index.tsx`
- Routing in `src/app/[locale]/onboarding/step/[stepNumber]/page.tsx`
- Session persistence via localStorage (`onboarding_sessions` table)
- Form validation with Zod schemas (`src/schemas/onboarding.ts`)
- Navigation logic in `src/lib/step-navigation.ts`
- Current max step: 12 (Business Assets)

**Database Schema**:
```sql
-- onboarding_sessions table
CREATE TABLE onboarding_sessions (
  session_id UUID PRIMARY KEY,
  form_data JSONB,
  current_step INTEGER CHECK (current_step >= 1 AND current_step <= 12), -- NEEDS UPDATE to 14
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

-- onboarding_submissions table
CREATE TABLE onboarding_submissions (
  submission_id UUID PRIMARY KEY,
  session_id UUID REFERENCES onboarding_sessions,
  form_data JSONB,
  status TEXT, -- 'draft', 'submitted', 'paid', 'refunded'
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
  -- NEEDS: payment fields
);
```

### 2. Stripe Integration Requirements

**Subscription Model**:
- Product: WhiteBoar Base Package
- Price: €35/month (recurring monthly)
- Billing interval: `month` with `interval_count: 1`
- Annual commitment: Enforced via Subscription Schedules with `iterations: 12`
- After 12 months: Converts to regular monthly subscription (cancellable anytime)

**One-Time Add-ons**:
- Invoice item per language (€75 each)
- Attached to first invoice only
- Non-recurring

**Required Stripe Objects**:
1. **Product**: `WhiteBoar Base Package`
2. **Price**: `€35/month` recurring
3. **Customer**: Created per onboarding submission (email from Step 3)
4. **Subscription Schedule**: Created with `iterations: 12` for annual commitment
5. **Subscription**: Auto-created by the schedule
6. **Invoice**: Auto-generated with subscription + add-on items
7. **Coupons**: Optional discount codes

**Stripe API Flow**:
```
1. User completes Step 13 → form submitted to DB
2. User reaches Step 14 → create Stripe Subscription Schedule (iterations: 12)
3. Schedule auto-creates Subscription
4. Add invoice items for language add-ons to first invoice (one-time: true)
5. Apply coupon at schedule phase level if discount code provided
6. Stripe redirects to payment form
7. User pays → Stripe sends webhooks:
   - invoice.paid (payment successful)
   - customer.subscription.created (subscription active)
8. Webhook handler updates DB: status='paid', stripe_subscription_id, stripe_subscription_schedule_id, payment_completed_at
9. Send admin notification email
10. Redirect user to /[locale]/onboarding/thank-you
11. After 12 months → subscription_schedule.completed event (converts to regular monthly)
```

### 3. Integration Points

**Frontend**:
- New components: `Step13AddOns.tsx`, `Step14Checkout.tsx`
- Update: `src/components/onboarding/steps/index.tsx` (export Steps 13-14)
- Update: `src/lib/step-navigation.ts` (maxStep: 14)
- Update: `src/app/[locale]/onboarding/step/[stepNumber]/page.tsx` (routing for 13-14)

**Backend**:
- New API route: `/api/stripe/create-checkout-session` (POST)
- New API route: `/api/stripe/webhook` (POST)
- New migration: Add payment fields to `onboarding_submissions`
- Update migration: Change `current_step` constraint (1-14)

**Data**:
- Static data: `src/data/european-languages.ts` (27 languages)
- Schema: `src/schemas/onboarding.ts` (step13Schema, step14Schema)
- Types: `src/types/onboarding.ts` (PaymentDetails, CheckoutSession)

**Translations**:
- `messages/en.json`: Add keys for Step 13/14
- `messages/it.json`: Add keys for Step 13/14

### 4. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Webhook delivery failures | Medium | High | Implement idempotency + fallback Stripe API poll |
| Payment failures during checkout | High | Medium | Clear error messages + retry without re-entering card |
| User navigates back from Step 14 | High | Low | Prevent form re-submission, update checkout with new selections |
| Discount code abuse | Medium | Medium | Rate limiting + server-side validation |
| 3D Secure authentication failures | Medium | High | Stripe Elements handles automatically, show clear errors |

### 5. Dependencies

**NPM Packages**:
```json
{
  "dependencies": {
    "stripe": "^14.0.0",
    "@stripe/stripe-js": "^2.4.0"
  }
}
```

**Environment Variables**:
```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_BASE_PACKAGE_PRICE_ID=price_...
STRIPE_LANGUAGE_ADDON_PRICE_ID=price_...
NOTIFICATION_ADMIN_EMAIL=admin@whiteboar.com
```

### 6. Testing Strategy

**Unit Tests** (Jest + RTL):
- `Step13AddOns`: Language selection, price calculation, checkbox interactions
- `Step14Checkout`: Discount code input, price display, validation
- Webhook handler: Signature verification, idempotency, database updates

**Integration Tests**:
- Complete Step 13, verify form submission
- Load Step 14, verify pricing accuracy
- Navigate back to Step 13, modify selections, return to Step 14

**E2E Tests** (Playwright):
- Full flow: Step 1 → Step 14 → Payment → Thank You
- Test discount code application
- Test payment failure + retry
- Test webhook delivery + DB updates
- Test accessibility (keyboard nav, screen readers)

**Stripe Test Mode**:
- Use test cards: `4242 4242 4242 4242` (success), `4000 0000 0000 0002` (decline)
- Use Stripe CLI for webhook testing: `stripe listen --forward-to localhost:3783/api/stripe/webhook`

---

## Phase 1: Data Model & Contracts

**Goal**: Design database schema, TypeScript types, and API contracts.

**Status**: ✅ Complete

See artifacts:
- [data-model.md](data-model.md)
- [contracts/create-checkout-session.md](contracts/create-checkout-session.md)
- [contracts/stripe-webhook.md](contracts/stripe-webhook.md)
- [quickstart.md](quickstart.md)

---

## Phase 2: Task Breakdown

**Goal**: Generate granular implementation tasks with dependencies.

**Status**: ⏳ Pending (run `/tasks` command to generate)

The tasks will be generated in `tasks.md` and will include:
1. Database migrations
2. Static data setup (languages)
3. Schema definitions
4. Step 13 component implementation
5. Step 14 component implementation
6. API route implementation
7. Webhook handler implementation
8. Translation additions
9. Testing suite
10. Documentation

---

## Progress Tracking

- [x] Phase 0: Research & Analysis
- [x] Phase 1: Data Model & Contracts
- [ ] Phase 2: Task Breakdown (requires `/tasks` command)
- [ ] Implementation (requires `/implement` command)
- [ ] QA & Deployment

---

## Next Steps

1. Run `/tasks` to generate granular implementation tasks
2. Review generated tasks for dependencies and ordering
3. Run `/implement` to begin execution
4. Validate with Playwright MCP after each UI component
5. Deploy and monitor webhook delivery in production

---

**Plan Created**: 2025-10-20
**Last Updated**: 2025-10-20
**Status**: Ready for task generation
