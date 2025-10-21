import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'
import { spawn, ChildProcess } from 'child_process'
import { execSync } from 'child_process'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

// Supabase client for database validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase credentials required for payment flow tests')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Stripe CLI webhook listener
let stripeListenerProcess: ChildProcess | null = null

// Helper: Check if stripe listen is already running
function isStripeListenerRunning(): boolean {
  try {
    const result = execSync('pgrep -f "stripe listen"', { encoding: 'utf-8' })
    return result.trim().length > 0
  } catch {
    return false
  }
}

// Helper: Start stripe listen
async function startStripeListener(): Promise<void> {
  if (isStripeListenerRunning()) {
    console.log('✓ Stripe webhook listener already running')
    return
  }

  console.log('🚀 Starting Stripe webhook listener...')

  stripeListenerProcess = spawn('stripe', [
    'listen',
    '--forward-to',
    'localhost:3783/api/stripe/webhook'
  ], {
    stdio: ['ignore', 'pipe', 'pipe']
  })

  stripeListenerProcess.stdout?.on('data', (data) => {
    console.log(`[Stripe] ${data.toString().trim()}`)
  })

  stripeListenerProcess.stderr?.on('data', (data) => {
    console.error(`[Stripe Error] ${data.toString().trim()}`)
  })

  // Wait for listener to be ready
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Stripe listener startup timeout'))
    }, 10000)

    const checkReady = (data: Buffer) => {
      if (data.toString().includes('Ready!')) {
        clearTimeout(timeout)
        console.log('✓ Stripe webhook listener ready')
        stripeListenerProcess!.stdout?.off('data', checkReady)
        resolve()
      }
    }

    stripeListenerProcess!.stdout?.on('data', checkReady)
  })
}

// Helper: Stop stripe listen
function stopStripeListener(): void {
  if (stripeListenerProcess) {
    console.log('🛑 Stopping Stripe webhook listener...')
    stripeListenerProcess.kill('SIGTERM')
    stripeListenerProcess = null
  }
}

// Helper: Fill onboarding steps quickly
async function quickFillOnboarding(page: any) {
  // Step 1: Personal Info
  await page.fill('input[name="firstName"]', 'Test')
  await page.fill('input[name="lastName"]', 'Payment')
  await page.fill('input[name="email"]', `payment-test-${Date.now()}@example.com`)
  await page.click('button:has-text("Next")')

  // Step 2: Email Verification (skip in test mode)
  await page.waitForURL('**/step/2')
  await page.click('button:has-text("Next")')

  // Step 3: Business Basics
  await page.waitForURL('**/step/3')
  await page.fill('input[name="businessName"]', 'Test Payment Business')
  await page.fill('input[name="businessEmail"]', 'business@test.com')
  await page.fill('input[name="businessPhone"]', '+393331234567')
  await page.fill('input[name="industry"]', 'Technology')
  await page.click('button:has-text("Next")')

  // Steps 4-12: Fill minimum required fields
  for (let step = 4; step <= 12; step++) {
    await page.waitForURL(`**/step/${step}`)
    await page.click('button:has-text("Next")')
    await page.waitForTimeout(500) // Small delay for form processing
  }

  // Step 13: Language Add-ons (optional - skip)
  await page.waitForURL('**/step/13')
}

