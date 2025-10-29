/**
 * Step 14: Comprehensive Stripe Validation Tests
 * Tests that validate actual Stripe objects match UI and database
 */

import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'
import { seedStep14TestSession, cleanupTestSession } from './helpers/seed-step14-session'
import { ensureTestCouponsExist, getStripePrices } from './fixtures/stripe-setup'
import { validateStripePaymentComplete } from './helpers/stripe-validation'
import { getUIPaymentAmount, getUIRecurringAmount, fillStripePaymentForm } from './helpers/ui-parser'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

// Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase credentials required for payment flow tests')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Helper: Wait for webhook processing
async function waitForPaymentCompletion(submissionId: string): Promise<boolean> {
  const maxAttempts = 40
  const delayMs = 500

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const { data: submission } = await supabase
      .from('onboarding_submissions')
      .select('status')
      .eq('id', submissionId)
      .single()

    if (submission?.status === 'paid') {
      return true
    }

    if (attempt < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }

  console.warn(`⚠️  Webhook not processed after ${maxAttempts} attempts`)
  return false
}

// Helper: Get submission
async function getSubmission(submissionId: string) {
  const { data, error } = await supabase
    .from('onboarding_submissions')
    .select('*')
    .eq('id', submissionId)
    .single()

  if (error || !data) {
    throw new Error(`Failed to fetch submission: ${error?.message}`)
  }

  return data
}

