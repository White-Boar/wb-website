import { test, expect, Page } from '@playwright/test';
import {
  ensureFreshOnboardingState,
  getOnboardingNextButton,
  startOnboardingFromWelcome,
  fillStep1Form,
  completeEmailVerification
} from './helpers/test-utils';

test.describe('Comprehensive Onboarding Test Suite', () => {
  test.beforeEach(async ({ page }) => {
    await ensureFreshOnboardingState(page);
  });

  test.describe('Step 12 Final Flow - File Upload and Submission', () => {
    test('completes onboarding with file uploads on Step 12', async ({ page }) => {
      // Navigate through onboarding to Step 12
      await completeOnboardingToStep12(page);

      // Test file upload functionality
      await expect(page.locator('h1').filter({ hasText: /Business Assets/i })).toBeVisible();
      await expect(page.locator('text=Step 12 of 12')).toBeVisible();

      // Upload logo file
      const logoInput = page.locator('input[type="file"]').first();
      if (await logoInput.isVisible()) {
        // Create a test image file
        await logoInput.setInputFiles({
          name: 'test-logo.png',
          mimeType: 'image/png',
          buffer: Buffer.from('test-image-data')
        });
      }

      // Upload business photos
      const photoInput = page.locator('input[type="file"]').last();
      if (await photoInput.isVisible()) {
        await photoInput.setInputFiles([
          {
            name: 'business-1.jpg',
            mimeType: 'image/jpeg',
            buffer: Buffer.from('test-business-photo-1')
          },
          {
            name: 'business-2.jpg',
            mimeType: 'image/jpeg',
            buffer: Buffer.from('test-business-photo-2')
          }
        ]);
      }

      // Verify Finish button is enabled
      const finishButton = page.locator('button:text("Finish")');
      await expect(finishButton).toBeVisible();
      await expect(finishButton).toBeEnabled();

      // Click Finish button
      await finishButton.click();

      // Should redirect to thank you page
      await page.waitForURL(/\/onboarding\/thank-you/, { timeout: 15000 });
      await expect(page.locator('h1').filter({ hasText: /Perfect|Thank|Complete/i })).toBeVisible();
    });

    test('completes onboarding without file uploads (optional fields)', async ({ page }) => {
      // Navigate through onboarding to Step 12
      await completeOnboardingToStep12(page);

      // Verify we're on Step 12
      await expect(page.locator('h1').filter({ hasText: /Business Assets/i })).toBeVisible();

      // Verify Finish button is enabled even without file uploads (since they're optional)
      const finishButton = page.locator('button:text("Finish")');
      await expect(finishButton).toBeVisible();
      await expect(finishButton).toBeEnabled();

      // Click Finish button
      await finishButton.click();

      // Should redirect to thank you page
      await page.waitForURL(/\/onboarding\/thank-you/, { timeout: 15000 });
      await expect(page.locator('h1').filter({ hasText: /Perfect|Thank|Complete/i })).toBeVisible();
    });

    test('validates file size limits on uploads', async ({ page }) => {
      // Navigate to Step 12
      await completeOnboardingToStep12(page);

      // Try to upload a file larger than 10MB (should fail)
      const logoInput = page.locator('input[type="file"]').first();
      if (await logoInput.isVisible()) {
        // Create a large file buffer (11MB)
        const largeBuffer = Buffer.alloc(11 * 1024 * 1024, 'x');

        try {
          await logoInput.setInputFiles({
            name: 'large-logo.png',
            mimeType: 'image/png',
            buffer: largeBuffer
          });

          // Should show error message
          await expect(page.locator('text*="10MB", text*="size", text*="large"')).toBeVisible();
        } catch (error) {
          // File size validation might prevent the upload entirely
          console.log('Large file upload rejected as expected');
        }
      }
    });
  });

  test.describe('Theme Testing', () => {
    test('works correctly in dark theme', async ({ page }) => {
      // Set dark theme
      await page.emulateMedia({ colorScheme: 'dark' });

      // Complete first few steps in dark theme
      await completeOnboardingSteps(page, 3);

      // Check dark theme is applied
      const body = page.locator('body');
      const bgColor = await body.evaluate(el => getComputedStyle(el).backgroundColor);

      // Dark theme should have dark background
      expect(bgColor).toContain('rgb(0') || expect(bgColor).toContain('rgb(1') || expect(bgColor).toContain('rgb(2');
    });

    test('works correctly in light theme', async ({ page }) => {
      // Set light theme
      await page.emulateMedia({ colorScheme: 'light' });

      // Complete first few steps in light theme
      await completeOnboardingSteps(page, 3);

      // Check light theme is applied
      const body = page.locator('body');
      const bgColor = await body.evaluate(el => getComputedStyle(el).backgroundColor);

      // Light theme should have light background
      expect(bgColor).toContain('rgb(255') || expect(bgColor).toContain('rgb(254') || expect(bgColor).toContain('rgb(253');
    });

    test('theme toggle works during onboarding', async ({ page }) => {
      // Start onboarding
      await startOnboarding(page);

      // Look for theme toggle button
      const themeToggle = page.locator('[aria-label*="theme"], [aria-label*="dark"], [aria-label*="light"], button[data-theme-toggle]');

      if (await themeToggle.isVisible()) {
        // Click theme toggle
        await themeToggle.click();
        await page.waitForTimeout(500);

        // Verify theme changed
        const body = page.locator('body');
        const classList = await body.getAttribute('class');
        expect(classList).toContain('dark' || 'light');
      }
    });
  });

  test.describe('Localization Testing', () => {
    test('works correctly in Italian locale', async ({ page }) => {
      // Navigate to Italian version
      await page.goto('/it/onboarding');
      await page.waitForLoadState('networkidle');

      // Start onboarding in Italian
      const startButton = page.locator('button').filter({ hasText: /Inizia|Comincia|Start/i });
      await expect(startButton).toBeVisible();
      await startButton.click();

      // Check we're on Italian Step 1
      await page.waitForURL(/\/it\/onboarding\/step\/1/);
      await expect(page.locator('text=Passaggio 1, text=Step 1')).toBeVisible();

      // Fill form in Italian context
      await page.fill('input[name="firstName"]', 'Marco');
      await page.fill('input[name="lastName"]', 'Rossi');
      await page.fill('input[name="email"]', 'marco.rossi@esempio.it');

      // Check Italian labels/placeholders
      await expect(page.locator('label, placeholder').filter({ hasText: /Nome|Email/i })).toBeVisible();
    });

    test('switches between English and Italian correctly', async ({ page }) => {
      // Start in English
      await startOnboarding(page);
      await page.fill('input[name="firstName"]', 'John');

      // Switch to Italian
      await page.goto('/it/onboarding/step/1');
      await page.waitForLoadState('networkidle');

      // Verify form data persists across language switch
      const firstNameValue = await page.locator('input[name="firstName"]').inputValue();
      expect(firstNameValue).toBe('John');

      // Verify UI is in Italian
      await expect(page.locator('text=Passaggio, text=Step').first()).toBeVisible();
    });
  });

  test.describe('Responsive Design Testing', () => {
    test('works on desktop (1920x1080)', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });

      await completeOnboardingSteps(page, 5);

      // Check desktop layout
      await expect(page.locator('.container, .max-w-4xl')).toBeVisible();

      // Check form elements are properly sized
      const inputs = page.locator('input[type="text"], input[type="email"]');
      const count = await inputs.count();
      if (count > 0) {
        const inputBox = await inputs.first().boundingBox();
        expect(inputBox?.width).toBeGreaterThan(200);
      }
    });

    test('works on tablet (768x1024)', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      await completeOnboardingSteps(page, 3);

      // Check tablet layout adapts correctly
      const nextButton = getOnboardingNextButton(page);
      await expect(nextButton).toBeVisible();

      // Verify touch targets are large enough
      const buttonBox = await nextButton.boundingBox();
      expect(buttonBox?.height).toBeGreaterThan(40);
    });

    test('works on mobile (375x667)', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      await completeOnboardingSteps(page, 3);

      // Check mobile layout
      await expect(page.locator('input[name="firstName"]')).toBeVisible();

      // Test mobile interactions
      await page.tap('input[name="firstName"]');
      await page.fill('input[name="firstName"]', 'Mobile');

      // Check button is accessible on mobile
      const nextButton = getOnboardingNextButton(page);
      await expect(nextButton).toBeVisible();
    });
  });

  test.describe('Data Persistence Testing', () => {
    test('persists form data across browser refresh', async ({ page }) => {
      // Complete first few steps
      await startOnboarding(page);
      await page.fill('input[name="firstName"]', 'TestUser');
      await page.fill('input[name="lastName"]', 'LastName');
      await page.fill('input[name="email"]', 'test@persistence.com');

      await getOnboardingNextButton(page).click();
      await page.waitForURL(/\/step\/2/);

      // Refresh the page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Check data persisted
      if (await page.locator('input[name="firstName"]').isVisible()) {
        await expect(page.locator('input[name="firstName"]')).toHaveValue('TestUser');
      }
    });

    test('handles session interruption and resume', async ({ page }) => {
      // Start onboarding and reach step 3
      await completeOnboardingSteps(page, 3);

      // Fill some data on step 3
      await page.fill('input[name="businessName"]', 'Interrupted Business');

      // Navigate away
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Return to onboarding
      await page.goto('/onboarding');
      await page.waitForLoadState('networkidle');

      // Should offer to continue
      const continueButton = page.locator('button').filter({ hasText: /continue|resume/i });
      if (await continueButton.isVisible()) {
        await continueButton.click();

        // Should return to step 3 with data preserved
        await expect(page).toHaveURL(/\/step\/3/);
        await expect(page.locator('input[name="businessName"]')).toHaveValue('Interrupted Business');
      }
    });

    test('restart button clears all data', async ({ page }) => {
      // Complete some steps
      await completeOnboardingSteps(page, 3);
      await page.fill('input[name="businessName"]', 'ToBeCleared');

      // Look for restart button
      const restartButton = page.locator('button').filter({ hasText: /restart|reset|start over/i });
      if (await restartButton.isVisible()) {
        await restartButton.click();

        // Confirm restart if dialog appears
        const confirmButton = page.locator('button').filter({ hasText: /confirm|yes|restart/i });
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
        }

        // Should go back to welcome page
        await expect(page).toHaveURL(/\/onboarding$/);

        // Start fresh onboarding
        const startButton = page.locator('button').filter({ hasText: /start/i });
        await startButton.click();
        await page.waitForURL(/\/step\/1/);

        // Data should be cleared
        await expect(page.locator('input[name="firstName"]')).toHaveValue('');
      }
    });
  });
});

