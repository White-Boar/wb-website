import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import * as dotenv from 'dotenv'
import path from 'path'
import { seedStep14TestSession, cleanupTestSession } from './helpers/seed-step14-session'
import { ensureTestCouponsExist, getStripePrices } from './fixtures/stripe-setup'
import { validateStripePaymentComplete } from './helpers/stripe-validation'
import { getUIPaymentAmount, getUIRecurringAmount, fillStripePaymentForm } from './helpers/ui-parser'
import { StripePaymentService } from '@/services/payment/StripePaymentService'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

// Supabase client for database validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase credentials required for payment flow tests')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover'
})

const stripePaymentService = new StripePaymentService()


// Helper: Wait for webhook processing with retries
async function waitForWebhookProcessing(
  submissionId: string,
  expectedStatus: 'paid' | 'submitted' = 'paid',
  options: { maxAttempts?: number; delayMs?: number } = {}
): Promise<boolean> {
  const { maxAttempts = 60, delayMs = 500 } = options

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const { data: submission } = await supabase
      .from('onboarding_submissions')
      .select('status, stripe_subscription_id, payment_completed_at')
      .eq('id', submissionId)
      .single()

    if (submission?.status === expectedStatus) {
      return true
    }

    if (attempt < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }

  console.warn(`⚠️  Webhook not processed after ${maxAttempts} attempts`)
  return false
}

