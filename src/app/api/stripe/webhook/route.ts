import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServiceClient } from '@/lib/supabase'
import { stripe } from '@/lib/stripe'
import { EmailService } from '@/services/resend'

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.NOTIFICATION_ADMIN_EMAIL
const IS_PRODUCTION = process.env.NODE_ENV === 'production'

// Disable body parsing for webhook signature verification
// Next.js needs the raw body bytes to verify Stripe signatures
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Safe logging helper - only logs in development
function debugLog(message: string, data?: unknown) {
  if (!IS_PRODUCTION) {
    if (data) {
      console.log(message, data)
    } else {
      console.log(message)
    }
  }
}

/**
 * POST /api/stripe/webhook
 * Handles Stripe webhook events for payment confirmation and subscription updates
 */
export async function POST(request: NextRequest) {
  const webhookId = `wh_${Date.now()}_${Math.random().toString(36).substring(7)}`
  debugLog(`[${webhookId}] === WEBHOOK RECEIVED ===`)
  debugLog(`[${webhookId}] Timestamp: ${new Date().toISOString()}`)

  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      debugLog(`[${webhookId}] ❌ Missing signature`)
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      )
    }

    // Verify webhook signature
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET)
    } catch (error) {
      console.error(`[${webhookId}] ❌ Webhook signature verification failed:`, error)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    debugLog(`[${webhookId}] Event verified:`, {
      event_id: event.id,
      event_type: event.type,
      created: event.created
    })

    // Initialize Supabase client
    const supabase = await createServiceClient()

    // Mark event as processing - use unique constraint for idempotency
    // Try to insert the event; if it already exists, the unique constraint will prevent duplicate processing
    const { error: insertError } = await supabase.from('stripe_webhook_events').insert({
      event_id: event.id,
      event_type: event.type,
      processed_at: new Date().toISOString(),
      status: 'processing'
    })

    // If insert failed due to unique constraint (duplicate event), return early
    if (insertError && insertError.code === '23505') {
      debugLog(`[${webhookId}] ⚠️  DUPLICATE EVENT: ${event.id} already processed`)
      return NextResponse.json({ received: true, duplicate: true })
    }

    // If insert failed for other reasons, throw error
    if (insertError) {
      debugLog(`[${webhookId}] ❌ Failed to insert event record:`, insertError)
      throw insertError
    }

    debugLog(`[${webhookId}] Event record created, processing...`)

    // Handle different event types
    try {
      switch (event.type) {
        case 'invoice.paid':
          await handleInvoicePaid(event, supabase)
          break

        case 'customer.subscription.created':
          await handleSubscriptionCreated(event, supabase)
          break

        case 'customer.subscription.updated':
          await handleSubscriptionUpdated(event, supabase)
          break

        case 'customer.subscription.deleted':
          await handleSubscriptionDeleted(event, supabase)
          break

        case 'subscription_schedule.completed':
          await handleScheduleCompleted(event, supabase)
          break

        case 'subscription_schedule.canceled':
          await handleScheduleCanceled(event, supabase)
          break

        case 'charge.refunded':
          await handleChargeRefunded(event, supabase)
          break

        case 'payment_intent.payment_failed':
          await handlePaymentFailed(event, supabase)
          break

        default:
          debugLog(`[${webhookId}] ⚠️  Unhandled event type: ${event.type}`)
      }

      // Mark event as completed
      await supabase
        .from('stripe_webhook_events')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('event_id', event.id)

      debugLog(`[${webhookId}] ✓ Event processed successfully`)
      return NextResponse.json({ received: true })
    } catch (error) {
      console.error(`Error processing event ${event.id}:`, error)

      // Mark event as failed
      await supabase
        .from('stripe_webhook_events')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: error instanceof Error ? error.message : 'Unknown error'
        })
        .eq('event_id', event.id)

      throw error
    }
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

/**
 * Handle invoice.paid event - Payment successful
 */