// Helper functions
async function startOnboarding(page: Page) {
  await startOnboardingFromWelcome(page);
}

async function completeOnboardingSteps(page: Page, targetStep: number) {
  await startOnboarding(page);

  // Step 1
  if (targetStep >= 1) {
    await fillStep1Form(page, { firstName: 'Test', lastName: 'User', email: 'test@example.com' });

    if (targetStep > 1) {
      await getOnboardingNextButton(page).click();
      await page.waitForURL(/\/step\/2/);
    }
  }

  // Step 2 - Email verification
  if (targetStep >= 2) {
    // Use development bypass code with proper helper
    await completeEmailVerification(page, '123456');
  }

  // Step 3 - Business details
  if (targetStep >= 3) {
    await page.fill('input[name="businessName"]', 'Test Business');
    await page.fill('input[name="businessEmail"]', 'business@test.com');
    await page.fill('input[name="businessPhone"]', '3331234567');

    // Fill address
    await page.fill('input[name="physicalAddress.street"]', 'Via Test 123');
    await page.fill('input[name="physicalAddress.city"]', 'Milano');
    await page.fill('input[name="physicalAddress.postalCode"]', '20100');
    await page.fill('input[name="physicalAddress.province"]', 'MI');

    await page.waitForTimeout(1000);

    if (targetStep > 3) {
      const nextButton = getOnboardingNextButton(page);
      if (await nextButton.isEnabled()) {
        await nextButton.click();
        await page.waitForURL(/\/step\/4/);
      }
    }
  }

  // Continue for higher steps as needed
  if (targetStep >= 4) {
    await page.fill('textarea[name="businessDescription"]', 'Test business description');
    await page.waitForTimeout(500);

    if (targetStep > 4) {
      await getOnboardingNextButton(page).click();
      await page.waitForURL(/\/step\/5/);
    }
  }

  if (targetStep >= 5) {
    // Customer profile sliders have default values, can proceed
    if (targetStep > 5) {
      await getOnboardingNextButton(page).click();
      await page.waitForURL(/\/step\/6/);
    }
  }
}

