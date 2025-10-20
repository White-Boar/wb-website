import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServiceClient } from '@/lib/supabase'
import { stripe } from '@/lib/stripe'

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.NOTIFICATION_ADMIN_EMAIL

/**
 * POST /api/stripe/webhook
 * Handles Stripe webhook events for payment confirmation and subscription updates
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
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
      console.error('Webhook signature verification failed:', error)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    // Initialize Supabase client
    const supabase = await createServiceClient()

    // Check idempotency - has this event been processed before?
    const { data: existingEvent } = await supabase
      .from('stripe_webhook_events')
      .select('event_id')
      .eq('event_id', event.id)
      .single()

    if (existingEvent) {
      console.log(`Event ${event.id} already processed`)
      return NextResponse.json({ received: true, duplicate: true })
    }

    // Mark event as processing
    await supabase.from('stripe_webhook_events').insert({
      event_id: event.id,
      event_type: event.type,
      processed_at: new Date().toISOString(),
      status: 'processing'
    })

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
          console.log(`Unhandled event type: ${event.type}`)
      }

      // Mark event as completed
      await supabase
        .from('stripe_webhook_events')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('event_id', event.id)

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
  const invoice = event.data.object as Stripe.Invoice
  const subscriptionId = invoice.subscription as string
  const customerId = invoice.customer as string
  const paymentIntentId = invoice.payment_intent as string

  // Retrieve subscription to get schedule ID
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const scheduleId = subscription.schedule as string | null

  // Find submission by subscription ID or customer ID
  let submission
  if (scheduleId) {
    const { data } = await supabase
      .from('onboarding_submissions')
      .select('*')
      .eq('stripe_subscription_schedule_id', scheduleId)
      .single()
    submission = data
  }

  if (!submission) {
    const { data } = await supabase
      .from('onboarding_submissions')
      .select('*')
      .eq('stripe_customer_id', customerId)
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
    event_data: {
      submission_id: submission.id,
      stripe_payment_id: paymentIntentId,
      amount: invoice.amount_paid,
      currency: invoice.currency
    }
  })

  // Send admin notification (implement email sending logic)
  if (ADMIN_EMAIL) {
    console.log('Payment received notification:', {
      submission_id: submission.id,
      business_name: submission.form_data?.step3?.businessName || submission.form_data?.businessName,
      amount: invoice.amount_paid / 100,
      stripe_payment_id: paymentIntentId
    })
    // TODO: Implement email sending via Resend or other service
  }
}

/**
 * Handle customer.subscription.created event
 */
async function handleSubscriptionCreated(
  event: Stripe.Event,
  supabase: any
): Promise<void> {
  const subscription = event.data.object as Stripe.Subscription

  await supabase.from('onboarding_analytics').insert({
    session_id: null,
    event_type: 'subscription_created',
    event_data: {
      subscription_id: subscription.id,
      customer_id: subscription.customer,
      status: subscription.status
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
    event_data: {
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
    event_data: {
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
    event_data: {
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
    event_data: {
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
    event_data: {
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
    event_data: {
      payment_intent_id: paymentIntent.id,
      error_code: paymentIntent.last_payment_error?.code,
      error_message: paymentIntent.last_payment_error?.message
    }
  })
}
