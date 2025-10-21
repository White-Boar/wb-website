# Data Model: Add-ons Selection & Stripe Checkout

**Feature**: 001-two-new-steps | **Phase**: 1 | **Date**: 2025-10-20

## Database Schema Changes

### 1. Update `onboarding_sessions` Table

**Migration**: Update current_step constraint to allow values 1-14

```sql
-- Migration: Update step constraint
ALTER TABLE onboarding_sessions
DROP CONSTRAINT IF EXISTS onboarding_sessions_current_step_check;

ALTER TABLE onboarding_sessions
ADD CONSTRAINT onboarding_sessions_current_step_check
CHECK (current_step >= 1 AND current_step <= 14);
```

**Rollback**:
```sql
ALTER TABLE onboarding_sessions
DROP CONSTRAINT IF EXISTS onboarding_sessions_current_step_check;

ALTER TABLE onboarding_sessions
ADD CONSTRAINT onboarding_sessions_current_step_check
CHECK (current_step >= 1 AND current_step <= 12);
```

### 2. Add Payment Fields to `onboarding_submissions` Table

**Migration**: Add Stripe payment tracking fields

```sql
-- Migration: Add payment fields
ALTER TABLE onboarding_submissions
ADD COLUMN stripe_payment_id TEXT,
ADD COLUMN stripe_customer_id TEXT,
ADD COLUMN stripe_subscription_id TEXT,
ADD COLUMN stripe_subscription_schedule_id TEXT,
ADD COLUMN payment_amount INTEGER, -- in cents (e.g., 3500 = €35.00)
ADD COLUMN currency TEXT DEFAULT 'EUR',
ADD COLUMN discount_code TEXT,
ADD COLUMN discount_amount INTEGER, -- in cents
ADD COLUMN payment_metadata JSONB DEFAULT '{}'::jsonb,
ADD COLUMN payment_completed_at TIMESTAMPTZ,
ADD COLUMN refunded_at TIMESTAMPTZ;

-- Add index for Stripe payment ID lookups
CREATE INDEX idx_onboarding_submissions_stripe_payment_id
ON onboarding_submissions(stripe_payment_id);

-- Add index for Stripe customer ID lookups
CREATE INDEX idx_onboarding_submissions_stripe_customer_id
ON onboarding_submissions(stripe_customer_id);

-- Add index for Stripe subscription ID lookups
CREATE INDEX idx_onboarding_submissions_stripe_subscription_id
ON onboarding_submissions(stripe_subscription_id);

-- Add index for Stripe subscription schedule ID lookups
CREATE INDEX idx_onboarding_submissions_stripe_subscription_schedule_id
ON onboarding_submissions(stripe_subscription_schedule_id);

-- Add comment
COMMENT ON COLUMN onboarding_submissions.payment_amount IS 'Total amount charged in cents (base subscription + add-ons)';
COMMENT ON COLUMN onboarding_submissions.stripe_subscription_schedule_id IS 'Stripe subscription schedule ID for 12-month annual commitment';
COMMENT ON COLUMN onboarding_submissions.payment_metadata IS 'Additional payment details from Stripe (payment method, invoice ID, etc.)';
```

**Rollback**:
```sql
DROP INDEX IF EXISTS idx_onboarding_submissions_stripe_subscription_schedule_id;
DROP INDEX IF EXISTS idx_onboarding_submissions_stripe_subscription_id;
DROP INDEX IF EXISTS idx_onboarding_submissions_stripe_customer_id;
DROP INDEX IF EXISTS idx_onboarding_submissions_stripe_payment_id;

ALTER TABLE onboarding_submissions
DROP COLUMN IF EXISTS refunded_at,
DROP COLUMN IF EXISTS payment_completed_at,
DROP COLUMN IF EXISTS payment_metadata,
DROP COLUMN IF EXISTS discount_amount,
DROP COLUMN IF EXISTS discount_code,
DROP COLUMN IF EXISTS currency,
DROP COLUMN IF EXISTS payment_amount,
DROP COLUMN IF EXISTS stripe_subscription_schedule_id,
DROP COLUMN IF EXISTS stripe_subscription_id,
DROP COLUMN IF EXISTS stripe_customer_id,
DROP COLUMN IF EXISTS stripe_payment_id;
```

