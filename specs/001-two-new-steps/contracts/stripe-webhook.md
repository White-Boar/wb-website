# API Contract: Stripe Webhook Handler

**Endpoint**: `POST /api/stripe/webhook`
**Feature**: 001-two-new-steps
**Purpose**: Handle Stripe webhook events for payment confirmation and subscription updates

## Request

### Headers

```
Content-Type: application/json
Stripe-Signature: t=timestamp,v1=signature_hash
```

### Body

Raw Stripe webhook event payload (varies by event type).

### Common Event Types

1. `invoice.paid` - Payment successful, subscription active
2. `customer.subscription.created` - Subscription created
3. `customer.subscription.updated` - Subscription modified
4. `customer.subscription.deleted` - Subscription cancelled
5. `subscription_schedule.completed` - Schedule completed after 12 months (converts to regular subscription)
6. `subscription_schedule.canceled` - Schedule canceled before completion
7. `charge.refunded` - Payment refunded
8. `payment_intent.succeeded` - One-time payment succeeded
9. `payment_intent.payment_failed` - Payment failed

## Response

### Success (200 OK)

```json
{
  "received": true
}
```

### Error Responses

#### 400 Bad Request - Invalid signature

```json
{
  "error": "Invalid signature"
}
```

#### 404 Not Found - Submission not found

```json
{
  "error": "Submission not found for subscription ID"
}
```

#### 409 Conflict - Duplicate event (idempotency)

```json
{
  "error": "Event already processed",
  "event_id": "evt_abc123"
}
```

#### 500 Internal Server Error

```json
{
  "error": "Webhook processing failed"
}
```

## Implementation Logic

### 1. Verify Webhook Signature

```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return new Response(
      JSON.stringify({ error: 'Invalid signature' }),
      { status: 400 }
    );
  }

  // Process event...
}
```

### 2. Check Idempotency

```typescript
// Check if event already processed
const existingEvent = await checkEventProcessed(event.id);
if (existingEvent) {
  console.log(`Event ${event.id} already processed`);
  return new Response(
    JSON.stringify({ received: true, duplicate: true }),
    { status: 200 }
  );
}

// Mark event as processing (prevents duplicate handling)
await markEventProcessing(event.id);
```

### 3. Handle Event by Type

```typescript
switch (event.type) {
  case 'invoice.paid':
    await handleInvoicePaid(event);
    break;

  case 'customer.subscription.created':
    await handleSubscriptionCreated(event);
    break;

  case 'customer.subscription.deleted':
    await handleSubscriptionDeleted(event);
    break;

  case 'subscription_schedule.completed':
    await handleScheduleCompleted(event);
    break;

  case 'subscription_schedule.canceled':
    await handleScheduleCanceled(event);
    break;

  case 'charge.refunded':
    await handleChargeRefunded(event);
    break;

  case 'payment_intent.payment_failed':
    await handlePaymentFailed(event);
    break;

  default:
    console.log(`Unhandled event type: ${event.type}`);
}
```

### 4. Handle `invoice.paid` Event

This is the primary event for confirming successful payment.

