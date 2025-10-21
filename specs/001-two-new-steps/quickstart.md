# Developer Quickstart: Add-ons Selection & Stripe Checkout

**Feature**: 001-two-new-steps | **Target Time**: 30 minutes to working dev environment

This guide gets you from zero to a working Stripe checkout flow in the onboarding.

## Prerequisites

- ✅ Node.js 18+ and pnpm installed
- ✅ Supabase project set up (database running)
- ✅ Stripe account created (test mode)
- ✅ Repository cloned and dependencies installed

## Step 1: Install Stripe Dependencies (2 min)

```bash
cd /Users/Yoav/Projects/wb/wb-website

# Install Stripe SDK
pnpm add stripe @stripe/stripe-js

# Verify installation
pnpm list stripe
```

## Step 2: Set Up Stripe Account (10 min)

### 2.1 Create Stripe Products

1. Go to [https://dashboard.stripe.com/test/products](https://dashboard.stripe.com/test/products)
2. Click **"+ Add product"**

**Base Package Product**:
- Name: `WhiteBoar Base Package`
- Description: `Yearly subscription billed monthly - includes English and Italian`
- Pricing model: `Recurring`
- Price: `€35.00`
- Billing period: `Monthly`
- Currency: `EUR`

Copy the **Price ID** (starts with `price_`). You'll need this for `STRIPE_BASE_PACKAGE_PRICE_ID`.

**Important**: The monthly price is used for billing, but the annual commitment (12 months) is enforced via Subscription Schedules in code, not in the Stripe Dashboard price configuration.

**Language Add-on Product** (optional - for testing invoice items):
- Name: `Language Add-on`
- Description: `Additional language support (one-time fee)`
- Pricing model: `One-time`
- Price: `€75.00`
- Currency: `EUR`

Copy the **Price ID**. You'll need this for `STRIPE_LANGUAGE_ADDON_PRICE_ID`.

### 2.2 Get API Keys

1. Go to [https://dashboard.stripe.com/test/apikeys](https://dashboard.stripe.com/test/apikeys)
2. Copy **Publishable key** (starts with `pk_test_`)
3. Reveal and copy **Secret key** (starts with `sk_test_`)

### 2.3 Create Webhook Endpoint

**⚠️ RECOMMENDED FOR LOCAL DEV**: Skip this step and use Stripe CLI (see Step 6 below) - it's faster and easier.

**For Production Setup Only:**

**Using Stripe Workbench (New UI - Recommended by Stripe):**
1. Go to [https://dashboard.stripe.com/workbench](https://dashboard.stripe.com/workbench) or click "Workbench" in left sidebar
2. In Workbench, look for **"Webhooks"** section or click **"Add webhook endpoint"**
3. Configure endpoint:
   - Endpoint URL: `https://your-production-domain.com/api/stripe/webhook`
   - Description: `Onboarding payment webhooks`
   - Events to listen to:
     - `invoice.paid`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `subscription_schedule.completed`
     - `subscription_schedule.canceled`
     - `charge.refunded`
     - `payment_intent.payment_failed`
4. Click **"Add endpoint"** or **"Create endpoint"**
5. Copy the **Signing secret** (starts with `whsec_`)

**Using Classic Dashboard (Alternative):**
1. Go to [https://dashboard.stripe.com/test/webhooks](https://dashboard.stripe.com/test/webhooks)
2. Click **"+ Add endpoint"**
3. Follow same configuration as above
4. Copy the **Signing secret** (starts with `whsec_`)

**Note**: For local development, the Stripe CLI (Step 6 below) is much easier - it auto-creates a webhook endpoint and provides real-time event logs.

## Step 3: Configure Environment Variables (3 min)

Add to `.env.local`:

```bash
# Stripe API Keys (test mode)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Stripe Product/Price IDs
STRIPE_BASE_PACKAGE_PRICE_ID=price_your_base_package_price_id_here
STRIPE_LANGUAGE_ADDON_PRICE_ID=price_your_language_addon_price_id_here # Optional

# Admin Notifications
NOTIFICATION_ADMIN_EMAIL=admin@whiteboar.com
```

**Verify configuration**:
```bash
# Check .env.local exists
cat .env.local | grep STRIPE

# Should output your Stripe keys
```

## Step 4: Run Database Migrations (2 min)

```bash
# Create migration file
pnpm supabase migration create add_payment_fields_to_onboarding

# Copy SQL from specs/001-two-new-steps/data-model.md
# Paste into the new migration file in supabase/migrations/

# Apply migration
pnpm supabase db push

# Verify columns added
pnpm supabase db diff
```

**Quick verification**:
```sql
-- Run in Supabase SQL Editor
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'onboarding_submissions'
AND column_name LIKE 'stripe%';

-- Should return: stripe_payment_id, stripe_customer_id, stripe_subscription_id
```

## Step 5: Test Stripe Connection (5 min)

Create a test file to verify Stripe works:

**File**: `test-stripe.ts`

```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-10-28'
});

async function testStripe() {
  try {
    // Test 1: Retrieve price
    const price = await stripe.prices.retrieve(
      process.env.STRIPE_BASE_PACKAGE_PRICE_ID!
    );
    console.log('✅ Price retrieved:', price.unit_amount / 100, price.currency);

    // Test 2: Create test customer
    const customer = await stripe.customers.create({
      email: 'test@example.com',
      name: 'Test Business',
      metadata: { test: 'true' }
    });
    console.log('✅ Customer created:', customer.id);

    // Test 3: Create test subscription schedule (12-month commitment)
    const schedule = await stripe.subscriptionSchedules.create({
      customer: customer.id,
      start_date: 'now',
      end_behavior: 'release',
      phases: [{
        items: [{ price: process.env.STRIPE_BASE_PACKAGE_PRICE_ID! }],
        iterations: 12 // Annual commitment: 12 monthly payments
      }]
    });
    console.log('✅ Subscription schedule created:', schedule.id);
    console.log('✅ Subscription created:', schedule.subscription);

    // Test 4: Delete test data
    // Cancel schedule first, then delete customer
    if (schedule.subscription) {
      await stripe.subscriptionSchedules.cancel(schedule.id);
    }
    await stripe.customers.del(customer.id);
    console.log('✅ Cleanup complete');

    console.log('\n🎉 Stripe integration test passed!');
  } catch (error) {
    console.error('❌ Stripe test failed:', error);
  }
}

testStripe();
```

Run the test:
```bash
ts-node test-stripe.ts

# Expected output:
# ✅ Price retrieved: 35 eur
# ✅ Customer created: cus_xxx
# ✅ Subscription schedule created: sub_sched_xxx
# ✅ Subscription created: sub_xxx
# ✅ Cleanup complete
# 🎉 Stripe integration test passed!
```

## Step 6: Set Up Stripe CLI for Local Webhooks (5 min) ⭐ RECOMMENDED

**This is the easiest way to test webhooks locally** - no Dashboard configuration needed!

```bash
# Install Stripe CLI (macOS)
brew install stripe/stripe-cli/stripe

# Login to Stripe (opens browser for authentication)
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3783/api/stripe/webhook

# ✅ The CLI will display your webhook signing secret (whsec_xxx)
# Copy this and add it to .env.local as STRIPE_WEBHOOK_SECRET

# Keep this terminal running - you'll see real-time webhook logs here
```

**What the Stripe CLI does for you:**
- ✅ Automatically creates a temporary webhook endpoint
- ✅ Provides webhook signing secret instantly
- ✅ Forwards all Stripe events to your local server
- ✅ Shows real-time logs of webhook events and responses
- ✅ Works with Stripe Workbench and Classic Dashboard

**Test webhook delivery**:
```bash
# In another terminal, trigger a test event
stripe trigger invoice.paid

# Check the webhook listener terminal - should show:
# --> invoice.paid [evt_xxx]
# <-- [200] POST http://localhost:3783/api/stripe/webhook
```

**💡 Pro Tip**: If you switch to Workbench, the Stripe CLI still works exactly the same way - it's UI-agnostic!

## Step 7: Create Test Data (3 min)

Create a test onboarding submission to use during development:

```bash
# Start dev server
PORT=3783 pnpm dev
```

Navigate to `http://localhost:3783/onboarding` and complete Steps 1-12.

**Or** insert test data directly:

```sql
-- Run in Supabase SQL Editor
INSERT INTO onboarding_sessions (session_id, form_data, current_step, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '{
    "step1": {"businessName": "Test Business"},
    "step3": {"email": "test@example.com"},
    "step13": {"additionalLanguages": ["fr", "de"]}
  }'::jsonb,
  13,
  NOW(),
  NOW()
);

INSERT INTO onboarding_submissions (submission_id, session_id, form_data, status, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  (SELECT session_id FROM onboarding_sessions ORDER BY created_at DESC LIMIT 1),
  '{
    "step1": {"businessName": "Test Business"},
    "step3": {"email": "test@example.com"},
    "step13": {"additionalLanguages": ["fr", "de"]}
  }'::jsonb,
  'submitted',
  NOW(),
  NOW()
);
```

## Step 8: Test the Complete Flow (5 min)

### 8.1 Test Step 13 (Language Selection)

1. Navigate to `http://localhost:3783/en/onboarding/step/13`
2. Select 2-3 languages
3. Click "Next"
4. Verify form data saved to `onboarding_submissions` table

### 8.2 Test Step 14 (Checkout)

1. Navigate to `http://localhost:3783/en/onboarding/step/14`
2. Verify pricing breakdown shows:
   - Base Package: €35/month
   - Language Add-ons: €75 × number selected
   - Total: €35 + (€75 × languages)
3. Enter discount code (if you created one in Stripe)
4. Use Stripe test card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - ZIP: Any 5 digits
5. Click "Pay"
6. Verify redirect to `/onboarding/thank-you`

### 8.3 Verify Webhook Processing

Check Stripe CLI terminal - should show:
```
--> invoice.paid [evt_xxx]
<-- [200] POST http://localhost:3783/api/stripe/webhook
```

Check database:
```sql
SELECT submission_id, status, stripe_payment_id, payment_amount
FROM onboarding_submissions
ORDER BY created_at DESC
LIMIT 1;

-- Should show:
-- status: 'paid'
-- stripe_payment_id: 'pi_xxx'
-- payment_amount: 18500 (€185 in cents)
```

## Troubleshooting

### Error: "Stripe publishable key not found"

Check `.env.local`:
```bash
cat .env.local | grep NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

# Should output: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```

Restart dev server after adding env vars:
```bash
PORT=3783 pnpm dev
```

### Error: "Price not found"

Verify price ID in Stripe dashboard:
```bash
# Test price retrieval
stripe prices retrieve price_your_price_id_here

# Should return price details
```

### Error: "Webhook signature verification failed"

Ensure Stripe CLI is running:
```bash
stripe listen --forward-to localhost:3783/api/stripe/webhook

# Copy the webhook signing secret (whsec_xxx)
# Update .env.local with STRIPE_WEBHOOK_SECRET
```

### Error: "Rate limit exceeded"

Clear rate limit attempts:
```sql
-- Run in Supabase SQL Editor
DELETE FROM onboarding_analytics
WHERE event_type = 'payment_attempt'
AND created_at > NOW() - INTERVAL '1 hour';
```

### Payment stuck in "incomplete" status

Check Stripe dashboard for payment errors:
1. Go to [https://dashboard.stripe.com/test/subscriptions](https://dashboard.stripe.com/test/subscriptions)
2. Find the subscription
3. Check "Events & logs" tab for errors

Common issues:
- 3D Secure required (use test card `4000 0027 6000 3184`)
- Insufficient funds (use successful test card `4242 4242 4242 4242`)
- Card declined (check Stripe test card docs)

## Next Steps

✅ You now have a working Stripe integration!

**To continue development**:

1. **Implement Step 13 component**: See `data-model.md` for schema
2. **Implement Step 14 component**: See `contracts/create-checkout-session.md`
3. **Implement webhook handler**: See `contracts/stripe-webhook.md`
4. **Write tests**: See `plan.md` Phase 0 → Testing Strategy
5. **Add translations**: See `messages/en.json` and `messages/it.json`

**Useful Stripe Test Cards**:

| Card Number | Description |
|------------|-------------|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0000 0000 0002` | Card declined |
| `4000 0027 6000 3184` | 3D Secure required |
| `4000 0000 0000 9995` | Insufficient funds |

**Stripe Dashboard Links** (test mode):

- [Customers](https://dashboard.stripe.com/test/customers)
- [Subscriptions](https://dashboard.stripe.com/test/subscriptions)
- [Payments](https://dashboard.stripe.com/test/payments)
- [Webhooks](https://dashboard.stripe.com/test/webhooks)
- [Products](https://dashboard.stripe.com/test/products)
- [Coupons](https://dashboard.stripe.com/test/coupons)

---

**Setup Time**: ~30 minutes
**Last Updated**: 2025-10-20
**Status**: Ready for development
