/**
 * Webhook Service
 * Handles all Stripe webhook events
 */

import Stripe from 'stripe'
import { SupabaseClient } from '@supabase/supabase-js'
import { EmailService } from '@/services/resend'
import { SubmissionLookupResult, WebhookHandlerResult } from './types'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.NOTIFICATION_ADMIN_EMAIL
const IS_PRODUCTION = process.env.NODE_ENV === 'production'

// Safe logging helper
function debugLog(message: string, data?: unknown) {
  if (!IS_PRODUCTION) {
    if (data) {
      console.log(message, data)
    } else {
      console.log(message)
    }
  }
}

export class WebhookService {
  private stripe: Stripe

  constructor(stripeInstance?: Stripe) {
    if (stripeInstance) {
      this.stripe = stripeInstance
    } else {
      const stripeSecretKey = process.env.STRIPE_SECRET_KEY!
      this.stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2025-09-30.clover'
      })
    }
  }

  /**
   * Find submission by various lookup strategies
   *
   * @param event - Stripe event
   * @param supabase - Supabase client
   * @returns Submission and lookup method used
   */
  async findSubmissionByEvent(
    event: Stripe.Event,
    supabase: SupabaseClient
  ): Promise<SubmissionLookupResult> {
    const eventData = event.data.object as any

    let scheduleId: string | null = null
    let customerId: string | null = null
    let subscriptionId: string | null = null
    let submissionIdFromMetadata: string | undefined

    // Extract IDs based on event type
    if (event.type.includes('subscription')) {
      subscriptionId = eventData.id
      customerId = typeof eventData.customer === 'string'
        ? eventData.customer
        : eventData.customer?.id
      scheduleId = eventData.schedule as string | null
      submissionIdFromMetadata = eventData.metadata?.submission_id
    } else if (event.type.includes('invoice')) {
      subscriptionId = typeof eventData.subscription === 'string'
        ? eventData.subscription
        : eventData.subscription?.id
      customerId = typeof eventData.customer === 'string'
        ? eventData.customer
        : eventData.customer?.id

      // Try to get schedule ID from subscription
      if (subscriptionId) {
        try {
          const subscription = await this.stripe.subscriptions.retrieve(subscriptionId)
          scheduleId = subscription.schedule as string | null
          submissionIdFromMetadata = subscription.metadata?.submission_id
        } catch (error) {
          debugLog(`Failed to retrieve subscription ${subscriptionId}:`, error)
        }
      }
    } else if (event.type.includes('payment_intent')) {
      // For payment_intent events
      customerId = typeof eventData.customer === 'string'
        ? eventData.customer
        : eventData.customer?.id
      submissionIdFromMetadata = eventData.metadata?.submission_id

      // Try to get subscription info from metadata or by retrieving the PaymentIntent
      if (customerId) {
        try {
          const paymentIntent = await this.stripe.paymentIntents.retrieve(eventData.id, {
            expand: ['invoice']
          }) as Stripe.Response<Stripe.PaymentIntent> & { invoice?: Stripe.Invoice | string }

          // Check if invoice is expanded (not just a string ID)
          if (paymentIntent.invoice && typeof paymentIntent.invoice !== 'string') {
            const invoice = paymentIntent.invoice
            // Invoice.subscription can be string | Subscription | null
            const invoiceSubscription = (invoice as any).subscription as string | Stripe.Subscription | null
            subscriptionId = typeof invoiceSubscription === 'string'
              ? invoiceSubscription
              : invoiceSubscription?.id || null

            if (subscriptionId) {
              const subscription = await this.stripe.subscriptions.retrieve(subscriptionId)
              scheduleId = subscription.schedule as string | null
            }
          }
        } catch (error) {
          debugLog(`Failed to retrieve payment intent details:`, error)
        }
      }
    }

    // Strategy 1: Try to find by subscription schedule ID
    if (scheduleId) {
      const { data } = await supabase
        .from('onboarding_submissions')
        .select('*')
        .eq('stripe_subscription_schedule_id', scheduleId)
        .single()

      if (data) {
        return { submission: data, foundBy: 'schedule_id' }
      }
    }

    // Strategy 2: Try to find by customer ID
    if (customerId) {
      const { data } = await supabase
        .from('onboarding_submissions')
        .select('*')
        .eq('stripe_customer_id', customerId)
        .single()

      if (data) {
        return { submission: data, foundBy: 'customer_id' }
      }
    }

    // Strategy 3: Try to find by subscription ID
    if (subscriptionId) {
      const { data } = await supabase
        .from('onboarding_submissions')
        .select('*')
        .eq('stripe_subscription_id', subscriptionId)
        .single()

      if (data) {
        return { submission: data, foundBy: 'subscription_id' }
      }
    }

    // Strategy 4: Try to find by submission_id from metadata
    if (submissionIdFromMetadata) {
      const { data } = await supabase
        .from('onboarding_submissions')
        .select('*')
        .eq('id', submissionIdFromMetadata)
        .single()

      if (data) {
        return { submission: data, foundBy: 'metadata' }
      }
    }

    return { submission: null }
  }

  /**
   * Handle invoice.paid event - Payment successful
   */
  async handleInvoicePaid(
    event: Stripe.Event,
    supabase: SupabaseClient
  ): Promise<WebhookHandlerResult> {
    try {
      const invoice = event.data.object as any
      const subscriptionId = typeof invoice.subscription === 'string'
        ? invoice.subscription
        : invoice.subscription?.id
      const customerId = typeof invoice.customer === 'string'
        ? invoice.customer
        : invoice.customer?.id
      const paymentIntentId = typeof invoice.payment_intent === 'string'
        ? invoice.payment_intent
        : invoice.payment_intent?.id

      // Find submission
      const lookupResult = await this.findSubmissionByEvent(event, supabase)
      if (!lookupResult.submission) {
        console.error(`Submission not found for subscription ${subscriptionId}`)
        return { success: false, error: 'Submission not found' }
      }

      const submission = lookupResult.submission
      const scheduleId = submission.stripe_subscription_schedule_id

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
        const businessName = submission.form_data?.businessName ||
                           submission.form_data?.step3?.businessName ||
                           'Unknown Business'
        const email = submission.form_data?.email ||
                     submission.form_data?.businessEmail ||
                     submission.form_data?.step3?.businessEmail ||
                     'unknown@example.com'
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

      return { success: true }
    } catch (error) {
      console.error('Error handling invoice.paid:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Handle payment_intent.succeeded event - For immediate payments
   */
  async handlePaymentIntentSucceeded(
    event: Stripe.Event,
    supabase: SupabaseClient
  ): Promise<WebhookHandlerResult> {
    try {
      debugLog('[Webhook] 💳 Processing payment_intent.succeeded')
      const paymentIntent = event.data.object as any
      const customerId = paymentIntent.customer as string
      const paymentIntentId = paymentIntent.id
      const amount = paymentIntent.amount
      const currency = paymentIntent.currency

      // Find submission by customer_id or metadata
      const lookupResult = await this.findSubmissionByEvent(event, supabase)
      if (!lookupResult.submission) {
        console.error(`Submission not found for payment intent ${paymentIntentId}`)
        return { success: false, error: 'Submission not found' }
      }

      const submission = lookupResult.submission

      // Update submission with payment details
      await supabase
        .from('onboarding_submissions')
        .update({
          status: 'paid',
          stripe_payment_id: paymentIntentId,
          stripe_customer_id: customerId,
          payment_amount: amount,
          currency: currency.toUpperCase(),
          payment_completed_at: new Date().toISOString(),
          payment_metadata: {
            payment_intent_id: paymentIntentId,
            payment_method: paymentIntent.payment_method
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', submission.id)

      debugLog('[Webhook] ✅ Submission updated: status=paid')

      // Log payment event
      await supabase.from('onboarding_analytics').insert({
        session_id: submission.session_id,
        event_type: 'payment_succeeded',
        event_data: {
          payment_intent_id: paymentIntentId,
          amount,
          currency
        }
      })

      return { success: true }
    } catch (error) {
      console.error('Error handling payment_intent.succeeded:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Handle customer.subscription.created event
   */
  async handleSubscriptionCreated(
    event: Stripe.Event,
    supabase: SupabaseClient
  ): Promise<WebhookHandlerResult> {
    try {
      debugLog('[Webhook] 🎫 Processing customer.subscription.created')
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string
      const scheduleId = subscription.schedule as string | null

      debugLog('[Webhook] Subscription details:', {
        subscription_id: subscription.id,
        customer_id: customerId,
        schedule_id: scheduleId
      })

      // Find submission
      const lookupResult = await this.findSubmissionByEvent(event, supabase)
      if (!lookupResult.submission) {
        debugLog('[Webhook] ⚠️  No submission found for subscription:', subscription.id)
        return { success: true } // Not an error, just log it
      }

      const submissionData = lookupResult.submission

      debugLog('[Webhook] Found submission:', submissionData.id)
      debugLog('[Webhook] Current stripe_subscription_id:', submissionData.stripe_subscription_id)

      if (submissionData.stripe_subscription_id && submissionData.stripe_subscription_id !== subscription.id) {
        debugLog('[Webhook] ⚠️  WARNING: Submission already has different subscription_id!', {
          existing: submissionData.stripe_subscription_id,
          new: subscription.id
        })
      }

      // Update submission with subscription ID
      await supabase
        .from('onboarding_submissions')
        .update({
          stripe_subscription_id: subscription.id,
          stripe_customer_id: customerId,
          stripe_subscription_schedule_id: scheduleId,
          updated_at: new Date().toISOString()
        })
        .eq('id', submissionData.id)

      debugLog('[Webhook] ✓ Submission updated with subscription_id:', subscription.id)

      // Log analytics event
      await supabase.from('onboarding_analytics').insert({
        session_id: submissionData.session_id || null,
        event_type: 'subscription_created',
        metadata: {
          submission_id: submissionData.id,
          subscription_id: subscription.id,
          customer_id: customerId,
          schedule_id: scheduleId
        }
      })

      return { success: true }
    } catch (error) {
      console.error('Error handling subscription.created:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Handle customer.subscription.updated event
   */
  async handleSubscriptionUpdated(
    event: Stripe.Event,
    supabase: SupabaseClient
  ): Promise<WebhookHandlerResult> {
    try {
      const subscription = event.data.object as Stripe.Subscription

      // Log analytics event
      await supabase.from('onboarding_analytics').insert({
        session_id: null,
        event_type: 'subscription_updated',
        metadata: {
          subscription_id: subscription.id,
          status: subscription.status
        }
      })

      return { success: true }
    } catch (error) {
      console.error('Error handling subscription.updated:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Handle customer.subscription.deleted event
   */
  async handleSubscriptionDeleted(
    event: Stripe.Event,
    supabase: SupabaseClient
  ): Promise<WebhookHandlerResult> {
    try {
      const subscription = event.data.object as Stripe.Subscription

      // Find and update submission status
      const lookupResult = await this.findSubmissionByEvent(event, supabase)
      if (lookupResult.submission) {
        await supabase
          .from('onboarding_submissions')
          .update({
            status: 'cancelled',
            updated_at: new Date().toISOString()
          })
          .eq('id', lookupResult.submission.id)
      }

      // Log analytics event
      await supabase.from('onboarding_analytics').insert({
        session_id: null,
        event_type: 'subscription_deleted',
        metadata: {
          subscription_id: subscription.id,
          canceled_at: subscription.canceled_at
        }
      })

      return { success: true }
    } catch (error) {
      console.error('Error handling subscription.deleted:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Handle subscription_schedule.completed event
   */
  async handleScheduleCompleted(
    event: Stripe.Event,
    supabase: SupabaseClient
  ): Promise<WebhookHandlerResult> {
    try {
      const schedule = event.data.object as Stripe.SubscriptionSchedule

      // Log analytics event
      await supabase.from('onboarding_analytics').insert({
        session_id: null,
        event_type: 'schedule_completed',
        metadata: {
          schedule_id: schedule.id,
          completed_at: schedule.completed_at
        }
      })

      return { success: true }
    } catch (error) {
      console.error('Error handling schedule.completed:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Handle subscription_schedule.canceled event
   */
  async handleScheduleCanceled(
    event: Stripe.Event,
    supabase: SupabaseClient
  ): Promise<WebhookHandlerResult> {
    try {
      const schedule = event.data.object as Stripe.SubscriptionSchedule

      // Log analytics event
      await supabase.from('onboarding_analytics').insert({
        session_id: null,
        event_type: 'schedule_canceled',
        metadata: {
          schedule_id: schedule.id,
          canceled_at: schedule.canceled_at
        }
      })

      return { success: true }
    } catch (error) {
      console.error('Error handling schedule.canceled:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Handle charge.refunded event
   */
  async handleChargeRefunded(
    event: Stripe.Event,
    supabase: SupabaseClient
  ): Promise<WebhookHandlerResult> {
    try {
      const charge = event.data.object as Stripe.Charge

      // Log analytics event
      await supabase.from('onboarding_analytics').insert({
        session_id: null,
        event_type: 'charge_refunded',
        metadata: {
          charge_id: charge.id,
          amount_refunded: charge.amount_refunded,
          refunded: charge.refunded
        }
      })

      return { success: true }
    } catch (error) {
      console.error('Error handling charge.refunded:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Handle payment_intent.payment_failed event
   */
  async handlePaymentFailed(
    event: Stripe.Event,
    supabase: SupabaseClient
  ): Promise<WebhookHandlerResult> {
    try {
      const paymentIntent = event.data.object as Stripe.PaymentIntent

      // Log analytics event
      await supabase.from('onboarding_analytics').insert({
        session_id: null,
        event_type: 'payment_failed',
        metadata: {
          payment_intent_id: paymentIntent.id,
          error_code: paymentIntent.last_payment_error?.code,
          error_message: paymentIntent.last_payment_error?.message
        }
      })

      return { success: true }
    } catch (error) {
      console.error('Error handling payment_intent.payment_failed:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }
}
