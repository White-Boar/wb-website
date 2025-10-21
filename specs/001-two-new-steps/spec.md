# Feature Specification: Add-ons Selection & Stripe Checkout Steps

**Feature Branch**: `001-two-new-steps`
**Created**: 2025-10-20
**Status**: Draft
**Input**: User description: "add two new steps to the onboarding flow. Step 13 should allow users to select add ons. For now the only add on is an additional language in addition to English and Italian that are part of the basic package. Offer all the European languages at a price of 75 euro per language. User selection should be persisted with the rest of the form data. Form data should be submited after this step (13). Then add an additional step 14 for checkout. This should be done using stripe. User should be able to pay the price of the package (monthly subscruption fee) pluse add ons selected. There should be an option to enter discount code. The items the user is purchasing should be clearly listed. Use best practices for the design and infosec of the checkout experiance. Once payed, the user should be redirected to the thank you page. The database should be updeated with the payment details and an admin notification sent. Create a document explaining how to configure Stripe."

## Clarifications

### Session 1 - 2025-10-20

**Q1: How do Steps 13 and 14 relate to each other?**
- Step 14 exists independently from Step 13 - it's how clients can pay even if they did not select any add-ons
- All users must complete Step 14 (payment) regardless of whether they selected add-ons in Step 13
- Step 14 always shows the base package price + any add-ons selected

**Q2: What is the scope of Step 13 - just languages or broader?**
- Step 13 is for selecting add-ons in general, not just languages
- Right now the only add-on is additional languages
- In the future, other add-on types can be added to Step 13
- UI should be designed to be extensible for future add-on categories

**Q3: When is the onboarding form data submitted to the database?**
- When the user clicks "Next" on Step 13, ALL onboarding information (Steps 1-13) is submitted and saved to the database
- This happens BEFORE the user reaches Step 14 (checkout)
- Step 14 only handles payment processing, not form submission

**Q4: How does session resumption work for incomplete checkout?**
- User does NOT need a special link to resume
- The onboarding system already has session persistence via localStorage
- Whenever a user returns to the onboarding flow, it automatically continues from their last step
- If they left at Step 14, they resume at Step 14 with all data intact

**Q5: Can users select English or Italian as add-on languages?**
- NO - users cannot select Italian or English as add-ons
- Both languages are ALWAYS included in the base package
- English and Italian are excluded from the add-ons selection UI
- Users cannot accidentally select or pay for languages they already have

**Q6: Which European languages should be available as add-ons?**
- Only European languages with more than 1 million speakers
- Total of 27 languages available as add-ons
- Excludes English and Italian (base package languages)
- Each language costs €75

### Session 2 - 2025-10-20

- Q: What is the billing model for the base package and language add-ons? → A: Recurring yearly subscription with a monthly payment for base package + one-time setup fee per language
- Q: What is the monthly payment amount for the base package subscription? → A: €35
- Q: Should EU VAT tax be automatically calculated and collected based on the customer's VAT number? → A: No - Show prices as VAT-inclusive, no separate tax line item
- Q: Can a customer have multiple active subscriptions for different businesses? → A: Multiple subscriptions allowed - user can create separate subscriptions for different businesses
- Q: Should Stripe automatically send invoices to customers after successful payment? → A: Yes - Stripe auto-sends invoices via email after each payment

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Additional Language Selection (Priority: P1)

A business owner wants to add German to their website package in addition to the included English and Italian. They navigate through the onboarding flow, reach Step 13 after completing all business information, and can select additional European languages from a clear interface showing the €75 per language pricing. They select German, see the total updated to reflect the add-on, and proceed to checkout. When they click "Next", all their onboarding information (Steps 1-13) is submitted and saved to the database.

**Why this priority**: This is the core value proposition of the new feature - enabling users to customize their package with add-ons. Step 13 is designed to be extensible for future add-on types (not just languages), making it a critical foundation for the business model.

**Independent Test**: Can be fully tested by navigating to Step 13 in the onboarding flow, selecting one or more European languages, verifying the selection persists, clicking "Next", and confirming all form data (Steps 1-13) is submitted to the database. Delivers value by allowing package customization before payment.

**Acceptance Scenarios**:

1. **Given** user has completed Steps 1-12, **When** they proceed to Step 13, **Then** they see a language selection interface with all European languages clearly listed with €75/language pricing
2. **Given** user is on Step 13, **When** they select French and Spanish as additional languages, **Then** both selections are visually confirmed and the subtotal shows €150 for add-ons
3. **Given** user has selected additional languages on Step 13, **When** they click "Next", **Then** their language selections are persisted to the database along with all other form data and they proceed to Step 14
4. **Given** user has selected languages and navigates back to Step 13, **When** the step loads, **Then** their previously selected languages are pre-checked
5. **Given** user is on Step 13, **When** they deselect a previously selected language, **Then** the subtotal updates immediately to reflect the removal

---

### User Story 2 - Secure Stripe Checkout (Priority: P1)

A business owner has completed their onboarding (Steps 1-13) and is ready to pay. On Step 14, they see a clear breakdown of their purchase: base package monthly subscription fee plus any language add-ons selected (if any). They can optionally enter a discount code. They complete payment securely through Stripe's payment form, receive confirmation, and are redirected to the thank-you page. Their payment details are recorded in the database and an admin notification is sent.

**Why this priority**: Payment collection is essential for the business to function. This step converts leads into paying customers. Step 14 is independent of Step 13 - users can proceed to checkout even without selecting any add-ons, as they still need to pay for the base package.

**Independent Test**: Can be fully tested by reaching Step 14 with a test onboarding session (with or without add-ons), verifying the payment breakdown is accurate, processing a test payment via Stripe test mode, confirming successful payment redirects to thank-you page, and verifying database records and admin notifications. Delivers value by enabling actual revenue generation.

**Acceptance Scenarios**:

1. **Given** user has completed Step 13 with or without language selections, **When** they proceed to Step 14, **Then** they see itemized breakdown showing base package price + language add-ons price (if any) + total
2. **Given** user completed Step 13 with zero add-ons, **When** they reach Step 14, **Then** checkout shows only base package price with no add-ons section
3. **Given** user is on Step 14 checkout, **When** they enter a valid discount code, **Then** the total updates to reflect the discount amount with clear indication of savings
4. **Given** user is on Step 14 checkout, **When** they enter payment details and submit, **Then** payment is processed securely through Stripe using PCI-compliant methods
5. **Given** user successfully completes payment, **When** Stripe confirms payment, **Then** user is redirected to `/[locale]/onboarding/thank-you` page
6. **Given** payment is successful, **When** the payment webhook is received, **Then** onboarding_submissions record is updated with payment_completed_at timestamp and status changed to 'paid'
7. **Given** payment is successful, **When** the database is updated, **Then** an admin notification email is sent containing submission ID, business name, email, and payment amount
8. **Given** user payment fails on Step 14, **When** Stripe returns an error, **Then** user sees clear error message and can retry payment without losing form data

---

### User Story 3 - Navigate Back from Checkout (Priority: P2)

A business owner reaches Step 14 checkout but realizes they want to change their language selections. They click the "Previous" button, return to Step 13, modify their language selections, and proceed back to checkout where the updated total is reflected.

**Why this priority**: Users should have flexibility to review and modify their choices before committing payment. This improves user experience and reduces payment abandonment.

**Independent Test**: Can be fully tested by navigating to Step 14, clicking Previous, modifying selections on Step 13, returning to Step 14, and verifying the checkout total reflects the changes. Delivers value by giving users confidence and control before payment.

**Acceptance Scenarios**:

1. **Given** user is on Step 14 checkout page, **When** they click "Previous", **Then** they are returned to Step 13 with all form data intact
2. **Given** user returns to Step 13 from checkout, **When** they modify language selections, **Then** the changes persist when they proceed back to Step 14
3. **Given** user has modified selections after returning from checkout, **When** they reach Step 14 again, **Then** the checkout total accurately reflects the updated selections

---

### User Story 4 - Resume Incomplete Checkout Session (Priority: P3)

A business owner starts checkout on Step 14 but closes their browser before completing payment. When they return hours later to the onboarding flow, the system automatically resumes from Step 14 (their last step) with their previous language selections and package details intact, allowing them to complete payment.

**Why this priority**: Reduces abandoned carts and improves conversion rates by allowing users to complete payment later without re-entering all information. The onboarding system already persists session state, so this works automatically.

