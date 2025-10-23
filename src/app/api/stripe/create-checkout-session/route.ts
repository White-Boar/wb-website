import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServiceClient } from '@/lib/supabase'
import { stripe } from '@/lib/stripe'
import { EUROPEAN_LANGUAGES, isValidLanguageCode } from '@/data/european-languages'
import { requireCSRFToken } from '@/lib/csrf'

const BASE_PACKAGE_PRICE_ID = process.env.STRIPE_BASE_PACKAGE_PRICE_ID!

/**
 * POST /api/stripe/create-checkout-session
 * Creates a Stripe Subscription Schedule with invoice items for language add-ons
 */
export async function POST(request: NextRequest) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(7)}`

  try {
    const body = await request.json()
    const {
      submission_id,
      additionalLanguages = [],
      discountCode,
      successUrl,
      cancelUrl
    } = body

    // Validate required fields
    if (!submission_id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_SUBMISSION_ID',
            message: 'Submission ID is required'
          }
        },
        { status: 400 }
      )
    }

    // Validate CSRF token
    const csrfValidation = requireCSRFToken(request, submission_id)
    if (!csrfValidation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CSRF_VALIDATION_FAILED',
            message: csrfValidation.error
          }
        },
        { status: 403 }
      )
    }

    // Initialize Supabase client
    const supabase = createServiceClient()

    // Fetch submission from database
    const { data: submission, error: fetchError } = await supabase
      .from('onboarding_submissions')
      .select('*')
      .eq('id', submission_id)
      .single()

    if (fetchError || !submission) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_SUBMISSION_ID',
            message: 'Submission not found or not in submitted status'
          }
        },
        { status: 400 }
      )
    }

    // Check if payment already exists
    if (submission.stripe_subscription_id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PAYMENT_ALREADY_COMPLETED',
            message: 'This submission has already been paid'
          }
        },
        { status: 409 }
      )
    }

    // Validate language codes
    const invalidLanguages = additionalLanguages.filter(
      (code: string) => !isValidLanguageCode(code)
    )

    if (invalidLanguages.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_LANGUAGE_CODE',
            message: `Invalid language codes: ${invalidLanguages.join(', ')}`
          }
        },
        { status: 400 }
      )
    }

    // Check rate limiting (5 attempts per hour per session)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count: recentAttempts } = await supabase
      .from('onboarding_analytics')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', submission.session_id)
      .eq('event_type', 'payment_attempt')
      .gte('created_at', oneHourAgo)

    if (recentAttempts && recentAttempts >= 5) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many payment attempts. Please try again in 1 hour.'
          }
        },
        { status: 429 }
      )
    }

    // Log payment attempt
    await supabase.from('onboarding_analytics').insert({
      session_id: submission.session_id,
      event_type: 'payment_attempt',
      event_data: {
        submission_id,
        language_count: additionalLanguages.length
      }
    })

    // Get customer email from submission
    // Try multiple locations: form_data.email (Step 1), form_data.businessEmail (Step 3),
    // legacy nested structure, and finally top-level submission.email
    const customerEmail = submission.form_data?.email ||
                         submission.form_data?.businessEmail ||
                         submission.form_data?.step3?.businessEmail ||
                         submission.email

    const businessName = submission.form_data?.businessName ||
                        submission.form_data?.step3?.businessName ||
                        submission.business_name

    if (!customerEmail) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_CUSTOMER_EMAIL',
            message: 'Customer email not found in submission'
          }
        },
        { status: 400 }
      )
    }

    // Create or retrieve Stripe customer
    const customers = await stripe.customers.list({
      email: customerEmail,
      limit: 1
    })

    let customer: Stripe.Customer
    if (customers.data.length > 0) {
      customer = customers.data[0]
    } else {
      customer = await stripe.customers.create({
        email: customerEmail,
        name: businessName,
        metadata: {
          submission_id,
          session_id: submission.session_id
        }
      })
    }

    // Validate discount code if provided
    let validatedCoupon: Stripe.Coupon | null = null
    if (discountCode) {
      try {
        validatedCoupon = await stripe.coupons.retrieve(discountCode)
        if (!validatedCoupon.valid) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'INVALID_DISCOUNT_CODE',
                message: `Discount code '${discountCode}' is not valid or has expired`
              }
            },
            { status: 400 }
          )
        }
      } catch (error) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_DISCOUNT_CODE',
              message: `Discount code '${discountCode}' does not exist`
            }
          },
          { status: 400 }
        )
      }
    }

    // Create subscription schedule with 12-month commitment FIRST
    const now = Math.floor(Date.now() / 1000)
    // Calculate 12 months from now (approximately 365 days)
    const twelveMonthsLater = now + (12 * 30 * 24 * 60 * 60) // 12 months in seconds

    const schedule = await stripe.subscriptionSchedules.create({
      customer: customer.id,
      start_date: 'now',
      end_behavior: 'release',
      phases: [
        {
          items: [
            {
              price: BASE_PACKAGE_PRICE_ID,
              quantity: 1
            }
          ],
          end_date: twelveMonthsLater,
          ...(validatedCoupon && {
            discounts: [{
              coupon: validatedCoupon.id
            }]
          })
        }
      ],
      metadata: {
        submission_id,
        session_id: submission.session_id,
        commitment_months: '12'
      }
    })

    // Get the subscription created by the schedule
    const subscription = await stripe.subscriptions.retrieve(schedule.subscription as string, {
      expand: ['latest_invoice']
    })

    // Add language add-ons as invoice items to the first invoice
    let invoiceId: string
    if (typeof subscription.latest_invoice === 'string') {
      invoiceId = subscription.latest_invoice
    } else if (subscription.latest_invoice?.id) {
      invoiceId = subscription.latest_invoice.id
    } else {
      throw new Error('No invoice found for subscription')
    }

    const languageAddOnPromises = additionalLanguages.map((code: string) => {
      const language = EUROPEAN_LANGUAGES.find(l => l.code === code)
      return stripe.invoiceItems.create({
        customer: customer.id,
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

    // Retrieve the updated invoice with language add-ons
    const invoice = await stripe.invoices.retrieve(invoiceId)

    // Create a payment intent for the total amount
    // We create this separately because subscription schedules don't auto-create payment intents
    const paymentIntent = await stripe.paymentIntents.create({
      amount: invoice.amount_due,
      currency: 'eur',
      customer: customer.id,
      setup_future_usage: 'off_session',
      automatic_payment_methods: {
        enabled: true
      },
      metadata: {
        invoice_id: invoice.id,
        subscription_id: subscription.id,
        subscription_schedule_id: schedule.id,
        submission_id,
        session_id: submission.session_id
      }
    })

    if (!paymentIntent.client_secret) {
      throw new Error('Payment intent client secret not available')
    }

    const finalInvoice = invoice

    // Build line items for response
    const lineItems = [
      {
        description: 'WhiteBoar Base Package (€35/month)',
        quantity: 1,
        unitAmount: 3500,
        totalAmount: 3500,
        recurring: true
      },
      ...additionalLanguages.map((code: string) => {
        const language = EUROPEAN_LANGUAGES.find(l => l.code === code)
        return {
          description: `${language?.nameEn} Language Add-on`,
          quantity: 1,
          unitAmount: 7500,
          totalAmount: 7500,
          recurring: false
        }
      })
    ]

    // Calculate discount if applied
    let discountApplied = undefined
    if (validatedCoupon && finalInvoice.total_discount_amounts) {
      const totalDiscount = finalInvoice.total_discount_amounts.reduce(
        (sum, discount) => sum + discount.amount,
        0
      )
      discountApplied = {
        code: validatedCoupon.id,
        amount: totalDiscount
      }
    }

    // Return client secret and session details
    return NextResponse.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        subscriptionId: subscription.id,
        subscriptionScheduleId: schedule.id,
        customerId: customer.id,
        totalAmount: finalInvoice.amount_due,
        currency: 'EUR',
        lineItems,
        discountApplied
      }
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'STRIPE_API_ERROR',
          message: 'Failed to create checkout session. Please try again.'
        }
      },
      { status: 500 }
    )
  }
}
