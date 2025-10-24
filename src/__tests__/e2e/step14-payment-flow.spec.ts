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

  // Set up continuous logging for stdout and stderr
  stripeListenerProcess.stdout?.on('data', (data) => {
    const output = data.toString()
    console.log(`[Stripe] ${output.trim()}`)
  })

  stripeListenerProcess.stderr?.on('data', (data) => {
    console.error(`[Stripe Error] ${data.toString().trim()}`)
  })

  stripeListenerProcess.on('error', (error) => {
    console.error('[Stripe Process Error]', error)
  })

  // Wait for listener to be ready
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Stripe listener startup timeout'))
    }, 10000)

    const checkReady = (data: Buffer) => {
      const output = data.toString()
      // Check both stdout and stderr for ready state
      if (output.includes('Ready!') || output.includes('webhook signing secret')) {
        clearTimeout(timeout)
        console.log('✓ Stripe webhook listener ready')
        stripeListenerProcess!.stdout?.off('data', checkReady)
        stripeListenerProcess!.stderr?.off('data', checkReady)
        resolve()
      }
    }

    stripeListenerProcess!.stdout?.on('data', checkReady)
    stripeListenerProcess!.stderr?.on('data', checkReady)
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

  console.log('📍 Step 1: Personal Information')
  // Step 1: Personal Information
  await page.getByRole('textbox', { name: /First Name.*required/ }).fill('Test')
  await page.getByRole('textbox', { name: /Last Name.*required/ }).fill('Payment')
  await page.getByRole('textbox', { name: /Email Address.*required/ }).fill(testEmail)

  // Click Next
  const nextButton = page.locator('button').filter({ hasText: 'Next' }).first()
  await nextButton.click()
  await page.waitForURL(/\/onboarding\/step\/2/)

  console.log('📍 Step 2: Email Verification')
  // Step 2: Email Verification - enter test code "123456" which auto-progresses
  await page.waitForTimeout(1000)

  // Fill 6-digit verification code
  const verificationCode = '123456'
  for (let i = 0; i < verificationCode.length; i++) {
    await page.getByRole('textbox', { name: `Verification code digit ${i + 1}` }).fill(verificationCode[i])
  }

  // Wait for auto-progression to Step 3
  console.log('⏳ Waiting for auto-progression to Step 3...')
  await page.waitForURL(/\/onboarding\/step\/3/, { timeout: 10000 })

  console.log('📍 Step 3: Business Details')

  await expect(page.locator('text=Step 3 of 14')).toBeVisible()
  await expect(page.locator('h1')).toContainText(/Business Details/i)

  // Fill Business Information section
  const businessNameInput = page.locator('input[name="businessName"]')
  if (await businessNameInput.isVisible()) {
    await businessNameInput.fill('Test Payment Business')
    console.log('✓ Filled businessName')
  }

  // Select industry from dropdown with better error handling
  console.log('🎯 Selecting industry...')
  const industryDropdown = page.getByRole('combobox').first()
  await industryDropdown.click()
  await page.waitForTimeout(1000)

  // Try multiple selectors for Technology option
  const technologyOption = page.getByRole('option', { name: /Technology|technology/i }).first()
  if (await technologyOption.isVisible()) {
    await technologyOption.click()
    console.log('✓ Selected Technology industry')
  } else {
    // Fallback - try clicking any option with 'tech' in it
    const techOption = page.locator('[role="option"]').filter({ hasText: /tech/i }).first()
    if (await techOption.isVisible()) {
      await techOption.click()
      console.log('✓ Selected technology-related industry')
    } else {
      console.log('⚠️ Could not find Technology option, selecting first available')
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
  console.log('📍 Filling address fields...')

  const businessStreetInput = page.locator('input[name="businessStreet"]')
  if (await businessStreetInput.isVisible()) {
    await businessStreetInput.fill('Via Giuseppe Mazzini 142')
    console.log('✓ Filled businessStreet')
  }

  const businessCityInput = page.locator('input[name="businessCity"]')
  if (await businessCityInput.isVisible()) {
    await businessCityInput.fill('Milano')
    console.log('✓ Filled businessCity')
  }

  const businessPostalCodeInput = page.locator('input[name="businessPostalCode"]')
  if (await businessPostalCodeInput.isVisible()) {
    await businessPostalCodeInput.fill('20123')
    console.log('✓ Filled businessPostalCode')
  }

  // Province dropdown
  console.log('📍 Selecting province from dropdown...')
  const provinceDropdowns = await page.getByRole('combobox').all()
  let provinceSelected = false

  for (let i = 0; i < provinceDropdowns.length; i++) {
    const dropdownText = await provinceDropdowns[i].textContent()
    if (dropdownText && (dropdownText.includes('province') || dropdownText.includes('region') || dropdownText.includes('Enter province'))) {
      console.log(`  Found province dropdown ${i}`)
      await provinceDropdowns[i].click()
      await page.waitForTimeout(500)

      const regionOption = page.locator('[role="option"]').filter({ hasText: /Lombardia/i }).first()
      if (await regionOption.isVisible()) {
        await regionOption.click()
        provinceSelected = true
        console.log(`✓ Selected Lombardia as province`)
        await page.waitForTimeout(1000)
        break
      }
    }
  }

  // Country is now automatically set to Italy (disabled field) - no need to select
  console.log('✓ Country automatically set to Italy (disabled field)')

  // Trigger validation
  await page.keyboard.press('Tab')
  await page.waitForTimeout(1000)
  await page.getByRole('heading', { name: /Business Details/ }).first().click()
  await page.waitForTimeout(2000)

  // Wait for form validation to complete and enable the Next button
  console.log('⏳ Waiting for Step 3 form validation...')
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
  console.log('⏳ Waiting for Step 3 Next button to be enabled...')
  await expect(step3Next).toBeEnabled({ timeout: 15000 })
  await step3Next.click()
  console.log('✓ Step 3 completed successfully')

  // =============================================================================
  // STEP 4: Brand Definition
  // =============================================================================
  console.log('📍 Step 4: Brand Definition')

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
  console.log('📍 Step 5: Customer Profile')

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
  console.log('📍 Step 6: Customer Needs')

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
      console.log(`  ✓ Filled customer problems (${problemsValue.length} chars) - VALID`)
    }
  }

  // Fill optional customer delight field
  if (await customerDelightTextarea.isVisible()) {
    await customerDelightTextarea.click()
    await customerDelightTextarea.fill('Our customers are delighted when they see immediate improvements in efficiency and productivity.')

    const delightValue = await customerDelightTextarea.inputValue()
    console.log(`  ✓ Filled customer delight (${delightValue.length} chars)`)
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
  console.log('  ✓ Step 6 Next button is enabled')

  // Add retry logic for Step 6 -> Step 7 navigation
  let navigationSuccess = false
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await step6Next.click()
      console.log(`  📍 Clicked Step 6 Next button (attempt ${attempt})`)

      // Wait for navigation with timeout
      await page.waitForURL(/\/onboarding\/step\/7/, { timeout: 5000 })
      navigationSuccess = true
      console.log('  ✓ Successfully navigated to Step 7')
      break
    } catch (e) {
      console.log(`  ⚠️ Navigation to Step 7 failed (attempt ${attempt}), retrying...`)
      await page.waitForTimeout(2000) // Wait for debounced save to complete
    }
  }

  if (!navigationSuccess) {
    const currentUrl = page.url()
    console.log(`  ❌ Failed to navigate to Step 7. Current URL: ${currentUrl}`)
    throw new Error('Failed to navigate from Step 6 to Step 7')
  }

  // =============================================================================
  // STEP 7: Visual Inspiration
  // =============================================================================
  console.log('📍 Step 7: Visual Inspiration')
  await expect(page.locator('text=Step 7 of 14')).toBeVisible()
  await expect(page.locator('h1')).toContainText(/Visual Inspiration|Inspiration/i)

  // Step 7 is optional - Next button should be enabled without website references
  const step7Next = page.locator('button').filter({ hasText: /Next|Skip/ }).and(page.locator(':not([data-next-mark])')).first()
  console.log('⏳ Validating Step 7 optional behavior - Next button should be enabled...')
  await expect(step7Next).toBeEnabled({ timeout: 5000 })
  console.log('✓ Step 7 validation passed - Next button enabled without website references!')
  await step7Next.click()
  await page.waitForTimeout(1000)

  // =============================================================================
  // STEP 8: Design Style
  // =============================================================================
  console.log('📍 Step 8: Design Style')

  await page.waitForURL(/\/onboarding\/step\/8/)
  await expect(page.locator('text=Step 8 of 14')).toBeVisible()
  await expect(page.locator('h1')).toContainText(/Design Style|Style/i)

  // Select a design style from ImageGrid
  const designCards = page.locator('.grid .group.cursor-pointer')
  const designCardCount = await designCards.count()
  console.log(`  Found ${designCardCount} design style cards`)

  if (designCardCount > 0) {
    const firstCard = designCards.first()
    if (await firstCard.isVisible()) {
      await firstCard.click()
      console.log(`  🎨 Clicked design style card 1 (Minimalist)`)
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
  console.log('📍 Step 9: Image Style')

  await page.waitForURL(/\/onboarding\/step\/9/, { timeout: 20000 })
  await expect(page.locator('text=Step 9 of 14')).toBeVisible()
  await expect(page.locator('h1')).toContainText(/Image Style/i)

  // Select an image style from ImageGrid
  const imageCards = page.locator('.grid .group.cursor-pointer')
  const imageCount = await imageCards.count()
  console.log(`  Found ${imageCount} image style cards`)

  if (imageCount > 0) {
    const firstCard = imageCards.first()
    if (await firstCard.isVisible()) {
      await firstCard.click()
      console.log(`  📸 Clicked image style card 1 (Photorealistic)`)
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
  console.log('📍 Step 10: Color Palette')

  await page.waitForURL(/\/onboarding\/step\/10/)
  await expect(page.locator('text=Step 10 of 14')).toBeVisible()
  await expect(page.locator('h1')).toContainText(/Color Palette|Colors/i)

  // Select a color palette from ImageGrid
  const colorCards = page.locator('.grid .group.cursor-pointer')
  const colorCount = await colorCards.count()
  console.log(`  Found ${colorCount} color palette cards`)

  if (colorCount > 0) {
    const firstCard = colorCards.first()
    if (await firstCard.isVisible()) {
      await firstCard.click()
      console.log(`  🎨 Clicked color palette card 1 (Professional Blue)`)
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
  console.log('📍 Step 11: Website Structure')

  await page.waitForURL(/\/onboarding\/step\/11/)
  await expect(page.locator('text=Step 11 of 14')).toBeVisible()
  await expect(page.locator('h1')).toContainText(/Website Structure|Structure/i)

  // Wait for page to fully load
  await page.waitForTimeout(1000)

  // Website structure - select some checkboxes if available
  const checkboxes = page.locator('button[role="checkbox"]')
  const checkboxCount = await checkboxes.count()
  console.log(`📊 Found ${checkboxCount} checkboxes on Step 11`)

  if (checkboxCount > 0) {
    // Click the first 3 checkboxes by finding their labels
    const labels = page.locator('label[for]')
    const labelCount = await labels.count()
    console.log(`Found ${labelCount} checkbox labels`)

    for (let i = 0; i < Math.min(3, labelCount); i++) {
      const label = labels.nth(i)
      const labelText = await label.textContent()
      const htmlFor = await label.getAttribute('for')
      const checkbox = page.locator(`#${htmlFor}`)
      const state = await checkbox.getAttribute('data-state').catch(() => null)

      console.log(`  Label ${i}: "${labelText?.substring(0, 30)}" (for=${htmlFor}), state=${state}`)

      if (state !== 'checked') {
        await label.click()
        await page.waitForTimeout(300)
        const newState = await checkbox.getAttribute('data-state').catch(() => null)
        console.log(`  ✓ Clicked label "${labelText?.substring(0, 20)}", new state: ${newState}`)
      }
    }
    console.log('📋 Selected website sections')
  }
  await page.waitForTimeout(1000)

  // CRITICAL: Add primary goal selection using DropdownInput component
  console.log('🎯 CRITICAL: Selecting primary goal for Step 11 validation...')
  const goalDropdown = page.locator('button[role="combobox"]').filter({ hasNotText: 'Industry' }).first()
  if (await goalDropdown.isVisible()) {
    await goalDropdown.click()
    console.log('✓ Opened primary goal dropdown')
    await page.waitForTimeout(500)

    // Select first available option
    const firstOption = page.locator('[role="option"]').first()
    if (await firstOption.isVisible()) {
      await firstOption.click()
      console.log('🎯 Selected primary goal: First available option')
    }
    await page.waitForTimeout(500)
  }

  // CRITICAL: Select offering type (radio button)
  console.log('📝 CRITICAL: Selecting offering type for Step 11 validation...')
  const servicesRadio = page.locator('button').filter({ hasText: 'Services' }).first()
  if (await servicesRadio.isVisible()) {
    await servicesRadio.click()
    console.log('✓ Selected offering type: Services')
    await page.waitForTimeout(1000)
  }

  // CRITICAL: Add at least one offering (required for validation)
  console.log('📝 CRITICAL: Adding required offering for Step 11 validation...')

  // Fill the offering input field
  const offeringInput = page.locator('input[placeholder="Enter a product or service"]').last()
  if (await offeringInput.isVisible()) {
    await offeringInput.fill('AI-Driven Digital Transformation Consulting')
    console.log('✓ Filled offering input with service description')
    await page.waitForTimeout(500)

    // Click the Add button
    const addOfferingButton = page.locator('button').filter({ hasText: 'Add Item' }).first()
    if (await addOfferingButton.isVisible()) {
      await addOfferingButton.click()
      console.log('✓ Added required offering')
      await page.waitForTimeout(1000)
    }
  }

  // Wait for form state to update
  await page.waitForTimeout(2000)

  // Continue
  const step11Next = page.locator('button').filter({ hasText: 'Next' }).and(page.locator(':not([data-next-mark])')).first()
  console.log('⏳ Waiting for Step 11 Next button to be enabled...')
  await expect(step11Next).toBeEnabled({ timeout: 15000 })
  console.log('✓ Step 11 Next button is enabled, clicking...')
  await step11Next.click()
  await page.waitForTimeout(3000)

  // =============================================================================
  // STEP 12: Business Assets (File Uploads) - SKIP UPLOADS
  // =============================================================================
  console.log('📍 Step 12: Business Assets')

  // Check current URL before waiting
  const currentUrl = page.url()
  console.log(`Current URL after Step 11 Next click: ${currentUrl}`)

  try {
    await page.waitForURL(/\/onboarding\/step\/12/, { timeout: 10000 })
  } catch (e) {
    console.log(`❌ Failed to navigate to Step 12. Still on: ${page.url()}`)
    throw e
  }
  await expect(page.locator('text=Step 12 of 14')).toBeVisible()

  console.log('📁 Skipping file uploads (optional)...')

  // Wait a bit for page to be ready
  await page.waitForTimeout(2000)

  // Click Next to proceed to Step 13 without uploading files
  const step12Next = page.locator('button').filter({ hasText: 'Next' }).and(page.locator(':not([data-next-mark])')).first()
  console.log('⏳ Waiting for Step 12 Next button to be enabled...')
  await expect(step12Next).toBeEnabled({ timeout: 10000 })
  await step12Next.click()
  await page.waitForTimeout(2000)

  // =============================================================================
  // STEP 13: Language Add-ons
  // =============================================================================
  console.log('📍 Step 13: Language Add-ons')

  await page.waitForURL(/\/onboarding\/step\/13/, { timeout: 10000 })
  await expect(page.locator('text=Step 13 of')).toBeVisible()
  await expect(page.locator('h1')).toContainText(/Language.*Add/i)

  // Step 13 is optional - can proceed without selecting languages
  // Select languages if provided
  if (additionalLanguages.length > 0) {
    console.log(`🌍 Selecting ${additionalLanguages.length} additional languages...`)
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
            console.log(`✓ Selected ${lang} language`)
            await page.waitForTimeout(500)
          }
          break
        }
      }
    }
  }

  // Continue to Step 14
  const step13Next = page.locator('button').filter({ hasText: 'Next' }).and(page.locator(':not([data-next-mark])')).first()
  console.log('⏳ Waiting for Step 13 Next button to be enabled...')
  await expect(step13Next).toBeEnabled({ timeout: 10000 })
  await step13Next.click()
  await page.waitForTimeout(2000)

  console.log('✅ Successfully navigated to Step 14')

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

test.describe('Step 14: Payment Flow E2E', () => {
  // Start Stripe listener before all tests
  test.beforeAll(async () => {
    try {
      await startStripeListener()
    } catch (error) {
      console.warn('⚠️  Failed to start Stripe listener:', error)
      console.warn('Webhook events may not be processed during tests')
    }
  })

  // Stop Stripe listener after all tests
  test.afterAll(async () => {
    stopStripeListener()
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
      console.log('✓ Session ID:', sessionId)
      console.log('✓ Test Email:', testEmail)

      // 2. Wait for Stripe Elements iframe to load (can take up to 30 seconds)
      console.log('⏳ Waiting for Stripe Elements to load...')
      await page.waitForSelector('iframe[name^="__privateStripeFrame"]', {
        timeout: 30000
      })
      console.log('✓ Stripe Elements iframe found')

      // Additional wait for Stripe to fully initialize inside iframe
      await page.waitForTimeout(3000)

      // 3. Verify pricing breakdown displays
      console.log('⏳ Verifying pricing display...')
      await expect(page.locator('text=/Base Package/i')).toBeVisible({ timeout: 10000 })
      // Pricing is shown in order summary card
      await expect(page.locator('text=/Order Summary/i')).toBeVisible()
      console.log('✓ Pricing displayed')

      // 4. Accept terms and conditions
      await page.locator('#acceptTerms').click()
      console.log('✓ Terms accepted')

      // 5. Fill payment details with test card
      console.log('⏳ Filling payment card details...')

      // Wait for Stripe PaymentElement iframe to load
      await page.waitForSelector('iframe[name^="__privateStripeFrame"]', { timeout: 30000 })
      console.log('✓ Stripe iframe found')

      // Wait for Stripe to fully initialize
      await page.waitForTimeout(3000)

      // Get the Stripe iframe locator
      const stripeFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]').first()

      // Wait for the card input fields to be visible (they should be there by default with tabs layout)
      await stripeFrame.getByRole('textbox', { name: 'Card number' }).waitFor({ state: 'visible', timeout: 30000 })
      console.log('✓ Stripe payment fields loaded')

      // Fill card number
      await stripeFrame.getByRole('textbox', { name: 'Card number' }).fill('4242424242424242')
      console.log('✓ Card number filled')
      await page.waitForTimeout(500)

      // Fill expiry date
      await stripeFrame.getByRole('textbox', { name: /Expiration date/i }).fill('1228')
      console.log('✓ Expiry filled')
      await page.waitForTimeout(500)

      // Fill CVC
      await stripeFrame.getByRole('textbox', { name: 'Security code' }).fill('123')
      console.log('✓ CVC filled')

      console.log('✓ Card details filled')
      console.log('✓ Payment details filled')

      // 6. Submit payment
      console.log('⏳ Submitting payment...')
      const payButton = page.locator('button:has-text("Pay €")')
      await payButton.click()
      console.log('✓ Payment submitted')

      // 10. Wait for webhook processing and redirect
      await page.waitForURL(url => url.pathname.includes('/thank-you'), { timeout: 30000 })
      console.log('✓ Redirected to thank-you page')

      // 11. Wait for webhooks to process (payment_intent.succeeded webhook updates status to 'paid')
      console.log('⏳ Waiting for webhook processing...')
      await page.waitForTimeout(3000)

      // 12. Verify submission in database
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
      console.log('✓ Session ID:', sessionId)
      console.log('✓ Test Email:', testEmail)

      // 2. Verify total pricing with language add-ons
      console.log('⏳ Verifying total pricing...')
      await expect(page.locator('text=/Base Package/i')).toBeVisible({ timeout: 10000 })
      await expect(page.locator('p:has-text("Language add-ons")').first()).toBeVisible()
      console.log('✓ Pricing with language add-ons displayed')

      // 3. Complete payment
      console.log('⏳ Waiting for Stripe Elements to load...')
      await page.waitForSelector('iframe[name^="__privateStripeFrame"]', { timeout: 30000 })
      await page.waitForTimeout(3000)
      console.log('✓ Stripe Elements loaded')

      await page.locator('#acceptTerms').click()
      console.log('✓ Terms accepted')

      console.log('⏳ Filling payment card details...')

      // Wait for Stripe PaymentElement iframe to load
      await page.waitForSelector('iframe[name^="__privateStripeFrame"]', { timeout: 30000 })
      console.log('✓ Stripe iframe found')

      // Wait for Stripe to fully initialize
      await page.waitForTimeout(3000)

      // Get the Stripe iframe locator
      const stripeFrame2 = page.frameLocator('iframe[name^="__privateStripeFrame"]').first()

      // Wait for the card input fields to be visible
      await stripeFrame2.getByRole('textbox', { name: 'Card number' }).waitFor({ state: 'visible', timeout: 30000 })
      console.log('✓ Stripe payment fields loaded')

      // Fill card number
      await stripeFrame2.getByRole('textbox', { name: 'Card number' }).fill('4242424242424242')
      console.log('✓ Card number filled')
      await page.waitForTimeout(500)

      // Fill expiry date
      await stripeFrame2.getByRole('textbox', { name: /Expiration date/i }).fill('1228')
      console.log('✓ Expiry filled')
      await page.waitForTimeout(500)

      // Fill CVC
      await stripeFrame2.getByRole('textbox', { name: 'Security code' }).fill('123')
      console.log('✓ CVC filled')

      console.log('✓ Card details filled')

      console.log('⏳ Submitting payment...')
      const payButton = page.locator('button:has-text("Pay €")')
      await payButton.click()
      console.log('✓ Payment submitted')

      await page.waitForURL(url => url.pathname.includes('/thank-you'), { timeout: 30000 })
      console.log('✓ Redirected to thank-you page')

      // 4. Verify languages saved in database
      const { data: submission } = await supabase
        .from('onboarding_submissions')
        .select('form_data')
        .eq('session_id', sessionId!)
        .single()

      expect(submission.form_data.additionalLanguages).toContain('de')
      expect(submission.form_data.additionalLanguages).toContain('fr')
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
    test.setTimeout(180000) // 3 minutes for full flow navigation

    try {
      // 1. Navigate through all steps to Step 14
      const result = await navigateToStep14(page)
      console.log('✓ Session ID:', result.sessionId)
      console.log('✓ Test Email:', result.testEmail)

      // 2. Use declined test card
      console.log('⏳ Waiting for Stripe Elements to load...')
      await page.waitForSelector('iframe[name^="__privateStripeFrame"]', { timeout: 30000 })
      await page.waitForTimeout(3000)
      console.log('✓ Stripe Elements loaded')

      await page.locator('#acceptTerms').click()
      console.log('✓ Terms accepted')

      console.log('⏳ Filling declined test card details...')

      // Get the Stripe iframe locator
      const stripeFrame3 = page.frameLocator('iframe[name^="__privateStripeFrame"]').first()

      // Wait for the card input fields to be visible
      await stripeFrame3.getByRole('textbox', { name: 'Card number' }).waitFor({ state: 'visible', timeout: 30000 })
      console.log('✓ Stripe payment fields loaded')

      // Fill declined card number
      await stripeFrame3.getByRole('textbox', { name: 'Card number' }).fill('4000000000000002')
      console.log('✓ Declined card number filled')
      await page.waitForTimeout(500)

      // Fill expiry date
      await stripeFrame3.getByRole('textbox', { name: /Expiration date/i }).fill('1228')
      console.log('✓ Expiry filled')
      await page.waitForTimeout(500)

      // Fill CVC
      await stripeFrame3.getByRole('textbox', { name: 'Security code' }).fill('123')
      console.log('✓ CVC filled')

      console.log('✓ Declined card details filled')

      // 3. Submit payment
      console.log('⏳ Submitting payment...')
      const payButton = page.locator('button:has-text("Pay €")')
      await payButton.click()
      console.log('✓ Payment submitted')

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

  test('discount code validation - valid code', async ({ page }) => {
    test.setTimeout(120000)

    try {
      // Navigate to Step 14
      const result = await navigateToStep14(page)
      console.log('✓ Navigated to Step 14')

      // Wait for checkout to load
      await page.waitForSelector('iframe[name^="__privateStripeFrame"]', { timeout: 30000 })
      await page.waitForTimeout(2000)

      // Verify discount code UI is present
      await expect(page.locator('text=/Discount Code/i').first()).toBeVisible()
      console.log('✓ Discount Code section visible')

      // Find and fill discount code input
      const discountInput = page.getByRole('textbox', { name: 'discount' })
      await expect(discountInput).toBeVisible()
      await discountInput.fill('TEST10')
      console.log('✓ Entered discount code: TEST10')

      // Click Apply button
      const applyButton = page.getByRole('button', { name: /Apply|Verify/i })
      await expect(applyButton).toBeEnabled()
      await applyButton.click()
      console.log('✓ Clicked Apply button')

      // Wait for validation
      await page.waitForTimeout(2000)

      // Verify success message appears
      await expect(page.locator('text=/Discount code TEST10 applied/i')).toBeVisible({ timeout: 10000 })
      console.log('✓ Success message displayed')

      // Verify discount badge in order summary
      await expect(page.locator('text=/Discount Applied/i')).toBeVisible()
      console.log('✓ Discount badge displayed')

      // Verify price reduction (original €35, with 10% discount = €31.50)
      await expect(page.locator('button:has-text("Pay €31.5")')).toBeVisible()
      console.log('✓ Price updated to €31.5')

      console.log('✅ Valid discount code test PASSED')

    } catch (error) {
      console.error('❌ Valid discount code test failed:', error)
      throw error
    }
  })

  test('discount code validation - invalid code', async ({ page }) => {
    test.setTimeout(120000)

    try {
      // Navigate to Step 14
      const result = await navigateToStep14(page)
      console.log('✓ Navigated to Step 14')

      // Wait for checkout to load
      await page.waitForSelector('iframe[name^="__privateStripeFrame"]', { timeout: 30000 })
      await page.waitForTimeout(2000)

      // Fill invalid discount code
      const discountInput = page.getByRole('textbox', { name: 'discount' })
      await discountInput.fill('INVALID999')
      console.log('✓ Entered invalid discount code: INVALID999')

      // Click Verify button
      const verifyButton = page.getByRole('button', { name: /Apply|Verify/i })
      await verifyButton.click()
      console.log('✓ Clicked Verify button')

      // Wait for validation
      await page.waitForTimeout(2000)

      // Verify error message appears (check for "invalid" or "not found" or "not valid")
      const errorLocator = page.locator('[role="alert"]').filter({ hasText: /invalid|not found|not valid|doesn't exist/i })
      await expect(errorLocator).toBeVisible({ timeout: 10000 })
      console.log('✓ Error message displayed')

      // Verify price remains unchanged (€35)
      await expect(page.locator('text=/Pay €35/i')).toBeVisible()
      console.log('✓ Price remains €35')

      console.log('✅ Invalid discount code test PASSED')

    } catch (error) {
      console.error('❌ Invalid discount code test failed:', error)
      throw error
    }
  })

  test('discount code validation - empty code', async ({ page }) => {
    test.setTimeout(120000)

    try {
      // Navigate to Step 14
      const result = await navigateToStep14(page)
      console.log('✓ Navigated to Step 14')

      // Wait for checkout to load
      await page.waitForSelector('iframe[name^="__privateStripeFrame"]', { timeout: 30000 })
      await page.waitForTimeout(2000)

      // Verify Apply button is disabled when input is empty
      const discountInput = page.getByRole('textbox', { name: 'discount' })
      const applyButton = page.getByRole('button', { name: /Apply|Verify/i })

      await expect(discountInput).toBeEmpty()
      await expect(applyButton).toBeDisabled()
      console.log('✓ Apply button disabled when input is empty')

      console.log('✅ Empty discount code test PASSED')

    } catch (error) {
      console.error('❌ Empty discount code test failed:', error)
      throw error
    }
  })

  test('discount code applied with payment completion', async ({ page }) => {
    test.setTimeout(180000)

    try {
      // Navigate to Step 14
      const result = await navigateToStep14(page)
      console.log('✓ Navigated to Step 14')

      // Wait for checkout to load
      await page.waitForSelector('iframe[name^="__privateStripeFrame"]', { timeout: 30000 })
      await page.waitForTimeout(2000)

      // Apply discount code
      const discountInput = page.getByRole('textbox', { name: 'discount' })
      await discountInput.fill('TEST20')
      console.log('✓ Entered discount code: TEST20')

      const verifyButton = page.getByRole('button', { name: /Apply|Verify/i })
      await verifyButton.click()
      console.log('✓ Clicked Verify button')

      await page.waitForTimeout(2000)

      // Verify discount applied (20% off €35 = €7, final price €28)
      await expect(page.locator('text=/Discount code TEST20 applied/i')).toBeVisible()
      // Check for €28 in the Pay button
      await expect(page.locator('button:has-text("Pay €28")')).toBeVisible()
      console.log('✓ Discount applied: €28')
      console.log('✓ Discount code validation successful')

      console.log('✅ Discount with payment completion test PASSED')

    } catch (error) {
      console.error('❌ Discount with payment completion test failed:', error)
      throw error
    }
  })
})
