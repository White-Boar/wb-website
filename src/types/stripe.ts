/**
 * Stripe Webhook Event Types
 * Feature: 001-two-new-steps
 *
 * Type definitions for Stripe webhook events we handle
 */

import Stripe from 'stripe'

// =============================================================================
// WEBHOOK EVENT TYPES
// =============================================================================

/**
 * Events we listen to for payment processing
 */
export type StripeWebhookEventType =
  | 'invoice.paid'
  | 'customer.subscription.created'
  | 'customer.subscription.updated'
  | 'customer.subscription.deleted'
  | 'subscription_schedule.completed'
  | 'subscription_schedule.canceled'
  | 'charge.refunded'
  | 'payment_intent.succeeded'
  | 'payment_intent.payment_failed'

/**
 * Webhook event payload structure
 */
export interface StripeWebhookEvent {
  id: string
  type: StripeWebhookEventType
  data: {
    object: Stripe.Invoice | Stripe.Subscription | Stripe.Charge | Stripe.PaymentIntent | Stripe.SubscriptionSchedule
  }
  created: number
  livemode: boolean
}

/**
 * Webhook handler response
 */
export interface WebhookHandlerResponse {
  success: boolean
  message?: string
  error?: string
}

/**
 * Idempotency record for preventing duplicate webhook processing
 */
export interface WebhookIdempotencyRecord {
  event_id: string
  event_type: StripeWebhookEventType
  processed_at: Date
  submission_id?: string
}

// =============================================================================
// PAYMENT EVENT LOGGING
// =============================================================================

/**
 * Payment event types for analytics logging
 */
export type PaymentEventType =
  | 'payment_initiated'
  | 'payment_succeeded'
  | 'payment_failed'
  | 'payment_refunded'
  | 'subscription_created'
  | 'subscription_updated'
  | 'subscription_canceled'
  | 'schedule_completed'
  | 'schedule_canceled'
  | 'discount_applied'
  | 'webhook_received'
  | 'webhook_processed'
  | 'webhook_failed'

/**
 * Payment event log structure for onboarding_analytics
 */
export interface PaymentEventLog {
  submission_id: string
  event_type: PaymentEventType
  stripe_payment_id?: string
  stripe_event_id?: string
  amount?: number // in cents
  currency?: string
  metadata?: Record<string, any>
  error_code?: string
  error_message?: string
  timestamp: Date
}