async function handleInvoicePaid(
  event: Stripe.Event,
  supabase: any
): Promise<void> {
  const invoice = event.data.object as any // Use any to handle different Stripe API versions
  const subscriptionId = typeof invoice.subscription === 'string'
    ? invoice.subscription
    : invoice.subscription?.id
  const customerId = typeof invoice.customer === 'string'
    ? invoice.customer
    : invoice.customer?.id
  const paymentIntentId = typeof invoice.payment_intent === 'string'
    ? invoice.payment_intent
    : invoice.payment_intent?.id

  // Retrieve subscription to get schedule ID and metadata
  let scheduleId: string | null = null
  let submissionIdFromMetadata: string | undefined

  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    scheduleId = subscription.schedule as string | null
    submissionIdFromMetadata = subscription.metadata?.submission_id
  } catch (error) {
    console.error(`Failed to retrieve subscription ${subscriptionId}:`, error)
    // Continue without subscription metadata - try to find submission by customer ID
  }

  // Find submission by subscription schedule ID, customer ID, or metadata
  let submission

  // 1. Try to find by subscription schedule ID
  if (scheduleId) {
    const { data } = await supabase
      .from('onboarding_submissions')
      .select('*')
      .eq('stripe_subscription_schedule_id', scheduleId)
      .single()
    submission = data
  }

  // 2. Try to find by customer ID
  if (!submission) {
    const { data } = await supabase
      .from('onboarding_submissions')
      .select('*')
      .eq('stripe_customer_id', customerId)
      .single()
    submission = data
  }

  // 3. Try to find by submission_id from subscription metadata
  if (!submission && submissionIdFromMetadata) {
    const { data } = await supabase
      .from('onboarding_submissions')
      .select('*')
      .eq('id', submissionIdFromMetadata)
      .single()
    submission = data
  }

  if (!submission) {
    console.error(`Submission not found for subscription ${subscriptionId}`)
    return
  }

  // Update submission with payment details
  await supabase
    .from('onboarding_submissions')
    .update({
      status: 'paid',
      stripe_payment_id: paymentIntentId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      stripe_subscription_schedule_id: scheduleId,
      payment_amount: invoice.amount_paid,
      currency: invoice.currency.toUpperCase(),
      payment_completed_at: new Date(invoice.status_transitions.paid_at! * 1000).toISOString(),
      payment_metadata: {
        invoice_id: invoice.id,
        payment_method: invoice.default_payment_method,
        billing_reason: invoice.billing_reason,
        schedule_id: scheduleId
      },
      updated_at: new Date().toISOString()
    })
    .eq('id', submission.id)

  // Log payment event
  await supabase.from('onboarding_analytics').insert({
    session_id: submission.session_id,
    event_type: 'payment_succeeded',
    metadata: {
      submission_id: submission.id,
      stripe_payment_id: paymentIntentId,
      amount: invoice.amount_paid,
      currency: invoice.currency
    }
  })

  // Send admin notification email
  if (ADMIN_EMAIL) {
    const businessName = submission.form_data?.step3?.businessName || submission.form_data?.businessName || 'Unknown Business'
    const email = submission.form_data?.step3?.email || submission.form_data?.email || 'unknown@example.com'
    const additionalLanguages = submission.form_data?.step13?.additionalLanguages || []

    try {
      await EmailService.sendPaymentNotification(
        submission.id,
        businessName,
        email,
        invoice.amount_paid,
        invoice.currency.toUpperCase(),
        paymentIntentId,
        additionalLanguages
      )
      debugLog('Payment notification email sent successfully')
    } catch (emailError) {
      console.error('Failed to send payment notification email:', emailError)
      // Log error but don't fail the webhook
    }
  }
}

/**
 * Handle customer.subscription.created event
 */
async function handleSubscriptionCreated(
  event: Stripe.Event,
  supabase: any
): Promise<void> {
  debugLog('[Webhook] 🎫 Processing customer.subscription.created')
  const subscription = event.data.object as Stripe.Subscription
  const customerId = subscription.customer as string
  const scheduleId = subscription.schedule as string | null
  const submissionIdFromMetadata = subscription.metadata?.submission_id

  debugLog('[Webhook] Subscription details:', {
    subscription_id: subscription.id,
    customer_id: customerId,
    schedule_id: scheduleId,
    metadata_submission_id: submissionIdFromMetadata
  })

  // Find submission by schedule ID, customer ID, or metadata
  let submission

  // 1. Try to find by subscription schedule ID
  if (scheduleId) {
    const { data } = await supabase
      .from('onboarding_submissions')
      .select('*')
      .eq('stripe_subscription_schedule_id', scheduleId)
      .single()
    submission = data
  }

  // 2. Try to find by customer ID
  if (!submission) {
    const { data } = await supabase
      .from('onboarding_submissions')
      .select('*')
      .eq('stripe_customer_id', customerId)
      .single()
    submission = data
  }

  // 3. Try to find by submission_id from subscription metadata
  if (!submission && submissionIdFromMetadata) {
    const { data } = await supabase
      .from('onboarding_submissions')
      .select('*')
      .eq('id', submissionIdFromMetadata)
      .single()
    submission = data
  }

  // Update submission with subscription ID if found
  if (submission) {
    debugLog('[Webhook] Found submission:', submission.id)
    debugLog('[Webhook] Current stripe_subscription_id:', submission.stripe_subscription_id)

    if (submission.stripe_subscription_id && submission.stripe_subscription_id !== subscription.id) {
      debugLog('[Webhook] ⚠️  WARNING: Submission already has different subscription_id!', {
        existing: submission.stripe_subscription_id,
        new: subscription.id
      })
    }

    await supabase
      .from('onboarding_submissions')
      .update({
        stripe_subscription_id: subscription.id,
        stripe_customer_id: customerId,
        stripe_subscription_schedule_id: scheduleId,
        updated_at: new Date().toISOString()
      })
      .eq('id', submission.id)

    debugLog('[Webhook] ✓ Submission updated with subscription_id:', subscription.id)
  } else {
    debugLog('[Webhook] ⚠️  No submission found for subscription:', subscription.id)
  }

  await supabase.from('onboarding_analytics').insert({
    session_id: submission?.session_id || null,
    event_type: 'subscription_created',
    metadata: {
      stripe_event_id: event.id,
      subscription_id: subscription.id,
      customer_id: subscription.customer,
      status: subscription.status,
      submission_id: submission?.id || null
    }
  })
}

