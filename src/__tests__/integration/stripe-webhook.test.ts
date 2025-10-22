import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import * as dotenv from 'dotenv'
import path from 'path'

// Polyfill fetch for Node.js
import fetch from 'node-fetch'
import { createHmac } from 'crypto'
global.fetch = fetch as any

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const stripeSecretKey = process.env.STRIPE_SECRET_KEY!
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

const supabase = createClient(supabaseUrl, supabaseServiceKey)
const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-12-18.acacia' })

// Helper function to generate webhook signature manually (Node.js compatible)
function generateWebhookSignature(payload: string, secret: string): string {
  const timestamp = Math.floor(Date.now() / 1000)
  const signedPayload = `${timestamp}.${payload}`
  const signature = createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex')

  return `t=${timestamp},v1=${signature}`
}

describe('Stripe Webhook Handler Tests', () => {
  let testSubmissionId: string
  let testSessionId: string
  let testCustomerId: string
  let testSubscriptionId: string

  beforeAll(async () => {
    // Create test session first
    const { randomUUID } = await import('crypto')
    testSessionId = randomUUID()

    const sessionData = {
      id: testSessionId,
      email: 'webhook-test@example.com',
      current_step: 14,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      form_data: {
        step3: {
          businessName: 'Webhook Test Business',
          email: 'webhook-test@example.com'
        },
        step13: {
          additionalLanguages: ['de', 'fr']
        }
      }
    }

    await supabase.from('onboarding_sessions').insert(sessionData)

    // Create test submission
    const { data, error } = await supabase
      .from('onboarding_submissions')
      .insert({
        session_id: testSessionId,
        email: 'webhook-test@example.com',
        business_name: 'Webhook Test Business',
        status: 'submitted',
        form_data: sessionData.form_data
      })
      .select()
      .single()

    if (error) throw error
    testSubmissionId = data.id
  })

  afterAll(async () => {
    // Cleanup test data
    await supabase
      .from('onboarding_submissions')
      .delete()
      .eq('id', testSubmissionId)

    // Cleanup test session
    await supabase
      .from('onboarding_sessions')
      .delete()
      .eq('id', testSessionId)

    // Cleanup Stripe test data
    if (testCustomerId) {
      await stripe.customers.del(testCustomerId).catch(() => {})
    }
    if (testSubscriptionId) {
      await stripe.subscriptions.cancel(testSubscriptionId).catch(() => {})
    }
  })

  it('should process invoice.paid event and update submission status', async () => {
    // 1. Create test Stripe customer
    const customer = await stripe.customers.create({
      email: 'webhook-test@example.com',
      metadata: { submission_id: testSubmissionId }
    })
    testCustomerId = customer.id

    // 2. Create a test payment method and attach to customer
    const paymentMethod = await stripe.paymentMethods.create({
      type: 'card',
      card: {
        token: 'tok_visa' // Test token
      }
    })

    await stripe.paymentMethods.attach(paymentMethod.id, {
      customer: customer.id
    })

    // Set as default payment method
    await stripe.customers.update(customer.id, {
      invoice_settings: {
        default_payment_method: paymentMethod.id
      }
    })

    // 3. Create test subscription with payment_behavior to auto-pay
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: process.env.STRIPE_BASE_PACKAGE_PRICE_ID! }],
      metadata: { submission_id: testSubmissionId },
      default_payment_method: paymentMethod.id,
      payment_behavior: 'default_incomplete'
    })
    testSubscriptionId = subscription.id

    // 4. Get the automatically created invoice
    const invoiceId = typeof subscription.latest_invoice === 'string'
      ? subscription.latest_invoice
      : subscription.latest_invoice?.id

    if (!invoiceId) {
      throw new Error('No invoice created for subscription')
    }

    const invoice = await stripe.invoices.retrieve(invoiceId)

    // 5. Mark invoice as paid
    const paidInvoice = await stripe.invoices.pay(invoice.id, {
      paid_out_of_band: true // Simulate payment without actual charge
    })

    // 6. Create webhook event
    const event = {
      id: `evt_test_${Date.now()}`,
      type: 'invoice.paid',
      data: {
        object: paidInvoice
      }
    } as Stripe.Event

    // 7. Send webhook to API endpoint
    const signature = generateWebhookSignature(JSON.stringify(event), webhookSecret)

    const response = await fetch('http://localhost:3783/api/stripe/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': signature
      },
      body: JSON.stringify(event)
    })

    expect(response.status).toBe(200)

    // 7. Verify database updated
    const { data: submission } = await supabase
      .from('onboarding_submissions')
      .select('status, payment_completed_at, stripe_subscription_id')
      .eq('id', testSubmissionId)
      .single()

    expect(submission.status).toBe('paid')
    expect(submission.payment_completed_at).toBeTruthy()
    expect(submission.stripe_subscription_id).toBe(subscription.id)
  })

  it('should reject webhook with invalid signature', async () => {
    const event = {
      id: `evt_test_${Date.now()}`,
      type: 'invoice.paid',
      data: { object: {} }
    } as Stripe.Event

    const response = await fetch('http://localhost:3783/api/stripe/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'invalid_signature'
      },
      body: JSON.stringify(event)
    })

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('Invalid signature')
  })

  it('should handle duplicate webhook events (idempotency)', async () => {
    const eventId = `evt_test_duplicate_${Date.now()}`

    const event = {
      id: eventId,
      type: 'customer.subscription.created',
      data: {
        object: {
          id: testSubscriptionId,
          customer: testCustomerId,
          metadata: { submission_id: testSubmissionId }
        }
      }
    } as Stripe.Event

    const signature = generateWebhookSignature(JSON.stringify(event), webhookSecret)

    // Send webhook first time
    const response1 = await fetch('http://localhost:3783/api/stripe/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': signature
      },
      body: JSON.stringify(event)
    })

    expect(response1.status).toBe(200)

    // Send same webhook second time
    const response2 = await fetch('http://localhost:3783/api/stripe/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': signature
      },
      body: JSON.stringify(event)
    })

    expect(response2.status).toBe(200)
    const data = await response2.json()
    expect(data.received).toBe(true) // Should acknowledge but not process twice

    // Verify event logged only once in analytics
    const { data: analytics } = await supabase
      .from('onboarding_analytics')
      .select('*')
      .eq('metadata->>stripe_event_id', eventId)

    expect(analytics).toBeTruthy()
    expect(analytics!.length).toBeLessThanOrEqual(1) // Processed at most once
  })

  it('should handle payment_intent.payment_failed event', async () => {
    const failedPaymentIntent = {
      id: 'pi_test_failed',
      last_payment_error: {
        code: 'card_declined',
        message: 'Your card was declined'
      }
    }

    const event = {
      id: `evt_test_${Date.now()}`,
      type: 'payment_intent.payment_failed',
      data: {
        object: failedPaymentIntent
      }
    } as Stripe.Event

    const signature = generateWebhookSignature(JSON.stringify(event), webhookSecret)

    const response = await fetch('http://localhost:3783/api/stripe/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': signature
      },
      body: JSON.stringify(event)
    })

    expect(response.status).toBe(200)

    // Verify error logged in analytics
    const { data: analytics } = await supabase
      .from('onboarding_analytics')
      .select('*')
      .eq('event_type', 'payment_failed')
      .order('created_at', { ascending: false })
      .limit(1)

    expect(analytics).toBeTruthy()
    expect(analytics![0].metadata.error_code).toBe('card_declined')
  })

  it('should handle subscription.created event', async () => {
    const subscription = {
      id: `sub_test_${Date.now()}`,
      customer: testCustomerId,
      status: 'active',
      metadata: { submission_id: testSubmissionId }
    }

    const event = {
      id: `evt_test_${Date.now()}`,
      type: 'customer.subscription.created',
      data: {
        object: subscription
      }
    } as Stripe.Event

    const signature = generateWebhookSignature(JSON.stringify(event), webhookSecret)

    const response = await fetch('http://localhost:3783/api/stripe/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': signature
      },
      body: JSON.stringify(event)
    })

    expect(response.status).toBe(200)

    // Verify subscription ID saved
    const { data: submission } = await supabase
      .from('onboarding_submissions')
      .select('stripe_subscription_id')
      .eq('id', testSubmissionId)
      .single()

    expect(submission.stripe_subscription_id).toBe(subscription.id)
  })

  it('should enforce rate limiting on webhook endpoint', async () => {
    const responses = []

    // Send 6 rapid webhook requests (limit is 5 per hour)
    for (let i = 0; i < 6; i++) {
      const event = {
        id: `evt_test_rate_${Date.now()}_${i}`,
        type: 'ping',
        data: { object: {} }
      } as Stripe.Event

      const signature = generateWebhookSignature(JSON.stringify(event), webhookSecret)

      const response = await fetch('http://localhost:3783/api/stripe/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': signature
        },
        body: JSON.stringify(event)
      })

      responses.push(response.status)
    }

    // Expect at least one request to be rate limited (429)
    const rateLimited = responses.some(status => status === 429)
    expect(rateLimited).toBe(true)
  })
})
