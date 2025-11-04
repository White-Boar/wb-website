import { NextRequest, NextResponse } from 'next/server'
import { requireCSRFToken } from '@/lib/csrf'
import { StripePaymentService } from '@/services/payment/StripePaymentService'

export async function POST(request: NextRequest) {
  try {
    const { discountCode, sessionId, additionalLanguages = [] } = await request.json()

    if (!discountCode || typeof discountCode !== 'string') {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Discount code is required'
        }
      }, { status: 400 })
    }

    const normalizedCode = discountCode.trim()

    if (!normalizedCode) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Discount code is required'
        }
      }, { status: 400 })
    }

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

    // Use service to validate discount code
    const stripeService = new StripePaymentService()
    const validatedDiscount = await stripeService.validateDiscountCode(normalizedCode)

    if (!validatedDiscount) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_DISCOUNT_CODE',
          message: 'Discount code is not valid or has expired'
        }
      }, { status: 400 })
    }

    const { coupon, promotionCode } = validatedDiscount
    const displayCode = promotionCode?.code ?? normalizedCode

    // Get base package price ID
    const baseProductId = process.env.STRIPE_BASE_PACKAGE_PRICE_ID!
    if (!baseProductId) {
      throw new Error('STRIPE_BASE_PACKAGE_PRICE_ID not configured')
    }

    // Calculate number of language add-ons
    const languageAddOnCount = Array.isArray(additionalLanguages) ? additionalLanguages.length : 0

    // Preview invoice with Stripe to get exact amounts
    const preview = await stripeService.previewInvoiceWithDiscount(
      null, // No customer yet (will create temporary)
      baseProductId,
      coupon.id,
      languageAddOnCount
    )

    return NextResponse.json({
      success: true,
      data: {
        code: displayCode,
        couponId: coupon.id,
        promotionCodeId: promotionCode?.id ?? null,
        enteredCode: normalizedCode,
        amount: preview.discountAmount, // Use Stripe's calculated discount in cents
        type: coupon.amount_off ? 'fixed' : 'percentage',
        duration: coupon.duration,
        durationInMonths: coupon.duration_in_months,
        // Stripe-calculated preview values
        preview: {
          subtotal: preview.subtotal,
          discountAmount: preview.discountAmount,
          total: preview.total,
          recurringAmount: preview.subscriptionAmount,
          recurringDiscount: preview.subscriptionDiscount,
          lineItems: preview.lineItems
        }
      }
    })
  } catch (error) {
    console.error('Validate discount error:', error)
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to validate discount code'
      }
    }, { status: 500 })
  }
}