### 3. Update Status Values

**Current status values**: `'draft'`, `'submitted'`
**New status values**: `'draft'`, `'submitted'`, `'paid'`, `'refunded'`

No schema change needed - status column is TEXT without enum constraint.

---

## TypeScript Types

### 1. European Language Type

**File**: `src/data/european-languages.ts`

```typescript
export interface EuropeanLanguage {
  code: string; // ISO 639-1 code (e.g., 'fr', 'de')
  nameEn: string; // English name (e.g., 'French')
  nameIt: string; // Italian name (e.g., 'Francese')
  speakers: number; // Number of speakers in millions
  price: number; // Price in euros (always 75)
}

export const EUROPEAN_LANGUAGES: EuropeanLanguage[] = [
  // Western Europe
  { code: 'nl', nameEn: 'Dutch', nameIt: 'Olandese', speakers: 24, price: 75 },
  { code: 'fr', nameEn: 'French', nameIt: 'Francese', speakers: 80, price: 75 },
  { code: 'de', nameEn: 'German', nameIt: 'Tedesco', speakers: 95, price: 75 },
  { code: 'pt', nameEn: 'Portuguese', nameIt: 'Portoghese', speakers: 10, price: 75 },
  { code: 'es', nameEn: 'Spanish', nameIt: 'Spagnolo', speakers: 47, price: 75 },

  // Northern Europe
  { code: 'da', nameEn: 'Danish', nameIt: 'Danese', speakers: 6, price: 75 },
  { code: 'fi', nameEn: 'Finnish', nameIt: 'Finlandese', speakers: 5.5, price: 75 },
  { code: 'no', nameEn: 'Norwegian', nameIt: 'Norvegese', speakers: 5.5, price: 75 },
  { code: 'sv', nameEn: 'Swedish', nameIt: 'Svedese', speakers: 13, price: 75 },

  // Eastern Europe
  { code: 'bg', nameEn: 'Bulgarian', nameIt: 'Bulgaro', speakers: 8, price: 75 },
  { code: 'cs', nameEn: 'Czech', nameIt: 'Ceco', speakers: 13, price: 75 },
  { code: 'hu', nameEn: 'Hungarian', nameIt: 'Ungherese', speakers: 13, price: 75 },
  { code: 'pl', nameEn: 'Polish', nameIt: 'Polacco', speakers: 40, price: 75 },
  { code: 'ro', nameEn: 'Romanian', nameIt: 'Rumeno', speakers: 24, price: 75 },
  { code: 'sk', nameEn: 'Slovak', nameIt: 'Slovacco', speakers: 5.4, price: 75 },
  { code: 'uk', nameEn: 'Ukrainian', nameIt: 'Ucraino', speakers: 33, price: 75 },

  // Southern Europe
  { code: 'sq', nameEn: 'Albanian', nameIt: 'Albanese', speakers: 6, price: 75 },
  { code: 'bs', nameEn: 'Bosnian', nameIt: 'Bosniaco', speakers: 2.5, price: 75 },
  { code: 'hr', nameEn: 'Croatian', nameIt: 'Croato', speakers: 5.6, price: 75 },
  { code: 'el', nameEn: 'Greek', nameIt: 'Greco', speakers: 13, price: 75 },
  { code: 'sr', nameEn: 'Serbian', nameIt: 'Serbo', speakers: 9, price: 75 },
  { code: 'sl', nameEn: 'Slovenian', nameIt: 'Sloveno', speakers: 2.5, price: 75 },
  { code: 'tr', nameEn: 'Turkish', nameIt: 'Turco', speakers: 88, price: 75 },

  // Regional
  { code: 'ca', nameEn: 'Catalan', nameIt: 'Catalano', speakers: 9, price: 75 },
  { code: 'lv', nameEn: 'Latvian', nameIt: 'Lettone', speakers: 1.75, price: 75 },
  { code: 'lt', nameEn: 'Lithuanian', nameIt: 'Lituano', speakers: 3.2, price: 75 },
];

// Helper function to get language name by locale
export function getLanguageName(code: string, locale: 'en' | 'it'): string {
  const language = EUROPEAN_LANGUAGES.find(lang => lang.code === code);
  if (!language) return code;
  return locale === 'it' ? language.nameIt : language.nameEn;
}

// Calculate total price for selected languages
export function calculateAddOnsTotal(selectedLanguages: string[]): number {
  return selectedLanguages.length * 75;
}
```