```typescript
async function handleInvoicePaid(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice;
  const subscriptionId = invoice.subscription as string;
  const customerId = invoice.customer as string;
  const paymentIntentId = invoice.payment_intent as string;

  // Find submission by subscription ID (stored in metadata)
  const submission = await findSubmissionByStripeSubscriptionId(subscriptionId);

  if (!submission) {
    console.error(`Submission not found for subscription ${subscriptionId}`);
    return;
  }

  // Retrieve subscription to get schedule ID
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const scheduleId = subscription.schedule as string;

  // Update submission with payment details
  await updateSubmission(submission.submission_id, {
    status: 'paid',
    stripe_payment_id: paymentIntentId,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscriptionId,
    stripe_subscription_schedule_id: scheduleId,
    payment_amount: invoice.amount_paid, // in cents
    currency: invoice.currency.toUpperCase(),
    payment_completed_at: new Date(invoice.status_transitions.paid_at! * 1000),
    payment_metadata: {
      invoice_id: invoice.id,
      payment_method: invoice.default_payment_method,
      billing_reason: invoice.billing_reason,
      schedule_id: scheduleId
    }
  });

  // Log to analytics
  await logPaymentEvent({
    submission_id: submission.submission_id,
    event_type: 'payment_succeeded',
    stripe_payment_id: paymentIntentId,
    amount: invoice.amount_paid,
    currency: invoice.currency
  });

  // Send admin notification
  await sendAdminNotification({
    submission_id: submission.submission_id,
    business_name: submission.form_data.step1.businessName,
    customer_email: submission.form_data.step3.email,
    package_type: 'Base Package',
    add_ons: submission.form_data.step13?.additionalLanguages || [],
    total_amount: invoice.amount_paid / 100, // convert to euros
    stripe_payment_id: paymentIntentId
  });
}
```

### 5. Handle `charge.refunded` Event

```typescript
async function handleChargeRefunded(event: Stripe.Event) {
  const charge = event.data.object as Stripe.Charge;
  const paymentIntentId = charge.payment_intent as string;

  // Find submission by payment ID
  const submission = await findSubmissionByPaymentId(paymentIntentId);

  if (!submission) {
    console.error(`Submission not found for payment ${paymentIntentId}`);
    return;
  }

  // Update submission status
  await updateSubmission(submission.submission_id, {
    status: 'refunded',
    refunded_at: new Date(),
    payment_metadata: {
      ...submission.payment_metadata,
      refund_id: charge.refunds?.data[0]?.id,
      refund_reason: charge.refunds?.data[0]?.reason
    }
  });

  // Log to analytics
  await logPaymentEvent({
    submission_id: submission.submission_id,
    event_type: 'payment_refunded',
    stripe_payment_id: paymentIntentId,
    amount: charge.amount_refunded,
    currency: charge.currency
  });

  // Send admin notification
  await sendAdminNotification({
    type: 'refund',
    submission_id: submission.submission_id,
    business_name: submission.form_data.step1.businessName,
    amount: charge.amount_refunded / 100
  });
}
```

### 6. Handle `subscription_schedule.completed` Event

This event fires when the 12-month commitment completes and the subscription converts to regular monthly billing.

```typescript
async function handleScheduleCompleted(event: Stripe.Event) {
  const schedule = event.data.object as Stripe.SubscriptionSchedule;
  const subscriptionId = schedule.subscription as string;

  // Find submission by subscription ID
  const submission = await findSubmissionByStripeSubscriptionId(subscriptionId);

  if (!submission) {
    console.error(`Submission not found for subscription ${subscriptionId}`);
    return;
  }

  // Update payment metadata to reflect schedule completion
  await updateSubmission(submission.submission_id, {
    payment_metadata: {
      ...submission.payment_metadata,
      schedule_completed: true,
      schedule_completed_at: new Date().toISOString(),
      converted_to_monthly: true
    }
  });

  // Log event
  await logPaymentEvent({
    submission_id: submission.submission_id,
    event_type: 'schedule_completed',
    stripe_payment_id: submission.stripe_payment_id,
    metadata: { schedule_id: schedule.id }
  });

  // Optional: Send notification to customer about conversion to monthly billing
}
```

### 7. Handle `subscription_schedule.canceled` Event

This event fires if the schedule is canceled before completing 12 months.

```typescript
async function handleScheduleCanceled(event: Stripe.Event) {
  const schedule = event.data.object as Stripe.SubscriptionSchedule;
  const subscriptionId = schedule.subscription as string;

  // Find submission by subscription ID
  const submission = await findSubmissionByStripeSubscriptionId(subscriptionId);

  if (!submission) {
    console.error(`Submission not found for subscription ${subscriptionId}`);
    return;
  }

  // Update payment metadata
  await updateSubmission(submission.submission_id, {
    payment_metadata: {
      ...submission.payment_metadata,
      schedule_canceled: true,
      schedule_canceled_at: new Date().toISOString(),
      schedule_canceled_reason: schedule.canceled_at ? 'user_canceled' : 'system'
    }
  });

  // Log event
  await logPaymentEvent({
    submission_id: submission.submission_id,
    event_type: 'schedule_canceled',
    stripe_payment_id: submission.stripe_payment_id,
    metadata: { schedule_id: schedule.id }
  });
}
```

