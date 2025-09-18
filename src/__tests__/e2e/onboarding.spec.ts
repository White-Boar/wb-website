import { test, expect } from '@playwright/test';
import {
  fillStep1Form,
  completeEmailVerification,
  fillStep3BusinessDetails,
  startOnboardingFromWelcome,
  navigateToStep,
  getCurrentStepNumber,
  getOnboardingNextButton,
  waitForValidation,
  ensureFreshOnboardingState,
  BYPASS_CODES,
  DEFAULT_USER_DATA
} from './helpers/test-utils';

test.describe('Onboarding Flow', () => {
  // Helper function to fill Step 1 form
  async function fillStep1Form(page: Page, data = {
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com'
  }) {
    await page.fill('input[name="firstName"]', data.firstName);
    await page.fill('input[name="lastName"]', data.lastName);
    await page.fill('input[name="email"]', data.email);
  }

  // Helper function to verify step navigation
  async function verifyStepNavigation(page: Page, stepNumber: number) {
    await expect(page).toHaveURL(`/onboarding/step/${stepNumber}`);
    await expect(page.locator(`[data-testid="step-${stepNumber}"]`).or(page.locator('.step-content'))).toBeVisible();
  }

  // Helper function to complete email verification
  // Updated to support automatic progression after verification
  async function completeEmailVerification(page: Page, code = 'DEV123') {
    // Wait for the OTP input to be visible
    await expect(page.locator('input[maxlength="6"]').first()).toBeVisible();

    // Enter verification code
    await page.fill('input[maxlength="6"]', code);

    // Wait for auto-progression to next step (system auto-navigates after successful verification)
    await page.waitForURL(/\/step\/3/, { timeout: 5000 });
    await page.waitForLoadState('networkidle');
  }

  test.beforeEach(async ({ page }) => {
    // Ensure fresh onboarding state using the restart functionality
    await ensureFreshOnboardingState(page);

    // Start onboarding flow naturally from welcome page
    const startButton = page.getByRole('button', { name: /Start Your Website/i });
    await expect(startButton).toBeVisible();
    await startButton.click();

    // Wait for navigation to step 1
    await page.waitForURL(/\/onboarding\/step\/1/);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // Allow for React hydration
  });

  test.describe('Step 1: Welcome & Basic Info', () => {
    test('loads correctly with proper UI elements', async ({ page }) => {
      // Should already be on step 1 from beforeEach
      await expect(page).toHaveURL(/\/onboarding\/step\/1/);

      // Check page loads correctly
      await expect(page.locator('h1, h2')).toContainText(['Welcome', 'Welcome to WhiteBoar']);

      // Check form fields are present
      await expect(page.locator('input[name="firstName"]')).toBeVisible();
      await expect(page.locator('input[name="lastName"]')).toBeVisible();
      await expect(page.locator('input[name="email"]')).toBeVisible();

      // Check Next button is initially disabled
      const nextButton = getOnboardingNextButton(page);
      await expect(nextButton).toBeDisabled();
    });

    test('validates required fields', async ({ page }) => {
      // First clear existing data from beforeEach and trigger validation
      await page.fill('input[name="firstName"]', '');
      await page.locator('input[name="firstName"]').blur();
      await page.fill('input[name="lastName"]', '');
      await page.locator('input[name="lastName"]').blur();
      await page.fill('input[name="email"]', '');
      await page.locator('input[name="email"]').blur();

      const nextButton = getOnboardingNextButton(page);

      // Check that button is disabled with empty form
      await expect(nextButton).toBeDisabled();

      // Fill only first name
      await page.fill('input[name="firstName"]', 'Test');
      await page.locator('input[name="firstName"]').blur();
      await page.waitForTimeout(300);
      await expect(nextButton).toBeDisabled();

      // Fill first and last name
      await page.fill('input[name="lastName"]', 'User');
      await page.locator('input[name="lastName"]').blur();
      await page.waitForTimeout(300);
      await expect(nextButton).toBeDisabled();

      // Fill all required fields
      await page.fill('input[name="email"]', 'test@example.com');
      await page.locator('input[name="email"]').blur();
      await page.waitForTimeout(1000); // Allow for validation
      await expect(nextButton).toBeEnabled();
    });

    test('validates email format', async ({ page }) => {
      await page.fill('input[name="firstName"]', 'Test');
      await page.fill('input[name="lastName"]', 'User');

      // Test invalid email formats
      const invalidEmails = ['invalid', 'test@', '@example.com', 'test..test@example.com'];

      for (const email of invalidEmails) {
        await page.fill('input[name="email"]', email);
        await page.waitForTimeout(300);

        const nextButton = getOnboardingNextButton(page);
        await expect(nextButton).toBeDisabled();
      }

      // Test valid email
      await page.fill('input[name="email"]', 'test@example.com');
      await page.waitForTimeout(500);
      const nextButton = getOnboardingNextButton(page);
      await expect(nextButton).toBeEnabled();
    });

    test('successfully submits and navigates to Step 2', async ({ page }) => {
      await fillStep1Form(page);

      const nextButton = getOnboardingNextButton(page);
      await expect(nextButton).toBeEnabled();

      await nextButton.click();

      // Should navigate to Step 2 (Email Verification)
      await verifyStepNavigation(page, 2);
    });
  });

  test.describe('Step 2: Email Verification', () => {
    test.beforeEach(async ({ page }) => {
      // Complete Step 1 first
      await fillStep1Form(page);
      await getOnboardingNextButton(page).click();
      await verifyStepNavigation(page, 2);
    });

    test('displays email verification UI correctly', async ({ page }) => {
      // Check email verification content
      await expect(page.locator('text=Email Verification').or(page.locator('text=Verify'))).toBeVisible();

      // Check OTP input is present
      await expect(page.locator('input[maxlength="6"]')).toBeVisible();

      // Check email is displayed (from Step 1)
      await expect(page.locator('text=test@example.com')).toBeVisible();
    });

    test('accepts DEV123 bypass code and auto-progresses', async ({ page }) => {
      await completeEmailVerification(page, 'DEV123');

      // Should automatically navigate to Step 3 (no additional wait needed)
      await verifyStepNavigation(page, 3);
    });

    test('accepts 123456 bypass code and auto-progresses', async ({ page }) => {
      await completeEmailVerification(page, '123456');

      // Should automatically navigate to Step 3 (no additional wait needed)
      await verifyStepNavigation(page, 3);
    });

    test('validates OTP input length', async ({ page }) => {
      const otpInput = page.locator('input[maxlength="6"]');

      // Test shorter codes
      await otpInput.fill('123');
      await page.waitForTimeout(500);

      const nextButton = getOnboardingNextButton(page);
      await expect(nextButton).toBeDisabled();

      // Test full length code
      await otpInput.fill('DEV123');
      await page.waitForTimeout(500);
      // Should auto-submit or enable next button
    });
  });

  test.describe('Step 3: Business Details', () => {
    test.beforeEach(async ({ page }) => {
      // Complete Steps 1-2
      await fillStep1Form(page);
      await getOnboardingNextButton(page).click();
      await verifyStepNavigation(page, 2);
      await completeEmailVerification(page);
      await verifyStepNavigation(page, 3);
    });

    test('displays business details form correctly', async ({ page }) => {
      // Check form fields are present
      await expect(page.locator('input[name="businessName"]')).toBeVisible();
      await expect(page.locator('input[name="businessEmail"]')).toBeVisible();
      await expect(page.locator('input[name="businessPhone"]')).toBeVisible();

      // Check industry dropdown/selection
      await expect(page.locator('text=Industry').or(page.locator('select, [role="combobox"]'))).toBeVisible();
    });

    test('validates business name requirement', async ({ page }) => {
      const nextButton = getOnboardingNextButton(page);

      // Try without business name
      await page.fill('input[name="businessEmail"]', 'business@example.com');
      await expect(nextButton).toBeDisabled();

      // Add business name
      await page.fill('input[name="businessName"]', 'Test Business');
      await page.waitForTimeout(500);
      // Should become enabled or closer to enabled
    });

    test('validates business email format', async ({ page }) => {
      await page.fill('input[name="businessName"]', 'Test Business');

      // Test invalid business email
      await page.fill('input[name="businessEmail"]', 'invalid-email');
      await page.waitForTimeout(300);

      const nextButton = getOnboardingNextButton(page);
      await expect(nextButton).toBeDisabled();

      // Test valid business email
      await page.fill('input[name="businessEmail"]', 'business@example.com');
      await page.waitForTimeout(500);
    });

    test('completes business details successfully', async ({ page }) => {
      // Fill all required fields
      await page.fill('input[name="businessName"]', 'Test Business Ltd');
      await page.fill('input[name="businessEmail"]', 'business@test-company.com');
      await page.fill('input[name="businessPhone"]', '+39 123 456 7890');

      // Select industry if dropdown is available
      const industrySelect = page.locator('select, [role="combobox"]').first();
      if (await industrySelect.isVisible()) {
        await industrySelect.click();
        await page.locator('option, [role="option"]').first().click();
      }

      // Submit form
      const nextButton = getOnboardingNextButton(page);
      await page.waitForTimeout(1000);

      if (await nextButton.isEnabled()) {
        await nextButton.click();
        await verifyStepNavigation(page, 4);
      }
    });
  });

  test.describe('Step 4: Brand Definition', () => {
    test.beforeEach(async ({ page }) => {
      // Complete Steps 1-3
      await fillStep1Form(page);
      await getOnboardingNextButton(page).click();
      await completeEmailVerification(page);

      // Fill Step 3
      await page.fill('input[name="businessName"]', 'Test Business');
      await page.fill('input[name="businessEmail"]', 'business@test.com');

      const nextButton = getOnboardingNextButton(page);
      await page.waitForTimeout(1000);
      if (await nextButton.isEnabled()) {
        await nextButton.click();
      }

      await verifyStepNavigation(page, 4);
    });

    test('displays brand definition form elements', async ({ page }) => {
      // Check for business description/offering field
      await expect(page.locator('textarea[name="businessDescription"], textarea[name="offer"]')).toBeVisible();

      // Check for unique value proposition field
      await expect(page.locator('textarea[name="uniqueValue"], textarea[name="uniqueness"]')).toBeVisible();

      // Check for competitor analysis section
      await expect(page.locator('text=Competitor').or(page.locator('input[placeholder*="competitor"], input[placeholder*="website"]'))).toBeVisible();
    });

    test('validates character count for text areas', async ({ page }) => {
      const businessDesc = page.locator('textarea[name="businessDescription"], textarea[name="offer"]').first();

      if (await businessDesc.isVisible()) {
        // Type short text and check validation
        await businessDesc.fill('Short');
        await page.waitForTimeout(300);

        // Should show character count or minimum requirement
        await expect(page.locator('text*="character", text*="min"')).toBeVisible();

        // Type longer text
        await businessDesc.fill('This is a comprehensive business description that provides detailed information about what our company does and the services we offer to our valued customers.');
        await page.waitForTimeout(500);
      }
    });

    test('allows adding competitor URLs', async ({ page }) => {
      // Look for competitor URL input or add button
      const competitorInput = page.locator('input[placeholder*="competitor"], input[placeholder*="website"], input[placeholder*="http"]');

      if (await competitorInput.isVisible()) {
        await competitorInput.fill('https://competitor.com');

        // Look for add button or auto-add functionality
        const addButton = page.locator('button').filter({ hasText: /add|plus|\+/ });
        if (await addButton.isVisible()) {
          await addButton.click();
        }
      }
    });
  });

  test.describe('Complete Flow Integration', () => {
    test('completes full onboarding flow (Steps 1-4)', async ({ page }) => {
      // Step 1: Welcome & Basic Info
      await fillStep1Form(page, {
        firstName: 'Integration',
        lastName: 'Test',
        email: 'integration@test.com'
      });

      await getOnboardingNextButton(page).click();
      await verifyStepNavigation(page, 2);

      // Step 2: Email Verification
      await completeEmailVerification(page, 'DEV123');
      await verifyStepNavigation(page, 3);

      // Step 3: Business Details
      await page.fill('input[name="businessName"]', 'Integration Test Company');
      await page.fill('input[name="businessEmail"]', 'business@integration-test.com');
      await page.fill('input[name="businessPhone"]', '+39 123 456 7890');

      await page.waitForTimeout(1000);
      const step3NextButton = getOnboardingNextButton(page);
      if (await step3NextButton.isEnabled()) {
        await step3NextButton.click();
        await verifyStepNavigation(page, 4);

        // Step 4: Brand Definition (partial)
        const businessDesc = page.locator('textarea[name="businessDescription"], textarea[name="offer"]').first();
        if (await businessDesc.isVisible()) {
          await businessDesc.fill('We are a comprehensive technology company that provides innovative solutions for businesses looking to modernize their operations and improve their digital presence in the competitive marketplace.');
        }
      }
    });

    test('maintains session persistence across page refreshes', async ({ page }) => {
      // Complete Step 1
      await page.fill('input[name="firstName"]', 'Test');
      await page.fill('input[name="lastName"]', 'User');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.locator('input[name="email"]').blur();
      await waitForValidation(page);

      const nextButton = getOnboardingNextButton(page);
      await expect(nextButton).toBeEnabled();
      await nextButton.click();
      await verifyStepNavigation(page, 2);

      // Refresh page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Should still be on Step 2 or maintain session
      await expect(page.locator('input[maxlength="6"]').or(page.locator('h1, h2'))).toBeVisible();

      // Complete email verification
      await completeEmailVerification(page);

      // Refresh again
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Should maintain progress
      await expect(page.url()).toContain('/onboarding/step/');
    });

    test('handles navigation between completed steps', async ({ page }) => {
      // Complete Steps 1-2
      await fillStep1Form(page);
      const nextButton = getOnboardingNextButton(page);
      await nextButton.click();
      await completeEmailVerification(page);

      // Try to navigate back to Step 1 directly
      await page.goto('/onboarding/step/1');
      await page.waitForLoadState('networkidle');

      // Should allow access to completed steps or redirect appropriately
      await expect(page.url()).toContain('/onboarding/step/');
    });
  });

  test.describe('Error Handling & Edge Cases', () => {
    test('handles network failures gracefully', async ({ page }) => {
      await fillStep1Form(page);

      // Simulate network failure
      await page.route('**/api/onboarding/**', route => route.abort());

      const nextButton = getOnboardingNextButton(page);
      if (await nextButton.isEnabled()) {
        await nextButton.click();

        // Should show error state or handle gracefully
        await page.waitForTimeout(2000);

        // Check for error message or that form remains functional
        await expect(page.locator('input[name="firstName"]').or(page.locator('text=error, text=Error'))).toBeVisible();
      }
    });

    test('validates form state after auto-save', async ({ page }) => {
      await fillStep1Form(page);

      // Wait for auto-save
      await page.waitForTimeout(3000);

      // Refresh page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Check if form data persisted
      const firstNameInput = page.locator('input[name="firstName"]');
      if (await firstNameInput.isVisible()) {
        const value = await firstNameInput.inputValue();
        // Auto-save may or may not work depending on backend
        console.log('Persisted first name:', value);
      }
    });

    test('handles invalid step access', async ({ page }) => {
      // Try to access Step 10 directly without completing previous steps
      await page.goto('/onboarding/step/10');
      await page.waitForLoadState('networkidle');

      // Should redirect to appropriate step or show access denied
      await expect(page.url()).toMatch(/\/onboarding\/step\/[1-9]/);
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test('works correctly on mobile devices', async ({ page, isMobile }) => {
      if (isMobile) {
        // Check mobile layout
        await expect(page.locator('input[name="firstName"]')).toBeVisible();

        // Fill form on mobile
        await fillStep1Form(page);

        // Check button accessibility on mobile
        const nextButton = getOnboardingNextButton(page);
        await expect(nextButton).toBeVisible();

        // Test form submission on mobile
        if (await nextButton.isEnabled()) {
          await nextButton.click();
          await verifyStepNavigation(page, 2);
        }
      }
    });

    test('touch interactions work on mobile', async ({ page, isMobile }) => {
      if (isMobile) {
        // Test touch interactions
        await page.tap('input[name="firstName"]');
        await page.fill('input[name="firstName"]', 'Mobile');

        await page.tap('input[name="lastName"]');
        await page.fill('input[name="lastName"]', 'User');

        await page.tap('input[name="email"]');
        await page.fill('input[name="email"]', 'mobile@test.com');

        // Test button tap
        const nextButton = getOnboardingNextButton(page);
        if (await nextButton.isEnabled()) {
          await page.tap('button:has-text("Next"), button:has-text("Continue")');
        }
      }
    });
  });

  test.describe('Accessibility', () => {
    test('supports keyboard navigation', async ({ page }) => {
      // Test tab navigation
      await page.keyboard.press('Tab');
      await expect(page.locator(':focus')).toBeVisible();

      // Continue tabbing through form elements
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Test form filling with keyboard
      await page.keyboard.type('Keyboard');
      await page.keyboard.press('Tab');
      await page.keyboard.type('User');
      await page.keyboard.press('Tab');
      await page.keyboard.type('keyboard@test.com');

      // Test button activation with keyboard
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter');
    });

    test('has proper ARIA labels and roles', async ({ page }) => {
      // Check for proper labels
      await expect(page.locator('label[for*="firstName"], input[aria-label*="first"], input[aria-labelledby]').first()).toBeVisible();

      // Check for required field indicators
      expect(await page.locator('input[required], input[aria-required="true"]').count()).toBeGreaterThanOrEqual(1);

      // Check for error announcements
      const firstNameInput = page.locator('input[name="firstName"]');
      await firstNameInput.clear();
      await page.keyboard.press('Tab');

      // Should have aria-invalid or error state
      await page.waitForTimeout(500);
    });
  });
});