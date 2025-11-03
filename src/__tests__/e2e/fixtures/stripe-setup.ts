/**
 * Stripe Test Setup Utilities
 * Ensures test coupons exist and provides price fetching
 */

import Stripe from 'stripe'
import * as dotenv from 'dotenv'
import path from 'path'

function createStripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) {
    const envPath = path.resolve(process.cwd(), '.env')
    dotenv.config({ path: envPath })
  }

  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is required for Stripe E2E fixtures. Set it in your environment or .env file.')
  }

  return new Stripe(secretKey, {
    apiVersion: '2025-09-30.clover'
  })
}

const stripe = createStripeClient()

/**
 * Ensures test coupons exist in Stripe test mode
 * Creates them if missing, skips if already exist
 */
export type CouponIdSet = {
  tenPercent: string
  twentyPercent: string
  fiftyPercentThreeMonths: string
}

function sanitizeSuffix(suffix?: string): string {
  if (!suffix) return ''
  const trimmed = suffix.trim()
  if (!trimmed) return ''
  return '_' + trimmed.replace(/[^A-Za-z0-9_]/g, '_')
}

export function getTestCouponIds(suffix?: string): CouponIdSet {
  const normalized = sanitizeSuffix(suffix)
  return {
    tenPercent: `E2E_TEST_10${normalized}`,
    twentyPercent: `E2E_TEST_20${normalized}`,
    fiftyPercentThreeMonths: `E2E_TEST_50_3MO${normalized}`
  }
}

export async function ensureTestCouponsExist(ids: CouponIdSet = getTestCouponIds()) {
  const coupons = [
    {
      id: ids.tenPercent,
      percent_off: 10,
      duration: 'forever' as const,
      name: `E2E Test 10% Forever ${ids.tenPercent}`.slice(0, 40)
    },
    {
      id: ids.twentyPercent,
      percent_off: 20,
      duration: 'forever' as const,
      name: `E2E Test 20% Forever ${ids.twentyPercent}`.slice(0, 40)
    },
    {
      id: ids.fiftyPercentThreeMonths,
      percent_off: 50,
      duration: 'repeating' as const,
      duration_in_months: 3,
      name: `E2E Test 50% for 3 Months ${ids.fiftyPercentThreeMonths}`.slice(0, 40)
    }
  ]

  for (const couponData of coupons) {
    try {
      // Try to retrieve existing coupon
      await stripe.coupons.retrieve(couponData.id)
      console.log(`✓ Coupon ${couponData.id} already exists`)
    } catch (error: any) {
      if (error.code === 'resource_missing') {
        // Create if doesn't exist
        await stripe.coupons.create(couponData)
        console.log(`✓ Created coupon ${couponData.id}`)
      } else {
        throw error
      }
    }
  }
}

/**
 * Gets actual Stripe prices to validate UI displays
 */
export async function getStripePrices() {
  const basePrice = await stripe.prices.retrieve(
    process.env.STRIPE_BASE_PACKAGE_PRICE_ID!
  )
  const addonPrice = await stripe.prices.retrieve(
    process.env.STRIPE_LANGUAGE_ADDON_PRICE_ID!
  )

  return {
    base: basePrice.unit_amount!, // cents
    addon: addonPrice.unit_amount!, // cents
    currency: basePrice.currency
  }
}