test.describe('Step 14: Payment Flow E2E', () => {
  test.beforeAll(async () => {
    // Start Stripe webhook listener
    await startStripeListener()
  })

  test.afterAll(() => {
    // Stop Stripe webhook listener
    stopStripeListener()
  })

  test('complete payment flow from Step 13 to thank-you page', async ({ page }) => {
    let sessionId: string | null = null
    let submissionId: string | null = null

    try {
      // 1. Navigate to onboarding
      await page.goto('http://localhost:3783/en/onboarding')
      await page.click('button:has-text("Start")')

      // 2. Quick-fill Steps 1-13
      await quickFillOnboarding(page)

      // 3. Capture session ID from localStorage
      sessionId = await page.evaluate(() => {
        const store = localStorage.getItem('wb-onboarding-store')
        if (store) {
          const parsed = JSON.parse(store)
          return parsed.state?.sessionId || null
        }
        return null
      })

      expect(sessionId).toBeTruthy()
      console.log('✓ Session ID:', sessionId)

      // 4. Navigate to Step 14
      await page.click('button:has-text("Next")')
      await page.waitForURL('**/step/14')

      // 5. Wait for Stripe Elements to load
      await page.waitForSelector('[data-testid="stripe-payment-element"]', {
        timeout: 10000
      })
      console.log('✓ Stripe Elements loaded')

      // 6. Verify pricing breakdown displays
      await expect(page.locator('text=/Base Package/i')).toBeVisible()
      await expect(page.locator('text=/€35/i')).toBeVisible()

      // 7. Accept terms and conditions
      await page.check('input[name="acceptTerms"]')

      // 8. Fill payment details with test card
      const paymentElement = page.frameLocator('iframe[name^="__privateStripeFrame"]').first()
      await paymentElement.locator('[name="number"]').fill('4242424242424242')
      await paymentElement.locator('[name="expiry"]').fill('1234')
      await paymentElement.locator('[name="cvc"]').fill('123')

      console.log('✓ Payment details filled')

      // 9. Submit payment
      await page.click('button:has-text("Complete Payment")')
      console.log('✓ Payment submitted')

      // 10. Wait for webhook processing and redirect
      await page.waitForURL('**/thank-you', { timeout: 30000 })
      console.log('✓ Redirected to thank-you page')

      // 11. Verify submission in database
      const { data: submissions } = await supabase
        .from('onboarding_submissions')
        .select('*')
        .eq('session_id', sessionId!)
        .single()

      expect(submissions).toBeTruthy()
      expect(submissions.status).toBe('paid')
      expect(submissions.payment_completed_at).toBeTruthy()
      submissionId = submissions.id
      console.log('✓ Database updated: status=paid')

      // 12. Verify session can no longer be resumed
      await page.goto('http://localhost:3783/en/onboarding')
      await page.waitForURL('**/thank-you', { timeout: 5000 })
      console.log('✓ Session redirects to thank-you (cannot be resumed)')

      console.log('✅ Payment flow test PASSED')

    } finally {
      // Cleanup: Delete test submission
      if (submissionId) {
        await supabase
          .from('onboarding_submissions')
          .delete()
          .eq('id', submissionId)
        console.log('🧹 Test submission deleted')
      }
    }
  })

  test('payment flow with language add-ons', async ({ page }) => {
    let sessionId: string | null = null
    let submissionId: string | null = null

    try {
      // 1. Navigate and quick-fill to Step 13
      await page.goto('http://localhost:3783/en/onboarding')
      await page.click('button:has-text("Start")')
      await quickFillOnboarding(page)

      sessionId = await page.evaluate(() => {
        const store = localStorage.getItem('wb-onboarding-store')
        return store ? JSON.parse(store).state?.sessionId : null
      })

      // 2. Select 2 language add-ons on Step 13
      await page.check('input[value="de"]') // German
      await page.check('input[value="fr"]') // French

      // 3. Verify pricing calculation
      await expect(page.locator('text=/€150/i')).toBeVisible() // 2 × €75
      console.log('✓ Language add-ons selected: €150')

      // 4. Navigate to Step 14
      await page.click('button:has-text("Next")')
      await page.waitForURL('**/step/14')

      // 5. Verify total pricing
      await expect(page.locator('text=/€185/i')).toBeVisible() // €35 + €150
      console.log('✓ Total pricing correct: €185')

      // 6. Complete payment
      await page.waitForSelector('[data-testid="stripe-payment-element"]', { timeout: 10000 })
      await page.check('input[name="acceptTerms"]')

      const paymentElement = page.frameLocator('iframe[name^="__privateStripeFrame"]').first()
      await paymentElement.locator('[name="number"]').fill('4242424242424242')
      await paymentElement.locator('[name="expiry"]').fill('1234')
      await paymentElement.locator('[name="cvc"]').fill('123')

      await page.click('button:has-text("Complete Payment")')
      await page.waitForURL('**/thank-you', { timeout: 30000 })

      // 7. Verify languages saved in database
      const { data: submission } = await supabase
        .from('onboarding_submissions')
        .select('form_data')
        .eq('session_id', sessionId!)
        .single()

      expect(submission.form_data.step13?.additionalLanguages).toContain('de')
      expect(submission.form_data.step13?.additionalLanguages).toContain('fr')
      console.log('✓ Language add-ons saved to database')

      submissionId = submission.id

      console.log('✅ Payment with add-ons test PASSED')

    } finally {
      if (submissionId) {
        await supabase
          .from('onboarding_submissions')
          .delete()
          .eq('id', submissionId)
      }
    }
  })

  test('payment failure handling', async ({ page }) => {
    try {
      // 1. Navigate and quick-fill to Step 14
      await page.goto('http://localhost:3783/en/onboarding')
      await page.click('button:has-text("Start")')
      await quickFillOnboarding(page)
      await page.click('button:has-text("Next")')
      await page.waitForURL('**/step/14')

      // 2. Use declined test card
      await page.waitForSelector('[data-testid="stripe-payment-element"]', { timeout: 10000 })
      await page.check('input[name="acceptTerms"]')

      const paymentElement = page.frameLocator('iframe[name^="__privateStripeFrame"]').first()
      await paymentElement.locator('[name="number"]').fill('4000000000000002') // Declined card
      await paymentElement.locator('[name="expiry"]').fill('1234')
      await paymentElement.locator('[name="cvc"]').fill('123')

      // 3. Submit payment
      await page.click('button:has-text("Complete Payment")')

      // 4. Verify error message displays
      await expect(page.locator('text=/declined/i')).toBeVisible({ timeout: 10000 })
      console.log('✓ Error message displayed')

      // 5. Verify still on Step 14 (not redirected)
      await expect(page).toHaveURL(/\/step\/14/)
      console.log('✓ User remains on Step 14')

      console.log('✅ Payment failure test PASSED')

    } catch (error) {
      console.error('❌ Payment failure test failed:', error)
      throw error
    }
  })
})