**Independent Test**: Can be fully tested by starting a checkout session, closing browser, clearing cookies, reopening the onboarding URL, and verifying the system resumes at Step 14 with correct state. Delivers value by recovering potentially lost conversions.

**Acceptance Scenarios**:

1. **Given** user has reached Step 14 and their session is persisted, **When** they close browser and return to onboarding, **Then** the system automatically resumes at Step 14 with their previous selections and pricing intact
2. **Given** user session has expired (>7 days), **When** they attempt to access onboarding, **Then** they are redirected to start a new onboarding session
3. **Given** user has already completed payment for a session, **When** they return to onboarding, **Then** they are redirected to the thank-you page

---

### Edge Cases

- **What happens when** user enters an invalid or expired discount code?
  - System validates discount code against Stripe Coupons API
  - If invalid: Show clear error message "Invalid discount code" without clearing the input field
  - If expired: Show message "This discount code has expired"
  - User can retry with different code or proceed without discount

- **How does system handle** Stripe API failures or network timeouts during payment?
  - Implement retry logic with exponential backoff (3 attempts)
  - Display user-friendly error messages without exposing technical details
  - Preserve form state so user doesn't lose their data
  - Log errors to analytics for debugging
  - Provide option to retry payment without re-entering card details

- **What happens when** user selects 0 additional languages on Step 13?
  - This is valid - user proceeds with base package only (English + Italian)
  - Step 14 checkout shows only the base package price
  - "Next" button on Step 13 is always enabled (no minimum selection required)
  - Step 14 exists independently from Step 13 - all users must complete payment regardless of add-on selection

- **How does system handle** webhook failures for payment confirmation?
  - Stripe webhooks have automatic retry mechanism (up to 3 days)
  - Implement idempotency keys to prevent duplicate database updates
  - Secondary verification: Poll Stripe API on thank-you page load to confirm payment status
  - If webhook never arrives but Stripe confirms payment: Admin receives delayed notification after manual reconciliation

- **What happens when** user tries to access Step 13 or 14 without completing previous steps?
  - Step protection logic redirects user back to their current_step
  - User must complete Steps 1-12 before accessing Step 13
  - Database constraint: current_step must progress sequentially

- **How does system handle** concurrent session access (user opens onboarding in multiple tabs)?
  - localStorage synchronization ensures consistent state across tabs
  - Last write wins for form data updates
  - Stripe Checkout Session is created once per submission attempt
  - Payment completion in one tab invalidates checkout in other tabs

- **What happens when** user tries to select Italian or English as add-on languages?
  - Italian and English are NOT available in the add-ons list - they are excluded from selection
  - Both languages are always included in the base package
  - The UI clearly indicates "English and Italian included" in the base package description
  - User cannot accidentally select languages they already have

- **How does system handle** partial payment processing (Stripe confirms but database update fails)?
  - Stripe payment ID is logged immediately upon webhook receipt
  - Database transaction wraps submission update + admin notification
  - If database fails: Manual reconciliation process using Stripe payment ID
  - Admin dashboard flags submissions with "payment_completed" in Stripe but not in DB

- **What happens when** user's card requires 3D Secure authentication?
  - Stripe Elements automatically handles 3D Secure challenge
  - User is prompted for authentication in modal/redirect as required by their bank
  - Payment flow continues seamlessly after authentication
  - Failed authentication shows appropriate error message

- **How does system handle** refunds or payment disputes?
  - Stripe webhook for refunds updates submission status to 'refunded'
  - Admin receives notification of refund/dispute
  - Submission record retains original payment_completed_at timestamp
  - New field: refunded_at timestamp is added when refund occurs

## Requirements *(mandatory)*

### Functional Requirements

#### Step 13: Add-ons Selection

- **FR-001**: System MUST display Step 13 after user completes Step 12 (Business Assets)
- **FR-002**: System MUST present European languages with >1M speakers as selectable add-ons with €75/language pricing clearly displayed
- **FR-003**: System MUST exclude English and Italian from selectable add-ons (they are included in base package and not shown in the add-ons list)
- **FR-004**: System MUST allow users to select zero or more additional languages (no minimum or maximum limit)
- **FR-005**: System MUST display real-time subtotal calculation as user selects/deselects languages
- **FR-006**: System MUST persist selected language add-ons to onboarding session form_data in database
- **FR-007**: System MUST submit complete form data (Steps 1-13) to onboarding_submissions table when user clicks "Next" on Step 13
- **FR-008**: System MUST validate Step 13 is accessible only if user has completed Steps 1-12
- **FR-009**: System MUST allow navigation back to previous steps from Step 13 without data loss
- **FR-010**: System MUST restore previously selected language add-ons when user returns to Step 13
- **FR-011**: System MUST design Step 13 UI to be extensible for future add-on types (not just languages)