### 8. Handle `payment_intent.payment_failed` Event

```typescript
async function handlePaymentFailed(event: Stripe.Event) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  const customerId = paymentIntent.customer as string;

  // Find submission by customer ID
  const submission = await findSubmissionByCustomerId(customerId);

  if (!submission) {
    console.error(`Submission not found for customer ${customerId}`);
    return;
  }

  // Log failed payment attempt
  await logPaymentEvent({
    submission_id: submission.submission_id,
    event_type: 'payment_failed',
    stripe_payment_id: paymentIntent.id,
    error_code: paymentIntent.last_payment_error?.code,
    error_message: paymentIntent.last_payment_error?.message
  });

  // Optionally notify user via email (not admin)
  // User will see error in UI during payment flow
}
```

## Database Operations

### Update Submission

```typescript
async function updateSubmission(
  submissionId: string,
  updates: Partial<OnboardingSubmission>
) {
  const { data, error } = await supabase
    .from('onboarding_submissions')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('submission_id', submissionId);

  if (error) {
    console.error('Failed to update submission:', error);
    throw new Error('Database update failed');
  }

  return data;
}
```

### Log Payment Event

```typescript
async function logPaymentEvent(event: {
  submission_id: string;
  event_type: string;
  stripe_payment_id: string;
  amount?: number;
  currency?: string;
  error_code?: string;
  error_message?: string;
}) {
  await supabase.from('onboarding_analytics').insert({
    session_id: null, // Not needed for webhook events
    event_type: event.event_type,
    event_data: {
      submission_id: event.submission_id,
      stripe_payment_id: event.stripe_payment_id,
      amount: event.amount,
      currency: event.currency,
      error_code: event.error_code,
      error_message: event.error_message
    },
    created_at: new Date().toISOString()
  });
}
```

### Check Event Processed (Idempotency)

```typescript
async function checkEventProcessed(eventId: string): Promise<boolean> {
  const { data } = await supabase
    .from('stripe_webhook_events')
    .select('event_id')
    .eq('event_id', eventId)
    .single();

  return !!data;
}

async function markEventProcessing(eventId: string) {
  await supabase.from('stripe_webhook_events').insert({
    event_id: eventId,
    processed_at: new Date().toISOString(),
    status: 'processing'
  });
}

async function markEventProcessed(eventId: string, success: boolean) {
  await supabase
    .from('stripe_webhook_events')
    .update({
      status: success ? 'completed' : 'failed',
      completed_at: new Date().toISOString()
    })
    .eq('event_id', eventId);
}
```

## Admin Notification Email

```typescript
async function sendAdminNotification(data: {
  submission_id: string;
  business_name: string;
  customer_email: string;
  package_type: string;
  add_ons: string[];
  total_amount: number;
  stripe_payment_id: string;
}) {
  const adminEmail = process.env.NOTIFICATION_ADMIN_EMAIL;

  const emailBody = `
    New Onboarding Payment Received

    Submission ID: ${data.submission_id}
    Business Name: ${data.business_name}
    Customer Email: ${data.customer_email}

    Package: ${data.package_type}
    Language Add-ons: ${data.add_ons.length > 0 ? data.add_ons.join(', ') : 'None'}

    Total Amount: €${data.total_amount.toFixed(2)}

    Stripe Payment ID: ${data.stripe_payment_id}
    View in Stripe: https://dashboard.stripe.com/payments/${data.stripe_payment_id}

    ---
    WhiteBoar Onboarding System
  `;

  // Send email via your email service (Resend, SendGrid, etc.)
  await sendEmail({
    to: adminEmail,
    subject: `New Payment: ${data.business_name} - €${data.total_amount.toFixed(2)}`,
    body: emailBody
  });

  // Retry logic: if send fails, queue for retry (max 3 attempts)
  // Store in onboarding_analytics with retry count
}
```

