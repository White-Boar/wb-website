# API Contract: Create Checkout Session

**Endpoint**: `POST /api/stripe/create-checkout-session`
**Feature**: 001-two-new-steps
**Purpose**: Create Stripe Subscription with invoice items for language add-ons

## Request

### Headers

```
Content-Type: application/json
Cookie: session_id=<onboarding_session_id>
```

### Body

```typescript
{
  submission_id: string;          // UUID of onboarding_submissions record
  additionalLanguages: string[];   // Array of language codes (e.g., ['fr', 'de'])
  discountCode?: string;          // Optional Stripe coupon code
  successUrl: string;             // Redirect URL after successful payment
  cancelUrl: string;              // Redirect URL if user cancels
}
```

### Example

```json
{
  "submission_id": "550e8400-e29b-41d4-a716-446655440000",
  "additionalLanguages": ["fr", "de", "es"],
  "discountCode": "LAUNCH2025",
  "successUrl": "https://whiteboar.com/en/onboarding/thank-you",
  "cancelUrl": "https://whiteboar.com/en/onboarding/step/14"
}
```

## Response

### Success (200 OK)

```typescript
{
  success: true;
  data: {
    clientSecret: string;            // Stripe client secret for Stripe Elements
    subscriptionId: string;          // Stripe subscription ID
    subscriptionScheduleId: string;  // Stripe subscription schedule ID (12-month commitment)
    customerId: string;              // Stripe customer ID
    totalAmount: number;             // Total amount in cents (after discount)
    currency: string;                // Always 'EUR'
    lineItems: Array<{
      description: string;
      quantity: number;
      unitAmount: number;        // in cents
      totalAmount: number;       // in cents
      recurring: boolean;
    }>;
    discountApplied?: {
      code: string;
      amount: number;            // Discount amount in cents
    };
  }
}
```

### Example Success Response

```json
{
  "success": true,
  "data": {
    "clientSecret": "pi_3abc123_secret_xyz",
    "subscriptionId": "sub_1abc123",
    "subscriptionScheduleId": "sub_sched_xyz456",
    "customerId": "cus_xyz789",
    "totalAmount": 18500,
    "currency": "EUR",
    "lineItems": [
      {
        "description": "WhiteBoar Base Package (€35/month)",
        "quantity": 1,
        "unitAmount": 3500,
        "totalAmount": 3500,
        "recurring": true
      },
      {
        "description": "French Language Add-on",
        "quantity": 1,
        "unitAmount": 7500,
        "totalAmount": 7500,
        "recurring": false
      },
      {
        "description": "German Language Add-on",
        "quantity": 1,
        "unitAmount": 7500,
        "totalAmount": 7500,
        "recurring": false
      },
      {
        "description": "Spanish Language Add-on",
        "quantity": 1,
        "unitAmount": 7500,
        "totalAmount": 7500,
        "recurring": false
      }
    ],
    "discountApplied": {
      "code": "LAUNCH2025",
      "amount": 2600
    }
  }
}
```

### Error Responses

#### 400 Bad Request - Invalid submission ID

```json
{
  "success": false,
  "error": {
    "code": "INVALID_SUBMISSION_ID",
    "message": "Submission not found or not in 'submitted' status"
  }
}
```

#### 400 Bad Request - Invalid language code

```json
{
  "success": false,
  "error": {
    "code": "INVALID_LANGUAGE_CODE",
    "message": "Language code 'xx' is not valid. Must be one of: fr, de, es, ..."
  }
}
```

#### 400 Bad Request - Invalid discount code

```json
{
  "success": false,
  "error": {
    "code": "INVALID_DISCOUNT_CODE",
    "message": "Discount code 'INVALID' does not exist or has expired"
  }
}
```

#### 409 Conflict - Payment already completed

```json
{
  "success": false,
  "error": {
    "code": "PAYMENT_ALREADY_COMPLETED",
    "message": "This submission has already been paid"
  }
}
```

