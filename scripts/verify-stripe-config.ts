/**
 * Stripe Configuration Verification Script
 *
 * Run this to verify your Stripe setup before testing payments
 * Usage: ts-node scripts/verify-stripe-config.ts
 */

import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
})

async function verifyStripeConfig() {
  console.log('🔍 Verifying Stripe Configuration...\n')

  const errors: string[] = []
  const warnings: string[] = []

  // Check environment variables
  console.log('1️⃣ Checking Environment Variables:')

  const requiredEnvVars = [
    'STRIPE_SECRET_KEY',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'STRIPE_BASE_PACKAGE_PRICE_ID',
  ]

  requiredEnvVars.forEach((varName) => {
    if (process.env[varName]) {
      console.log(`   ✅ ${varName}: ${process.env[varName]?.substring(0, 20)}...`)
    } else {
      console.log(`   ❌ ${varName}: MISSING`)
      errors.push(`Missing environment variable: ${varName}`)
    }
  })

  // Check Base Package Price ID
  console.log('\n2️⃣ Checking Base Package Price:')
  try {
    const basePriceId = process.env.STRIPE_BASE_PACKAGE_PRICE_ID!

    // Check if it's a product ID instead of price ID
    if (basePriceId.startsWith('prod_')) {
      console.log(`   ⚠️  STRIPE_BASE_PACKAGE_PRICE_ID appears to be a Product ID (${basePriceId})`)
      console.log(`   ℹ️  Fetching prices for this product...`)

      const prices = await stripe.prices.list({
        product: basePriceId,
        active: true,
      })

      if (prices.data.length === 0) {
        errors.push('No active prices found for the product')
        console.log(`   ❌ No active prices found for product ${basePriceId}`)
      } else {
        console.log(`   ✅ Found ${prices.data.length} active price(s):`)
        prices.data.forEach((price) => {
          const amount = price.unit_amount ? price.unit_amount / 100 : 0
          const interval = price.recurring?.interval || 'one-time'
          console.log(`      - ${price.id}: €${amount}/${interval}`)

          if (amount === 35 && interval === 'month') {
            console.log(`      ✨ This looks like your base package price!`)
            console.log(`      💡 Update .env with: STRIPE_BASE_PACKAGE_PRICE_ID=${price.id}`)
          }
        })
      }
    } else if (basePriceId.startsWith('price_')) {
      const price = await stripe.prices.retrieve(basePriceId)
      const amount = price.unit_amount ? price.unit_amount / 100 : 0
      const interval = price.recurring?.interval || 'one-time'

      console.log(`   ✅ Price retrieved: ${price.id}`)
      console.log(`   💰 Amount: €${amount}/${interval}`)

      if (amount !== 35) {
        warnings.push(`Expected €35/month, but found €${amount}/${interval}`)
        console.log(`   ⚠️  Expected €35/month, but found €${amount}/${interval}`)
      }

      if (interval !== 'month') {
        warnings.push(`Expected monthly billing, but found ${interval}`)
        console.log(`   ⚠️  Expected monthly billing, but found ${interval}`)
      }
    } else {
      errors.push('STRIPE_BASE_PACKAGE_PRICE_ID has invalid format')
      console.log(`   ❌ Invalid format: ${basePriceId}`)
    }
  } catch (error: any) {
    errors.push(`Failed to verify base package price: ${error.message}`)
    console.log(`   ❌ Error: ${error.message}`)
  }

  // Check Language Add-on Price (optional)
  if (process.env.STRIPE_LANGUAGE_ADDON_PRICE_ID) {
    console.log('\n3️⃣ Checking Language Add-on Price (optional):')
    try {
      const addonPriceId = process.env.STRIPE_LANGUAGE_ADDON_PRICE_ID!

      if (addonPriceId.startsWith('prod_')) {
        console.log(`   ⚠️  STRIPE_LANGUAGE_ADDON_PRICE_ID appears to be a Product ID`)
        console.log(`   ℹ️  This is optional - language add-ons are created as invoice items`)
      } else {
        console.log(`   ℹ️  Language add-ons are created as invoice items (€75 each)`)
        console.log(`   ℹ️  This environment variable is not required for the implementation`)
      }
    } catch (error: any) {
      console.log(`   ⚠️  ${error.message}`)
    }
  }

  // Test webhook secret
  console.log('\n4️⃣ Checking Webhook Secret:')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (webhookSecret?.startsWith('whsec_')) {
    console.log(`   ✅ Webhook secret format looks correct`)
    console.log(`   ℹ️  Test webhooks locally with: stripe listen --forward-to localhost:3783/api/stripe/webhook`)
  } else {
    warnings.push('Webhook secret format may be incorrect')
    console.log(`   ⚠️  Webhook secret format looks unusual`)
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 Verification Summary:')
  console.log('='.repeat(60))

  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ All checks passed! Your Stripe configuration looks good.')
  } else {
    if (errors.length > 0) {
      console.log(`\n❌ ${errors.length} Error(s):`)
      errors.forEach((error, i) => console.log(`   ${i + 1}. ${error}`))
    }

    if (warnings.length > 0) {
      console.log(`\n⚠️  ${warnings.length} Warning(s):`)
      warnings.forEach((warning, i) => console.log(`   ${i + 1}. ${warning}`))
    }
  }

  console.log('\n' + '='.repeat(60))
}

verifyStripeConfig().catch(console.error)