#### Step 14: Stripe Checkout

- **FR-012**: System MUST display Step 14 after user completes Step 13 and form submission succeeds
- **FR-013**: System MUST function independently - users can reach Step 14 even with zero add-ons selected
- **FR-014**: System MUST show itemized breakdown of charges: base package (yearly subscription billed monthly) + one-time language setup fees (if any) + total for first payment
- **FR-015**: System MUST integrate Stripe Elements for PCI-compliant payment form rendering
- **FR-016**: System MUST create Stripe Subscription Schedule with iterations: 12 to enforce annual commitment (€35/month × 12 = €420/year), billed monthly, with initial invoice containing one-time language setup fees. After 12 months, subscription converts to regular monthly billing (cancellable anytime).
- **FR-017**: System MUST support discount code entry with real-time validation against Stripe Coupons API
- **FR-018**: System MUST display updated total when valid discount code is applied
- **FR-019**: System MUST handle Stripe payment processing including 3D Secure authentication
- **FR-020**: System MUST redirect user to `/[locale]/onboarding/thank-you` page upon successful payment
- **FR-021**: System MUST update onboarding_submissions record with payment_completed_at timestamp and payment metadata
- **FR-022**: System MUST change submission status from 'submitted' to 'paid' upon payment completion
- **FR-023**: System MUST send admin notification email containing: submission ID, business name, customer email, package details, add-ons, total payment amount
- **FR-023a**: System MUST configure Stripe to automatically send invoices to customers via email after each successful payment
- **FR-024**: System MUST display clear error messages for payment failures without exposing sensitive details
- **FR-025**: System MUST implement Stripe webhook handler for payment confirmation events
- **FR-026**: System MUST use idempotency keys to prevent duplicate payment processing
- **FR-027**: System MUST validate Step 14 is accessible only if user has completed Step 13 and form is submitted
- **FR-028**: System MUST allow navigation back to Step 13 from Step 14 to modify selections
- **FR-029**: System MUST prevent re-submission of form data when returning from Step 14 to Step 13

#### Data & Schema

- **FR-030**: System MUST add 'additionalLanguages' field to onboarding form schema (Step 13)
- **FR-031**: System MUST add payment-related fields to onboarding_submissions table: stripe_payment_id, stripe_customer_id, stripe_subscription_id
- **FR-031a**: System MUST allow same email to have multiple onboarding_submissions with different business names (one subscription per business, multiple businesses per user allowed)
- **FR-032**: System MUST add discount_code and discount_amount fields to track applied discounts
- **FR-033**: System MUST update current_step check constraint to allow values 1-14
- **FR-034**: System MUST store payment metadata in JSONB format for flexibility
- **FR-035**: System MUST create Step 13 and Step 14 validation schemas using Zod

#### Internationalization

- **FR-036**: System MUST provide translations for Step 13 UI in both English and Italian
- **FR-037**: System MUST provide translations for Step 14 UI in both English and Italian
- **FR-038**: System MUST display language names in the user's selected locale (e.g., "French" in English, "Francese" in Italian)
- **FR-039**: System MUST display all pricing in EUR currency format (€75,00 for IT locale, €75.00 for EN locale)
- **FR-039a**: System MUST display all prices as VAT-inclusive with no separate tax line items in checkout or invoices

#### Security & Compliance

- **FR-040**: System MUST NEVER store credit card numbers or CVV codes in database
- **FR-041**: System MUST use HTTPS for all payment-related pages and API calls
- **FR-042**: System MUST implement CSRF protection on payment submission endpoints
- **FR-043**: System MUST validate webhook signatures from Stripe to prevent spoofing
- **FR-044**: System MUST log all payment events to onboarding_analytics table for audit trail
- **FR-045**: System MUST handle PCI DSS compliance through Stripe's hosted payment forms
- **FR-046**: System MUST rate-limit payment submission attempts to prevent abuse (max 5 attempts per hour per session)