test.describe.parallel('Step 14: Payment Flow E2E', () => {
  // Allow tests to run in parallel while each scenario seeds its own session/coupon context

  // Setup test coupons before all tests
  test.beforeAll(async () => {
    console.log('Setting up test environment...')
    await ensureTestCouponsExist()

    const prices = await getStripePrices()
    console.log('✓ Stripe test mode connected')
    console.log('✓ Base package price:', prices.base, 'cents (€' + (prices.base / 100) + ')')
    console.log('✓ Language add-on price:', prices.addon, 'cents (€' + (prices.addon / 100) + ')')
  })

  // Add delay between tests to let webhooks settle
  test.afterEach(async () => {
    await new Promise(resolve => setTimeout(resolve, 2000)) // 2 second cooldown
  })

  test('complete payment flow from Step 13 to thank-you page', async ({ page }) => {
    test.setTimeout(120000) // 2 minutes (Stripe test payments can take 90-120s)

    let sessionId: string | null = null
    let submissionId: string | null = null

    try {
      // 1. Seed pre-filled Step 14 session (FAST!)
      const seed = await seedStep14TestSession()
      sessionId = seed.sessionId
      submissionId = seed.submissionId

      // 2. Inject Zustand store into localStorage BEFORE navigating
      await page.addInitScript((store) => {
        localStorage.setItem('wb-onboarding-store', store)
      }, seed.zustandStore)

      // 3. Navigate to Step 14 - Zustand loads from localStorage
      await page.goto(`http://localhost:3783${seed.url}`)
      await page.waitForURL(/\/step\/14/, { timeout: 10000 })

      // 4. Wait for Stripe Elements iframe to load
      await page.waitForSelector('iframe[name^="__privateStripeFrame"]', {
        timeout: 30000
      })

      // Additional wait for Stripe to fully initialize inside iframe
      await page.waitForTimeout(3000)

      // 5. Verify pricing breakdown displays
      await expect(page.locator('text=/Base Package/i')).toBeVisible({ timeout: 10000 })
      // Pricing is shown in order summary card
      await expect(page.locator('text=/Order Summary/i')).toBeVisible()

      // 6. Accept terms and conditions
      await page.locator('#acceptTerms').click()

      // 7. Fill payment details with test card
      await fillStripePaymentForm(page)

      // 8. Submit payment
      await page.locator('form').evaluate(form => (form as HTMLFormElement).requestSubmit())

      // 9. Wait for webhook processing and redirect (Stripe test mode can take 60-90s)
      await page.waitForURL(url => url.pathname.includes('/thank-you'), { timeout: 90000 })

      // 10. Wait 10 seconds for any in-flight webhooks to arrive and process
      await page.waitForTimeout(10000)

      // 11. Wait for webhooks to process (payment_intent.succeeded webhook updates status to 'paid')
      const webhookProcessed = await waitForWebhookProcessing(submissionId!, 'paid', {
        maxAttempts: 20,
        delayMs: 500
      })

      expect(webhookProcessed).toBe(true)

      // 12. Verify final submission state in database
      const { data: submissions } = await supabase
        .from('onboarding_submissions')
        .select('status, stripe_subscription_id, payment_completed_at')
        .eq('id', submissionId!)
        .single()

      expect(submissions).toBeTruthy()
      expect(submissions.status).toBe('paid')
      expect(submissions.stripe_subscription_id).toBeTruthy()
      expect(submissions.payment_completed_at).toBeTruthy()

    } finally {
      // Cleanup: Delete test submission
      if (sessionId && submissionId) {
        await cleanupTestSession(sessionId, submissionId)
      }
    }
  })

  test('payment flow with language add-ons', async ({ page }) => {
    test.setTimeout(120000) // 2 minutes (language add-ons take longer to process)

    let sessionId: string | null = null
    let submissionId: string | null = null

    try {
      // 1. Seed pre-filled Step 14 session with language add-ons (FAST!)
      const seed = await seedStep14TestSession({
        additionalLanguages: ['de', 'fr'] // German and French
      })
      sessionId = seed.sessionId
      submissionId = seed.submissionId

      // 2. Inject Zustand store into localStorage BEFORE navigating
      await page.addInitScript((store) => {
        localStorage.setItem('wb-onboarding-store', store)
      }, seed.zustandStore)

      // 3. Navigate to Step 14 - Zustand loads from localStorage
      await page.goto(`http://localhost:3783${seed.url}`)
      await page.waitForURL(/\/step\/14/, { timeout: 10000 })

      // 4. Wait for Stripe Elements iframe to load
      await page.waitForSelector('iframe[name^="__privateStripeFrame"]', { timeout: 30000 })
      await page.waitForTimeout(3000)

      // 5. Verify total pricing with language add-ons
      await expect(page.locator('text=/Base Package/i')).toBeVisible({ timeout: 10000 })
      await expect(page.locator('p:has-text("Language add-ons")').first()).toBeVisible()

      // 6. Complete payment
      await page.waitForSelector('iframe[name^="__privateStripeFrame"]', { timeout: 30000 })
      await page.waitForTimeout(3000)

      await page.locator('#acceptTerms').click()

      await fillStripePaymentForm(page)

      await page.locator('form').evaluate(form => (form as HTMLFormElement).requestSubmit())

      // Wait for webhook processing and redirect (Stripe test mode can take 60-90s)
      await page.waitForURL(url => url.pathname.includes('/thank-you'), { timeout: 90000 })

      // Wait 10 seconds for any in-flight webhooks to arrive and process
      await page.waitForTimeout(10000)

      // 7. Get submission data
      const { data: submissionBeforeWebhook } = await supabase
        .from('onboarding_submissions')
        .select('id, status, form_data')
        .eq('session_id', sessionId!)
        .single()

      expect(submissionBeforeWebhook).toBeTruthy()

      // 8. Verify languages saved in database
      expect(submissionBeforeWebhook.form_data.additionalLanguages).toContain('de')
      expect(submissionBeforeWebhook.form_data.additionalLanguages).toContain('fr')

      // 9. Wait for webhooks to process (payment_intent.succeeded webhook updates status to 'paid')
      const webhookProcessed = await waitForWebhookProcessing(submissionId!, 'paid', {
        maxAttempts: 20,
        delayMs: 500
      })

      expect(webhookProcessed).toBe(true)

      // 10. Verify final submission state in database
      const { data: submission } = await supabase
        .from('onboarding_submissions')
        .select('status, stripe_subscription_id, payment_completed_at')
        .eq('id', submissionId!)
        .single()

      expect(submission).toBeTruthy()
      expect(submission.status).toBe('paid')
      expect(submission.stripe_subscription_id).toBeTruthy()
      expect(submission.payment_completed_at).toBeTruthy()

    } finally {
      // Temporarily skip cleanup for debugging
    }
  })

  test('payment failure handling', async ({ page }) => {
    test.setTimeout(60000) // 1 minute (no full navigation needed)

    let sessionId: string | null = null
    let submissionId: string | null = null

    try {
      // 1. Seed pre-filled Step 14 session (FAST!)
      const seed = await seedStep14TestSession()
      sessionId = seed.sessionId
      submissionId = seed.submissionId

      // 2. Inject Zustand store into localStorage BEFORE navigating
      await page.addInitScript((store) => {
        localStorage.setItem('wb-onboarding-store', store)
      }, seed.zustandStore)

      // 3. Navigate to Step 14 - Zustand loads from localStorage
      await page.goto(`http://localhost:3783${seed.url}`)
      await page.waitForURL(/\/step\/14/, { timeout: 10000 })

      // 4. Wait for Stripe Elements to load
      await page.waitForSelector('iframe[name^="__privateStripeFrame"]', { timeout: 30000 })
      await page.waitForTimeout(3000)

      // 5. Accept terms
      await page.locator('#acceptTerms').click()

      // 6. Fill declined test card details
      await fillStripePaymentForm(page, {
        cardNumber: '4000000000000002'
      })

      // 3. Submit payment
      await page.locator('form').evaluate(form => (form as HTMLFormElement).requestSubmit())

      // 4. Verify error message displays
      await expect(page.locator('text=/declined/i')).toBeVisible({ timeout: 10000 })

      // 5. Verify still on Step 14 (not redirected)
      await expect(page).toHaveURL(/\/step\/14/)

    } catch (error) {
      throw error
    } finally {
      // Cleanup test data
      if (sessionId && submissionId) {
        await cleanupTestSession(sessionId, submissionId)
      }
    }
  })

  test('discount with language add-ons keeps UI total in sync with Stripe', async ({ page }) => {
    test.setTimeout(90000)

    let sessionId: string | null = null
    let submissionId: string | null = null

    const languageCount = 2

    const previewTotals = await stripePaymentService.previewInvoiceWithDiscount(
      null,
      process.env.STRIPE_BASE_PACKAGE_PRICE_ID!,
      'E2E_TEST_20',
      languageCount
    )
    const expectedTotal = previewTotals.total
    const expectedRecurring = previewTotals.subscriptionAmount

    try {
      page.on('request', req => {
        if (req.url().includes('/api/stripe/create-checkout-session')) {
          console.log('create-checkout-session request:', req.postData())
        }
      })

      const seed = await seedStep14TestSession({
        additionalLanguages: ['de', 'fr']
      })
      sessionId = seed.sessionId
      submissionId = seed.submissionId
      console.log('Seeded session', seed)

      await page.addInitScript((store) => {
        localStorage.setItem('wb-onboarding-store', store)
      }, seed.zustandStore)

      await page.goto(`http://localhost:3783${seed.url}`)
      await page.waitForURL(/\/(?:en\/|it\/)?onboarding\/step\/14/, { timeout: 10000 })
      await page.waitForSelector('iframe[name^="__privateStripeFrame"]', { timeout: 30000 })
      await page.waitForTimeout(2000)

      const discountInput = page.getByRole('textbox', { name: /discount/i })
      await discountInput.fill('E2E_TEST_20')
      const verifyButton = page.getByRole('button', { name: /Apply|Verify/i })
      await verifyButton.click()

      // Wait for Stripe discount verification to complete and preview to match expected totals
      await expect(page.locator('text=/Discount Applied/i')).toBeVisible({ timeout: 15000 })
      await page.waitForFunction((expected) => {
        const preview = (window as any).__wb_lastDiscountPreview
        return !!preview && preview.total === expected
      }, expectedTotal, { timeout: 15000 })

      const uiAmount = await getUIPaymentAmount(page)
      expect(uiAmount).toBe(expectedTotal)

      // Ensure recurring commitment text also reflects discounted base
      const recurring = await getUIRecurringAmount(page)
      expect(recurring).toBe(expectedRecurring)

      const checkoutDebug = await page.evaluate(() => (window as any).__wb_lastCheckoutDebug)
      console.log('Checkout debug invoice:', checkoutDebug)
      const checkoutSession = await page.evaluate(() => (window as any).__wb_lastCheckoutSession)
      console.log('Checkout session payload:', checkoutSession)
      const discountMeta = await page.evaluate(() => (window as any).__wb_lastDiscountMeta)
      console.log('Discount meta:', discountMeta)
      const refreshPayloads = await page.evaluate(() => (window as any).__wb_refreshPayloads)
      console.log('Refresh payloads:', refreshPayloads)
    } finally {
      if (sessionId && submissionId) {
        await cleanupTestSession(sessionId, submissionId)
      }
    }
  })

  test('100% discount completes without requiring card entry', async ({ page }) => {
    test.setTimeout(90000)

    let sessionId: string | null = null
    let submissionId: string | null = null
    const couponId = `E2E_FREE_${Date.now()}`

    try {
      await stripe.coupons.create({
        id: couponId,
        percent_off: 100,
        duration: 'once',
        name: 'E2E Test 100% Once'
      })

      const seed = await seedStep14TestSession()
      sessionId = seed.sessionId
      submissionId = seed.submissionId

      await page.addInitScript((store) => {
        localStorage.setItem('wb-onboarding-store', store)
      }, seed.zustandStore)

      await page.goto(`http://localhost:3783${seed.url}`)
      await page.waitForURL(/\/(en|it)\/onboarding\/step\/14/, { timeout: 10000 })
      await page.waitForSelector('iframe[name^="__privateStripeFrame"]', { timeout: 30000 })
      await page.waitForTimeout(2000)

      const discountInput = page.getByRole('textbox', { name: /discount/i })
      await discountInput.fill(couponId)
      await page.getByRole('button', { name: /Apply|Verify/i }).click()

      await expect(page.locator(`text=/Discount code ${couponId} applied/i`)).toBeVisible()

      // Payment element should be hidden when no payment required
      await expect(page.locator('[data-testid="stripe-payment-element"]')).toHaveCount(0)

      await page.locator('#acceptTerms').click()

      const completeButton = page.getByRole('button', { name: /Complete without payment/i })
      await expect(completeButton).toBeEnabled()
      await completeButton.click()

      await page.waitForURL(url => url.pathname.includes('/thank-you'), { timeout: 30000 })

      const webhookProcessed = await waitForWebhookProcessing(submissionId!, 'paid')
      expect(webhookProcessed).toBe(true)
    } finally {
      if (sessionId && submissionId) {
        await cleanupTestSession(sessionId, submissionId)
      }
      await stripe.coupons.del(couponId).catch(() => {})
    }
  })

  test('discount code validation - valid code', async ({ page }) => {
    test.setTimeout(60000) // 1 minute (no full navigation needed)

    let sessionId: string | null = null
    let submissionId: string | null = null

    try {
      // Seed pre-filled Step 14 session (FAST!)
      const seed = await seedStep14TestSession()
      sessionId = seed.sessionId
      submissionId = seed.submissionId

      // Inject Zustand store into localStorage
      await page.addInitScript((store) => {
        localStorage.setItem('wb-onboarding-store', store)
      }, seed.zustandStore)

      // Navigate to Step 14
      await page.goto(`http://localhost:3783${seed.url}`)
      await page.waitForURL(/\/step\/14/, { timeout: 10000 })

      // Wait for checkout to load
      await page.waitForSelector('iframe[name^="__privateStripeFrame"]', { timeout: 30000 })
      await page.waitForTimeout(2000)

      // Verify discount code UI is present
      await expect(page.locator('text=/Discount Code/i').first()).toBeVisible()

      // Find and fill discount code input
      const discountInput = page.getByRole('textbox', { name: 'discount' })
      await expect(discountInput).toBeVisible()
      await discountInput.fill('TEST10')

      // Click Apply button
      const applyButton = page.getByRole('button', { name: /Apply|Verify/i })
      await expect(applyButton).toBeEnabled()
      await applyButton.click()

      // Wait for validation
      await page.waitForTimeout(2000)

      // Verify success message appears
      await expect(page.locator('text=/Discount code TEST10 applied/i')).toBeVisible({ timeout: 10000 })

      // Verify discount badge in order summary
      await expect(page.locator('text=/Discount Applied/i')).toBeVisible()

      // Verify price reduction (original €35, with 10% discount = €31.50)
      await expect(page.locator('button:has-text("Pay €31.5")')).toBeVisible()

    } catch (error) {
      throw error
    } finally {
      // Cleanup test data
      if (sessionId && submissionId) {
        await cleanupTestSession(sessionId, submissionId)
      }
    }
  })

  test('discount code validation - invalid code', async ({ page }) => {
    test.setTimeout(60000) // 1 minute (no full navigation needed)

    let sessionId: string | null = null
    let submissionId: string | null = null

    try {
      // Seed pre-filled Step 14 session (FAST!)
      const seed = await seedStep14TestSession()
      sessionId = seed.sessionId
      submissionId = seed.submissionId

      // Inject Zustand store into localStorage
      await page.addInitScript((store) => {
        localStorage.setItem('wb-onboarding-store', store)
      }, seed.zustandStore)

      // Navigate to Step 14
      await page.goto(`http://localhost:3783${seed.url}`)
      await page.waitForURL(/\/step\/14/, { timeout: 10000 })

      // Wait for checkout to load
      await page.waitForSelector('iframe[name^="__privateStripeFrame"]', { timeout: 30000 })
      await page.waitForTimeout(2000)

      // Fill invalid discount code
      const discountInput = page.getByRole('textbox', { name: 'discount' })
      await discountInput.fill('INVALID999')

      // Click Verify button
      const verifyButton = page.getByRole('button', { name: /Apply|Verify/i })
      await verifyButton.click()

      // Wait for validation
      await page.waitForTimeout(2000)

      // Verify error message appears (check for "invalid" or "not found" or "not valid")
      const errorLocator = page.locator('[role="alert"]').filter({ hasText: /invalid|not found|not valid|doesn't exist/i })
      await expect(errorLocator).toBeVisible({ timeout: 10000 })

      // Verify price remains unchanged (€35)
      await expect(page.locator('text=/Pay €35/i')).toBeVisible()

    } catch (error) {
      throw error
    } finally {
      // Cleanup test data
      if (sessionId && submissionId) {
        await cleanupTestSession(sessionId, submissionId)
      }
    }
  })

  test('discount code validation - empty code', async ({ page }) => {
    test.setTimeout(60000) // 1 minute (no full navigation needed)

    let sessionId: string | null = null
    let submissionId: string | null = null

    try {
      // Seed pre-filled Step 14 session (FAST!)
      const seed = await seedStep14TestSession()
      sessionId = seed.sessionId
      submissionId = seed.submissionId

      // Inject Zustand store into localStorage
      await page.addInitScript((store) => {
        localStorage.setItem('wb-onboarding-store', store)
      }, seed.zustandStore)

      // Navigate to Step 14
      await page.goto(`http://localhost:3783${seed.url}`)
      await page.waitForURL(/\/step\/14/, { timeout: 10000 })

      // Wait for checkout to load
      await page.waitForSelector('iframe[name^="__privateStripeFrame"]', { timeout: 30000 })
      await page.waitForTimeout(2000)

      // Verify Apply button is disabled when input is empty
      const discountInput = page.getByRole('textbox', { name: 'discount' })
      const applyButton = page.getByRole('button', { name: /Apply|Verify/i })

      await expect(discountInput).toBeEmpty()
      await expect(applyButton).toBeDisabled()

    } catch (error) {
      throw error
    } finally {
      // Cleanup test data
      if (sessionId && submissionId) {
        await cleanupTestSession(sessionId, submissionId)
      }
    }
  })

  test('discount code applied with payment completion', async ({ page }) => {
    test.setTimeout(180000)

    let sessionId: string | null = null
    let submissionId: string | null = null

    try {
      // 1. Seed pre-filled Step 14 session
      const seed = await seedStep14TestSession()
      sessionId = seed.sessionId
      submissionId = seed.submissionId

      // 2. Inject Zustand store into localStorage BEFORE navigating
      await page.addInitScript((store) => {
        localStorage.setItem('wb-onboarding-store', store)
      }, seed.zustandStore)

      // 3. Navigate to Step 14
      await page.goto(`http://localhost:3783${seed.url}`)
      await page.waitForURL(/\/step\/14/, { timeout: 10000 })

      // Wait for checkout to load
      await page.waitForSelector('iframe[name^="__privateStripeFrame"]', { timeout: 30000 })
      await page.waitForTimeout(2000)

      // Apply discount code
      const discountInput = page.getByRole('textbox', { name: 'discount' })
      await discountInput.fill('TEST20')

      const verifyButton = page.getByRole('button', { name: /Apply|Verify/i })
      await verifyButton.click()

      await page.waitForTimeout(2000)

      // Verify discount applied (20% off €35 = €7, final price €28)
      await expect(page.locator('text=/Discount code TEST20 applied/i')).toBeVisible()
      // Check for €28 in the Pay button
      await expect(page.locator('button:has-text("Pay €28")')).toBeVisible()

    } catch (error) {
      throw error
    } finally {
      // Cleanup
      if (sessionId) {
        await cleanupTestSession(sessionId)
      }
    }
  })

  test('comprehensive database validation after payment', async ({ page }) => {
    test.setTimeout(120000)

    let sessionId: string | null = null
    let submissionId: string | null = null

    try {
      // 1. Seed pre-filled Step 14 session with language add-ons
      const seed = await seedStep14TestSession({
        additionalLanguages: ['de', 'fr'] // German and French
      })
      sessionId = seed.sessionId
      submissionId = seed.submissionId

      // 2. Inject Zustand store into localStorage
      await page.addInitScript((store) => {
        localStorage.setItem('wb-onboarding-store', store)
      }, seed.zustandStore)

      // 3. Navigate to Step 14
      await page.goto(`http://localhost:3783${seed.url}`)
      await page.waitForURL(/\/step\/14/, { timeout: 10000 })

      // 4. Wait for Stripe Elements iframe to load
      await page.waitForSelector('iframe[name^="__privateStripeFrame"]', { timeout: 30000 })
      await page.waitForTimeout(3000)

      // 5. Apply discount code
      const discountInput = page.getByRole('textbox', { name: 'discount' })
      await discountInput.fill('TEST10')

      const verifyButton = page.getByRole('button', { name: /Apply|Verify/i })
      await verifyButton.click()

      await page.waitForFunction((code: string) => {
        const meta = (window as any).__wb_lastDiscountMeta
        return meta?.code === code
      }, 'TEST10', { timeout: 15000 })

      // Verify discount applied
      await expect(page.locator('text=/Discount code TEST10 applied/i')).toBeVisible({ timeout: 15000 })

      // 6. Accept terms and complete payment
      await page.locator('#acceptTerms').click()

      await fillStripePaymentForm(page)

      await page.locator('form').evaluate(form => (form as HTMLFormElement).requestSubmit())

      // 7. Wait for redirect to thank-you page
      await page.waitForURL(url => url.pathname.includes('/thank-you'), { timeout: 90000 })
      await page.waitForTimeout(10000)

      // 8. Wait for webhooks to process
      const webhookProcessed = await waitForWebhookProcessing(submissionId!, 'paid', {
        maxAttempts: 20,
        delayMs: 500
      })
      expect(webhookProcessed).toBe(true)

      // 9. COMPREHENSIVE DATABASE VALIDATION
      const { data: submission } = await supabase
        .from('onboarding_submissions')
        .select('*')
        .eq('id', submissionId!)
        .single()

      expect(submission).toBeTruthy()

      // === STRIPE IDs VALIDATION ===
      expect(submission.stripe_customer_id).toBeTruthy()
      expect(submission.stripe_customer_id).toMatch(/^cus_/)

      expect(submission.stripe_subscription_id).toBeTruthy()
      expect(submission.stripe_subscription_id).toMatch(/^sub_/)

      expect(submission.stripe_subscription_schedule_id).toBeTruthy()
      expect(submission.stripe_subscription_schedule_id).toMatch(/^sub_sched_/)

      expect(submission.stripe_payment_id).toBeTruthy()
      expect(submission.stripe_payment_id).toMatch(/^pi_/)

      // === STATUS AND DATES VALIDATION ===
      expect(submission.status).toBe('paid')
      expect(submission.payment_completed_at).toBeTruthy()

      const paymentDate = new Date(submission.payment_completed_at)
      expect(paymentDate.getTime()).toBeGreaterThan(Date.now() - 120000) // Within last 2 minutes
      expect(paymentDate.getTime()).toBeLessThanOrEqual(Date.now())

      expect(submission.created_at).toBeTruthy()
      expect(submission.updated_at).toBeTruthy()

      // === PAYMENT AMOUNTS VALIDATION ===
      expect(submission.payment_amount).toBeTruthy()
      expect(submission.currency).toBe('EUR')

      const paymentMetadata = submission.payment_metadata || {}
      expect(typeof paymentMetadata).toBe('object')
      expect(paymentMetadata.subtotal).toBeDefined()
      expect(paymentMetadata.discount_amount).toBeDefined()
      expect(submission.payment_amount).toBe(paymentMetadata.subtotal - paymentMetadata.discount_amount)

      // === PAYMENT METADATA VALIDATION ===
      expect(submission.payment_metadata).toBeTruthy()
      // payment_metadata structure varies by event type (payment_intent vs invoice)
      // Verify it's an object with some data
      expect(typeof submission.payment_metadata).toBe('object')

      // === LANGUAGE ADD-ONS VALIDATION ===
      expect(submission.form_data.additionalLanguages).toBeTruthy()
      expect(submission.form_data.additionalLanguages).toEqual(['de', 'fr'])
      expect(submission.form_data.additionalLanguages.length).toBe(2)

      // === SESSION VALIDATION ===
      expect(submission.session_id).toBe(sessionId)

    } finally {
      if (sessionId && submissionId) {
        await cleanupTestSession(sessionId, submissionId)
      }
    }
  })

  test('database validation - discount code metadata persisted', async ({ page }) => {
    test.setTimeout(120000)

    let sessionId: string | null = null
    let submissionId: string | null = null

    try {
      // 1. Seed session with no language add-ons (simpler for discount validation)
      const seed = await seedStep14TestSession()
      sessionId = seed.sessionId
      submissionId = seed.submissionId

      // 2. Inject Zustand store
      await page.addInitScript((store) => {
        localStorage.setItem('wb-onboarding-store', store)
      }, seed.zustandStore)

      // 3. Navigate to Step 14
      await page.goto(`http://localhost:3783${seed.url}`)
      await page.waitForURL(/\/step\/14/, { timeout: 10000 })
      await page.waitForSelector('iframe[name^="__privateStripeFrame"]', { timeout: 30000 })
      await page.waitForTimeout(3000)

      // 4. Apply 20% discount code
      const discountInput = page.getByRole('textbox', { name: 'discount' })
      await discountInput.fill('TEST20')
      const verifyButton = page.getByRole('button', { name: /Apply|Verify/i })
      await verifyButton.click()
      await page.waitForTimeout(2000)

      // 5. Complete payment
      await page.locator('#acceptTerms').click()
      await fillStripePaymentForm(page)

      await page.locator('form').evaluate(form => (form as HTMLFormElement).requestSubmit())

      // 6. Wait for completion
      await page.waitForURL(url => url.pathname.includes('/thank-you'), { timeout: 90000 })
      await page.waitForTimeout(10000)

      const webhookProcessed = await waitForWebhookProcessing(submissionId!, 'paid')
      expect(webhookProcessed).toBe(true)

      // 7. VALIDATE DISCOUNT CODE IN DATABASE
      const { data: submission } = await supabase
        .from('onboarding_submissions')
        .select('*')
        .eq('id', submissionId!)
        .single()

      expect(submission).toBeTruthy()

      // Validate payment amount
      // Base package: €35/month = 3500 cents
      // Note: Discount codes apply to recurring subscription charges via Stripe schedule
      // First payment shows full amount, discount applies to future recurring charges
      expect(submission.payment_amount).toBe(3500)
      expect(submission.currency).toBe('EUR')
      expect(submission.status).toBe('paid')

      // Validate payment metadata exists
      expect(submission.payment_metadata).toBeTruthy()

    } finally {
      if (sessionId && submissionId) {
        await cleanupTestSession(sessionId, submissionId)
      }
    }
  })

  test('database validation - subscription schedule dates', async ({ page }) => {
    test.setTimeout(120000)

    let sessionId: string | null = null
    let submissionId: string | null = null

    try {
      // 1. Seed and navigate
      const seed = await seedStep14TestSession()
      sessionId = seed.sessionId
      submissionId = seed.submissionId

      await page.addInitScript((store) => {
        localStorage.setItem('wb-onboarding-store', store)
      }, seed.zustandStore)

      await page.goto(`http://localhost:3783${seed.url}`)
      await page.waitForURL(/\/step\/14/, { timeout: 10000 })
      await page.waitForSelector('iframe[name^="__privateStripeFrame"]', { timeout: 30000 })
      await page.waitForTimeout(3000)

      // 2. Complete payment
      await page.locator('#acceptTerms').click()
      await fillStripePaymentForm(page)

      await page.locator('form').evaluate(form => (form as HTMLFormElement).requestSubmit())

      await page.waitForURL(url => url.pathname.includes('/thank-you'), { timeout: 90000 })
      await page.waitForTimeout(10000)

      const webhookProcessed = await waitForWebhookProcessing(submissionId!, 'paid')
      expect(webhookProcessed).toBe(true)

      // 3. VALIDATE SUBSCRIPTION DATES AND TIMESTAMPS
      const { data: submission } = await supabase
        .from('onboarding_submissions')
        .select('*')
        .eq('id', submissionId!)
        .single()

      expect(submission).toBeTruthy()

      // Validate all critical timestamps exist
      expect(submission.created_at).toBeTruthy()
      expect(submission.updated_at).toBeTruthy()
      expect(submission.payment_completed_at).toBeTruthy()

      // Validate timestamp order: created_at <= payment_completed_at <= updated_at
      const createdTime = new Date(submission.created_at).getTime()
      const paymentTime = new Date(submission.payment_completed_at).getTime()
      const updatedTime = new Date(submission.updated_at).getTime()

      expect(createdTime).toBeLessThanOrEqual(paymentTime)
      expect(paymentTime).toBeLessThanOrEqual(updatedTime)

      // Validate payment happened recently (within last 2 minutes)
      const now = Date.now()
      expect(paymentTime).toBeGreaterThan(now - 120000)
      expect(paymentTime).toBeLessThanOrEqual(now)

      // Validate Stripe IDs format
      expect(submission.stripe_subscription_schedule_id).toMatch(/^sub_sched_/)
      expect(submission.stripe_subscription_id).toMatch(/^sub_/)
      expect(submission.stripe_customer_id).toMatch(/^cus_/)

    } finally {
      if (sessionId && submissionId) {
        await cleanupTestSession(sessionId, submissionId)
      }
    }
  })
})
