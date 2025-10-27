import { NextRequest, NextResponse } from 'next/server'
import { requireCSRFToken } from '@/lib/csrf'
import { StripePaymentService } from '@/services/payment/StripePaymentService'

export async function POST(request: NextRequest) {
  try {
    const { discountCode, sessionId } = await request.json()

    if (!discountCode || typeof discountCode !== 'string') {
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
    const coupon = await stripeService.validateCoupon(discountCode)

    if (!coupon) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_DISCOUNT_CODE',
          message: 'Discount code is not valid or has expired'
        }
      }, { status: 400 })
    }

    // Calculate discount amount (for base package €35)
    const baseAmount = 3500 // €35 in cents
    let discountAmount = 0

    if (coupon.amount_off) {
      // Fixed amount discount
      discountAmount = coupon.amount_off
    } else if (coupon.percent_off) {
      // Percentage discount
      discountAmount = Math.round((baseAmount * coupon.percent_off) / 100)
    }

    return NextResponse.json({
      success: true,
      data: {
        code: coupon.id,
        amount: discountAmount,
        type: coupon.amount_off ? 'fixed' : 'percentage',
        value: coupon.amount_off || coupon.percent_off,
        duration: coupon.duration,
        durationInMonths: coupon.duration_in_months
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