#### 429 Too Many Requests - Rate limit exceeded

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many payment attempts. Please try again in 1 hour."
  }
}
```

#### 500 Internal Server Error - Stripe API failure

```json
{
  "success": false,
  "error": {
    "code": "STRIPE_API_ERROR",
    "message": "Failed to create subscription. Please try again."
  }
}
```

## Implementation Logic

### 1. Validate Request

```typescript
// Verify submission_id exists and status is 'submitted'
const submission = await getSubmission(submission_id);
if (!submission || submission.status !== 'submitted') {
  return 400 INVALID_SUBMISSION_ID;
}

// Verify no existing payment
if (submission.stripe_subscription_id) {
  return 409 PAYMENT_ALREADY_COMPLETED;
}

// Validate language codes
const validLanguages = EUROPEAN_LANGUAGES.map(l => l.code);
const invalidLanguages = additionalLanguages.filter(code => !validLanguages.includes(code));
if (invalidLanguages.length > 0) {
  return 400 INVALID_LANGUAGE_CODE;
}

// Check rate limit (max 5 attempts per hour per session)
const recentAttempts = await getRateLimitAttempts(session_id, '1 hour');
if (recentAttempts >= 5) {
  return 429 RATE_LIMIT_EXCEEDED;
}
```

### 2. Create or Retrieve Stripe Customer

```typescript
const customerEmail = submission.form_data.step3.email;
const businessName = submission.form_data.step1.businessName;

// Check if customer already exists by email
let customer = await stripe.customers.list({ email: customerEmail, limit: 1 });

if (customer.data.length === 0) {
  // Create new customer
  customer = await stripe.customers.create({
    email: customerEmail,
    name: businessName,
    metadata: {
      submission_id: submission_id,
      onboarding_session_id: session_id
    }
  });
} else {
  customer = customer.data[0];
}
```

### 3. Create Subscription Schedule with Invoice Items

```typescript
// Create subscription schedule with 12-month commitment
const schedule = await stripe.subscriptionSchedules.create({
  customer: customer.id,
  start_date: 'now',
  end_behavior: 'release', // After 12 months, converts to regular monthly subscription
  phases: [{
    items: [{
      price: process.env.STRIPE_BASE_PACKAGE_PRICE_ID, // €35/month recurring
    }],
    iterations: 12, // Exactly 12 monthly payments (annual commitment)
    // Apply discount at phase level if provided
    ...(discountCode && { coupon: discountCode })
  }],
  metadata: {
    submission_id: submission_id,
    session_id: session_id,
    commitment_months: '12'
  }
});

// Get the subscription created by the schedule
const subscription = await stripe.subscriptions.retrieve(schedule.subscription as string, {
  expand: ['latest_invoice.payment_intent']
});

// Add language add-ons as one-time invoice items to the first invoice
if (additionalLanguages.length > 0) {
  for (const code of additionalLanguages) {
    const language = EUROPEAN_LANGUAGES.find(l => l.code === code);
    await stripe.invoiceItems.create({
      customer: customer.id,
      invoice: subscription.latest_invoice.id,
      amount: 7500, // €75.00 in cents
      currency: 'eur',
      description: `${language.nameEn} Language Add-on`,
      metadata: { language_code: code, one_time: 'true' }
    });
  }
}

// Validate discount code if provided
if (discountCode) {
  const coupon = await stripe.coupons.retrieve(discountCode);
  if (!coupon || !coupon.valid) {
    // Cancel the schedule and throw error
    await stripe.subscriptionSchedules.cancel(schedule.id);
    return 400 INVALID_DISCOUNT_CODE;
  }
}
```

### 4. Return Client Secret

```typescript
const invoice = subscription.latest_invoice;
const paymentIntent = invoice.payment_intent;