### 2. Step 13 Schema (Zod)

**File**: `src/schemas/onboarding.ts` (add to existing file)

```typescript
import { z } from 'zod';

export const step13Schema = z.object({
  additionalLanguages: z.array(z.string())
    .default([])
    .refine(
      (langs) => !langs.includes('en') && !langs.includes('it'),
      'English and Italian are included in base package and cannot be selected as add-ons'
    )
    .refine(
      (langs) => {
        const validCodes = EUROPEAN_LANGUAGES.map(l => l.code);
        return langs.every(code => validCodes.includes(code));
      },
      'Invalid language code selected'
    )
});

export type Step13FormData = z.infer<typeof step13Schema>;
```

### 3. Step 14 Schema (Zod)

**File**: `src/schemas/onboarding.ts` (add to existing file)

```typescript
export const step14Schema = z.object({
  discountCode: z.string().optional(),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'You must accept the terms and conditions to proceed'
  }),
  stripePaymentIntentId: z.string().optional(), // Populated after payment
  stripeCustomerId: z.string().optional(), // Populated after payment
  stripeSubscriptionId: z.string().optional() // Populated after payment
});

export type Step14FormData = z.infer<typeof step14Schema>;
```

### 4. Payment Types

**File**: `src/types/onboarding.ts` (add to existing file)

```typescript
export interface PaymentDetails {
  stripe_payment_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  stripe_subscription_schedule_id: string; // Schedule enforcing 12-month commitment
  payment_amount: number; // in cents
  currency: string; // always 'EUR'
  discount_code?: string;
  discount_amount?: number; // in cents
  payment_method: string; // 'card', 'sepa_debit', etc.
  payment_status: 'succeeded' | 'pending' | 'failed';
  payment_completed_at?: string; // ISO timestamp
  refunded_at?: string; // ISO timestamp
  payment_metadata?: Record<string, any>; // Additional Stripe metadata
}

export interface CheckoutSession {
  session_id: string;
  line_items: LineItem[];
  total_amount: number; // in cents
  currency: string;
  discount_applied?: {
    code: string;
    amount: number; // in cents
  };
}

export interface LineItem {
  description: string;
  quantity: number;
  unit_amount: number; // in cents
  total_amount: number; // in cents
  recurring: boolean;
}

// Update OnboardingSubmission type to include payment fields
export interface OnboardingSubmission {
  submission_id: string;
  session_id: string;
  form_data: Record<string, any>;
  status: 'draft' | 'submitted' | 'paid' | 'refunded';
  submitted_at?: string;
  // Payment fields
  stripe_payment_id?: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  stripe_subscription_schedule_id?: string; // Schedule enforcing 12-month commitment
  payment_amount?: number;
  currency?: string;
  discount_code?: string;
  discount_amount?: number;
  payment_metadata?: Record<string, any>;
  payment_completed_at?: string;
  refunded_at?: string;
  created_at: string;
  updated_at: string;
}
```

### 5. Stripe Webhook Event Types

**File**: `src/types/stripe.ts` (new file)

```typescript
import Stripe from 'stripe';

export type StripeWebhookEvent =
  | 'invoice.paid'
  | 'customer.subscription.created'
  | 'customer.subscription.updated'
  | 'customer.subscription.deleted'
  | 'charge.refunded'
  | 'payment_intent.succeeded'
  | 'payment_intent.payment_failed';

export interface WebhookPayload {
  event: Stripe.Event;
  type: StripeWebhookEvent;
  data: Stripe.Event.Data;
}

export interface ProcessedWebhook {
  submission_id: string;
  event_type: StripeWebhookEvent;
  stripe_payment_id: string;
  stripe_customer_id: string;
  stripe_subscription_id?: string;
  processed_at: string;
  success: boolean;
  error_message?: string;
}
```

---

## Form Data Structure

### Step 13 Form Data (stored in `onboarding_sessions.form_data`)

```json
{
  "step13": {
    "additionalLanguages": ["fr", "de", "es"]
  }
}
```

