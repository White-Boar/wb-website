import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * Send a mock Stripe webhook event to the webhook endpoint
 * This is used in CI environments where we can't use stripe listen
 *
 * @param event - The Stripe event to send
 * @param baseUrl - The base URL of the deployment (optional, defaults to process.env.BASE_URL)
 */
export async function sendMockWebhook(
  event: Stripe.Event,
  baseUrl?: string
): Promise<Response> {
  const url = baseUrl || process.env.BASE_URL || 'http://localhost:3783'
  const webhookUrl = `${url}/api/stripe/webhook`

  // Add Vercel bypass header if available
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-mock-webhook': 'true',
  }

  if (process.env.VERCEL_AUTOMATION_BYPASS_SECRET) {
    headers['x-vercel-protection-bypass'] = process.env.VERCEL_AUTOMATION_BYPASS_SECRET
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(event),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(
      `Mock webhook failed: ${response.status} ${response.statusText}\n${errorText}`
    )
  }

  return response
}

/**
 * Trigger mock webhook for a payment after it completes
 * Fetches the submission data and sends appropriate mock webhook events
 *
 * @param submissionId - The submission ID to trigger webhooks for
 */
export async function triggerMockWebhookForPayment(submissionId: string): Promise<void> {
  // Only use mock webhooks when BASE_URL is set (CI environment)
  if (!process.env.BASE_URL) {
    // Local environment - real webhooks will arrive via stripe listen
    return
  }

  console.log(`📤 Triggering mock webhook for submission: ${submissionId}`)

  // Fetch submission to get Stripe IDs
  const { data: submission, error } = await supabase
    .from('onboarding_submissions')
    .select('*')
    .eq('id', submissionId)
    .single()

  if (error || !submission) {
    throw new Error(`Failed to fetch submission: ${error?.message}`)
  }

  const paymentIntentId = submission.stripe_payment_id
  const customerId = submission.stripe_customer_id
  const subscriptionId = submission.stripe_subscription_id

  // For 100% discount payments, there's no PaymentIntent (no payment to process)
  // In this case, we only send invoice.paid webhook
  if (paymentIntentId) {
    // Send payment_intent.succeeded event
    const paymentIntentEvent = createMockPaymentIntentSucceededEvent(
      paymentIntentId,
      submission.payment_amount || 0,
      customerId || '',
      {
        submission_id: submissionId,
        session_id: submission.session_id || '',
      }
    )

    await sendMockWebhook(paymentIntentEvent)
    console.log(`✅ Sent mock payment_intent.succeeded webhook`)
  } else {
    console.log(`ℹ️  No payment intent (likely 100% discount) - skipping payment_intent webhook`)
  }

  // If there's a subscription, also send invoice.paid event
  if (subscriptionId) {
    // Wait a bit to simulate event timing
    await new Promise(resolve => setTimeout(resolve, 500))

    const invoiceId = `in_mock_${Date.now()}`
    const invoiceEvent = createMockInvoicePaidEvent(
      invoiceId,
      subscriptionId,
      customerId || '',
      submission.payment_amount || 0,
      {
        submission_id: submissionId,
        session_id: submission.session_id || '',
      }
    )

    await sendMockWebhook(invoiceEvent)
    console.log(`✅ Sent mock invoice.paid webhook`)
  }
}

/**
 * Create a mock payment_intent.succeeded event
 */
export function createMockPaymentIntentSucceededEvent(
  paymentIntentId: string,
  amount: number,
  customerId: string,
  metadata: Record<string, string> = {}
): Stripe.Event {
  return {
    id: `evt_mock_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    object: 'event',
    api_version: '2025-09-30.clover',
    created: Math.floor(Date.now() / 1000),
    type: 'payment_intent.succeeded',
    livemode: false,
    pending_webhooks: 0,
    request: {
      id: null,
      idempotency_key: null,
    },
    data: {
      object: {
        id: paymentIntentId,
        object: 'payment_intent',
        amount,
        currency: 'eur',
        customer: customerId,
        metadata,
        status: 'succeeded',
        // Add other required PaymentIntent fields with mock data
      } as Stripe.PaymentIntent,
    },
  } as Stripe.Event
}

/**
 * Create a mock invoice.paid event
 */
export function createMockInvoicePaidEvent(
  invoiceId: string,
  subscriptionId: string,
  customerId: string,
  amount: number,
  metadata: Record<string, string> = {}
): Stripe.Event {
  return {
    id: `evt_mock_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    object: 'event',
    api_version: '2025-09-30.clover',
    created: Math.floor(Date.now() / 1000),
    type: 'invoice.paid',
    livemode: false,
    pending_webhooks: 0,
    request: {
      id: null,
      idempotency_key: null,
    },
    data: {
      object: {
        id: invoiceId,
        object: 'invoice',
        amount_due: amount,
        amount_paid: amount,
        total: amount,
        subtotal: amount,
        currency: 'eur',
        customer: customerId,
        subscription: subscriptionId,
        metadata,
        status: 'paid',
        status_transitions: {
          paid_at: Math.floor(Date.now() / 1000)
        },
        // Add other required Invoice fields with mock data
      } as Stripe.Invoice,
    },
  } as Stripe.Event
}
