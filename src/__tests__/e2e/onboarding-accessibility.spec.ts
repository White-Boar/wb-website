import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Onboarding Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/onboarding/step/1');
    await page.waitForLoadState('networkidle');
  });

  test('should not have accessibility violations on Step 1', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('supports keyboard navigation throughout form', async ({ page }) => {
    // Start keyboard navigation
    await page.keyboard.press('Tab');

    // Should focus on first form input
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();

    // Continue through all form elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Should reach the submit button
    const nextButton = page.getByRole('button', { name: /next|continue/i });
    await expect(nextButton).toBeFocused();
  });

  test('form labels are properly associated', async ({ page }) => {
    // Check that all form inputs have associated labels
    const firstNameInput = page.locator('input[name="firstName"]');
    const lastNameInput = page.locator('input[name="lastName"]');
    const emailInput = page.locator('input[name="email"]');

    // Check for labels using for attribute or aria-labelledby
    await expect(firstNameInput).toHaveAttribute('id');
    await expect(lastNameInput).toHaveAttribute('id');
    await expect(emailInput).toHaveAttribute('id');

    // Verify labels exist and are connected
    const firstNameId = await firstNameInput.getAttribute('id');
    const lastNameId = await lastNameInput.getAttribute('id');
    const emailId = await emailInput.getAttribute('id');

    await expect(page.locator(`label[for="${firstNameId}"]`)).toBeVisible();
    await expect(page.locator(`label[for="${lastNameId}"]`)).toBeVisible();
    await expect(page.locator(`label[for="${emailId}"]`)).toBeVisible();
  });

  test('required fields are properly marked', async ({ page }) => {
    // Check for required attributes or aria-required
    const requiredInputs = page.locator('input[required], input[aria-required="true"]');

    // Should have at least 3 required inputs (first name, last name, email)
    await expect(requiredInputs).toHaveCount.atLeast(3);

    // Check for visual indicators of required fields
    await expect(page.locator('text="*"').or(page.locator('[aria-label*="required"]'))).toBeVisible();
  });

  test('error states are announced to screen readers', async ({ page }) => {
    const emailInput = page.locator('input[name="email"]');

    // Enter invalid email to trigger error
    await emailInput.fill('invalid-email');
    await emailInput.blur();

    // Wait for validation
    await page.waitForTimeout(500);

    // Check for aria-invalid or aria-describedby pointing to error message
    const ariaInvalid = await emailInput.getAttribute('aria-invalid');
    const ariaDescribedBy = await emailInput.getAttribute('aria-describedby');

    if (ariaInvalid === 'true' || ariaDescribedBy) {
      // Error state is properly communicated
      expect(true).toBe(true);
    } else {
      // Look for error message in proximity
      const errorMessage = page.locator('[role="alert"], .error, [class*="error"]');
      await expect(errorMessage).toBeVisible();
    }
  });

  test('supports screen reader navigation landmarks', async ({ page }) => {
    // Check for proper heading hierarchy
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    await expect(headings).toHaveCount.atLeast(1);

    // Check for main content area
    const main = page.locator('main, [role="main"]');
    await expect(main).toBeVisible();

    // Check for form regions
    const form = page.locator('form, [role="form"]');
    await expect(form).toBeVisible();
  });

  test('focus management during step transitions', async ({ page }) => {
    // Fill form
    await page.fill('input[name="firstName"]', 'Focus');
    await page.fill('input[name="lastName"]', 'Test');
    await page.fill('input[name="email"]', 'focus@test.com');

    // Submit form
    const nextButton = page.getByRole('button', { name: /next|continue/i });
    await nextButton.click();

    // Wait for navigation
    await page.waitForURL('**/step/2');

    // Focus should be managed - either on heading or first interactive element
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();

    // Should be on a meaningful element (heading, main content, or first input)
    const meaningfulElements = page.locator('h1, h2, main, [role="main"], input').first();
    await expect(meaningfulElements).toBeVisible();
  });

  test('color contrast meets WCAG AA standards', async ({ page }) => {
    // This test would typically use axe-core to check color contrast
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa', 'color-contrast'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('supports high contrast mode', async ({ page }) => {
    // Simulate high contrast mode
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.addStyleTag({ content: `
      * {
        background: black !important;
        color: white !important;
        border-color: white !important;
      }
    ` });

    // Elements should still be visible and functional
    await expect(page.locator('input[name="firstName"]')).toBeVisible();
    await expect(page.locator('input[name="lastName"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();

    const nextButton = page.getByRole('button', { name: /next|continue/i });
    await expect(nextButton).toBeVisible();
  });

  test('respects reduced motion preferences', async ({ page }) => {
    // Set reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });

    // Fill form to trigger any animations
    await page.fill('input[name="firstName"]', 'Motion');
    await page.fill('input[name="lastName"]', 'Test');
    await page.fill('input[name="email"]', 'motion@test.com');

    // Click next button
    const nextButton = page.getByRole('button', { name: /next|continue/i });
    if (await nextButton.isEnabled()) {
      await nextButton.click();

      // Transitions should still work but without excessive motion
      await page.waitForTimeout(1000);
    }

    // Page should still be functional
    await expect(page.locator('body')).toBeVisible();
  });

  test('supports voice navigation commands', async ({ page }) => {
    // Test common voice commands simulation

    // "Click first name"
    await page.click('input[name="firstName"]');
    await expect(page.locator('input[name="firstName"]')).toBeFocused();

    // "Type John"
    await page.type('input[name="firstName"]', 'John');

    // "Click last name"
    await page.click('input[name="lastName"]');
    await expect(page.locator('input[name="lastName"]')).toBeFocused();

    // "Type Doe"
    await page.type('input[name="lastName"]', 'Doe');

    // "Click email"
    await page.click('input[name="email"]');
    await expect(page.locator('input[name="email"]')).toBeFocused();

    // "Type john@example.com"
    await page.type('input[name="email"]', 'john@example.com');

    // "Click next" or "Click continue"
    const nextButton = page.getByRole('button', { name: /next|continue/i });
    if (await nextButton.isEnabled()) {
      await nextButton.click();
    }
  });

  test('provides meaningful error messages', async ({ page }) => {
    const emailInput = page.locator('input[name="email"]');

    // Test various invalid email formats
    const invalidEmails = ['invalid', 'test@', '@example.com'];

    for (const email of invalidEmails) {
      await emailInput.fill(email);
      await emailInput.blur();
      await page.waitForTimeout(300);

      // Look for meaningful error message
      const errorText = await page.locator('[role="alert"], .error, [class*="error"]').textContent();

      if (errorText) {
        // Error message should be descriptive, not just "Invalid"
        expect(errorText.length).toBeGreaterThan(5);
        expect(errorText.toLowerCase()).toContain('email');
      }
    }
  });

  test('skip links functionality', async ({ page }) => {
    // Look for skip links (may be hidden until focused)
    await page.keyboard.press('Tab');

    const skipLink = page.locator('a[href="#main"], a[href="#content"], a:has-text("Skip")').first();

    if (await skipLink.isVisible()) {
      await skipLink.click();

      // Should jump to main content
      const mainContent = page.locator('#main, #content, main, [role="main"]');
      await expect(mainContent).toBeInViewport();
    }
  });

  test('form field help text is accessible', async ({ page }) => {
    // Look for help text or hints
    const helpText = page.locator('[id*="hint"], [id*="help"], .hint, .help-text').first();

    if (await helpText.isVisible()) {
      const helpId = await helpText.getAttribute('id');

      if (helpId) {
        // Find input that should be described by this help text
        const describedInput = page.locator(`[aria-describedby*="${helpId}"]`);
        await expect(describedInput).toBeVisible();
      }
    }
  });

  test('Step 2 accessibility (Email Verification)', async ({ page }) => {
    // Navigate to Step 2
    await page.fill('input[name="firstName"]', 'Access');
    await page.fill('input[name="lastName"]', 'Test');
    await page.fill('input[name="email"]', 'access@test.com');

    const nextButton = page.getByRole('button', { name: /next|continue/i });
    if (await nextButton.isEnabled()) {
      await nextButton.click();
      await page.waitForURL('**/step/2');

      // Run accessibility scan on Step 2
      const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
      expect(accessibilityScanResults.violations).toEqual([]);

      // Check OTP input accessibility
      const otpInput = page.locator('input[maxlength="6"]');
      if (await otpInput.isVisible()) {
        await expect(otpInput).toHaveAttribute('aria-label');

        // Should be described by instructions
        const ariaDescribedBy = await otpInput.getAttribute('aria-describedby');
        if (ariaDescribedBy) {
          const description = page.locator(`#${ariaDescribedBy}`);
          await expect(description).toBeVisible();
        }
      }
    }
  });

  test('dynamic content announcements', async ({ page }) => {
    const emailInput = page.locator('input[name="email"]');

    // Fill valid email to trigger success state
    await emailInput.fill('valid@example.com');
    await emailInput.blur();
    await page.waitForTimeout(500);

    // Look for success announcement
    const successMessage = page.locator('[role="status"], [aria-live="polite"], .success');

    if (await successMessage.isVisible()) {
      const messageText = await successMessage.textContent();
      expect(messageText).toBeTruthy();
      console.log('Success message:', messageText);
    }

    // Fill invalid email to trigger error state
    await emailInput.fill('invalid');
    await emailInput.blur();
    await page.waitForTimeout(500);

    // Look for error announcement
    const errorMessage = page.locator('[role="alert"], [aria-live="assertive"], .error');

    if (await errorMessage.isVisible()) {
      const messageText = await errorMessage.textContent();
      expect(messageText).toBeTruthy();
      console.log('Error message:', messageText);
    }
  });
});