#### Admin Notifications

- **FR-047**: System MUST send email notification to admin email address configured in environment variables
- **FR-048**: Admin notification email MUST include: submission timestamp, customer name, customer email, business name, selected package, language add-ons, total amount paid, Stripe payment ID
- **FR-049**: System MUST retry admin notification email up to 3 times if initial send fails
- **FR-050**: System MUST log failed notification attempts to analytics table

#### Documentation

- **FR-051**: System MUST provide Stripe configuration documentation covering: API key setup, webhook endpoint configuration, product/price setup, coupon creation, test mode vs production mode
- **FR-052**: Documentation MUST include step-by-step instructions for creating Stripe products for base package and language add-ons

### Key Entities

- **AdditionalLanguage**: Represents a language add-on selection
  - languageCode: ISO 639-1 code (e.g., 'fr', 'de', 'es')
  - languageName: Display name in English (e.g., 'French', 'German')
  - languageNameLocalized: Display name in Italian (e.g., 'Francese', 'Tedesco')
  - price: Fixed at 75 EUR
  - included: Boolean indicating if language is part of base package (English, Italian)

- **EuropeanLanguages**: Static list of European languages with >1 million speakers available for selection
  - Excludes English ('en') and Italian ('it') as they are base package languages
  - Includes 27 languages: Albanian, Bosnian, Bulgarian, Catalan, Croatian, Czech, Danish, Dutch, Finnish, French, German, Greek, Hungarian, Latvian, Lithuanian, Norwegian, Polish, Portuguese, Romanian, Serbian, Slovak, Slovenian, Spanish, Swedish, Turkish, Ukrainian
  - Each language includes: ISO 639-1 code, English name, Italian name, speaker count

- **PaymentDetails**: Payment information stored in onboarding_submissions
  - stripe_payment_id: Stripe PaymentIntent ID
  - stripe_customer_id: Stripe Customer ID
  - stripe_subscription_id: Stripe Subscription ID (if subscription created)
  - payment_amount: Total amount charged in cents (e.g., 7500 = €75.00)
  - currency: Always 'EUR'
  - discount_code: Applied discount code (if any)
  - discount_amount: Discount amount in cents
  - payment_method: Payment method type (card, sepa_debit, etc.)
  - payment_status: 'succeeded', 'pending', 'failed'

- **CheckoutSession**: Ephemeral Stripe Checkout Session for Step 14
  - session_id: Stripe Checkout Session ID
  - line_items: Array of items being purchased (base package + language add-ons)
  - success_url: Redirect URL after successful payment
  - cancel_url: Redirect URL if user cancels
  - mode: 'subscription' or 'payment' depending on business model

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can select language add-ons on Step 13 and see real-time price updates in under 200ms
- **SC-002**: Form submission from Step 13 completes successfully in under 2 seconds for 95% of users
- **SC-003**: Stripe checkout page (Step 14) loads with accurate pricing in under 1.5 seconds
- **SC-004**: Payment processing completes within 5 seconds for 95% of transactions (excluding bank 3D Secure time)
- **SC-005**: Successful payment redirects to thank-you page within 2 seconds of Stripe confirmation
- **SC-006**: Admin notification email is sent within 30 seconds of successful payment for 99% of transactions
- **SC-007**: Zero credit card data is stored in WhiteBoar database (verified through database schema audit)
- **SC-008**: All Stripe webhook signatures are validated with zero bypass exceptions (verified through code review)
- **SC-009**: Users can successfully navigate back from Step 14 to Step 13 and modify selections in 100% of test cases
- **SC-010**: Discount codes are validated and applied correctly with accurate price recalculation in 100% of test cases
- **SC-011**: E2E tests cover complete flow from Step 1 through successful payment and thank-you page in under 60 seconds (excluding manual payment delays)
- **SC-012**: Database schema migration adds new payment fields without downtime or data loss
- **SC-013**: Stripe configuration documentation enables a developer to set up test environment in under 30 minutes
- **SC-014**: System handles payment failures gracefully with user-friendly error messages in 100% of error scenarios
- **SC-015**: Language selections persist across page refreshes and browser restarts when using session URL

