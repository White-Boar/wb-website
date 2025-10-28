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
   * Validate a discount coupon code or promotion code
   *
   * @param discountCode - Coupon ID or Promotion Code to validate
   * @returns Validated coupon or null if invalid
   * @throws Error if validation fails
   */
  async validateCoupon(discountCode: string): Promise<Stripe.Coupon | null> {
    try {
      const code = discountCode.trim()

      // First, try as a promotion code (customer-facing codes like "SUMMER10")
      const promotionCodes = await this.stripe.promotionCodes.list({
        code,
        active: true,
        limit: 1
      })

      if (promotionCodes.data.length > 0) {
        const promotionCode = promotionCodes.data[0] as any

        // Extract coupon ID from promotion code
        // The structure is: promotionCode.promotion.coupon (string ID)
        // OR for older API versions: promotionCode.coupon (string ID or expanded object)
        let couponId: string | undefined;

        if (promotionCode.promotion?.coupon) {
          // New structure: promotion.coupon is a string ID
          couponId = typeof promotionCode.promotion.coupon === 'string'
            ? promotionCode.promotion.coupon
            : promotionCode.promotion.coupon?.id;
        } else if (promotionCode.coupon) {
          // Old structure: coupon can be string ID or expanded object
          couponId = typeof promotionCode.coupon === 'string'
            ? promotionCode.coupon
            : promotionCode.coupon?.id;
        }

        if (!couponId) {
          return null
        }

        // Retrieve the full coupon object
        const coupon = await this.stripe.coupons.retrieve(couponId)

        if (!coupon.valid) {
          return null
        }

        return coupon
      }

      // Fallback: try as a direct coupon ID (for backwards compatibility)
      const coupon = await this.stripe.coupons.retrieve(code)

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
   * Preview an invoice with subscription and invoice items
   * Returns the exact amounts Stripe will charge including discounts
   *
   * @param customerId - Stripe customer ID (null to create temporary)
   * @param priceId - Subscription price ID
   * @param couponId - Optional coupon ID
   * @param languageAddOns - Number of language add-ons
   * @returns Preview invoice with all calculations from Stripe
   */
  async previewInvoiceWithDiscount(
    customerId: string | null,
    priceId: string,
    couponId: string | null,
    languageAddOns: number
  ): Promise<{
    subtotal: number           // Before discount (cents)
    discountAmount: number     // Total discount applied (cents)
    total: number              // After discount (cents)
    subscriptionAmount: number // Recurring amount (cents)
    subscriptionDiscount: number // Discount on recurring (cents)
  }> {
    // Create a temporary customer if needed
    let customer = customerId
    let tempCustomer: Stripe.Customer | null = null

    if (!customer) {
      tempCustomer = await this.stripe.customers.create({
        email: 'preview@whiteboar.com',
        metadata: { temporary: 'true' }
      })
      customer = tempCustomer.id
    }

    // Add invoice items (language add-ons) to customer
    const createdItems: Stripe.InvoiceItem[] = []

    try {
      for (let i = 0; i < languageAddOns; i++) {
        const item = await this.stripe.invoiceItems.create({
          customer,
          amount: 7500, // €75 in cents
          currency: 'eur',
          description: 'Language Add-on Preview'
        })
        createdItems.push(item)
      }

      // Preview the upcoming invoice with subscription
      const preview = await this.stripe.invoices.createPreview({
        customer,
        schedule: undefined,
        subscription_details: {
          items: [{
            price: priceId,
            quantity: 1
          }]
        },
        ...(couponId && { discounts: [{ coupon: couponId }] })
      })

      // Calculate subscription recurring amount with discount from line items
      const baseSubscriptionAmount = 3500 // €35 in cents
      let subscriptionAmount = baseSubscriptionAmount
      let subscriptionDiscount = 0

      // Find the subscription line item (not language add-ons)
      const subscriptionLine = preview.lines?.data?.find((line: any) =>
        line.price?.id === priceId ||
        line.description?.includes('WhiteBoar Base Package') ||
        line.description?.includes('Base Package')
      )

      if (subscriptionLine && subscriptionLine.discount_amounts && subscriptionLine.discount_amounts.length > 0) {
        // Calculate total discount on subscription from all discount_amounts
        subscriptionDiscount = subscriptionLine.discount_amounts.reduce(
          (sum: number, discount: any) => sum + discount.amount,
          0
        )
        subscriptionAmount = subscriptionLine.amount - subscriptionDiscount
      }

      // Extract discount amount from preview
      const discountAmount = preview.total_discount_amounts?.reduce(
        (sum, discount) => sum + discount.amount,
        0
      ) || 0

      return {
        subtotal: preview.subtotal,
        discountAmount,
        total: preview.total,
        subscriptionAmount,
        subscriptionDiscount
      }
    } finally {
      // Clean up: delete temporary invoice items
      for (const item of createdItems) {
        try {
          await this.stripe.invoiceItems.del(item.id)
        } catch (err) {
          console.error('Failed to delete preview invoice item:', err)
        }
      }

      // Clean up temporary customer if created
      if (tempCustomer) {
        try {
          await this.stripe.customers.del(tempCustomer.id)
        } catch (err) {
          console.error('Failed to delete temporary customer:', err)
        }
      }
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