return {
  success: true,
  data: {
    clientSecret: paymentIntent.client_secret,
    subscriptionId: subscription.id,
    subscriptionScheduleId: schedule.id,
    customerId: customer.id,
    totalAmount: invoice.amount_due,
    currency: 'EUR',
    lineItems: buildLineItems(subscription, additionalLanguages),
    discountApplied: discountCode ? calculateDiscount(invoice) : undefined
  }
};
```

## Rate Limiting

- **Max attempts**: 5 per hour per session_id
- **Tracking**: Store attempt timestamps in `onboarding_analytics` table
- **Reset**: Automatically after 1 hour
- **Bypass**: Admin can reset rate limit via dashboard (future feature)

## Security

- ✅ Validate CSRF token
- ✅ Verify session_id matches authenticated user
- ✅ Never expose Stripe secret key in response
- ✅ Sanitize error messages (no internal details)
- ✅ Log all payment attempts to `onboarding_analytics`
- ✅ Use HTTPS only
- ✅ Validate webhook signatures (handled in separate endpoint)

## Testing

### Unit Tests

```typescript
describe('POST /api/stripe/create-checkout-session', () => {
  it('should create subscription schedule with base package only', async () => {
    const response = await createCheckoutSession({
      submission_id: 'test-id',
      additionalLanguages: [],
      successUrl: 'http://localhost:3783/thank-you',
      cancelUrl: 'http://localhost:3783/step/14'
    });

    expect(response.success).toBe(true);
    expect(response.data.subscriptionScheduleId).toBeDefined();
    expect(response.data.lineItems).toHaveLength(1);
    expect(response.data.totalAmount).toBe(3500); // €35
  });

  it('should add language add-ons to invoice', async () => {
    const response = await createCheckoutSession({
      submission_id: 'test-id',
      additionalLanguages: ['fr', 'de'],
      successUrl: 'http://localhost:3783/thank-you',
      cancelUrl: 'http://localhost:3783/step/14'
    });

    expect(response.data.lineItems).toHaveLength(3); // base + 2 languages
    expect(response.data.totalAmount).toBe(18500); // €35 + €150
  });

  it('should apply discount code', async () => {
    const response = await createCheckoutSession({
      submission_id: 'test-id',
      additionalLanguages: ['fr'],
      discountCode: 'TEST10', // 10% off
      successUrl: 'http://localhost:3783/thank-you',
      cancelUrl: 'http://localhost:3783/step/14'
    });

    expect(response.data.discountApplied).toBeDefined();
    expect(response.data.totalAmount).toBeLessThan(11000); // €110 - 10%
  });

  it('should reject invalid language code', async () => {
    const response = await createCheckoutSession({
      submission_id: 'test-id',
      additionalLanguages: ['invalid'],
      successUrl: 'http://localhost:3783/thank-you',
      cancelUrl: 'http://localhost:3783/step/14'
    });

    expect(response.success).toBe(false);
    expect(response.error.code).toBe('INVALID_LANGUAGE_CODE');
  });

  it('should enforce rate limit', async () => {
    // Make 5 requests
    for (let i = 0; i < 5; i++) {
      await createCheckoutSession({ ... });
    }

    // 6th request should fail
    const response = await createCheckoutSession({ ... });
    expect(response.success).toBe(false);
    expect(response.error.code).toBe('RATE_LIMIT_EXCEEDED');
  });
});
```

### Integration Tests

```typescript
describe('Stripe Integration', () => {
  it('should create real Stripe subscription schedule with 12-month commitment', async () => {
    const response = await createCheckoutSession({
      submission_id: 'integration-test-id',
      additionalLanguages: ['fr'],
      successUrl: 'http://localhost:3783/thank-you',
      cancelUrl: 'http://localhost:3783/step/14'
    });

    expect(response.success).toBe(true);

    // Verify subscription schedule exists in Stripe
    const schedule = await stripe.subscriptionSchedules.retrieve(
      response.data.subscriptionScheduleId
    );
    expect(schedule.phases[0].iterations).toBe(12);
    expect(schedule.end_behavior).toBe('release');

    // Verify subscription exists and is linked to schedule
    const subscription = await stripe.subscriptions.retrieve(
      response.data.subscriptionId
    );
    expect(subscription.status).toBe('incomplete');
    expect(subscription.schedule).toBe(schedule.id);
  });
});
```

---

**Document Version**: 1.0
**Last Updated**: 2025-10-20
**Status**: Ready for implementation
