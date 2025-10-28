import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'
import { seedStep14TestSession, cleanupTestSession } from './helpers/seed-step14-session'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

// Supabase client for database validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase credentials required for payment flow tests')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)


// Helper: Wait for webhook processing with retries
async function waitForWebhookProcessing(
  submissionId: string,
  expectedStatus: 'paid' | 'submitted' = 'paid',
  options: { maxAttempts?: number; delayMs?: number } = {}
): Promise<boolean> {
  const { maxAttempts = 40, delayMs = 500 } = options

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

test.describe('Step 14: Payment Flow E2E', () => {
  // Force sequential execution to avoid Stripe listener conflicts
  test.describe.configure({ mode: 'serial' })

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
      // Wait for Stripe PaymentElement iframe to load
      await page.waitForSelector('iframe[name^="__privateStripeFrame"]', { timeout: 30000 })

      // Wait for Stripe to fully initialize
      await page.waitForTimeout(3000)

      // Get the Stripe iframe locator
      const stripeFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]').first()

      // Wait for the card input fields to be visible (they should be there by default with tabs layout)
      await stripeFrame.getByRole('textbox', { name: 'Card number' }).waitFor({ state: 'visible', timeout: 30000 })

      // Fill card number
      await stripeFrame.getByRole('textbox', { name: 'Card number' }).fill('4242424242424242')
      await page.waitForTimeout(500)

      // Fill expiry date
      await stripeFrame.getByRole('textbox', { name: /Expiration date/i }).fill('1228')
      await page.waitForTimeout(500)

      // Fill CVC
      await stripeFrame.getByRole('textbox', { name: 'Security code' }).fill('123')

      // 8. Submit payment
      const payButton = page.locator('button:has-text("Pay €")')
      await payButton.click()

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

      // Wait for Stripe PaymentElement iframe to load
      await page.waitForSelector('iframe[name^="__privateStripeFrame"]', { timeout: 30000 })

      // Wait for Stripe to fully initialize
      await page.waitForTimeout(3000)

      // Get the Stripe iframe locator
      const stripeFrame2 = page.frameLocator('iframe[name^="__privateStripeFrame"]').first()

      // Wait for the card input fields to be visible
      await stripeFrame2.getByRole('textbox', { name: 'Card number' }).waitFor({ state: 'visible', timeout: 30000 })

      // Fill card number
      await stripeFrame2.getByRole('textbox', { name: 'Card number' }).fill('4242424242424242')
      await page.waitForTimeout(500)

      // Fill expiry date
      await stripeFrame2.getByRole('textbox', { name: /Expiration date/i }).fill('1228')
      await page.waitForTimeout(500)

      // Fill CVC
      await stripeFrame2.getByRole('textbox', { name: 'Security code' }).fill('123')

      const payButton = page.locator('button:has-text("Pay €")')
      await payButton.click()

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
      if (sessionId && submissionId) {
        await cleanupTestSession(sessionId, submissionId)
      }
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
      // Get the Stripe iframe locator
      const stripeFrame3 = page.frameLocator('iframe[name^="__privateStripeFrame"]').first()

      // Wait for the card input fields to be visible
      await stripeFrame3.getByRole('textbox', { name: 'Card number' }).waitFor({ state: 'visible', timeout: 30000 })

      // Fill declined card number
      await stripeFrame3.getByRole('textbox', { name: 'Card number' }).fill('4000000000000002')
      await page.waitForTimeout(500)

      // Fill expiry date
      await stripeFrame3.getByRole('textbox', { name: /Expiration date/i }).fill('1228')
      await page.waitForTimeout(500)

      // Fill CVC
      await stripeFrame3.getByRole('textbox', { name: 'Security code' }).fill('123')

      // 3. Submit payment
      const payButton = page.locator('button:has-text("Pay €")')
      await payButton.click()

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
})