## Error Handling

### Webhook Failure Recovery

1. **Stripe automatic retries**: Stripe retries webhooks for up to 3 days
2. **Idempotency**: Use `event.id` to prevent duplicate processing
3. **Fallback polling**: On thank-you page, poll Stripe API to verify payment status if webhook hasn't arrived
4. **Manual reconciliation**: Admin dashboard shows submissions with `stripe_subscription_id` in Stripe but `status != 'paid'` in DB

### Database Transaction

Wrap all database updates in a transaction to ensure atomicity:

```typescript
async function handleInvoicePaid(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice;

  try {
    // Start transaction
    await supabase.rpc('begin_transaction');

    // Update submission
    await updateSubmission(...);

    // Log event
    await logPaymentEvent(...);

    // Mark webhook processed
    await markEventProcessed(event.id, true);

    // Commit transaction
    await supabase.rpc('commit_transaction');

    // Send admin notification (outside transaction - can retry)
    await sendAdminNotification(...);
  } catch (error) {
    // Rollback transaction
    await supabase.rpc('rollback_transaction');
    await markEventProcessed(event.id, false);
    throw error;
  }
}
```

## Security

- ✅ Validate webhook signature (prevents spoofing)
- ✅ Use HTTPS only
- ✅ Never expose Stripe secret key
- ✅ Log all webhook events to analytics
- ✅ Implement idempotency (prevent duplicate processing)
- ✅ Rate limit webhook endpoint (prevent DDoS)
- ✅ Sanitize error messages in logs

## Testing

### Unit Tests

```typescript
describe('POST /api/stripe/webhook', () => {
  it('should reject invalid signature', async () => {
    const response = await POST(new Request({
      body: JSON.stringify({ type: 'invoice.paid' }),
      headers: { 'stripe-signature': 'invalid' }
    }));

    expect(response.status).toBe(400);
  });

  it('should handle invoice.paid event', async () => {
    const event = createMockStripeEvent('invoice.paid', {
      subscription: 'sub_123',
      customer: 'cus_123',
      payment_intent: 'pi_123',
      amount_paid: 18500
    });

    const response = await POST(createMockRequest(event));

    expect(response.status).toBe(200);

    // Verify submission updated
    const submission = await getSubmission('test-id');
    expect(submission.status).toBe('paid');
    expect(submission.stripe_payment_id).toBe('pi_123');
  });

  it('should handle duplicate events (idempotency)', async () => {
    const event = createMockStripeEvent('invoice.paid', { ... });

    // Process first time
    await POST(createMockRequest(event));

    // Process second time (duplicate)
    const response = await POST(createMockRequest(event));

    expect(response.status).toBe(200);

    // Verify only processed once
    const events = await getProcessedEvents(event.id);
    expect(events.length).toBe(1);
  });
});
```

### Integration Tests with Stripe CLI

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3783/api/stripe/webhook

# Trigger test events
stripe trigger invoice.paid
stripe trigger charge.refunded
stripe trigger payment_intent.payment_failed
```

### E2E Tests

```typescript
describe('Webhook E2E', () => {
  it('should update DB when real Stripe webhook received', async () => {
    // Create test subscription
    const subscription = await createTestSubscription();

    // Wait for invoice.paid webhook
    await waitForWebhook('invoice.paid', subscription.id, { timeout: 10000 });

    // Verify DB updated
    const submission = await getSubmissionBySubscriptionId(subscription.id);
    expect(submission.status).toBe('paid');
    expect(submission.payment_completed_at).toBeDefined();
  });
});
```

---

**Document Version**: 1.0
**Last Updated**: 2025-10-20
**Status**: Ready for implementation