### Step 14 Form Data (stored in `onboarding_submissions` after payment)

```json
{
  "step14": {
    "discountCode": "LAUNCH2025",
    "acceptTerms": true,
    "stripePaymentIntentId": "pi_xxx",
    "stripeCustomerId": "cus_xxx",
    "stripeSubscriptionId": "sub_xxx"
  }
}
```

### Complete Submission Example

```typescript
{
  submission_id: "550e8400-e29b-41d4-a716-446655440000",
  session_id: "650e8400-e29b-41d4-a716-446655440001",
  form_data: {
    step1: { /* business info */ },
    step2: { /* contact info */ },
    step3: { email: "user@example.com", vatNumber: "IT12345678901" },
    // ... steps 4-12
    step13: {
      additionalLanguages: ["fr", "de"]
    },
    step14: {
      discountCode: "LAUNCH2025",
      acceptTerms: true
    }
  },
  status: "paid",
  submitted_at: "2025-10-20T14:30:00Z",

  // Payment fields
  stripe_payment_id: "pi_3abc123",
  stripe_customer_id: "cus_xyz789",
  stripe_subscription_id: "sub_def456",
  stripe_subscription_schedule_id: "sub_sched_xyz123", // Enforces 12-month commitment
  payment_amount: 18500, // €185.00 (€35 base + €150 for 2 languages)
  currency: "EUR",
  discount_code: "LAUNCH2025",
  discount_amount: 1850, // 10% discount = €18.50
  payment_metadata: {
    invoice_id: "in_1abc123",
    payment_method: "card",
    card_brand: "visa",
    card_last4: "4242"
  },
  payment_completed_at: "2025-10-20T14:35:00Z",

  created_at: "2025-10-20T14:00:00Z",
  updated_at: "2025-10-20T14:35:00Z"
}
```

---

## Data Validation Rules

### Step 13 Validation

1. `additionalLanguages` must be an array of valid language codes
2. English (`en`) and Italian (`it`) cannot be included
3. Array can be empty (zero add-ons is valid)
4. Duplicate language codes should be prevented client-side
5. Language codes must exist in `EUROPEAN_LANGUAGES` list

### Step 14 Validation

1. `discountCode` is optional, validated against Stripe Coupons API
2. `acceptTerms` must be `true` before payment submission
3. Stripe IDs are populated after successful payment (not user input)

### Database Constraints

1. `payment_amount` and `discount_amount` must be >= 0
2. `currency` must be 'EUR'
3. `status` transitions: `draft` → `submitted` → `paid` or `refunded`
4. `stripe_payment_id` should be unique (prevent duplicate payments)
5. `payment_completed_at` must be set when `status` changes to 'paid'

---

## State Transitions

### Submission Status Flow

```
draft → submitted → paid → refunded
  ↑         ↓          ↓
  └─────────┴──────────┘ (can return to draft if payment fails)
```

**State Definitions**:
- `draft`: User is completing onboarding steps 1-12
- `submitted`: User clicked "Next" on Step 13, form data saved to DB
- `paid`: Payment successful, webhook received, subscription active
- `refunded`: Payment refunded via Stripe dashboard

**Transition Rules**:
- `draft` → `submitted`: When user completes Step 13
- `submitted` → `paid`: When Stripe webhook confirms payment
- `submitted` → `draft`: If payment fails and user returns to edit
- `paid` → `refunded`: When admin processes refund via Stripe

---

## Data Retention & Privacy

### PCI DSS Compliance

- **Never store**: Card numbers, CVV codes, expiration dates
- **Store**: Stripe payment IDs, customer IDs, subscription IDs (reference tokens)
- **Encrypted fields**: None required (Stripe handles sensitive data)

### GDPR Compliance

- User email from Step 3 is used to create Stripe Customer
- Payment metadata stored for audit trail (7 years retention)
- User can request deletion: Archive submission, cancel subscription in Stripe
- Stripe customer data retained per Stripe's data retention policy

### Data Access

- Admin dashboard: View submission ID, payment status, amount, Stripe links
- User: View payment confirmation on thank-you page
- Analytics: Log payment events (no card details)

---

**Document Version**: 1.0
**Last Updated**: 2025-10-20
**Status**: Ready for implementation
