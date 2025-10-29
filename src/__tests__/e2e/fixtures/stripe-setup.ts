/**
 * Stripe Test Setup Utilities
 * Ensures test coupons exist and provides price fetching
 */

import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover'
})

/**
 * Ensures test coupons exist in Stripe test mode
 * Creates them if missing, skips if already exist
 */
export async function ensureTestCouponsExist() {
  const coupons = [
    {
      id: 'E2E_TEST_10',
      percent_off: 10,
      duration: 'forever' as const,
      name: 'E2E Test 10% Forever'
    },
    {
      id: 'E2E_TEST_20',
      percent_off: 20,
      duration: 'forever' as const,
      name: 'E2E Test 20% Forever'
    },
    {
      id: 'E2E_TEST_50_3MO',
      percent_off: 50,
      duration: 'repeating' as const,
      duration_in_months: 3,
      name: 'E2E Test 50% for 3 Months'
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