/**
 * Handle customer.subscription.updated event
 */
async function handleSubscriptionUpdated(
  event: Stripe.Event,
  supabase: any
): Promise<void> {
  const subscription = event.data.object as Stripe.Subscription

  // Update submission if subscription status changed
  await supabase
    .from('onboarding_submissions')
    .update({
      payment_metadata: {
        subscription_status: subscription.status,
        updated_at: new Date().toISOString()
      }
    })
    .eq('stripe_subscription_id', subscription.id)

  await supabase.from('onboarding_analytics').insert({
    session_id: null,
    event_type: 'subscription_updated',
    metadata: {
      subscription_id: subscription.id,
      customer_id: subscription.customer,
      status: subscription.status
    }
  })
}

/**
 * Handle customer.subscription.deleted event
 */
async function handleSubscriptionDeleted(
  event: Stripe.Event,
  supabase: any
): Promise<void> {
  const subscription = event.data.object as Stripe.Subscription

  await supabase
    .from('onboarding_submissions')
    .update({
      status: 'cancelled',
      payment_metadata: {
        subscription_canceled_at: new Date().toISOString(),
        cancellation_reason: subscription.cancellation_details?.reason
      }
    })
    .eq('stripe_subscription_id', subscription.id)

  await supabase.from('onboarding_analytics').insert({
    session_id: null,
    event_type: 'subscription_canceled',
    metadata: {
      subscription_id: subscription.id,
      customer_id: subscription.customer
    }
  })
}

/**
 * Handle subscription_schedule.completed event
 * Fires when 12-month commitment completes
 */
async function handleScheduleCompleted(
  event: Stripe.Event,
  supabase: any
): Promise<void> {
  const schedule = event.data.object as Stripe.SubscriptionSchedule
  const subscriptionId = schedule.subscription as string

  await supabase
    .from('onboarding_submissions')
    .update({
      payment_metadata: {
        schedule_completed: true,
        schedule_completed_at: new Date().toISOString(),
        converted_to_monthly: true
      }
    })
    .eq('stripe_subscription_schedule_id', schedule.id)

  await supabase.from('onboarding_analytics').insert({
    session_id: null,
    event_type: 'schedule_completed',
    metadata: {
      schedule_id: schedule.id,
      subscription_id: subscriptionId
    }
  })
}

/**
 * Handle subscription_schedule.canceled event
 */
async function handleScheduleCanceled(
  event: Stripe.Event,
  supabase: any
): Promise<void> {
  const schedule = event.data.object as Stripe.SubscriptionSchedule

  await supabase
    .from('onboarding_submissions')
    .update({
      payment_metadata: {
        schedule_canceled: true,
        schedule_canceled_at: new Date().toISOString()
      }
    })
    .eq('stripe_subscription_schedule_id', schedule.id)

  await supabase.from('onboarding_analytics').insert({
    session_id: null,
    event_type: 'schedule_canceled',
    metadata: {
      schedule_id: schedule.id
    }
  })
}

/**
 * Handle charge.refunded event
 */
async function handleChargeRefunded(
  event: Stripe.Event,
  supabase: any
): Promise<void> {
  const charge = event.data.object as Stripe.Charge
  const paymentIntentId = charge.payment_intent as string

  await supabase
    .from('onboarding_submissions')
    .update({
      status: 'refunded',
      refunded_at: new Date().toISOString(),
      payment_metadata: {
        refund_id: charge.refunds?.data[0]?.id,
        refund_reason: charge.refunds?.data[0]?.reason
      }
    })
    .eq('stripe_payment_id', paymentIntentId)

  await supabase.from('onboarding_analytics').insert({
    session_id: null,
    event_type: 'payment_refunded',
    metadata: {
      payment_intent_id: paymentIntentId,
      amount: charge.amount_refunded,
      currency: charge.currency
    }
  })
}

/**
 * Handle payment_intent.payment_failed event
 */
async function handlePaymentFailed(
  event: Stripe.Event,
  supabase: any
): Promise<void> {
  const paymentIntent = event.data.object as Stripe.PaymentIntent

  await supabase.from('onboarding_analytics').insert({
    session_id: null,
    event_type: 'payment_failed',
    metadata: {
      payment_intent_id: paymentIntent.id,
      error_code: paymentIntent.last_payment_error?.code,
      error_message: paymentIntent.last_payment_error?.message
    }
  })
}
