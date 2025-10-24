/**
 * Stripe Payment Service
 * Centralized service for all Stripe SDK interactions
 */

import Stripe from 'stripe'
import { SubscriptionScheduleParams, SubscriptionScheduleResult } from './types'

const BASE_PACKAGE_PRICE_ID = process.env.STRIPE_BASE_PACKAGE_PRICE_ID!

export class StripePaymentService {
  private stripe: Stripe

  /**
   * Initialize the service with a Stripe instance
   * Allows for dependency injection and testing
   */
  constructor(stripeInstance?: Stripe) {
    if (stripeInstance) {
      this.stripe = stripeInstance
    } else {
      // Use default Stripe instance from lib/stripe
      const stripeSecretKey = process.env.STRIPE_SECRET_KEY!
      this.stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2025-09-30.clover'
      })
    }
  }

  /**
   * Find existing customer by email or create a new one
   *
   * @param email - Customer email address
   * @param name - Customer name (business name)
   * @param metadata - Additional metadata to store
   * @returns Stripe Customer object
   */
  async findOrCreateCustomer(
    email: string,
    name: string,
    metadata: Record<string, string> = {}
  ): Promise<Stripe.Customer> {
    // Try to find existing customer by email
    const customers = await this.stripe.customers.list({
      email,
      limit: 1
    })

    if (customers.data.length > 0) {
      return customers.data[0]
    }

    // Create new customer if not found
    return await this.stripe.customers.create({
      email,
      name,
      metadata
    })
  }

  /**
   * Validate a discount coupon code
   *
   * @param discountCode - Coupon code to validate
   * @returns Validated coupon or null if invalid
   * @throws Error if coupon doesn't exist
   */
  async validateCoupon(discountCode: string): Promise<Stripe.Coupon | null> {
    try {
      const coupon = await this.stripe.coupons.retrieve(discountCode.trim())

      if (!coupon.valid) {
        return null
      }

      return coupon
    } catch (error) {
      // Coupon doesn't exist
      if (error instanceof Stripe.errors.StripeError) {
        if (error.code === 'resource_missing') {
          return null
        }
      }
      throw error
    }
  }

  /**
   * Create a subscription schedule with 12-month commitment
   *
   * @param params - Schedule creation parameters
   * @returns Created subscription schedule and associated subscription
   */
  async createSubscriptionSchedule(
    params: SubscriptionScheduleParams
  ): Promise<SubscriptionScheduleResult> {
    const { customerId, priceId, couponId, metadata = {} } = params

    const now = Math.floor(Date.now() / 1000)
    // Calculate 12 months from now (approximately 365 days)
    const twelveMonthsLater = now + (12 * 30 * 24 * 60 * 60)

    const scheduleParams: Stripe.SubscriptionScheduleCreateParams = {
      customer: customerId,
      start_date: 'now',
      end_behavior: 'release',
      phases: [
        {
          items: [
            {
              price: priceId,
              quantity: 1
            }
          ],
          end_date: twelveMonthsLater,
          ...(couponId && {
            discounts: [{
              coupon: couponId
            }]
          })
        }
      ],
      metadata: {
        ...metadata,
        commitment_months: '12'
      }
    }

    const schedule = await this.stripe.subscriptionSchedules.create(scheduleParams)

    // Retrieve the created subscription
    const subscriptionId = schedule.subscription as string
    const subscription = subscriptionId
      ? await this.stripe.subscriptions.retrieve(subscriptionId)
      : undefined

    return {
      schedule,
      subscription
    }
  }

  /**
   * Retrieve a subscription by ID
   *
   * @param subscriptionId - Stripe subscription ID
   * @returns Subscription object
   */
  async retrieveSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    return await this.stripe.subscriptions.retrieve(subscriptionId)
  }

  /**
   * Create a Stripe Checkout Session
   *
   * @param customerId - Stripe customer ID
   * @param subscriptionId - Stripe subscription ID
   * @param successUrl - URL to redirect on success
   * @param cancelUrl - URL to redirect on cancel
   * @param metadata - Additional metadata
   * @returns Checkout session with URL
   */
  async createCheckoutSession(
    customerId: string,
    subscriptionId: string,
    successUrl: string,
    cancelUrl: string,
    metadata: Record<string, string> = {}
  ): Promise<Stripe.Checkout.Session> {
    return await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [
        {
          price: BASE_PACKAGE_PRICE_ID,
          quantity: 1
        }
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      subscription_data: {
        metadata: {
          ...metadata,
          subscription_id: subscriptionId
        }
      },
      metadata
    })
  }

  /**
   * Get the Stripe instance (for advanced usage)
   */
  getStripeInstance(): Stripe {
    return this.stripe
  }
}