---

## Implementation Notes

### European Languages List

The following European languages with more than 1 million speakers should be available as add-ons (excluding English and Italian which are included in base package):

**Western Europe**: Dutch (24M), French (80M), German (95M), Portuguese (10M), Spanish (47M)
**Northern Europe**: Danish (6M), Finnish (5.5M), Norwegian (5.5M), Swedish (13M)
**Eastern Europe**: Bulgarian (8M), Czech (13M), Hungarian (13M), Polish (40M), Romanian (24M), Slovak (5.4M), Ukrainian (33M)
**Southern Europe**: Albanian (6M), Bosnian (2.5M), Croatian (5.6M), Greek (13M), Serbian (9M), Slovenian (2.5M), Turkish (88M)
**Regional**: Catalan (9M), Latvian (1.75M), Lithuanian (3.2M)

Total: 27 additional languages available as add-ons

### Stripe Integration Approach

**Recommended**: Use Stripe Checkout (hosted payment page) for fastest implementation
- Stripe handles PCI compliance, 3D Secure, payment methods
- Minimal frontend code required
- Strong fraud protection built-in

**Alternative**: Use Stripe Payment Element (embedded in Step 14)
- More control over UI/UX
- Requires more frontend integration code
- Still PCI compliant via Stripe Elements

### Database Migration Requirements

New fields for `onboarding_submissions`:
```sql
ALTER TABLE onboarding_submissions ADD COLUMN stripe_payment_id TEXT;
ALTER TABLE onboarding_submissions ADD COLUMN stripe_customer_id TEXT;
ALTER TABLE onboarding_submissions ADD COLUMN stripe_subscription_id TEXT;
ALTER TABLE onboarding_submissions ADD COLUMN payment_amount INTEGER; -- in cents
ALTER TABLE onboarding_submissions ADD COLUMN currency TEXT DEFAULT 'EUR';
ALTER TABLE onboarding_submissions ADD COLUMN discount_code TEXT;
ALTER TABLE onboarding_submissions ADD COLUMN discount_amount INTEGER; -- in cents
ALTER TABLE onboarding_submissions ADD COLUMN payment_metadata JSONB;
```

Update constraint on `onboarding_sessions`:
```sql
ALTER TABLE onboarding_sessions DROP CONSTRAINT IF EXISTS onboarding_sessions_current_step_check;
ALTER TABLE onboarding_sessions ADD CONSTRAINT onboarding_sessions_current_step_check
  CHECK (current_step >= 1 AND current_step <= 14);
```

### Pricing Structure

**Base Package**: Recurring yearly subscription with monthly payment
- Billing: Annual commitment (12 months) billed monthly at €35/month (VAT-inclusive)
- Implementation: Stripe Subscription Schedule with `iterations: 12`
- Total annual commitment: €420/year
- Includes: English + Italian languages
- Other features:
  * Branding
  * One-page custom design
  * 5 business-day delivery
  * Copy in EN+IT
  * Search Engine Optimization
  * Mobile friendly
  * 1 revision
  * Managed hosting (10k visits)
- After 12 months: Converts to regular monthly subscription (cancellable anytime)

**Language Add-on**: €75.00 per language (one-time setup fee)
- Billing: One-time charge added to first payment (VAT-inclusive)
- Not recurring - paid once when language is added
- Multiple languages can be selected, each adds €75 to the checkout total

**Tax Handling**: All prices are VAT-inclusive
- No separate tax line item displayed in checkout
- Stripe Tax is NOT enabled
- VAT is already included in the €35/month and €75/language prices

**Invoicing**: Stripe automatic invoice generation enabled
- Stripe automatically emails invoices to customers after each successful payment
- Invoices include subscription charges and one-time language setup fees
- Customer receives invoice at their business email address (from Step 3)

### Open Questions Requiring Clarification

