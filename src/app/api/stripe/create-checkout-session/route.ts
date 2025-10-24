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

    return NextResponse.json({
      success: true,
      data: {
        clientSecret: result.sessionUrl,
        sessionId: result.sessionId,
        customerId: result.customerId,
        subscriptionId: result.subscriptionId
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
