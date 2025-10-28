import { NextRequest, NextResponse } from 'next/server'
import { requireCSRFToken } from '@/lib/csrf'
import { StripePaymentService } from '@/services/payment/StripePaymentService'

export async function POST(request: NextRequest) {
  try {
    const { sessionId, additionalLanguages = [], discountCode = null } = await request.json()

    if (!sessionId) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Session ID is required'
        }
      }, { status: 400 })
    }

    // Validate CSRF token
    const csrfValidation = requireCSRFToken(request, sessionId)
    if (!csrfValidation.valid) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'CSRF_VALIDATION_FAILED',
          message: csrfValidation.error
        }
      }, { status: 403 })
    }

    // Get base package price ID
    const baseProductId = process.env.STRIPE_BASE_PACKAGE_PRICE_ID!
    if (!baseProductId) {
      throw new Error('STRIPE_BASE_PACKAGE_PRICE_ID not configured')
    }

    const stripeService = new StripePaymentService()

    // Validate discount code if provided
    let validatedCoupon = null
    let discountError = null
    let couponDuration = null
    let couponDurationInMonths = null

    if (discountCode) {
      validatedCoupon = await stripeService.validateCoupon(discountCode)
      if (!validatedCoupon) {
        discountError = 'Discount code is not valid or has expired'
      } else {
        couponDuration = validatedCoupon.duration
        couponDurationInMonths = validatedCoupon.duration_in_months
      }
    }

    // Calculate number of language add-ons
    const languageAddOnCount = Array.isArray(additionalLanguages) ? additionalLanguages.length : 0

    // Preview invoice with Stripe to get exact amounts
    const preview = await stripeService.previewInvoiceWithDiscount(
      null, // No customer yet (will create temporary)
      baseProductId,
      validatedCoupon?.id || null,
      languageAddOnCount
    )

    return NextResponse.json({
      success: true,
      data: {
        preview: {
          subtotal: preview.subtotal,
          discountAmount: preview.discountAmount,
          total: preview.total,
          recurringAmount: preview.subscriptionAmount,
          recurringDiscount: preview.subscriptionDiscount,
          lineItems: preview.lineItems
        },
        ...(discountCode && {
          code: validatedCoupon?.id,
          duration: couponDuration,
          durationInMonths: couponDurationInMonths
        }),
        ...(discountError && { discountError })
      }
    })
  } catch (error) {
    console.error('Preview invoice error:', error)
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to preview invoice'
      }
    }, { status: 500 })
  }
}
