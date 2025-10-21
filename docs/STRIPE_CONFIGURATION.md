# Stripe Configuration Guide

**Last Updated**: 2025-10-21
**Feature**: Add-ons Selection & Stripe Checkout

This guide provides step-by-step instructions for configuring Stripe for the WhiteBoar onboarding payment flow.

## Prerequisites

- Active Stripe account ([sign up here](https://dashboard.stripe.com/register))
- Access to Stripe Dashboard
- Basic understanding of Stripe concepts (Products, Prices, Subscriptions)

## Table of Contents

1. [API Keys Setup](#1-api-keys-setup)
2. [Product & Price Creation](#2-product--price-creation)
3. [Subscription Schedule Configuration](#3-subscription-schedule-configuration)
4. [Webhook Endpoint Setup](#4-webhook-endpoint-setup)
5. [Auto-Invoice Email Configuration](#5-auto-invoice-email-configuration)
6. [Coupon Creation (Discount Codes)](#6-coupon-creation-discount-codes)
7. [Test Mode vs Production Mode](#7-test-mode-vs-production-mode)

---

## 1. API Keys Setup

### 1.1 Retrieve API Keys

1. Log in to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers → API keys**
3. You'll see two types of keys:
   - **Publishable key** (starts with `pk_test_` or `pk_live_`)
   - **Secret key** (starts with `sk_test_` or `sk_live_`)

### 1.2 Add to Environment Variables

Create or update `.env.local` with the following:

```bash
# Stripe API Keys (test mode for development)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here

# Stripe Webhook Secret (will be generated in step 4)
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Stripe Product/Price IDs (will be created in step 2)
STRIPE_BASE_PACKAGE_PRICE_ID=price_your_base_package_price_id_here
STRIPE_LANGUAGE_ADDON_PRICE_ID=price_your_language_addon_price_id_here

# Admin Email for Notifications
NOTIFICATION_ADMIN_EMAIL=admin@whiteboar.com
```

**Security Note**:
- ✅ **DO** commit `.env.example` with placeholder values
- ❌ **DO NOT** commit `.env.local` with real keys to version control
- Add `.env.local` to `.gitignore`

---

## 2. Product & Price Creation

### 2.1 Create Base Package Product

1. Navigate to **Products → Add product**
2. Fill in product details:

   | Field | Value |
   |-------|-------|
   | Name | `WhiteBoar Base Package` |
   | Description | `Yearly subscription billed monthly - includes English and Italian` |
   | Statement descriptor | `WHITEBOAR BASE` |
   | Unit label | (leave empty) |

3. Configure pricing:

   | Field | Value |
   |-------|-------|
   | Pricing model | **Recurring** |
   | Price | `€35.00` |
   | Billing period | **Monthly** |
   | Currency | **EUR** |
   | Usage type | Licensed |
   | Trial period | (leave empty) |

4. Click **Save product**
5. **Copy the Price ID** (starts with `price_`) - you'll need this for `STRIPE_BASE_PACKAGE_PRICE_ID`

**Important Notes**:
- The **monthly price (€35)** is used for billing
- The **annual commitment (12 months)** is enforced via Subscription Schedules in code, not in this Stripe Dashboard configuration
- After 12 months, the subscription converts to a regular monthly subscription (cancellable anytime)

### 2.2 Create Language Add-on Product (Optional)

This product is optional - language add-ons are created dynamically as invoice items in code. However, you can create it for testing purposes:

1. Navigate to **Products → Add product**
2. Fill in product details:

   | Field | Value |
   |-------|-------|
   | Name | `Language Add-on` |
   | Description | `Additional language support (one-time fee)` |
   | Statement descriptor | `WHITEBOAR LANG` |

3. Configure pricing:

   | Field | Value |
   |-------|-------|
   | Pricing model | **One-time** |
   | Price | `€75.00` |
   | Currency | **EUR** |

4. Click **Save product**
5. **Copy the Price ID** - you'll need this for `STRIPE_LANGUAGE_ADDON_PRICE_ID`

---

## 3. Subscription Schedule Configuration

Subscription Schedules are created programmatically in the codebase to enforce the 12-month annual commitment. Here's what happens:

### How It Works

1. **User completes Step 14** → API creates Subscription Schedule
2. **Schedule configuration**:
   - **Start**: Immediately (`now`)
   - **Phases**: 1 phase with 12 iterations
   - **End behavior**: `release` (converts to regular subscription)
3. **Schedule auto-creates Subscription** with monthly billing
4. **After 12 months**: Schedule completes, subscription becomes regular monthly (cancellable)

### Code Reference

See `src/app/api/stripe/create-checkout-session/route.ts`:

```typescript
const schedule = await stripe.subscriptionSchedules.create({
  customer: customer.id,
  start_date: 'now',
  end_behavior: 'release', // Convert to regular subscription after schedule ends
  phases: [{
    items: [{ price: process.env.STRIPE_BASE_PACKAGE_PRICE_ID! }],
    iterations: 12 // Annual commitment: 12 monthly payments
  }]
})
```

**No Dashboard configuration needed** - this is all handled in code.

---

## 4. Webhook Endpoint Setup

Webhooks notify your application when payment events occur (e.g., payment successful, subscription canceled).

### 4.1 Local Development (Stripe CLI - Recommended)

For local testing, use Stripe CLI to forward webhooks:

```bash
# Install Stripe CLI (macOS)
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to local server (port 3783)
stripe listen --forward-to localhost:3783/api/stripe/webhook

# ✅ The CLI will display your webhook signing secret (whsec_xxx)
# Copy this and add it to .env.local as STRIPE_WEBHOOK_SECRET
```

**Advantages**:
- ✅ Instant setup (no Dashboard configuration)
- ✅ Real-time webhook logs in terminal
- ✅ Works with both test and live mode
- ✅ Automatically provides webhook signing secret

### 4.2 Production (Stripe Dashboard)

**Option A: Stripe Workbench (New UI - Recommended)**

1. Navigate to **Workbench** in left sidebar
2. Look for **"Webhooks"** section
3. Click **"Add webhook endpoint"**
4. Configure endpoint:
   - **Endpoint URL**: `https://your-production-domain.com/api/stripe/webhook`
   - **Description**: `Onboarding payment webhooks`
   - **Events to listen to** (select these):
     - `invoice.paid`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `subscription_schedule.completed`
     - `subscription_schedule.canceled`
     - `charge.refunded`
     - `payment_intent.payment_failed`
5. Click **"Add endpoint"** or **"Create endpoint"**
6. **Copy the Signing secret** (starts with `whsec_`) and add to production environment variables

**Option B: Classic Dashboard**

1. Navigate to **Developers → Webhooks**
2. Click **"+ Add endpoint"**
3. Follow same configuration as Option A above
4. **Copy the Signing secret** and add to production environment variables

**Security**:
- Webhook signature verification is **critical** - always verify `stripe-signature` header
- Never skip signature verification in production
- Use HTTPS endpoints only

---

## 5. Auto-Invoice Email Configuration

Configure Stripe to automatically send invoices to customers after payment:

1. Navigate to **Settings → Emails → Invoice emails**
2. Enable **"Automatically send invoice emails"**
3. Configure email settings:
   - **Send emails**: `To customers`
   - **Email timing**: `When invoice is finalized`
   - **Additional recipients**: (optional) Add admin email if you want copies
4. Customize email template (optional):
   - Click **"Customize invoice email"**
   - Add your logo and branding
   - Customize subject line and message
5. Click **"Save changes"**

**Email Flow**:
1. User completes payment on Step 14
2. Stripe creates invoice and marks it as paid
3. `invoice.paid` webhook is sent to your application
4. Stripe automatically emails invoice PDF to customer
5. Application sends admin notification email via Resend

---

## 6. Coupon Creation (Discount Codes)

Create discount coupons that users can apply during checkout:

### 6.1 Create a Coupon

1. Navigate to **Products → Coupons**
2. Click **"+ New"**
3. Configure coupon:

   | Field | Value (Example) |
   |-------|----------------|
   | ID | `LAUNCH2025` |
   | Type | **Percentage** or **Fixed amount** |
   | Discount | `10%` or `€5.00` |
   | Duration | **Once** (applied to first invoice only) |
   | Redeem by | (optional) Set expiration date |
   | Max redemptions | (optional) Limit total uses |

4. Click **"Create coupon"**

### 6.2 Test Discount Codes

- Discount codes are validated against Stripe Coupons API in real-time
- Invalid codes return user-friendly error messages
- Discount is applied to total amount (base + language add-ons)

### 6.3 Code Reference

Discount validation: `src/app/api/stripe/create-checkout-session/route.ts`

```typescript
// Validate discount code if provided
let coupon: Stripe.Coupon | null = null
if (discountCode) {
  try {
    coupon = await stripe.coupons.retrieve(discountCode)
    if (!coupon.valid) {
      throw new Error('Coupon is not valid')
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: { message: 'Invalid discount code', code: 'INVALID_DISCOUNT' }
    }, { status: 400 })
  }
}
```

---

## 7. Test Mode vs Production Mode

### Test Mode

**When to use**: Development and testing

**Characteristics**:
- API keys start with `pk_test_` and `sk_test_`
- No real money is charged
- Use test cards for payments
- Webhooks can be forwarded via Stripe CLI
- Data is separate from production

**Test Cards**:

| Card Number | Result |
|------------|--------|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0000 0000 0002` | Card declined |
| `4000 0027 6000 3184` | 3D Secure authentication required |
| `4000 0000 0000 9995` | Insufficient funds |

**Expiry**: Any future date (e.g., `12/34`)
**CVC**: Any 3 digits (e.g., `123`)
**ZIP**: Any 5 digits (e.g., `12345`)

### Production Mode

**When to use**: Live production environment

**Characteristics**:
- API keys start with `pk_live_` and `sk_live_`
- Real money is charged
- Webhooks must be configured in Dashboard
- Data is separate from test mode
- Requires HTTPS endpoints

**Activation Steps**:
1. Complete Stripe account activation (identity verification, business details)
2. Switch Dashboard to **Live mode** (toggle in top-right)
3. Retrieve live API keys from **Developers → API keys**
4. Update production environment variables with live keys
5. Configure live webhook endpoint in Dashboard
6. Enable auto-invoice emails in live mode settings
7. Test with small real payment first

**Security Checklist**:
- ✅ Use HTTPS for all webhook endpoints
- ✅ Verify webhook signatures
- ✅ Implement rate limiting (5 attempts per hour implemented)
- ✅ Never log full card numbers or CVV
- ✅ Use environment variables for secrets
- ✅ Enable Stripe Radar for fraud detection

---

## Troubleshooting

### Issue: "Stripe publishable key not found"

**Solution**:
1. Verify `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is in `.env.local`
2. Restart dev server after adding env vars: `PORT=3783 pnpm dev`
3. Check that key starts with `pk_test_` (test) or `pk_live_` (production)

### Issue: "Webhook signature verification failed"

**Solution**:
1. Ensure `STRIPE_WEBHOOK_SECRET` matches the secret from Stripe Dashboard or CLI
2. For local dev, use Stripe CLI: `stripe listen --forward-to localhost:3783/api/stripe/webhook`
3. Copy the displayed webhook signing secret to `.env.local`
4. Restart dev server

### Issue: "Price not found"

**Solution**:
1. Verify `STRIPE_BASE_PACKAGE_PRICE_ID` exists and starts with `price_`
2. Check that price is in the correct mode (test/live)
3. Test price retrieval: `stripe prices retrieve price_your_price_id`

### Issue: "Rate limit exceeded"

**Solution**:
1. Wait 1 hour (rate limit: 5 payment attempts per hour per session)
2. For testing, clear rate limit attempts in database:
   ```sql
   DELETE FROM onboarding_analytics
   WHERE event_type = 'payment_attempt'
   AND created_at > NOW() - INTERVAL '1 hour';
   ```

### Issue: "Payment stuck in incomplete status"

**Solution**:
1. Check Stripe Dashboard → Payments for error details
2. Common causes:
   - 3D Secure required (use test card `4000 0027 6000 3184`)
   - Insufficient funds (use successful test card `4242 4242 4242 4242`)
   - Card declined (check Stripe test card docs)
3. Review webhook logs in Stripe CLI or Dashboard → Developers → Webhooks

---

## Additional Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Stripe CLI Reference](https://stripe.com/docs/stripe-cli)
- [Subscription Schedules API](https://stripe.com/docs/api/subscription_schedules)
- [Webhook Events Reference](https://stripe.com/docs/api/events/types)
- [WhiteBoar Quickstart Guide](../specs/001-two-new-steps/quickstart.md)

---

**Configuration Complete!** 🎉

Your Stripe integration is now ready for onboarding payments with:
- ✅ Monthly recurring subscription (€35/month)
- ✅ Annual commitment (12 months via Subscription Schedules)
- ✅ One-time language add-ons (€75 each)
- ✅ Discount code support
- ✅ Automatic invoice emails
- ✅ Webhook event handling
- ✅ Admin payment notifications

For development setup, see [quickstart.md](../specs/001-two-new-steps/quickstart.md).
