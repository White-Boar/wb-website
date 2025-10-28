import { NextResponse } from 'next/server'
import { StripePaymentService } from '@/services/payment/StripePaymentService'

// In-memory cache for prices (5-minute TTL)
let pricesCache: {
  data: any
  timestamp: number
} | null = null

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes in milliseconds

export async function GET() {
  try {
    // Check cache first
    if (pricesCache && Date.now() - pricesCache.timestamp < CACHE_TTL) {
      return NextResponse.json({
        success: true,
        data: pricesCache.data,
        cached: true
      })
    }

    // Fetch prices from Stripe
    const stripeService = new StripePaymentService()
    const prices = await stripeService.getPrices()

    // Update cache
    pricesCache = {
      data: prices,
      timestamp: Date.now()
    }

    return NextResponse.json({
      success: true,
      data: prices,
      cached: false
    })
  } catch (error) {
    console.error('Get prices error:', error)
    return NextResponse.json({
      success: false,
      error: {
        code: 'STRIPE_API_ERROR',
        message: 'Failed to retrieve prices from Stripe'
      }
    }, { status: 500 })
  }
}
