/**
 * Checkout Session Service
 * Business logic for creating checkout sessions
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { EUROPEAN_LANGUAGES, isValidLanguageCode } from '@/data/european-languages'
import { StripePaymentService } from './StripePaymentService'
import {
  CreateSessionParams,
  SubmissionValidationResult,
  CustomerInfo,
  CheckoutSessionResult,
  RateLimitResult
} from './types'
import Stripe from 'stripe'

export class CheckoutSessionService {
  private stripeService: StripePaymentService

  constructor(stripeService?: StripePaymentService) {
    this.stripeService = stripeService || new StripePaymentService()
  }

  /**
   * Validate submission and check if it's eligible for payment
   *
   * @param submissionId - Onboarding submission ID
   * @param supabase - Supabase client
   * @returns Validation result with submission data or error
   */
  async validateSubmission(
    submissionId: string,
    supabase: SupabaseClient
  ): Promise<SubmissionValidationResult> {
    // Fetch submission from database
    const { data: submission, error: fetchError } = await supabase
      .from('onboarding_submissions')
      .select('*')
      .eq('id', submissionId)
      .single()

    if (fetchError || !submission) {
      return {
        valid: false,
        error: {
          code: 'INVALID_SUBMISSION_ID',
          message: 'Submission not found or not in submitted status',
          status: 400
        }
      }
    }

    // Check if payment already exists
    if (submission.stripe_subscription_id) {
      return {
        valid: false,
        error: {
          code: 'PAYMENT_ALREADY_COMPLETED',
          message: 'This submission has already been paid',
          status: 409
        }
      }
    }

    return {
      valid: true,
      submission
    }
  }

  /**
   * Validate language codes
   *
   * @param languageCodes - Array of language codes to validate
   * @returns Invalid language codes or empty array if all valid
   */
  validateLanguageCodes(languageCodes: string[]): string[] {
    return languageCodes.filter(code => !isValidLanguageCode(code))
  }

  /**
   * Check rate limiting for payment attempts
   *
   * @param sessionId - Onboarding session ID
   * @param supabase - Supabase client
   * @returns Rate limit status
   */
  async checkRateLimit(
    sessionId: string,
    supabase: SupabaseClient
  ): Promise<RateLimitResult> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

    const { count: recentAttempts } = await supabase
      .from('onboarding_analytics')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId)
      .eq('event_type', 'payment_attempt')
      .gte('created_at', oneHourAgo)

    const maxAttempts = 5
    const allowed = !recentAttempts || recentAttempts < maxAttempts

    return {
      allowed,
      attemptsRemaining: allowed ? maxAttempts - (recentAttempts || 0) : 0,
      resetAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now
    }
  }

  /**
   * Log a payment attempt
   *
   * @param sessionId - Onboarding session ID
   * @param submissionId - Submission ID
   * @param languageCount - Number of language add-ons
   * @param supabase - Supabase client
   */
  async logPaymentAttempt(
    sessionId: string,
    submissionId: string,
    languageCount: number,
    supabase: SupabaseClient
  ): Promise<void> {
    await supabase.from('onboarding_analytics').insert({
      session_id: sessionId,
      event_type: 'payment_attempt',
      event_data: {
        submission_id: submissionId,
        language_count: languageCount
      }
    })
  }

  /**
   * Extract customer information from submission
   *
   * @param submission - Onboarding submission data
   * @returns Customer email and business name
   * @throws Error if customer email not found
   */
  extractCustomerInfo(submission: any): CustomerInfo {
    // Try multiple locations for email (form data structure changes over time)
    const customerEmail = submission.form_data?.email ||
                         submission.form_data?.businessEmail ||
                         submission.form_data?.step3?.businessEmail ||
                         submission.email

    const businessName = submission.form_data?.businessName ||
                        submission.form_data?.step3?.businessName ||
                        submission.business_name

    if (!customerEmail) {
      throw new Error('MISSING_CUSTOMER_EMAIL: Customer email not found in submission')
    }

    return {
      email: customerEmail,
      businessName: businessName || 'Unknown Business'
    }
  }

  /**
   * Create a complete checkout session with payment intent
   *
   * @param params - Session creation parameters
   * @param supabase - Supabase client
   * @returns Checkout session result with client secret
   */
  async createCheckoutSession(
    params: CreateSessionParams,
    supabase: SupabaseClient
  ): Promise<CheckoutSessionResult> {
    const {
      submissionId,
      additionalLanguages = [],
      discountCode
    } = params

    try {
      // 1. Validate submission
      const validationResult = await this.validateSubmission(submissionId, supabase)
      if (!validationResult.valid || !validationResult.submission) {
        return {
          success: false,
          error: validationResult.error
        }
      }
      const submission = validationResult.submission

      // 2. Validate language codes
      const invalidLanguages = this.validateLanguageCodes(additionalLanguages)
      if (invalidLanguages.length > 0) {
        return {
          success: false,
          error: {
            code: 'INVALID_LANGUAGE_CODE',
            message: `Invalid language codes: ${invalidLanguages.join(', ')}`
          }
        }
      }

      // 3. Check rate limiting
      const rateLimitResult = await this.checkRateLimit(submission.session_id, supabase)
      if (!rateLimitResult.allowed) {
        return {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many payment attempts. Please try again in 1 hour.'
          }
        }
      }

      // 4. Log payment attempt
      await this.logPaymentAttempt(
        submission.session_id,
        submissionId,
        additionalLanguages.length,
        supabase
      )

      // 5. Extract customer information
      const customerInfo = this.extractCustomerInfo(submission)

      // 6. Create or retrieve Stripe customer
      const customer = await this.stripeService.findOrCreateCustomer(
        customerInfo.email,
        customerInfo.businessName,
        {
          submission_id: submissionId,
          session_id: submission.session_id
        }
      )

      // 7. Validate discount code if provided
      let validatedCoupon: Stripe.Coupon | null = null
      if (discountCode) {
        validatedCoupon = await this.stripeService.validateCoupon(discountCode)
        if (!validatedCoupon) {
          return {
            success: false,
            error: {
              code: 'INVALID_DISCOUNT_CODE',
              message: `Discount code '${discountCode}' is not valid or has expired`
            }
          }
        }
      }

      // 8. Create subscription schedule with 12-month commitment
      const scheduleResult = await this.stripeService.createSubscriptionSchedule({
        customerId: customer.id,
        priceId: process.env.STRIPE_BASE_PACKAGE_PRICE_ID!,
        couponId: validatedCoupon?.id,
        metadata: {
          submission_id: submissionId,
          session_id: submission.session_id,
          commitment_months: '12'
        }
      })

      const { schedule, subscription } = scheduleResult

      if (!subscription) {
        throw new Error('Subscription not created by schedule')
      }

      // 9. Add language add-ons as invoice items
      const result = await this.addLanguageAddOns(
        customer.id,
        subscription,
        additionalLanguages,
        submissionId,
        submission.session_id
      )

      // 10. Update submission with Stripe IDs
      await supabase
        .from('onboarding_submissions')
        .update({
          stripe_customer_id: customer.id,
          stripe_subscription_id: subscription.id,
          stripe_subscription_schedule_id: schedule.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', submissionId)

      return {
        success: true,
        ...result,
        customerId: customer.id,
        subscriptionId: subscription.id
      }
    } catch (error) {
      console.error('Checkout session creation error:', error)

      // Check for specific error types
      if (error instanceof Error && error.message.startsWith('MISSING_CUSTOMER_EMAIL')) {
        return {
          success: false,
          error: {
            code: 'MISSING_CUSTOMER_EMAIL',
            message: 'Customer email not found in submission'
          }
        }
      }

      return {
        success: false,
        error: {
          code: 'STRIPE_API_ERROR',
          message: 'Failed to create checkout session. Please try again.'
        }
      }
    }
  }

  /**
   * Add language add-ons to the subscription invoice
   *
   * @private
   */
  private async addLanguageAddOns(
    customerId: string,
    subscription: Stripe.Subscription,
    languageCodes: string[],
    submissionId: string,
    sessionId: string
  ): Promise<{ sessionUrl?: string; sessionId?: string; error?: any }> {
    const stripe = this.stripeService.getStripeInstance()

    // Get the invoice ID from the subscription
    let invoiceId: string
    if (typeof subscription.latest_invoice === 'string') {
      invoiceId = subscription.latest_invoice
    } else if (subscription.latest_invoice?.id) {
      invoiceId = subscription.latest_invoice.id
    } else {
      throw new Error('No invoice found for subscription')
    }

    // Add language add-ons as invoice items
    const languageAddOnPromises = languageCodes.map((code: string) => {
      const language = EUROPEAN_LANGUAGES.find(l => l.code === code)
      return stripe.invoiceItems.create({
        customer: customerId,
        invoice: invoiceId,
        amount: 7500, // €75.00 in cents
        currency: 'eur',
        description: `${language?.nameEn} Language Add-on`,
        metadata: {
          language_code: code,
          one_time: 'true'
        }
      })
    })

    await Promise.all(languageAddOnPromises)

    // Retrieve the updated invoice
    const invoice = await stripe.invoices.retrieve(invoiceId)

    // Create a payment intent for the total amount
    const paymentIntent = await stripe.paymentIntents.create({
      amount: invoice.amount_due,
      currency: 'eur',
      customer: customerId,
      setup_future_usage: 'off_session',
      automatic_payment_methods: {
        enabled: true
      },
      metadata: {
        invoice_id: invoice.id,
        subscription_id: subscription.id,
        subscription_schedule_id: subscription.schedule as string,
        submission_id: submissionId,
        session_id: sessionId
      }
    })

    if (!paymentIntent.client_secret) {
      throw new Error('Payment intent client secret not available')
    }

    return {
      sessionUrl: paymentIntent.client_secret,
      sessionId: paymentIntent.id
    }
  }
}
