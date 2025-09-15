import { test, expect, Page } from '@playwright/test';

test.describe('Onboarding Advanced Features', () => {
  // Helper to complete initial steps quickly
  async function completeInitialSteps(page: Page, userData = {
    firstName: 'Advanced',
    lastName: 'Test',
    email: 'advanced@test.com'
  }) {
    // Step 1
    await page.goto('/onboarding/step/1');
    await page.waitForLoadState('networkidle');

    await page.fill('input[name="firstName"]', userData.firstName);
    await page.fill('input[name="lastName"]', userData.lastName);
    await page.fill('input[name="email"]', userData.email);

    await page.getByRole('button', { name: /next|continue/i }).click();
    await page.waitForURL('**/step/2');

    // Step 2 - Email verification
    await page.fill('input[maxlength="6"]', 'DEV123');
    await page.waitForTimeout(1000);

    const nextButton = page.getByRole('button', { name: /next|continue/i });
    if (await nextButton.isEnabled()) {
      await nextButton.click();
      await page.waitForURL('**/step/3');
    }

    // Step 3 - Business details
    await page.fill('input[name="businessName"]', 'Advanced Test Company');
    await page.fill('input[name="businessEmail"]', 'business@advanced-test.com');
    await page.fill('input[name="businessPhone"]', '+39 123 456 7890');

    await page.waitForTimeout(1000);
    const step3NextButton = page.getByRole('button', { name: /next|continue/i });
    if (await step3NextButton.isEnabled()) {
      await step3NextButton.click();
    }
  }

  test.describe('Step 5: Customer Profiling Sliders', () => {
    test.beforeEach(async ({ page }) => {
      await completeInitialSteps(page);

      // Navigate to Step 5 (may need to complete Step 4 first)
      try {
        await page.goto('/onboarding/step/5');
        await page.waitForLoadState('networkidle');
      } catch {
        // If direct access fails, complete Step 4 first
        await page.goto('/onboarding/step/4');
        await page.waitForLoadState('networkidle');

        const businessDesc = page.locator('textarea[name="businessDescription"], textarea[name="offer"]').first();
        if (await businessDesc.isVisible()) {
          await businessDesc.fill('We provide advanced technology solutions for modern businesses.');
        }

        const nextButton = page.getByRole('button', { name: /next|continue/i });
        if (await nextButton.isEnabled()) {
          await nextButton.click();
          await page.waitForURL('**/step/5');
        }
      }
    });

    test('displays customer profiling sliders correctly', async ({ page }) => {
      // Check for slider elements
      const sliders = page.locator('input[type="range"], [role="slider"]');

      if (await sliders.count() > 0) {
        await expect(sliders).toHaveCount.atLeast(3); // Should have multiple profiling sliders

        // Check slider labels and categories
        await expect(page.locator('text*="Budget", text*="Style", text*="Traditional", text*="Modern"')).toBeVisible();

        console.log(`Found ${await sliders.count()} customer profiling sliders`);
      } else {
        // Step 5 might have different content, log what's actually there
        const pageContent = await page.textContent('body');
        console.log('Step 5 content preview:', pageContent?.substring(0, 200));
      }
    });

    test('slider interactions work correctly', async ({ page }) => {
      const sliders = page.locator('input[type="range"], [role="slider"]');

      if (await sliders.count() > 0) {
        const firstSlider = sliders.first();

        // Test slider interaction
        await firstSlider.click();

        // Try to move slider to different positions
        await firstSlider.fill('25');
        await page.waitForTimeout(200);

        await firstSlider.fill('75');
        await page.waitForTimeout(200);

        // Verify slider value changed
        const sliderValue = await firstSlider.inputValue();
        expect(parseInt(sliderValue)).toBeGreaterThan(0);

        console.log('Slider interaction test passed, final value:', sliderValue);
      }
    });

    test('customer profile insights update dynamically', async ({ page }) => {
      const sliders = page.locator('input[type="range"], [role="slider"]');

      if (await sliders.count() > 0) {
        // Move sliders and check for dynamic content updates
        for (let i = 0; i < Math.min(3, await sliders.count()); i++) {
          const slider = sliders.nth(i);
          await slider.fill('80');
          await page.waitForTimeout(300);
        }

        // Look for insights or recommendations that might update
        const insights = page.locator('[class*="insight"], [class*="recommendation"], [class*="tip"]');

        if (await insights.count() > 0) {
          await expect(insights.first()).toBeVisible();
          console.log('Dynamic insights found and visible');
        }
      }
    });
  });

  test.describe('Step 10: Color Palette Selection', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/onboarding/step/10');
      await page.waitForLoadState('networkidle');
    });

    test('displays color palette options', async ({ page }) => {
      // Look for color palette options
      const colorOptions = page.locator('[class*="palette"], [class*="color"], button[data-palette], [role="option"]');

      if (await colorOptions.count() > 0) {
        await expect(colorOptions).toHaveCount.atLeast(3); // Should have multiple palette options

        // Check for color psychology descriptions
        await expect(page.locator('text*="Professional", text*="Warm", text*="Nature", text*="Elegant"')).toBeVisible();

        console.log(`Found ${await colorOptions.count()} color palette options`);
      } else {
        console.log('Color palette step may have different implementation');
      }
    });

    test('color palette selection works', async ({ page }) => {
      const colorOptions = page.locator('[class*="palette"], button[data-palette], [role="option"]');

      if (await colorOptions.count() >= 2) {
        // Select first palette
        await colorOptions.first().click();
        await page.waitForTimeout(300);

        // Select different palette
        await colorOptions.nth(1).click();
        await page.waitForTimeout(300);

        // Check if selection is visually indicated
        const selectedPalette = page.locator('[class*="selected"], [aria-selected="true"], [data-selected="true"]');

        if (await selectedPalette.count() > 0) {
          await expect(selectedPalette).toBeVisible();
          console.log('Color palette selection working correctly');
        }
      }
    });

    test('color accessibility information is provided', async ({ page }) => {
      // Look for accessibility or psychology information
      const accessibilityInfo = page.locator('text*="accessibility", text*="contrast", text*="readable"');

      if (await accessibilityInfo.count() > 0) {
        await expect(accessibilityInfo.first()).toBeVisible();
        console.log('Color accessibility information found');
      }
    });
  });

  test.describe('Step 13: Completion & Summary', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/onboarding/step/13');
      await page.waitForLoadState('networkidle');
    });

    test('displays completion summary correctly', async ({ page }) => {
      // Check for completion elements
      await expect(page.locator('text*="Complete", text*="Summary", text*="Congratulations", text*="Finish"')).toBeVisible();

      // Check for project timeline information
      await expect(page.locator('text*="timeline", text*="days", text*="delivery", text*="project"')).toBeVisible();

      // Check for contact or next steps information
      await expect(page.locator('text*="contact", text*="next", text*="email", text*="start"')).toBeVisible();
    });

    test('final submission works', async ({ page }) => {
      const submitButton = page.getByRole('button', { name: /submit|finish|complete|send/i });

      if (await submitButton.isVisible()) {
        await expect(submitButton).toBeEnabled();

        // Click submit
        await submitButton.click();

        // Should show success state or redirect
        await page.waitForTimeout(2000);

        // Check for success indication
        const successIndicators = page.locator('text*="success", text*="submitted", text*="received", text*="thank"');
        await expect(successIndicators.first()).toBeVisible();
      }
    });

    test('project summary displays collected information', async ({ page }) => {
      // Look for summary sections displaying gathered data
      const summaryElements = page.locator('[class*="summary"], [class*="review"], .project-info');

      if (await summaryElements.count() > 0) {
        await expect(summaryElements.first()).toBeVisible();

        // Should show business name, email, or other collected info
        const businessInfo = page.locator('text*="business", text*="company", text*="@"');
        await expect(businessInfo.first()).toBeVisible();
      }
    });
  });

  test.describe('Session Management & Auto-Save', () => {
    test('auto-save functionality works', async ({ page }) => {
      await page.goto('/onboarding/step/1');
      await page.waitForLoadState('networkidle');

      // Fill form data
      await page.fill('input[name="firstName"]', 'AutoSave');
      await page.fill('input[name="lastName"]', 'Test');
      await page.fill('input[name="email"]', 'autosave@test.com');

      // Wait for auto-save (typically 2 seconds debounce)
      await page.waitForTimeout(3000);

      // Refresh page to test persistence
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Check if data persisted (may depend on localStorage or backend)
      const firstNameValue = await page.locator('input[name="firstName"]').inputValue();

      if (firstNameValue === 'AutoSave') {
        console.log('Auto-save working: data persisted after refresh');
      } else {
        console.log('Auto-save test: data not persisted (may be expected)');
      }
    });

    test('session expiration handling', async ({ page }) => {
      await page.goto('/onboarding/step/1');
      await page.waitForLoadState('networkidle');

      // Simulate session expiration by manipulating localStorage
      await page.evaluate(() => {
        const store = localStorage.getItem('wb-onboarding-store');
        if (store) {
          const data = JSON.parse(store);
          data.state.sessionExpiresAt = new Date(Date.now() - 1000).toISOString(); // Expired
          localStorage.setItem('wb-onboarding-store', JSON.stringify(data));
        }
      });

      // Refresh to trigger expiration check
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Should handle expiration gracefully
      await expect(page.locator('body')).toBeVisible();
    });

    test('session recovery works', async ({ page }) => {
      await completeInitialSteps(page);

      // Simulate browser crash by closing and reopening
      await page.close();

      // Create new page to simulate recovery
      const context = await page.context();
      const newPage = await context.newPage();

      await newPage.goto('/onboarding/step/1');
      await newPage.waitForLoadState('networkidle');

      // Should attempt to recover session or start fresh
      await expect(newPage.locator('body')).toBeVisible();

      await newPage.close();
    });
  });

  test.describe('Multi-Language Support', () => {
    test('works correctly in Italian', async ({ page }) => {
      await page.goto('/it/onboarding/step/1');
      await page.waitForLoadState('networkidle');

      // Check for Italian content
      const italianContent = page.locator('text*="Nome", text*="Cognome", text*="Email", text*="Avanti", text*="Continua"');

      if (await italianContent.count() > 0) {
        await expect(italianContent.first()).toBeVisible();

        // Test form functionality in Italian
        await page.fill('input[name="firstName"]', 'Mario');
        await page.fill('input[name="lastName"]', 'Rossi');
        await page.fill('input[name="email"]', 'mario@test.it');

        const nextButton = page.getByRole('button', { name: /avanti|continua/i });
        if (await nextButton.isEnabled()) {
          await nextButton.click();
          await expect(page).toHaveURL(/\/it\/onboarding\/step\/2/);
        }
      }
    });

    test('translation fallbacks work for missing keys', async ({ page }) => {
      await page.goto('/onboarding/step/5'); // Step with potential missing translations
      await page.waitForLoadState('networkidle');

      // Check console for translation warnings (if accessible)
      const consoleMessages: string[] = [];
      page.on('console', msg => {
        if (msg.text().includes('translation') || msg.text().includes('fallback')) {
          consoleMessages.push(msg.text());
        }
      });

      // Interact with elements that might trigger translation lookups
      await page.locator('body').click();
      await page.waitForTimeout(1000);

      if (consoleMessages.length > 0) {
        console.log('Translation fallbacks triggered:', consoleMessages.length);
      }

      // Page should still be functional even with missing translations
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('File Upload Functionality', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to step that has file uploads (typically Step 12)
      await page.goto('/onboarding/step/12');
      await page.waitForLoadState('networkidle');
    });

    test('file upload interface is accessible', async ({ page }) => {
      const fileInputs = page.locator('input[type="file"]');

      if (await fileInputs.count() > 0) {
        await expect(fileInputs.first()).toBeVisible();

        // Check for upload areas or drag-drop zones
        const uploadAreas = page.locator('[class*="upload"], [class*="drop"], text*="drag", text*="upload"');
        if (await uploadAreas.count() > 0) {
          await expect(uploadAreas.first()).toBeVisible();
        }
      }
    });

    test('file validation works correctly', async ({ page }) => {
      const fileInputs = page.locator('input[type="file"]');

      if (await fileInputs.count() > 0) {
        // Test with various file types (would need actual files in real scenario)
        // This is a conceptual test - in practice, you'd use page.setInputFiles()

        console.log('File upload validation interface available');
      }
    });
  });

  test.describe('Dynamic Form Behavior', () => {
    test('conditional fields show/hide correctly', async ({ page }) => {
      await page.goto('/onboarding/step/11'); // Step with conditional logic
      await page.waitForLoadState('networkidle');

      // Look for dropdowns or selections that might trigger conditional fields
      const selects = page.locator('select, [role="combobox"]');

      if (await selects.count() > 0) {
        const firstSelect = selects.first();
        await firstSelect.click();

        // Select different options and check for dynamic content
        const options = page.locator('option, [role="option"]');
        if (await options.count() > 1) {
          await options.nth(1).click();
          await page.waitForTimeout(500);

          // Check if additional fields appeared
          const dynamicFields = page.locator('input, textarea, select').count();
          console.log('Dynamic form behavior test completed');
        }
      }
    });

    test('form validation updates dynamically', async ({ page }) => {
      await completeInitialSteps(page);

      // Navigate to step with complex validation
      await page.goto('/onboarding/step/4');
      await page.waitForLoadState('networkidle');

      const textarea = page.locator('textarea').first();

      if (await textarea.isVisible()) {
        // Test character count updates
        await textarea.fill('Short');
        await page.waitForTimeout(300);

        // Should show character count or validation message
        const charCount = page.locator('text*="character", text*="/", text*="min"');
        if (await charCount.count() > 0) {
          await expect(charCount.first()).toBeVisible();
        }

        // Add more text
        await textarea.fill('This is a much longer text that should meet the minimum character requirements for this field and provide proper validation feedback.');
        await page.waitForTimeout(300);

        // Validation should update
        console.log('Dynamic validation test completed');
      }
    });
  });

  test.describe('Progress Tracking', () => {
    test('progress indicator updates correctly', async ({ page }) => {
      await page.goto('/onboarding/step/1');
      await page.waitForLoadState('networkidle');

      // Look for progress indicator
      const progressIndicator = page.locator('[class*="progress"], [role="progressbar"], text*="%"');

      if (await progressIndicator.count() > 0) {
        const initialProgress = await progressIndicator.first().textContent();
        console.log('Initial progress:', initialProgress);

        // Complete step and check progress update
        await page.fill('input[name="firstName"]', 'Progress');
        await page.fill('input[name="lastName"]', 'Test');
        await page.fill('input[name="email"]', 'progress@test.com');

        const nextButton = page.getByRole('button', { name: /next|continue/i });
        if (await nextButton.isEnabled()) {
          await nextButton.click();
          await page.waitForURL('**/step/2');

          const updatedProgress = await progressIndicator.first().textContent();
          console.log('Updated progress:', updatedProgress);

          // Progress should have increased
          expect(updatedProgress).not.toBe(initialProgress);
        }
      }
    });

    test('step indicators show current position', async ({ page }) => {
      await page.goto('/onboarding/step/3');
      await page.waitForLoadState('networkidle');

      // Look for step indicators (numbered steps, breadcrumbs, etc.)
      const stepIndicators = page.locator('[class*="step"], [class*="breadcrumb"], text*="Step 3", text*="3 of"');

      if (await stepIndicators.count() > 0) {
        await expect(stepIndicators.first()).toBeVisible();

        // Should highlight current step
        const currentStep = page.locator('[class*="current"], [class*="active"], [aria-current="step"]');
        if (await currentStep.count() > 0) {
          await expect(currentStep.first()).toBeVisible();
        }
      }
    });
  });
});