test.describe('Step 14: Stripe Validation (Comprehensive)', () => {
  test.describe.configure({ mode: 'serial' })

  test.beforeAll(async () => {
    console.log('\n=== STRIPE VALIDATION TESTS ===')
    console.log('Setting up test coupons...')
    await ensureTestCouponsExist()

    const prices = await getStripePrices()
    console.log('✓ Stripe connected')
    console.log('✓ Base price: €' + (prices.base / 100))
    console.log('✓ Add-on price: €' + (prices.addon / 100))
    console.log('')
  })

  test.afterEach(async () => {
    await new Promise(resolve => setTimeout(resolve, 2000))
  })

  test('[COMPREHENSIVE] base package - validates UI matches Stripe prices', async ({ page }) => {
    test.setTimeout(180000)

    let sessionId: string | null = null
    let submissionId: string | null = null

    try {
      // SETUP: Get actual Stripe prices
      const prices = await getStripePrices()
      console.log('Testing with Stripe base price:', prices.base, 'cents (€' + (prices.base / 100) + ')')

      // Seed session
      const seed = await seedStep14TestSession()
      sessionId = seed.sessionId
      submissionId = seed.submissionId

      await page.addInitScript((store) => {
        localStorage.setItem('wb-onboarding-store', store)
      }, seed.zustandStore)

      // Navigate to Step 14
      await page.goto(`http://localhost:3783${seed.url}`)
      await page.waitForURL(/\/step\/14/, { timeout: 10000 })
      await page.waitForSelector('iframe[name^="__privateStripeFrame"]', { timeout: 30000 })

      // CRITICAL VALIDATION 1: UI shows Stripe price
      console.log('Validating UI prices...')
      const uiAmount = await getUIPaymentAmount(page)
      console.log('  UI Pay button amount:', uiAmount, 'cents')
      expect(uiAmount).toBe(prices.base)

      const uiRecurring = await getUIRecurringAmount(page)
      console.log('  UI recurring amount:', uiRecurring, 'cents')
      expect(uiRecurring).toBe(prices.base)

      console.log('✓ UI matches Stripe prices')

      // Complete payment
      await fillStripePaymentForm(page)
      await page.locator('#acceptTerms').click()

      const payButton = page.locator('button:has-text("Pay €")')
      await payButton.click()

      // Wait for redirect
      await page.waitForURL(url => url.pathname.includes('/thank-you'), { timeout: 90000 })
      await page.waitForTimeout(10000)

      // Wait for webhook
      const webhookProcessed = await waitForPaymentCompletion(submissionId!)
      expect(webhookProcessed).toBe(true)

      // CRITICAL VALIDATION 2: Database correct
      console.log('Validating database...')
      const submission = await getSubmission(submissionId!)
      expect(submission.status).toBe('paid')
      expect(submission.payment_amount).toBe(prices.base)
      expect(submission.form_data.discountCode).toBeFalsy()
      console.log('✓ Database correct')

      // CRITICAL VALIDATION 3: Stripe objects correct
      console.log('Validating Stripe objects...')
      await validateStripePaymentComplete(submission, {
        totalAmount: prices.base,
        hasDiscount: false,
        recurringAmount: prices.base
      })

      console.log('✓ Payment Intent amount matches UI')
      console.log('✓ Subscription has NO discount')
      console.log('✓ Schedule has NO discount in phase')
      console.log('✓ Future invoices will charge €' + (prices.base / 100))
      console.log('')
      console.log('=== TEST PASSED: User paid exactly what they saw ===')

    } finally {
      if (sessionId && submissionId) {
        await cleanupTestSession(sessionId, submissionId)
      }
    }
  })

  test('[COMPREHENSIVE] 20% forever discount - validates discount in Stripe', async ({ page }) => {
    test.setTimeout(180000)

    let sessionId: string | null = null
    let submissionId: string | null = null

    try {
      // Get prices
      const prices = await getStripePrices()
      const discountedBase = Math.round(prices.base * 0.8) // 20% off

      console.log('Base price:', prices.base, 'cents (€' + (prices.base / 100) + ')')
      console.log('Expected with 20% discount:', discountedBase, 'cents (€' + (discountedBase / 100) + ')')

      // Seed session
      const seed = await seedStep14TestSession()
      sessionId = seed.sessionId
      submissionId = seed.submissionId

      await page.addInitScript((store) => {
        localStorage.setItem('wb-onboarding-store', store)
      }, seed.zustandStore)

      await page.goto(`http://localhost:3783${seed.url}`)
      await page.waitForURL(/\/step\/14/, { timeout: 10000 })
      await page.waitForSelector('iframe[name^="__privateStripeFrame"]', { timeout: 30000 })

      // Apply discount code
      console.log('Applying E2E_TEST_20 discount code...')
      const discountInput = page.getByRole('textbox', { name: /discount/i })
      await discountInput.fill('E2E_TEST_20')

      const verifyButton = page.getByRole('button', { name: /Apply|Verify/i })
      await verifyButton.click()
      await page.waitForTimeout(2000)

      // VALIDATION 1: UI shows discount
      await expect(page.locator('text=/Discount.*E2E_TEST_20.*applied/i')).toBeVisible()
      console.log('✓ Discount validation message visible')

      const uiAmount = await getUIPaymentAmount(page)
      console.log('UI Pay button:', uiAmount, 'cents')
      expect(uiAmount).toBe(discountedBase)

      const uiRecurring = await getUIRecurringAmount(page)
      console.log('UI recurring:', uiRecurring, 'cents')

      // DEBUG: Print the actual commitment text
      const commitmentText = await page.locator('text=/12 monthly payments of €/i').textContent()
      console.log('  DEBUG - Commitment text:', commitmentText)

      expect(uiRecurring).toBe(discountedBase)
      console.log('✓ UI shows discounted amounts')

      // Complete payment
      await fillStripePaymentForm(page)
      await page.locator('#acceptTerms').click()
      await page.locator('button:has-text("Pay €")').click()

      await page.waitForURL(url => url.pathname.includes('/thank-you'), { timeout: 90000 })
      await page.waitForTimeout(10000)

      const webhookProcessed = await waitForPaymentCompletion(submissionId!)
      expect(webhookProcessed).toBe(true)

      // VALIDATION 2: Database has discount
      console.log('Validating database...')
      const submission = await getSubmission(submissionId!)
      expect(submission.status).toBe('paid')
      expect(submission.payment_amount).toBe(discountedBase)
      expect(submission.form_data.discountCode).toBe('E2E_TEST_20')
      console.log('✓ Database records discount code')

      // CRITICAL VALIDATION 3: Stripe has discount
      console.log('Validating Stripe objects...')
      await validateStripePaymentComplete(submission, {
        totalAmount: discountedBase,
        hasDiscount: true,
        discountCode: 'E2E_TEST_20',
        discountPercent: 20,
        recurringAmount: discountedBase
      })

      console.log('✓ Payment Intent = discounted amount')
      console.log('✓ Subscription HAS 20% discount')
      console.log('✓ Schedule phase HAS discount')
      console.log('✓ Future invoices will charge €' + (discountedBase / 100))
      console.log('')
      console.log('=== TEST PASSED: Discount actually applied in Stripe ===')

    } finally {
      if (sessionId && submissionId) {
        await cleanupTestSession(sessionId, submissionId)
      }
    }
  })
})