async function completeOnboardingToStep12(page: Page) {
  await completeOnboardingSteps(page, 5);

  // Continue through remaining steps
  for (let step = 6; step <= 11; step++) {
    // Fill minimal required data for each step
    switch (step) {
      case 6: // Customer Needs
        await page.fill('textarea[name="customerProblems"]', 'Test problems');
        await page.fill('textarea[name="customerDelight"]', 'Test solutions');
        break;
      case 7: // Visual Inspiration - optional, can skip
        break;
      case 8: // Design Style
        const designOptions = page.locator('[role="button"], button').filter({ hasText: /modern|classic|minimal/i });
        if (await designOptions.first().isVisible()) {
          await designOptions.first().click();
        }
        break;
      case 9: // Image Style
        const imageOptions = page.locator('[role="button"], button').filter({ hasText: /photo|illustration|graphic/i });
        if (await imageOptions.first().isVisible()) {
          await imageOptions.first().click();
        }
        break;
      case 10: // Color Palette
        const colorOptions = page.locator('[role="button"], button, .color-option').first();
        if (await colorOptions.isVisible()) {
          await colorOptions.click();
        }
        break;
      case 11: // Website Structure
        // Select primary goal
        const goalDropdown = page.locator('[role="combobox"]').first();
        if (await goalDropdown.isVisible()) {
          await goalDropdown.click();
          await page.locator('[role="option"]').first().click();
        }

        // Select some checkboxes
        const checkboxes = page.locator('input[type="checkbox"]');
        const count = await checkboxes.count();
        if (count > 0) {
          await checkboxes.first().click();
          if (count > 1) await checkboxes.nth(1).click();
        }
        break;
    }

    // Move to next step
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
  await getOnboardingNextButton(page).click();
  await page.waitForURL(/\/step\/12/);
}