1. ~~**Subscription vs One-time Payment**~~: **RESOLVED** - Recurring yearly subscription with monthly payment for base package
2. ~~**Language Add-on Billing**~~: **RESOLVED** - €75/language is a one-time setup fee
3. ~~**Base Package Price**~~: **RESOLVED** - €35/month (€420/year annual commitment)
4. ~~**Tax Handling**~~: **RESOLVED** - All prices are VAT-inclusive, no Stripe Tax, no separate tax line items
5. ~~**Multiple Subscriptions**~~: **RESOLVED** - Users can have multiple active subscriptions for different businesses
6. ~~**Invoice Generation**~~: **RESOLVED** - Stripe automatically generates and sends invoices via email after each payment
7. **Admin Email Configuration**: Should admin notification email(s) be configured via environment variable or database setting?
8. **Trial Period**: Should there be a trial period before the first payment is collected?
9. **Payment Failure Retry**: Should system automatically retry failed payments, or require manual user retry?
10. **Currency**: Is EUR the only supported currency, or should multi-currency be supported?

### Validation Schema Additions

Step 13 Schema:
```typescript
export const step13Schema = z.object({
  additionalLanguages: z.array(z.string())
    .default([])
    .refine(
      (langs) => !langs.includes('en') && !langs.includes('it'),
      'English and Italian are included in base package'
    )
})
```

Step 14 Schema:
```typescript
export const step14Schema = z.object({
  discountCode: z.string().optional(),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'You must accept the terms and conditions to proceed'
  }),
  stripePaymentIntentId: z.string().optional() // Populated after payment
})
```

### File Changes Required

**New Files**:
- `src/components/onboarding/steps/Step13AddOns.tsx`
- `src/components/onboarding/steps/Step14Checkout.tsx`
- `src/app/api/stripe/create-checkout-session/route.ts`
- `src/app/api/stripe/webhook/route.ts`
- `src/lib/stripe.ts` (Stripe client initialization)
- `src/data/european-languages.ts` (static language list)
- `docs/STRIPE_CONFIGURATION.md`
- `supabase/migrations/[timestamp]_add_payment_fields.sql`

**Modified Files**:
- `src/components/onboarding/steps/index.tsx` (add Step 13 & 14)
- `src/schemas/onboarding.ts` (add step13Schema, step14Schema)
- `src/app/[locale]/onboarding/step/[stepNumber]/page.tsx` (update step validation logic)
- `src/lib/step-navigation.ts` (update to include steps 13-14)
- `src/types/onboarding.ts` (add payment-related types)
- `src/services/onboarding-client.ts` (handle submission at step 13 instead of 12)
- `messages/en.json` (add translations for steps 13-14)
- `messages/it.json` (add translations for steps 13-14)
- `package.json` (add @stripe/stripe-js, stripe dependencies)
- `.env.local.example` (add Stripe keys)

### Environment Variables Required

```bash
# Stripe API Keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Product/Price IDs
STRIPE_BASE_PACKAGE_PRICE_ID=price_...
STRIPE_LANGUAGE_ADDON_PRICE_ID=price_...

# Admin Notifications
ADMIN_NOTIFICATION_EMAIL=admin@whiteboar.com
```

### Testing Requirements

**Unit Tests**:
- Language selection component (checkboxes, price calculation)
- Discount code validation
- Payment form validation
- Stripe webhook signature verification
- Database migration rollback

**Integration Tests**:
- Complete Step 13 with various language selections
- Submit form data from Step 13
- Load Step 14 with accurate pricing
- Navigate back to Step 13 from Step 14
- Apply discount codes
- Process test payment via Stripe test mode

**E2E Tests** (Playwright):
- Complete onboarding flow from Step 1 to payment success
- Test payment failure and retry
- Test discount code application
- Test navigation back from checkout
- Test session persistence after browser restart
- Test webhook delivery and database updates

**Accessibility Tests**:
- Keyboard navigation for language selection checkboxes
- Screen reader announcements for price updates
- Focus management in Stripe payment form
- Error message announcements

### Performance Targets

- Step 13 interactive in < 300ms
- Language selection price update in < 200ms
- Form submission from Step 13 in < 2s
- Stripe Checkout Session creation in < 1.5s
- Payment processing completion in < 5s (excluding 3DS)
- Webhook processing in < 500ms
- Admin email delivery in < 30s

---

## Next Steps

1. **Clarify open questions** listed above with stakeholder
2. **Set up Stripe account** in test mode
3. **Create Stripe products** for base package and language add-ons
4. **Design Step 13 UI mockup** for language selection
5. **Design Step 14 UI mockup** for checkout flow
6. **Begin implementation** once all clarifications received

---

*This specification is ready for the /plan phase.*
