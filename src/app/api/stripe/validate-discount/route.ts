import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia'
})

export async function POST(request: NextRequest) {
  try {
    const { discountCode } = await request.json()

    if (!discountCode || typeof discountCode !== 'string') {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Discount code is required'
        }
      }, { status: 400 })
    }

    // Validate the discount code with Stripe
    try {
      const coupon = await stripe.coupons.retrieve(discountCode.trim())

      // Check if the coupon is valid
      if (!coupon.valid) {
        return NextResponse.json({
          success: false,
          error: {
            code: 'INVALID_DISCOUNT_CODE',
            message: `Discount code '${discountCode}' is not valid or has expired`
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
          value: coupon.amount_off || coupon.percent_off
        }
      })

    } catch (error) {
      // Coupon doesn't exist or other Stripe error
      if (error instanceof Stripe.errors.StripeError) {
        return NextResponse.json({
          success: false,
          error: {
            code: 'INVALID_DISCOUNT_CODE',
            message: `Discount code '${discountCode}' does not exist`
          }
        }, { status: 400 })
      }
      throw error
    }

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
