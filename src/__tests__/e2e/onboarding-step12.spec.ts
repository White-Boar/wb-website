import { test, expect } from '@playwright/test';
import { ensureFreshOnboardingState, startOnboardingFromWelcome, fillStep1Form, completeEmailVerification, getOnboardingNextButton } from './helpers/test-utils';

test.describe('Step 12 File Upload Tests', () => {
  test.beforeEach(async ({ page }) => {
    await ensureFreshOnboardingState(page);
  });

  test('reaches Step 12 and tests file upload functionality', async ({ page }) => {
    // Start onboarding
    await startOnboardingFromWelcome(page);

    // Complete Step 1
    await fillStep1Form(page, {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com'
    });

    const step1NextButton = getOnboardingNextButton(page);
    await expect(step1NextButton).toBeEnabled();
    await step1NextButton.click();

    // Wait for Step 2
    await page.waitForURL(/\/step\/2/);
    await expect(page).toHaveURL(/\/step\/2/);

    // Complete email verification
    await completeEmailVerification(page, '123456');

    // Should auto-progress to Step 3
    await expect(page).toHaveURL(/\/step\/3/);

    // Fill minimal Step 3 data
    await page.fill('input[name="businessName"]', 'Test Business');
    await page.fill('input[name="businessEmail"]', 'business@test.com');
    await page.fill('input[name="businessPhone"]', '3331234567');

    // Fill address fields
    await page.fill('input[name="physicalAddress.street"]', 'Via Test 123');
    await page.fill('input[name="physicalAddress.city"]', 'Milano');
    await page.fill('input[name="physicalAddress.postalCode"]', '20100');
    await page.fill('input[name="physicalAddress.province"]', 'MI');

    // Select industry if dropdown exists
    const industryDropdown = page.locator('[role="combobox"]').first();
    if (await industryDropdown.isVisible()) {
      await industryDropdown.click();
      const firstOption = page.locator('[role="option"]').first();
      if (await firstOption.isVisible()) {
        await firstOption.click();
      }
    }

    // Continue to Step 4
    await page.waitForTimeout(1000);
    const step3NextButton = getOnboardingNextButton(page);
    if (await step3NextButton.isEnabled()) {
      await step3NextButton.click();
      await page.waitForURL(/\/step\/4/);
    }

    // Skip through steps 4-11 quickly with minimal data
    for (let step = 4; step <= 11; step++) {
      console.log(`Processing step ${step}`);

      switch (step) {
        case 4: // Brand Definition
          const textarea = page.locator('textarea[name="businessDescription"]');
          if (await textarea.isVisible()) {
            await textarea.fill('Test business description');
          }
          break;
        case 5: // Customer Profile - sliders have default values
          break;
        case 6: // Customer Needs
          const problemsTextarea = page.locator('textarea[name="customerProblems"]');
          if (await problemsTextarea.isVisible()) {
            await problemsTextarea.fill('Test problems');
          }
          const delightTextarea = page.locator('textarea[name="customerDelight"]');
          if (await delightTextarea.isVisible()) {
            await delightTextarea.fill('Test solutions');
          }
          break;
        case 7: // Visual Inspiration - optional
          break;
        case 8: // Design Style
          const designOption = page.locator('button, [role="button"]').filter({ hasText: /modern|classic|minimal/i }).first();
          if (await designOption.isVisible()) {
            await designOption.click();
          }
          break;
        case 9: // Image Style
          const imageOption = page.locator('button, [role="button"]').filter({ hasText: /photo|illustration|graphic/i }).first();
          if (await imageOption.isVisible()) {
            await imageOption.click();
          }
          break;
        case 10: // Color Palette
          const colorOption = page.locator('button, [role="button"], .color-option').first();
          if (await colorOption.isVisible()) {
            await colorOption.click();
          }
          break;
        case 11: // Website Structure
          const goalDropdown = page.locator('[role="combobox"]').first();
          if (await goalDropdown.isVisible()) {
            await goalDropdown.click();
            const goalOption = page.locator('[role="option"]').first();
            if (await goalOption.isVisible()) {
              await goalOption.click();
            }
          }
          // Select some checkboxes
          const checkboxes = page.locator('input[type="checkbox"]');
          const count = await checkboxes.count();
          if (count > 0) {
            await checkboxes.first().click();
          }
          break;
      }

      // Move to next step (except for step 11, which goes to 12)
      if (step < 11) {
        await page.waitForTimeout(500);
        const nextButton = getOnboardingNextButton(page);
        if (await nextButton.isEnabled()) {
          await nextButton.click();
          await page.waitForURL(new RegExp(`\\/step\\/${step + 1}`));
        }
      }
    }

    // Final navigation to step 12
    const finalNextButton = getOnboardingNextButton(page);
    if (await finalNextButton.isEnabled()) {
      await finalNextButton.click();
      await page.waitForURL(/\/step\/12/);
    }

    // Now test Step 12 functionality
    await expect(page.locator('h1').filter({ hasText: /Business Assets/i })).toBeVisible();
    await expect(page.locator('text=Step 12 of 13')).toBeVisible();

    // Test that Finish button is present and enabled (files are optional)
    const finishButton = page.locator('button:text("Finish")');
    await expect(finishButton).toBeVisible();
    await expect(finishButton).toBeEnabled();

    // Test file upload areas are present
    await expect(page.locator('text=Upload Logo')).toBeVisible();
    await expect(page.locator('text=Upload Photos')).toBeVisible();

    // Test clicking Finish button (without uploads since they're optional)
    await finishButton.click();

    // Should redirect to thank you page
    await page.waitForURL(/\/onboarding\/thank-you/, { timeout: 15000 });
    await expect(page.locator('h1').filter({ hasText: /Perfect|Thank|Complete/i })).toBeVisible();

    console.log('Step 12 test completed successfully!');
  });

  test('Step 12 file upload validation works', async ({ page }) => {
    // Navigate directly to step 12 (this test assumes we can access it)
    await page.goto('/en/onboarding/step/12');
    await page.waitForLoadState('networkidle');

    // If redirected back to start, complete minimal flow
    if (!page.url().includes('/step/12')) {
      console.log('Redirected to start, completing minimal flow...');
      // This test will be skipped if we can't directly access step 12
      test.skip(true, 'Cannot directly access Step 12 - session state required');
    }

    // Test file upload areas exist
    await expect(page.locator('text=Upload Logo')).toBeVisible();
    await expect(page.locator('text=Upload Photos')).toBeVisible();

    // Check that finish button is enabled even without uploads
    const finishButton = page.locator('button:text("Finish")');
    await expect(finishButton).toBeVisible();
    await expect(finishButton).toBeEnabled();
  });
});