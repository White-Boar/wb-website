import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { requireCSRFToken } from '@/lib/csrf'
import { CheckoutSessionService } from '@/services/payment/CheckoutSessionService'

/**
 * POST /api/stripe/create-checkout-session
 * Creates a Stripe Subscription Schedule with invoice items for language add-ons
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      submission_id,
      session_id,
      additionalLanguages = [],
      discountCode,
      successUrl,
      cancelUrl
    } = body

    console.log('[api/stripe/create-checkout-session] incoming request', {
      submission_id,
      session_id,
      discountCode,
      additionalLanguagesCount: Array.isArray(additionalLanguages) ? additionalLanguages.length : 0
    })

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

    const csrfKey = session_id || submission_id

    // Validate CSRF token
    const csrfValidation = requireCSRFToken(request, csrfKey)
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

    // Initialize services
    const supabase = await createServiceClient()
    const checkoutService = new CheckoutSessionService()

    // Create checkout session using the service
    const result = await checkoutService.createCheckoutSession(
      {
        submissionId: submission_id,
        additionalLanguages,
        discountCode,
        successUrl,
        cancelUrl
      },
      supabase
    )

    // Return result
    if (!result.success) {
      console.error('[api/stripe/create-checkout-session] failed', {
        submission_id,
        discountCode,
        error: result.error
      })
      const statusCode = result.error?.code === 'RATE_LIMIT_EXCEEDED' ? 429 :
                        result.error?.code === 'PAYMENT_ALREADY_COMPLETED' ? 409 :
                        result.error?.code === 'MISSING_CUSTOMER_EMAIL' ? 400 :
                        result.error?.code === 'INVALID_LANGUAGE_CODE' ? 400 :
                        result.error?.code === 'INVALID_DISCOUNT_CODE' ? 400 :
                        500

      return NextResponse.json(
        {
          success: false,
          error: result.error
        },
        { status: statusCode }
      )
    }

    let debugInvoice: { invoiceId: string; total?: number; totalDiscount?: number } | undefined
    if (process.env.NODE_ENV !== 'production' && result.invoiceId) {
      try {
        const stripeSecretKey = process.env.STRIPE_SECRET_KEY
        if (stripeSecretKey) {
          const { default: Stripe } = await import('stripe')
          const stripe = new Stripe(stripeSecretKey, { apiVersion: '2025-09-30.clover' })
          const invoice = await stripe.invoices.retrieve(result.invoiceId, { expand: ['total_discount_amounts'] })
          debugInvoice = {
            invoiceId: result.invoiceId,
            total: invoice.total ?? undefined,
            totalDiscount: (invoice.total_discount_amounts || []).reduce((sum, d) => sum + d.amount, 0)
          }
        }
      } catch (debugError) {
        console.warn('Debug invoice lookup failed:', debugError)
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        paymentRequired: result.paymentRequired,
        clientSecret: result.clientSecret,
        invoiceId: result.invoiceId || null,
        sessionId: result.paymentRequired ? result.invoiceId || null : null,
        customerId: result.customerId,
        subscriptionId: result.subscriptionId,
        invoiceTotal: result.invoiceTotal ?? null,
        invoiceDiscount: result.invoiceDiscount ?? null,
        couponId: result.couponId ?? null,
        requestedDiscountCode: discountCode ?? null,
        ...(debugInvoice ? { debugInvoice } : {})
      }
    })
  } catch (error) {
    console.error('Checkout session route error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create checkout session. Please try again.'
        }
      },
      { status: 500 }
    )
  }
}
