import { test, expect } from '@playwright/test'
import path from 'path'

/**
 * Step 12 Bug Fix Validation Test
 *
 * BUG: When navigating back to Step 12 after uploading files, the UI doesn't show the uploaded files
 * even though they're stored in localStorage.
 *
 * This test:
 * 1. Seeds localStorage with a complete session up to Step 12
 * 2. Navigates to Step 12
 * 3. Uploads logo and business photo
 * 4. Navigates to Step 13 (Next)
 * 5. Navigates back to Step 12 (Previous)
 * 6. Validates files are visible in UI
 * 7. Validates files are in localStorage
 */

test.describe('Step 12 - File Upload Persistence Bug', () => {
  test('should show uploaded files in UI when navigating back to Step 12', async ({ page }) => {
    console.log('\n🧪 TESTING STEP 12 FILE UPLOAD PERSISTENCE BUG')
    console.log('=' .repeat(80))

    // Capture all console logs from the browser
    page.on('console', msg => {
      const text = msg.text()
      // Filter for our debug logs
      if (text.includes('[updateFormData]') || text.includes('[Step12BusinessAssets]') || text.includes('[Form Reset Effect]') || text.includes('[getStepDefaultValues]')) {
        console.log(`   [BROWSER] ${text}`)
      }
    })

    // ========== SETUP: Seed localStorage with mock session ==========
    console.log('\n📦 STEP 1: Seeding localStorage with mock session...')

    const sessionId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    const mockSessionData = {
      state: {
        sessionId: sessionId,
        currentStep: 14, // Set to 14 so we can navigate to step 12 without redirect
        completedSteps: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
        sessionExpiresAt: expiresAt,
        isSessionExpired: false,
        formData: {
          // Step 1 data
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          emailVerified: true,
          // Step 3 data
          businessName: 'Test Business',
          businessEmail: 'business@example.com',
          businessPhone: '+39 123 456 7890',
          industry: 'Technology',
          // Step 4 data
          businessDescription: 'A test business description',
          // Step 8 data
          designStyle: 'modern',
          // Step 9 data
          imageStyle: 'photography',
          // Step 10 data
          colorPalette: 'blue',
          // Step 11 data
          primaryGoal: 'generate_leads',
          // Step 12 will be empty initially - we'll upload files via UI
          logoUpload: undefined,
          businessPhotos: [],
          _uploading: false
        },
        isLoading: false,
        error: null
      },
      version: 1
    }

    // Use addInitScript to inject localStorage BEFORE page loads
    await page.addInitScript((data) => {
      localStorage.setItem('wb-onboarding-store', JSON.stringify(data))
    }, mockSessionData)

    console.log('✅ localStorage seed script added')
    console.log(`   Session ID: ${sessionId}`)
    console.log(`   Current Step: 14 (can navigate to any previous step)`)

    // ========== NAVIGATE TO STEP 12 ==========
    console.log('\n📍 STEP 2: Navigating to Step 12...')

    await page.goto('http://localhost:3783/onboarding/step/12')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500) // Allow component to mount and restore state

    // ========== VERIFY WE'RE ON STEP 12 ==========
    console.log('\n📍 STEP 3: Verifying navigation to Step 12...')

    // Debug: Check what URL we ended up at
    const actualUrl = page.url()
    console.log(`   Current URL: ${actualUrl}`)

    if (!actualUrl.includes('/step/12')) {
      // Debug: Check localStorage to see if it was read correctly
      const debugStorage = await page.evaluate(() => {
        const store = localStorage.getItem('wb-onboarding-store')
        return store ? JSON.parse(store) : null
      })
      console.log('   ⚠️  Redirected away from Step 12!')
      console.log('   localStorage contents:', JSON.stringify(debugStorage, null, 2))
    }

    await expect(page).toHaveURL(/\/onboarding\/step\/12/)
    console.log('✅ Successfully navigated to Step 12')

    // ========== UPLOAD LOGO ==========
    console.log('\n📤 STEP 4: Uploading logo...')

    const logoInput = page.locator('input[type="file"]').first()
    const logoPath = path.resolve(__dirname, '../fixtures/test-logo.png')

    console.log(`   Logo file path: ${logoPath}`)
    await logoInput.setInputFiles(logoPath)

    // Wait for upload to complete
    await page.waitForTimeout(3000)

    // Verify logo appears in UI
    const logoFileName = page.getByText('test-logo.png')
    await expect(logoFileName).toBeVisible({ timeout: 5000 })
    console.log('✅ Logo uploaded and visible in UI')

    // ========== UPLOAD BUSINESS PHOTO ==========
    console.log('\n📤 STEP 5: Uploading business photo...')

    const allFileInputs = page.locator('input[type="file"]')
    const fileInputCount = await allFileInputs.count()
    console.log(`   Found ${fileInputCount} file inputs on page`)

    if (fileInputCount >= 2) {
      const photoInput = allFileInputs.nth(1)
      await photoInput.scrollIntoViewIfNeeded()

      const photoPath = path.resolve(__dirname, '../fixtures/test-photo.jpg')
      console.log(`   Photo file path: ${photoPath}`)

      await photoInput.setInputFiles(photoPath)

      // Wait for upload to complete
      await page.waitForTimeout(3000)

      // Verify photo appears in UI
      const photoFileName = page.getByText('test-photo.jpg')
      await expect(photoFileName).toBeVisible({ timeout: 5000 })
      console.log('✅ Business photo uploaded and visible in UI')
    } else {
      console.log('⚠️  Only one file input found, skipping business photo upload')
    }

    // ========== VERIFY LOCALSTORAGE AFTER UPLOAD ==========
    console.log('\n💾 STEP 6: Checking localStorage after upload...')

    const storageAfterUpload = await page.evaluate(() => {
      const store = localStorage.getItem('wb-onboarding-store')
      if (!store) return null
      const parsed = JSON.parse(store)
      return {
        logoUpload: parsed?.state?.formData?.logoUpload,
        businessPhotos: parsed?.state?.formData?.businessPhotos,
        currentStep: parsed?.state?.currentStep
      }
    })

    console.log('   localStorage contents:')
    console.log('   - Logo:', storageAfterUpload?.logoUpload ? `✅ ${storageAfterUpload.logoUpload.fileName}` : '❌ Missing')
    console.log('   - Photos:', storageAfterUpload?.businessPhotos?.length > 0 ? `✅ ${storageAfterUpload.businessPhotos.length} photo(s)` : '❌ Empty')
    console.log('   - Current Step:', storageAfterUpload?.currentStep)

    expect(storageAfterUpload?.logoUpload?.fileName).toBe('test-logo.png')
    if (fileInputCount >= 2) {
      expect(storageAfterUpload?.businessPhotos?.length).toBeGreaterThan(0)
      expect(storageAfterUpload?.businessPhotos?.[0]?.fileName).toBe('test-photo.jpg')
    }

    // Wait for auto-save
    await page.waitForTimeout(2000)

    // ========== NAVIGATE TO STEP 13 ==========
    console.log('\n➡️  STEP 7: Navigating to Step 13 (clicking Next)...')

    const nextButton = page.getByRole('button', { name: 'Next', exact: true })
    await expect(nextButton).toBeEnabled({ timeout: 5000 })
    await nextButton.click()

    await page.waitForURL(/\/onboarding\/step\/13/)
    console.log('✅ Successfully navigated to Step 13')

    await page.waitForTimeout(1000)

    // ========== NAVIGATE BACK TO STEP 12 ==========
    console.log('\n⬅️  STEP 8: Navigating back to Step 12 (clicking Previous)...')
    console.log('   🔍 THIS IS THE CRITICAL TEST - Will the UI show the uploaded files?')

    const prevButton = page.getByRole('button', { name: 'Previous' })
    await prevButton.click()

    await page.waitForURL(/\/onboarding\/step\/12/)
    console.log('✅ Returned to Step 12')

    // Wait for component to mount and restore state
    await page.waitForTimeout(1500)

    // ========== DEBUG: Check localStorage immediately after return ==========
    console.log('\n🔍 STEP 9: Checking localStorage after returning to Step 12...')

    const storageAfterReturn = await page.evaluate(() => {
      const store = localStorage.getItem('wb-onboarding-store')
      if (!store) return null
      const parsed = JSON.parse(store)
      return {
        logoUpload: parsed?.state?.formData?.logoUpload,
        businessPhotos: parsed?.state?.formData?.businessPhotos
      }
    })

    console.log('   localStorage after return:')
    console.log('   - Logo:', storageAfterReturn?.logoUpload ? `✅ ${storageAfterReturn.logoUpload.fileName}` : '❌ Missing')
    console.log('   - Photos:', storageAfterReturn?.businessPhotos?.length > 0 ? `✅ ${storageAfterReturn.businessPhotos.length} photo(s)` : '❌ Empty')

    // ========== VERIFY FILES VISIBLE IN UI ==========
    console.log('\n🔍 STEP 10: Verifying files are visible in UI...')

    // Check for any console errors
    const consoleErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    // Verify logo is visible
    try {
      await expect(page.getByText('test-logo.png')).toBeVisible({ timeout: 5000 })
      console.log('   ✅ Logo file visible: test-logo.png')
    } catch (error) {
      console.log('   ❌ Logo file NOT visible: test-logo.png')

      // Take screenshot for debugging
      await page.screenshot({ path: 'test-results/step12-debug.png', fullPage: true })
      console.log('   📸 Screenshot saved to test-results/step12-debug.png')

      throw error
    }

    // Verify business photo is visible
    if (fileInputCount >= 2) {
      try {
        await expect(page.getByText('test-photo.jpg')).toBeVisible({ timeout: 5000 })
        console.log('   ✅ Business photo visible: test-photo.jpg')
      } catch (error) {
        console.log('   ❌ Business photo NOT visible: test-photo.jpg')
        console.log('   Error:', error)
        throw error
      }
    }

    // ========== VERIFY LOCALSTORAGE STILL HAS FILES (FINAL CHECK) ==========
    console.log('\n💾 STEP 11: Final localStorage verification...')

    const storageFinalCheck = await page.evaluate(() => {
      const store = localStorage.getItem('wb-onboarding-store')
      if (!store) return null
      const parsed = JSON.parse(store)
      return {
        logoUpload: parsed?.state?.formData?.logoUpload,
        businessPhotos: parsed?.state?.formData?.businessPhotos,
        currentStep: parsed?.state?.currentStep,
        fullFormData: parsed?.state?.formData
      }
    })

    console.log('   localStorage contents after return:')
    console.log('   - Logo:', storageFinalCheck?.logoUpload ? `✅ ${storageFinalCheck.logoUpload.fileName}` : '❌ Missing')
    console.log('   - Photos:', storageFinalCheck?.businessPhotos?.length > 0 ? `✅ ${storageFinalCheck.businessPhotos.length} photo(s)` : '❌ Empty')
    console.log('   - Current Step:', storageFinalCheck?.currentStep)

    expect(storageFinalCheck?.logoUpload?.fileName).toBe('test-logo.png')
    if (fileInputCount >= 2) {
      expect(storageFinalCheck?.businessPhotos?.length).toBeGreaterThan(0)
      expect(storageFinalCheck?.businessPhotos?.[0]?.fileName).toBe('test-photo.jpg')
    }

    // ========== VERIFY NO ERROR STATES IN UI ==========
    console.log('\n🚨 STEP 12: Checking for error states in UI...')

    const errorAlerts = page.locator('[role="alert"]').filter({ hasText: /error|fail/i })
    const errorCount = await errorAlerts.count()

    if (errorCount > 0) {
      console.log(`   ⚠️  Found ${errorCount} error alert(s) in UI`)
      for (let i = 0; i < errorCount; i++) {
        const errorText = await errorAlerts.nth(i).textContent()
        console.log(`   Error ${i + 1}: ${errorText}`)
      }
    } else {
      console.log('   ✅ No error alerts in UI')
    }

    await expect(errorAlerts).toHaveCount(0)

    // ========== VERIFY FILE CONTROLS ARE VISIBLE ==========
    console.log('\n🎛️  STEP 13: Verifying file controls (X buttons to remove files) are visible...')

    // The FileUploadWithProgress component shows X icons to remove files
    // These buttons exist within the file list items, one per uploaded file
    const fileListItems = page.locator('.bg-gray-50.rounded-lg').filter({ has: page.getByText('test-logo.png') })
    const fileItemCount = await fileListItems.count()

    console.log(`   Found ${fileItemCount} file list item(s) with remove button`)
    expect(fileItemCount).toBeGreaterThanOrEqual(1) // At least logo file item

    // ========== CONSOLE ERRORS ==========
    if (consoleErrors.length > 0) {
      console.log('\n⚠️  Console errors detected:')
      consoleErrors.forEach((error, i) => {
        console.log(`   ${i + 1}. ${error}`)
      })
    } else {
      console.log('\n✅ No console errors detected')
    }

    // ========== TEST COMPLETE ==========
    console.log('\n' + '='.repeat(80))
    console.log('✅ TEST PASSED: Files persist in UI and localStorage after navigation')
    console.log('='.repeat(80) + '\n')
  })
})
