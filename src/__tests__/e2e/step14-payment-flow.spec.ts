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

// Helper: Fill onboarding steps quickly
// Helper: Navigate through all onboarding steps to reach Step 14 for payment testing
async function navigateToStep14(page: any, additionalLanguages: string[] = []) {
  const testEmail = `payment-test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`

  // Navigate to onboarding homepage
  await page.goto('http://localhost:3783/onboarding')
  await page.waitForTimeout(500)

  // Click "Start Your Website" button
  const startButton = page.getByRole('button', { name: 'Start Your Website' })
  await startButton.click()
  await page.waitForURL(/\/onboarding\/step\/1/)

  // Step 1: Personal Information
  await page.getByRole('textbox', { name: /First Name.*required/ }).fill('Test')
  await page.getByRole('textbox', { name: /Last Name.*required/ }).fill('Payment')
  await page.getByRole('textbox', { name: /Email Address.*required/ }).fill(testEmail)

  // Click Next
  const nextButton = page.locator('button').filter({ hasText: 'Next' }).first()
  await nextButton.click()
  await page.waitForURL(/\/onboarding\/step\/2/)

  // Step 2: Email Verification - enter test code "123456" which auto-progresses
  await page.waitForTimeout(1000)

  // Fill 6-digit verification code
  const verificationCode = '123456'
  for (let i = 0; i < verificationCode.length; i++) {
    await page.getByRole('textbox', { name: `Verification code digit ${i + 1}` }).fill(verificationCode[i])
  }

  // Wait for auto-progression to Step 3
  await page.waitForURL(/\/onboarding\/step\/3/, { timeout: 10000 })


  await expect(page.locator('text=Step 3 of 14')).toBeVisible()
  await expect(page.locator('h1')).toContainText(/Business Details/i)

  // Fill Business Information section
  const businessNameInput = page.locator('input[name="businessName"]')
  if (await businessNameInput.isVisible()) {
    await businessNameInput.fill('Test Payment Business')
  }

  // Select industry from dropdown with better error handling
  const industryDropdown = page.getByRole('combobox').first()
  await industryDropdown.click()
  await page.waitForTimeout(1000)

  // Try multiple selectors for Technology option
  const technologyOption = page.getByRole('option', { name: /Technology|technology/i }).first()
  if (await technologyOption.isVisible()) {
    await technologyOption.click()
  } else {
    // Fallback - try clicking any option with 'tech' in it
    const techOption = page.locator('[role="option"]').filter({ hasText: /tech/i }).first()
    if (await techOption.isVisible()) {
      await techOption.click()
    } else {
      const firstOption = page.getByRole('option').first()
      if (await firstOption.isVisible()) {
        await firstOption.click()
      }
    }
  }
  await page.waitForTimeout(1000)

  // Fill Contact Information section - phone has special formatting
  const phoneInput = page.locator('input[name="businessPhone"]')
  if (await phoneInput.isVisible()) {
    await phoneInput.click()
    await phoneInput.fill('')
    await phoneInput.type('3201234567', { delay: 50 })
  }

  const businessEmailInput = page.locator('input[name="businessEmail"]')
  if (await businessEmailInput.isVisible()) {
    await businessEmailInput.fill('business@test.com')
  }

  // Fill address fields (required)

  const businessStreetInput = page.locator('input[name="businessStreet"]')
  if (await businessStreetInput.isVisible()) {
    await businessStreetInput.fill('Via Giuseppe Mazzini 142')
  }

  const businessCityInput = page.locator('input[name="businessCity"]')
  if (await businessCityInput.isVisible()) {
    await businessCityInput.fill('Milano')
  }

  const businessPostalCodeInput = page.locator('input[name="businessPostalCode"]')
  if (await businessPostalCodeInput.isVisible()) {
    await businessPostalCodeInput.fill('20123')
  }

  // Province dropdown
  const provinceDropdowns = await page.getByRole('combobox').all()
  let provinceSelected = false

  for (let i = 0; i < provinceDropdowns.length; i++) {
    const dropdownText = await provinceDropdowns[i].textContent()
    if (dropdownText && (dropdownText.includes('province') || dropdownText.includes('region') || dropdownText.includes('Enter province'))) {
      await provinceDropdowns[i].click()
      await page.waitForTimeout(500)

      const regionOption = page.locator('[role="option"]').filter({ hasText: /Lombardia/i }).first()
      if (await regionOption.isVisible()) {
        await regionOption.click()
        provinceSelected = true
        await page.waitForTimeout(1000)
        break
      }
    }
  }

  // Country is now automatically set to Italy (disabled field) - no need to select

  // Trigger validation
  await page.keyboard.press('Tab')
  await page.waitForTimeout(1000)
  await page.getByRole('heading', { name: /Business Details/ }).first().click()
  await page.waitForTimeout(2000)

  // Wait for form validation to complete and enable the Next button
  const step3Next = page.locator('button').filter({ hasText: 'Next' }).and(page.locator(':not([data-next-mark])')).first()

  // Wait longer for form validation
  await page.waitForTimeout(3000)

  // Try to enable the Next button by triggering form validation
  await page.evaluate(() => {
    // Dispatch change events on all inputs to trigger validation
    const inputs = document.querySelectorAll('input')
    inputs.forEach(input => {
      input.dispatchEvent(new Event('change', { bubbles: true }))
      input.dispatchEvent(new Event('blur', { bubbles: true }))
    })
  })

  await page.waitForTimeout(2000)

  // Wait for Next button to be enabled and click it
  await expect(step3Next).toBeEnabled({ timeout: 15000 })
  await step3Next.click()

  // =============================================================================
  // STEP 4: Brand Definition
  // =============================================================================

  await page.waitForURL(/\/onboarding\/step\/4/, { timeout: 10000 })
  await expect(page.locator('text=Step 4 of 14')).toBeVisible()
  await expect(page.locator('h1')).toContainText(/Brand Definition|Brand/i)

  // Fill business description
  const descriptionField = page.locator('textarea').first()
  await descriptionField.fill('We are a test technology consulting company for payment flow testing.')
  await page.waitForTimeout(1000)

  // Continue
  const step4Next = page.locator('button').filter({ hasText: 'Next' }).and(page.locator(':not([data-next-mark])')).first()
  await step4Next.click()
  await page.waitForTimeout(1000)

  // =============================================================================
  // STEP 5: Customer Profile
  // =============================================================================

  await page.waitForURL(/\/onboarding\/step\/5/, { timeout: 10000 })
  await expect(page.locator('text=Step 5 of 14')).toBeVisible()

  // Set slider values - just click Next as sliders have defaults
  await page.waitForTimeout(1000)

  // Continue
  const step5Next = page.locator('button').filter({ hasText: 'Next' }).and(page.locator(':not([data-next-mark])')).first()
  await step5Next.click()
  await page.waitForTimeout(1000)

  // =============================================================================
  // STEP 6: Customer Needs
  // =============================================================================

  await page.waitForURL(/\/onboarding\/step\/6/, { timeout: 10000 })
  await expect(page.locator('text=Step 6 of 14')).toBeVisible()

  // Fill customer needs textareas using more specific selectors
  const customerProblemsTextarea = page.locator('textarea[name="customerProblems"]')
  const customerDelightTextarea = page.locator('textarea[name="customerDelight"]')

  // Fill required customer problems field
  if (await customerProblemsTextarea.isVisible()) {
    await customerProblemsTextarea.click()
    await customerProblemsTextarea.fill('Our target customers struggle with outdated legacy systems that slow down their operations.')

    // Verify the content was actually filled
    const problemsValue = await customerProblemsTextarea.inputValue()
    if (problemsValue.length >= 30) {
    }
  }

  // Fill optional customer delight field
  if (await customerDelightTextarea.isVisible()) {
    await customerDelightTextarea.click()
    await customerDelightTextarea.fill('Our customers are delighted when they see immediate improvements in efficiency and productivity.')

    const delightValue = await customerDelightTextarea.inputValue()
  }

  // Multiple validation triggers
  await page.keyboard.press('Tab')
  await page.waitForTimeout(1000)

  // Trigger validation by blurring and focusing
  await customerProblemsTextarea.blur()
  await page.waitForTimeout(500)
  await customerProblemsTextarea.focus()
  await page.waitForTimeout(500)
  await customerProblemsTextarea.blur()

  await page.waitForTimeout(3000) // Give more time for validation

  // Continue
  const step6Next = page.locator('button').filter({ hasText: 'Next' }).and(page.locator(':not([data-next-mark])')).first()
  await expect(step6Next).toBeEnabled({ timeout: 15000 })

  // Add retry logic for Step 6 -> Step 7 navigation
  let navigationSuccess = false
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await step6Next.click()

      // Wait for navigation with timeout
      await page.waitForURL(/\/onboarding\/step\/7/, { timeout: 5000 })
      navigationSuccess = true
      break
    } catch (e) {
      await page.waitForTimeout(2000) // Wait for debounced save to complete
    }
  }

  if (!navigationSuccess) {
    throw new Error('Failed to navigate from Step 6 to Step 7')
  }

  // =============================================================================
  // STEP 7: Visual Inspiration
  // =============================================================================
  await expect(page.locator('text=Step 7 of 14')).toBeVisible()
  await expect(page.locator('h1')).toContainText(/Visual Inspiration|Inspiration/i)

  // Step 7 is optional - Next button should be enabled without website references
  const step7Next = page.locator('button').filter({ hasText: /Next|Skip/ }).and(page.locator(':not([data-next-mark])')).first()
  await expect(step7Next).toBeEnabled({ timeout: 5000 })
  await step7Next.click()
  await page.waitForTimeout(1000)

  // =============================================================================
  // STEP 8: Design Style
  // =============================================================================

  await page.waitForURL(/\/onboarding\/step\/8/)
  await expect(page.locator('text=Step 8 of 14')).toBeVisible()
  await expect(page.locator('h1')).toContainText(/Design Style|Style/i)

  // Select a design style from ImageGrid
  const designCards = page.locator('.grid .group.cursor-pointer')
  const designCardCount = await designCards.count()

  if (designCardCount > 0) {
    const firstCard = designCards.first()
    if (await firstCard.isVisible()) {
      await firstCard.click()
    }
  }

  await page.waitForTimeout(2000)

  // Continue
  const step8Next = page.locator('button').filter({ hasText: 'Next' }).and(page.locator(':not([data-next-mark])')).first()
  await expect(step8Next).toBeEnabled({ timeout: 15000 })
  await step8Next.click()
  await page.waitForTimeout(3000)

  // =============================================================================
  // STEP 9: Image Style
  // =============================================================================

  await page.waitForURL(/\/onboarding\/step\/9/, { timeout: 20000 })
  await expect(page.locator('text=Step 9 of 14')).toBeVisible()
  await expect(page.locator('h1')).toContainText(/Image Style/i)

  // Select an image style from ImageGrid
  const imageCards = page.locator('.grid .group.cursor-pointer')
  const imageCount = await imageCards.count()

  if (imageCount > 0) {
    const firstCard = imageCards.first()
    if (await firstCard.isVisible()) {
      await firstCard.click()
    }
  }
  await page.waitForTimeout(1000)

  // Continue
  const step9Next = page.locator('button').filter({ hasText: 'Next' }).and(page.locator(':not([data-next-mark])')).first()
  await expect(step9Next).toBeEnabled({ timeout: 10000 })
  await step9Next.click()
  await page.waitForTimeout(1000)

  // =============================================================================
  // STEP 10: Color Palette
  // =============================================================================

  await page.waitForURL(/\/onboarding\/step\/10/)
  await expect(page.locator('text=Step 10 of 14')).toBeVisible()
  await expect(page.locator('h1')).toContainText(/Color Palette|Colors/i)

  // Select a color palette from ImageGrid
  const colorCards = page.locator('.grid .group.cursor-pointer')
  const colorCount = await colorCards.count()

  if (colorCount > 0) {
    const firstCard = colorCards.first()
    if (await firstCard.isVisible()) {
      await firstCard.click()
    }
  }
  await page.waitForTimeout(1000)

  // Continue
  const step10Next = page.locator('button').filter({ hasText: 'Next' }).and(page.locator(':not([data-next-mark])')).first()
  await expect(step10Next).toBeEnabled({ timeout: 10000 })
  await step10Next.click()
  await page.waitForTimeout(1000)

  // =============================================================================
  // STEP 11: Website Structure
  // =============================================================================

  await page.waitForURL(/\/onboarding\/step\/11/)
  await expect(page.locator('text=Step 11 of 14')).toBeVisible()
  await expect(page.locator('h1')).toContainText(/Website Structure|Structure/i)

  // Wait for page to fully load
  await page.waitForTimeout(1000)

  // Website structure - select some checkboxes if available
  const checkboxes = page.locator('button[role="checkbox"]')
  const checkboxCount = await checkboxes.count()

  if (checkboxCount > 0) {
    // Click the first 3 checkboxes by finding their labels
    const labels = page.locator('label[for]')
    const labelCount = await labels.count()

    for (let i = 0; i < Math.min(3, labelCount); i++) {
      const label = labels.nth(i)
      const htmlFor = await label.getAttribute('for')
      const checkbox = page.locator(`#${htmlFor}`)
      const state = await checkbox.getAttribute('data-state').catch(() => null)

      if (state !== 'checked') {
        await label.click()
        await page.waitForTimeout(300)
      }
    }
  }
  await page.waitForTimeout(1000)

  // CRITICAL: Add primary goal selection using DropdownInput component
  const goalDropdown = page.locator('button[role="combobox"]').filter({ hasNotText: 'Industry' }).first()
  if (await goalDropdown.isVisible()) {
    await goalDropdown.click()
    await page.waitForTimeout(500)

    // Select first available option
    const firstOption = page.locator('[role="option"]').first()
    if (await firstOption.isVisible()) {
      await firstOption.click()
    }
    await page.waitForTimeout(500)
  }

  // CRITICAL: Select offering type (radio button)
  const servicesRadio = page.locator('button').filter({ hasText: 'Services' }).first()
  if (await servicesRadio.isVisible()) {
    await servicesRadio.click()
    await page.waitForTimeout(1000)
  }

  // CRITICAL: Add at least one offering (required for validation)

  // Fill the offering input field
  const offeringInput = page.locator('input[placeholder="Enter a product or service"]').last()
  if (await offeringInput.isVisible()) {
    await offeringInput.fill('AI-Driven Digital Transformation Consulting')
    await page.waitForTimeout(500)

    // Click the Add button
    const addOfferingButton = page.locator('button').filter({ hasText: 'Add Item' }).first()
    if (await addOfferingButton.isVisible()) {
      await addOfferingButton.click()
      await page.waitForTimeout(1000)
    }
  }

  // Wait for form state to update
  await page.waitForTimeout(2000)

  // Continue
  const step11Next = page.locator('button').filter({ hasText: 'Next' }).and(page.locator(':not([data-next-mark])')).first()
  await expect(step11Next).toBeEnabled({ timeout: 15000 })
  await step11Next.click()
  await page.waitForTimeout(3000)

  // =============================================================================
  // STEP 12: Business Assets (File Uploads) - SKIP UPLOADS
  // =============================================================================

  await page.waitForURL(/\/onboarding\/step\/12/, { timeout: 10000 })
  await expect(page.locator('text=Step 12 of 14')).toBeVisible()


  // Wait a bit for page to be ready
  await page.waitForTimeout(2000)

  // Click Next to proceed to Step 13 without uploading files
  const step12Next = page.locator('button').filter({ hasText: 'Next' }).and(page.locator(':not([data-next-mark])')).first()
  await expect(step12Next).toBeEnabled({ timeout: 10000 })
  await step12Next.click()
  await page.waitForTimeout(2000)

  // =============================================================================
  // STEP 13: Language Add-ons
  // =============================================================================

  await page.waitForURL(/\/onboarding\/step\/13/, { timeout: 10000 })
  await expect(page.locator('text=Step 13 of')).toBeVisible()
  await expect(page.locator('h1')).toContainText(/Language.*Add/i)

  // Step 13 is optional - can proceed without selecting languages
  // Select languages if provided
  if (additionalLanguages.length > 0) {
    for (const lang of additionalLanguages) {
      // Find checkbox by checking all checkboxes for matching text
      const allCheckboxes = await page.locator('button[role="checkbox"]').all()
      for (const checkbox of allCheckboxes) {
        const parent = checkbox.locator('..')
        const text = await parent.textContent()

        // Match language codes: de, fr, es, etc.
        const langPatterns: Record<string, RegExp> = {
          'de': /German|Deutsch|de/i,
          'fr': /French|Français|fr/i,
          'es': /Spanish|Español|es/i,
          'it': /Italian|Italiano|it/i
        }

        const pattern = langPatterns[lang] || new RegExp(lang, 'i')

        if (text && pattern.test(text)) {
          const state = await checkbox.getAttribute('data-state')
          if (state !== 'checked') {
            await checkbox.click()
            await page.waitForTimeout(500)
          }
          break
        }
      }
    }
  }

  // Continue to Step 14
  const step13Next = page.locator('button').filter({ hasText: 'Next' }).and(page.locator(':not([data-next-mark])')).first()
  await expect(step13Next).toBeEnabled({ timeout: 10000 })
  await step13Next.click()
  await page.waitForTimeout(2000)

  // Get session ID from localStorage
  const sessionId = await page.evaluate(() => {
    const store = localStorage.getItem('wb-onboarding-store')
    if (!store) return null
    try {
      const parsed = JSON.parse(store)
      return parsed.state?.sessionId || null
    } catch {
      return null
    }
  })

  return { testEmail, sessionId }
}

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
    test.setTimeout(180000) // 3 minutes for full flow navigation

    let sessionId: string | null = null
    let submissionId: string | null = null
    let testEmail: string = ''

    try {
      // 1. Navigate through all steps to Step 14
      const result = await navigateToStep14(page)
      testEmail = result.testEmail
      sessionId = result.sessionId

      expect(sessionId).toBeTruthy()

      // 2. Wait for Stripe Elements iframe to load (can take up to 30 seconds)
      await page.waitForSelector('iframe[name^="__privateStripeFrame"]', {
        timeout: 30000
      })

      // Additional wait for Stripe to fully initialize inside iframe
      await page.waitForTimeout(3000)

      // 3. Verify pricing breakdown displays
      await expect(page.locator('text=/Base Package/i')).toBeVisible({ timeout: 10000 })
      // Pricing is shown in order summary card
      await expect(page.locator('text=/Order Summary/i')).toBeVisible()

      // 4. Accept terms and conditions
      await page.locator('#acceptTerms').click()

      // 5. Fill payment details with test card
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


      // 6. Submit payment
      const payButton = page.locator('button:has-text("Pay €")')
      await payButton.click()

      // 10. Wait for webhook processing and redirect
      await page.waitForURL(url => url.pathname.includes('/thank-you'), { timeout: 30000 })

      // 11. Get submission ID first
      const { data: submissionBeforeWebhook } = await supabase
        .from('onboarding_submissions')
        .select('id, status')
        .eq('session_id', sessionId!)
        .single()

      expect(submissionBeforeWebhook).toBeTruthy()
      submissionId = submissionBeforeWebhook.id

      // 12. Wait for webhooks to process (payment_intent.succeeded webhook updates status to 'paid')
      const webhookProcessed = await waitForWebhookProcessing(submissionId!, 'paid', {
        maxAttempts: 20,
        delayMs: 500
      })

      expect(webhookProcessed).toBe(true)

      // 13. Verify final submission state in database
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
      if (submissionId) {
        await supabase
          .from('onboarding_submissions')
          .delete()
          .eq('id', submissionId)
      }
    }
  })

  test('payment flow with language add-ons', async ({ page }) => {
    test.setTimeout(180000) // 3 minutes for full flow navigation

    let sessionId: string | null = null
    let submissionId: string | null = null
    let testEmail: string = ''

    try {
      // 1. Navigate through all steps to Step 14 with language add-ons
      const result = await navigateToStep14(page, ['de', 'fr']) // German and French
      testEmail = result.testEmail
      sessionId = result.sessionId

      expect(sessionId).toBeTruthy()

      // 2. Verify total pricing with language add-ons
      await expect(page.locator('text=/Base Package/i')).toBeVisible({ timeout: 10000 })
      await expect(page.locator('p:has-text("Language add-ons")').first()).toBeVisible()

      // 3. Complete payment
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

      await page.waitForURL(url => url.pathname.includes('/thank-you'), { timeout: 30000 })

      // 4. Get submission ID first
      const { data: submissionBeforeWebhook } = await supabase
        .from('onboarding_submissions')
        .select('id, status, form_data')
        .eq('session_id', sessionId!)
        .single()

      expect(submissionBeforeWebhook).toBeTruthy()
      submissionId = submissionBeforeWebhook.id

      // 5. Verify languages saved in database
      expect(submissionBeforeWebhook.form_data.additionalLanguages).toContain('de')
      expect(submissionBeforeWebhook.form_data.additionalLanguages).toContain('fr')

      // 6. Wait for webhooks to process (payment_intent.succeeded webhook updates status to 'paid')
      const webhookProcessed = await waitForWebhookProcessing(submissionId!, 'paid', {
        maxAttempts: 20,
        delayMs: 500
      })

      expect(webhookProcessed).toBe(true)

      // 7. Verify final submission state in database
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
      if (submissionId) {
        await supabase
          .from('onboarding_submissions')
          .delete()
          .eq('id', submissionId)
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

    try {
      // Navigate to Step 14
      const result = await navigateToStep14(page)

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
    }
  })
})
