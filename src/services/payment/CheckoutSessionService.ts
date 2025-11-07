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

  private async cancelPendingStripeResources(
    submission: any,
    supabase: SupabaseClient
  ): Promise<void> {
    const stripe = this.stripeService.getStripeInstance()

    console.log('Cancelling pending Stripe resources for submission', {
      submissionId: submission.id,
      stripe_subscription_id: submission.stripe_subscription_id,
      stripe_subscription_schedule_id: submission.stripe_subscription_schedule_id
    })

    const scheduleId = submission.stripe_subscription_schedule_id as string | null
    const subscriptionId = submission.stripe_subscription_id as string | null

    if (scheduleId) {
      try {
        await stripe.subscriptionSchedules.cancel(scheduleId, {
          invoice_now: false,
          prorate: false
        })
      } catch (error) {
        console.error('Failed to cancel subscription schedule during reset:', error)
      }
    }

    if (subscriptionId) {
      try {
        await stripe.subscriptions.cancel(subscriptionId, {
          invoice_now: false,
          prorate: false
        })
      } catch (error) {
        console.error('Failed to cancel subscription during reset:', error)
      }
    }

    const { error: cleanupError } = await supabase
      .from('onboarding_submissions')
      .update({
        stripe_subscription_id: null,
        stripe_subscription_schedule_id: null,
        stripe_payment_id: null,
        payment_amount: null,
        payment_completed_at: null,
        payment_metadata: null,
        status: submission.status === 'paid' ? 'submitted' : submission.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', submission.id)

    if (cleanupError) {
      console.error('Failed to reset submission state during cancel', cleanupError)
    }

    submission.stripe_subscription_id = null
    submission.stripe_subscription_schedule_id = null
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
    let submission: any | null = null
    let fetchError: any = null

    for (let attempt = 0; attempt < 2 && !submission; attempt++) {
      const { data, error } = await supabase
        .from('onboarding_submissions')
        .select('*')
        .eq('id', submissionId)
        .single()

      if (data) {
        submission = data
        break
      }

      fetchError = error

      if (error?.code !== 'PGRST116') {
        break
      }

      await new Promise(resolve => setTimeout(resolve, 250))
    }

    if (!submission) {
      console.error('CheckoutSessionService.validateSubmission failed', {
        submissionId,
        fetchError
      })
      return {
        valid: false,
        error: {
          code: 'INVALID_SUBMISSION_ID',
          message: 'Submission not found or not in submitted status',
          status: 400
        }
      }
    }

    // Check if subscription already exists
    if (submission.stripe_subscription_id) {
      // Subscription exists - need to check if payment is pending or completed
      // We'll return the submission and let createCheckoutSession handle retrieving
      // the existing client secret if payment is still pending
      console.log('CheckoutSessionService.validateSubmission existing subscription', {
        submissionId,
        stripe_subscription_id: submission.stripe_subscription_id
      })
      return {
        valid: true,
        submission,
        existingSubscription: true
      }
    }

    console.log('CheckoutSessionService.validateSubmission success', {
      submissionId
    })

    return {
      valid: true,
      submission,
      existingSubscription: false
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
          paymentRequired: true,
          clientSecret: null,
          error: validationResult.error
        }
      }
      const submission = validationResult.submission

      // 1b. Extract additionalLanguages from submission's form_data (source of truth)
      // The frontend may pass additionalLanguages, but we should trust the database
      const formLanguages = submission.form_data?.step13?.additionalLanguages || submission.form_data?.additionalLanguages || []
      const submissionLanguages = Array.isArray(formLanguages)
        ? [...new Set(formLanguages.filter((code: unknown): code is string => typeof code === 'string'))]
        : []
      const fallbackLanguages = Array.isArray(additionalLanguages)
        ? [...new Set(additionalLanguages.filter((code: unknown): code is string => typeof code === 'string'))]
        : []
      const languagesToUse = submissionLanguages.length > 0 ? submissionLanguages : fallbackLanguages

      // 1a. Handle existing subscription - retrieve existing client secret
    if (validationResult.existingSubscription && submission.stripe_subscription_id) {
      console.warn('Existing subscription detected – resetting Stripe resources')
      await this.cancelPendingStripeResources(submission, supabase)
      submission.stripe_subscription_id = null
      submission.stripe_subscription_schedule_id = null
      validationResult.existingSubscription = false
    }

      // 2. Validate language codes
      const invalidLanguages = this.validateLanguageCodes(languagesToUse)
      if (invalidLanguages.length > 0) {
        return {
          success: false,
          paymentRequired: true,
          clientSecret: null,
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
          paymentRequired: true,
          clientSecret: null,
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
        languagesToUse.length,
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
        console.log('[CheckoutSessionService] coupon validation result', {
          discountCode,
          validatedCoupon: validatedCoupon ? { id: validatedCoupon.id, valid: validatedCoupon.valid, duration: validatedCoupon.duration } : null
        })
        if (!validatedCoupon) {
          return {
            success: false,
            paymentRequired: true,
            clientSecret: null,
            error: {
              code: 'INVALID_DISCOUNT_CODE',
              message: `Discount code '${discountCode}' is not valid or has expired`
            }
          }
        }
      }


      // Persist discount code in form data for auditing/UI
      if (validatedCoupon && discountCode) {
        const updatedFormData = {
          ...(submission.form_data || {})
        }
        updatedFormData.discountCode = discountCode
        updatedFormData.step14 = {
          ...(updatedFormData.step14 || {}),
          discountCode
        }
        submission.form_data = updatedFormData
      } else if (!discountCode && submission.form_data?.discountCode) {
        const updatedFormData = {
          ...(submission.form_data || {})
        }
        delete updatedFormData.discountCode
        if (updatedFormData.step14) {
          delete updatedFormData.step14.discountCode
        }
        submission.form_data = updatedFormData
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

      const stripe = this.stripeService.getStripeInstance()
      const subscriptionMetadata = {
        ...(subscription.metadata || {}),
        submission_id: submissionId,
        session_id: submission.session_id,
        ...(validatedCoupon ? { discount_code: validatedCoupon.id } : {})
      }

      try {
        await stripe.subscriptions.update(subscription.id, {
          metadata: subscriptionMetadata
        })
      } catch (metadataError) {
        console.error('Failed to update subscription metadata:', metadataError)
      }

      // 9. Add language add-ons as invoice items (use database value)
      const addOnResult = await this.addLanguageAddOns(
        customer.id,
        subscription,
        languagesToUse,
        submissionId,
        submission.session_id,
        validatedCoupon?.id ?? null
      )

      console.log('[CheckoutSessionService] addLanguageAddOns result', {
        submissionId,
        invoiceId: addOnResult.invoiceId,
        paymentRequired: addOnResult.paymentRequired,
        couponId: validatedCoupon?.id || null,
        invoiceTotal: addOnResult.invoiceTotal,
        invoiceDiscount: addOnResult.invoiceDiscount,
        paymentIntentId: addOnResult.paymentIntentId || null
      })

      // 10. Update submission with Stripe IDs (including payment intent ID for mock webhooks)
      const { error: updateError } = await supabase
        .from('onboarding_submissions')
        .update({
          stripe_customer_id: customer.id,
          stripe_subscription_id: subscription.id,
          stripe_subscription_schedule_id: schedule.id,
          stripe_payment_id: addOnResult.paymentIntentId || null,
          form_data: submission.form_data,
          updated_at: new Date().toISOString()
        })
        .eq('id', submissionId)

      if (updateError) {
        console.error('[CheckoutSessionService] Failed to update submission with Stripe IDs:', updateError)
      } else {
        console.log('[CheckoutSessionService] Updated submission with Stripe IDs', {
          submissionId,
          customerId: customer.id,
          subscriptionId: subscription.id,
          scheduleId: schedule.id,
          paymentIntentId: addOnResult.paymentIntentId || null
        })
      }

      console.log('[CheckoutSessionService] returning session creation result', {
        submissionId,
        paymentRequired: addOnResult.paymentRequired,
        clientSecret: addOnResult.clientSecret ? 'present' : null,
        invoiceId: addOnResult.invoiceId
      })

      return {
        success: true,
        paymentRequired: addOnResult.paymentRequired,
        clientSecret: addOnResult.clientSecret,
        invoiceId: addOnResult.invoiceId,
        customerId: customer.id,
        subscriptionId: subscription.id,
        invoiceTotal: addOnResult.invoiceTotal,
        invoiceDiscount: addOnResult.invoiceDiscount,
        couponId: validatedCoupon?.id ?? null
      }
    } catch (error) {
      console.error('Checkout session creation error:', error)

      // Check for specific error types
      if (error instanceof Error && error.message.startsWith('MISSING_CUSTOMER_EMAIL')) {
        return {
          success: false,
          paymentRequired: true,
          clientSecret: null,
          error: {
            code: 'MISSING_CUSTOMER_EMAIL',
            message: 'Customer email not found in submission'
          }
        }
      }

      return {
        success: false,
        paymentRequired: true,
        clientSecret: null,
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
    sessionId: string,
    couponId?: string | null
  ): Promise<{
    paymentRequired: boolean
    clientSecret: string | null
    invoiceId: string
    invoiceTotal: number
    invoiceDiscount: number
    paymentIntentId?: string | null
  }> {
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

    // Fetch language add-on price from Stripe
    const languageAddonPriceId = process.env.STRIPE_LANGUAGE_ADDON_PRICE_ID!
    const addonPrice = await stripe.prices.retrieve(languageAddonPriceId)

    // Add language add-ons as invoice items
    const languageAddOnPromises = languageCodes.map((code: string) => {
      const language = EUROPEAN_LANGUAGES.find(l => l.code === code)
      return stripe.invoiceItems.create({
        customer: customerId,
        invoice: invoiceId,
        pricing: {
          price: addonPrice.id
        },
        description: `${language?.nameEn} Language Add-on`,
        metadata: {
          language_code: code,
          one_time: 'true'
        }
      })
    })

    await Promise.all(languageAddOnPromises)

    if (couponId) {
      try {
        await stripe.invoices.update(invoiceId, {
          discounts: [{ coupon: couponId }]
        })
      } catch (discountAttachError) {
        console.error('Failed to attach coupon discount to invoice:', discountAttachError)
      }
    }

    try {
      const invoicePreview = await stripe.invoices.retrieve(invoiceId, { expand: ['total_discount_amounts'] })
      console.log('[CheckoutSessionService] invoice before finalize', {
        invoiceId,
        total: invoicePreview.total,
        discountAmounts: invoicePreview.total_discount_amounts,
        couponId
      })
    } catch (previewError) {
      console.error('Failed to retrieve invoice before finalize:', previewError)
    }

    // Attach metadata to invoice so webhook events can resolve the submission reliably
    try {
      await stripe.invoices.update(invoiceId, {
        metadata: {
          submission_id: submissionId,
          session_id: sessionId
        }
      })
    } catch (invoiceMetadataError) {
      console.error('Failed to attach metadata to invoice:', invoiceMetadataError)
    }

    // Finalize the invoice to create the Payment Intent with discounts automatically applied
    // NOTE: In Stripe API v2025-09-30.clover+, payment_intent is no longer directly on invoice
    // Instead, it's nested in payments array: invoice.payments.data[0].payment.payment_intent
    const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoiceId, {
      expand: ['confirmation_secret', 'payments', 'total_discount_amounts']
    })

    console.log('[CheckoutSessionService] finalized invoice', {
      invoiceId: finalizedInvoice.id,
      total: finalizedInvoice.total,
      subtotal: finalizedInvoice.subtotal,
      totalDiscount: (finalizedInvoice.total_discount_amounts || []).reduce((sum, d) => sum + d.amount, 0),
      discountAmounts: finalizedInvoice.total_discount_amounts,
      couponId,
      paymentsCount: (finalizedInvoice as any).payments?.data?.length || 0,
      firstPaymentIntentId: (finalizedInvoice as any).payments?.data?.[0]?.payment?.payment_intent
    })

    // Handle zero-amount invoices (discount >= total)
    const invoiceIdValue = finalizedInvoice.id

    if (finalizedInvoice.amount_due <= 0) {
      // Stripe automatically marks zero-amount invoices as paid
      return {
        paymentRequired: false,
        clientSecret: null,
        invoiceId: invoiceIdValue,
        invoiceTotal: finalizedInvoice.total ?? 0,
        invoiceDiscount: (finalizedInvoice.total_discount_amounts || []).reduce((sum, d) => sum + d.amount, 0),
        paymentIntentId: null
      }
    }

    // Extract PaymentIntent ID from the payments array (Stripe API v2025-09-30.clover+)
    // In newer Stripe APIs, payment_intent is nested in: invoice.payments.data[0].payment.payment_intent
    const paymentsData = (finalizedInvoice as any).payments?.data
    const firstPayment = paymentsData?.[0]?.payment
    const paymentIntentId = typeof firstPayment?.payment_intent === 'string'
      ? firstPayment.payment_intent
      : firstPayment?.payment_intent?.id

    if (paymentIntentId) {
      await stripe.paymentIntents.update(paymentIntentId, {
        metadata: {
          submission_id: submissionId,
          session_id: sessionId
        }
      })
    }

    // Use the invoice's confirmation_secret which contains the PaymentIntent client_secret
    // Stripe automatically creates this during finalization with discounts applied
    const confirmationSecret = finalizedInvoice.confirmation_secret

    if (!confirmationSecret?.client_secret) {
      throw new Error('Invoice confirmation secret not available')
    }

    return {
      paymentRequired: true,
      clientSecret: confirmationSecret.client_secret,
      invoiceId: invoiceIdValue,
      invoiceTotal: finalizedInvoice.total ?? 0,
      invoiceDiscount: (finalizedInvoice.total_discount_amounts || []).reduce((sum, d) => sum + d.amount, 0),
      paymentIntentId: paymentIntentId || null
    }
  }
}
