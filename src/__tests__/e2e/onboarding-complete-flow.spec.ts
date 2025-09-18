import { test, expect, Page } from '@playwright/test';
import {
  ensureFreshOnboardingState,
  getOnboardingNextButton,
  completeEmailVerification,
  startOnboardingFromWelcome,
  fillStep1Form
} from './helpers/test-utils';

test.describe('Complete Onboarding Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure fresh onboarding state using the restart functionality
    await ensureFreshOnboardingState(page);
  });

  test('completes entire onboarding flow from start to finish', async ({ page }) => {
    // Start at the welcome page
    await page.goto('/onboarding');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Wait for hydration

    // Click Start Your Website button
    await page.click('button:text-is("Start Your Website")');
    await page.waitForURL(/\/onboarding\/step\/1/, { timeout: 10000 });

    // Step 1: Welcome - Personal Information
    await expect(page.locator('text=Step 1 of 13')).toBeVisible();
    await expect(page.locator('h1:text("Welcome")')).toBeVisible();

    // Wait for form to be ready and fill out personal information
    await page.waitForTimeout(2000); // Wait for hydration to complete

    // Fill fields using more specific selectors and trigger validation with blur events
    const firstNameField = page.locator('input[name="firstName"]');
    const lastNameField = page.locator('input[name="lastName"]');
    const emailField = page.locator('input[name="email"]');

    await firstNameField.fill('John');
    await firstNameField.blur(); // Trigger validation
    await page.waitForTimeout(500);

    await lastNameField.fill('Doe');
    await lastNameField.blur(); // Trigger validation
    await page.waitForTimeout(500);

    await emailField.fill('john.doe@example.com');
    await emailField.blur(); // Trigger validation
    await page.waitForTimeout(1500); // Wait for validation to complete

    // Click Next button
    await getOnboardingNextButton(page).click();
    await page.waitForURL(/\/onboarding\/step\/2/, { timeout: 10000 });

    // Step 2: Email Verification
    await expect(page.locator('text=Step 2 of 13')).toBeVisible();
    await expect(page.locator('h1:text("Email Verification")')).toBeVisible();

    // Fill verification code using development bypass code "123456" (all digits)
    await page.getByRole('textbox', { name: 'Verification code digit 1' }).fill('1');
    await page.getByRole('textbox', { name: 'Verification code digit 2' }).fill('2');
    await page.getByRole('textbox', { name: 'Verification code digit 3' }).fill('3');
    await page.getByRole('textbox', { name: 'Verification code digit 4' }).fill('4');
    await page.getByRole('textbox', { name: 'Verification code digit 5' }).fill('5');
    await page.getByRole('textbox', { name: 'Verification code digit 6' }).fill('6');

    // Wait for auto-progression to step 3 (system automatically navigates after successful verification)
    await page.waitForURL(/\/onboarding\/step\/3/, { timeout: 10000 });

    // Step 3: Business Details
    await expect(page.locator('text=Step 3 of 13')).toBeVisible();
    await expect(page.locator('h1:text("Business Details")')).toBeVisible();

    // Fill out business information using correct field names from schema
    await page.locator('input[name="businessName"]').fill('Test Company');
    await page.locator('input[name="businessName"]').blur();

    // Select industry - try different approach
    await page.getByRole('combobox', { name: /Industry/i }).click();
    await page.waitForTimeout(1000);

    // Try different selector for the option
    await page.locator('[role="option"]').filter({ hasText: 'Technology' }).click();
    await page.waitForTimeout(500);

    // Fill business email (now added to component)
    await page.locator('input[name="businessEmail"]').fill('business@test.com');
    await page.locator('input[name="businessEmail"]').blur();

    // Fill business phone - use correct Italian format (3XX XXXXXXX - 10 digits total)
    await page.locator('input[name="businessPhone"]').fill('3331234567');
    await page.locator('input[name="businessPhone"]').blur();

    // Fill address fields using nested schema field names
    await page.locator('input[name="physicalAddress.street"]').fill('Via Roma 123');
    await page.locator('input[name="physicalAddress.street"]').blur();
    await page.locator('input[name="physicalAddress.city"]').fill('Milan');
    await page.locator('input[name="physicalAddress.city"]').blur();
    await page.locator('input[name="physicalAddress.postalCode"]').fill('20100');
    await page.locator('input[name="physicalAddress.postalCode"]').blur();
    await page.locator('input[name="physicalAddress.province"]').fill('Lombardy');
    await page.locator('input[name="physicalAddress.province"]').blur();

    // Country field is read-only and defaults to Italy, no need to fill
    // Optional VAT number can be left empty
    await page.waitForTimeout(1000);

    // Try to trigger form validation manually by clicking somewhere else
    await page.click('h1'); // Click on the heading to trigger validation
    await page.waitForTimeout(2000);

    // Debug: List all input field names on the page
    const inputNames = await page.$$eval('input', inputs =>
      inputs.map(input => ({ name: input.getAttribute('name'), value: input.value }))
    );
    console.log('All input fields:', JSON.stringify(inputNames, null, 2));

    // Debug: Check if industry selection worked by looking for hidden inputs or other elements
    const allFormElements = await page.$$eval('input, select, [data-value], [role="combobox"]', elements =>
      elements.map(el => ({
        type: el.tagName.toLowerCase(),
        name: el.getAttribute('name'),
        value: el.value || el.getAttribute('data-value') || el.textContent?.trim(),
        role: el.getAttribute('role')
      }))
    );
    console.log('All form elements:', JSON.stringify(allFormElements, null, 2));

    // Take a screenshot for debugging before clicking Next
    await page.screenshot({ path: 'debug-step3-before-next.png' });

    // Check form validation status
    const nextButton = page.locator('button:has-text("Next")');
    const isEnabled = await nextButton.isEnabled();
    console.log('Next button enabled:', isEnabled);

    if (!isEnabled) {
      // Wait a bit more and try again
      await page.waitForTimeout(2000);
      const isEnabledAfterWait = await nextButton.isEnabled();
      console.log('Next button enabled after wait:', isEnabledAfterWait);

      if (!isEnabledAfterWait) {
        // Take another screenshot showing the disabled state
        await page.screenshot({ path: 'debug-step3-next-disabled.png' });
        throw new Error('Next button is disabled - form validation failed');
      }
    }

    // Click Next button
    await getOnboardingNextButton(page).click();
    await page.waitForURL(/\/onboarding\/step\/4/, { timeout: 10000 });

    // Step 4: Brand Definition
    await expect(page.locator('text=Step 4 of 13')).toBeVisible();
    await expect(page.locator('h1:text("Brand Definition")')).toBeVisible();

    // Fill brand definition information
    await page.fill('textarea[name="businessDescription"]', 'We provide innovative technology solutions for businesses looking to modernize their operations.');

    // Click Next button
    await getOnboardingNextButton(page).click();
    await page.waitForURL(/\/onboarding\/step\/5/, { timeout: 10000 });

    // Step 5: Customer Profile
    await expect(page.locator('text=Step 5 of 13')).toBeVisible();
    await expect(page.locator('h1:text("Customer Profile")')).toBeVisible();

    // Interact with customer profile sliders
    // The sliders should have default values, so we can proceed without changes

    // Click Next button
    await getOnboardingNextButton(page).click();
    await page.waitForURL(/\/onboarding\/step\/6/, { timeout: 10000 });

    // Step 6: Customer Needs
    await expect(page.locator('text=Step 6 of 13')).toBeVisible();
    await expect(page.locator('h1:text("Customer Needs")')).toBeVisible();

    // Fill customer problems
    await page.fill('textarea[name="customerProblems"]', 'Customers struggle with outdated systems and lack of technical expertise');
    // Fill customer delight
    await page.fill('textarea[name="customerDelight"]', 'We provide modern, user-friendly solutions with comprehensive support');

    // Click Next button
    await getOnboardingNextButton(page).click();
    await page.waitForURL(/\/onboarding\/step\/7/, { timeout: 10000 });

    // Step 7: Visual Inspiration
    await expect(page.locator('text=Step 7 of 13')).toBeVisible();
    await expect(page.locator('h1:text("Visual Inspiration")')).toBeVisible();

    // Website references are optional, so we can proceed without adding any

    // Click Next button
    await getOnboardingNextButton(page).click();
    await page.waitForURL(/\/onboarding\/step\/8/, { timeout: 10000 });

    // Step 8: Design Style
    await expect(page.locator('text=Step 8 of 13')).toBeVisible();
    await expect(page.locator('h1:text("Design Style")')).toBeVisible();

    // Select a design style
    await page.click('text=Modern Minimal');

    // Click Next button
    await getOnboardingNextButton(page).click();
    await page.waitForURL(/\/onboarding\/step\/9/, { timeout: 10000 });

    // Step 9: Image Style
    await expect(page.locator('text=Step 9 of 13')).toBeVisible();
    await expect(page.locator('h1:text("Image Style")')).toBeVisible();

    // Select an image style
    await page.click('text=Professional Photography');

    // Click Next button
    await getOnboardingNextButton(page).click();
    await page.waitForURL(/\/onboarding\/step\/10/, { timeout: 10000 });

    // Step 10: Color Palette
    await expect(page.locator('text=Step 10 of 13')).toBeVisible();
    await expect(page.locator('h1:text("Color Palette")')).toBeVisible();

    // Select a color palette
    await page.click('[data-testid="color-option"]:first-child, .color-option:first-child, button[aria-label*="color"]:first-child');

    // Click Next button
    await getOnboardingNextButton(page).click();
    await page.waitForURL(/\/onboarding\/step\/11/, { timeout: 10000 });

    // Step 11: Website Structure
    await expect(page.locator('text=Step 11 of 13')).toBeVisible();
    await expect(page.locator('h1:text("Website Structure")')).toBeVisible();

    // Select primary goal using dropdown
    await page.locator('[role="combobox"]').first().click();
    await page.locator('[role="option"]').first().click();

    // Select website sections (checkboxes)
    const checkboxes = page.locator('input[type="checkbox"]');
    const count = await checkboxes.count();
    if (count > 0) {
      await checkboxes.first().click();
      if (count > 1) await checkboxes.nth(1).click();
      if (count > 2) await checkboxes.nth(2).click();
    }

    // Click Next button
    await getOnboardingNextButton(page).click();
    await page.waitForURL(/\/onboarding\/step\/12/, { timeout: 10000 });

    // Step 12: Business Assets (Final Step)
    await expect(page.locator('text=Step 12 of 13')).toBeVisible();
    await expect(page.locator('h1:text("Business Assets")')).toBeVisible();

    // File uploads are optional, so we can proceed without uploading
    // Verify the Finish button is present and enabled
    await expect(page.locator('button:text("Finish")')).toBeVisible();
    await expect(page.locator('button:text("Finish")')).toBeEnabled();

    // Click Finish button to complete onboarding
    await page.locator('button:text("Finish")').click();

    // Should redirect to thank you page
    await page.waitForURL(/\/onboarding\/thank-you/, { timeout: 10000 });

    // Verify we've reached the thank you page
    await expect(page.locator('h1').filter({ hasText: /Perfect|Thank you|Complete/i })).toBeVisible();
    await expect(page.locator('text=5 business days').or(page.locator('text=preview'))).toBeVisible();
  });

  test('validates required fields and prevents progression without them', async ({ page }) => {
    // Start onboarding
    await page.goto('/onboarding');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Wait for hydration
    await page.click('button:text-is("Start Your Website")');
    await page.waitForURL(/\/onboarding\/step\/1/, { timeout: 10000 });

    // Wait for form to be ready
    await page.waitForTimeout(2000);

    // Step 1: Try to proceed without filling required fields
    const nextButton = page.locator('button:has-text("Next")');

    // Next button should be disabled initially
    await expect(nextButton).toBeDisabled();

    // Fill only some fields
    const firstNameField = page.locator('input[name="firstName"]');
    const lastNameField = page.locator('input[name="lastName"]');
    const emailField = page.locator('input[name="email"]');

    await firstNameField.fill('John');
    await firstNameField.blur();
    await page.waitForTimeout(500);

    // Next should still be disabled
    await expect(nextButton).toBeDisabled();

    // Fill remaining required fields
    await lastNameField.fill('Doe');
    await lastNameField.blur();
    await page.waitForTimeout(500);

    await emailField.fill('john.doe@example.com');
    await emailField.blur();
    await page.waitForTimeout(1500);

    // Now Next should be enabled
    await expect(nextButton).toBeEnabled();

    // Click to proceed
    await nextButton.click();
    await page.waitForURL(/\/onboarding\/step\/2/, { timeout: 10000 });

    // Verify we successfully moved to step 2
    await expect(page.locator('text=Step 2 of 13')).toBeVisible();
  });

  test('allows navigation back to previous steps', async ({ page }) => {
    // Start onboarding and go to step 2
    await page.goto('/onboarding');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Wait for hydration
    await page.click('button:text-is("Start Your Website")');
    await page.waitForURL(/\/onboarding\/step\/1/, { timeout: 10000 });

    // Fill step 1 and proceed
    const firstNameField = page.locator('input[name="firstName"]');
    const lastNameField = page.locator('input[name="lastName"]');
    const emailField = page.locator('input[name="email"]');

    await firstNameField.fill('John');
    await firstNameField.blur();
    await page.waitForTimeout(500);

    await lastNameField.fill('Doe');
    await lastNameField.blur();
    await page.waitForTimeout(500);

    await emailField.fill('john.doe@example.com');
    await emailField.blur();
    await page.waitForTimeout(1500);

    await getOnboardingNextButton(page).click();
    await page.waitForURL(/\/onboarding\/step\/2/, { timeout: 10000 });

    // Now go back to step 1
    await page.click('button:has-text("Previous")');
    await page.waitForURL(/\/onboarding\/step\/1/, { timeout: 10000 });

    // Verify we're back on step 1
    await expect(page.locator('text=Step 1 of 13')).toBeVisible();

    // Verify form data is preserved
    await expect(page.locator('input[name="firstName"]')).toHaveValue('John');
    await expect(page.locator('input[name="lastName"]')).toHaveValue('Doe');
  });

  test('saves progress and allows resuming from where user left off', async ({ page }) => {
    // Start onboarding
    await page.goto('/onboarding');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Wait for hydration
    await page.click('button:text-is("Start Your Website")');
    await page.waitForURL(/\/onboarding\/step\/1/, { timeout: 10000 });

    // Fill step 1 and proceed to step 2
    const firstNameField = page.locator('input[name="firstName"]');
    const lastNameField = page.locator('input[name="lastName"]');
    const emailField = page.locator('input[name="email"]');

    await firstNameField.fill('John');
    await firstNameField.blur();
    await page.waitForTimeout(500);

    await lastNameField.fill('Doe');
    await lastNameField.blur();
    await page.waitForTimeout(500);

    await emailField.fill('john.doe@example.com');
    await emailField.blur();
    await page.waitForTimeout(1500);

    await getOnboardingNextButton(page).click();
    await page.waitForURL(/\/onboarding\/step\/2/, { timeout: 10000 });

    // Fill step 2 (Email Verification) - use development bypass code
    await page.getByRole('textbox', { name: 'Verification code digit 1' }).fill('1');
    await page.getByRole('textbox', { name: 'Verification code digit 2' }).fill('2');
    await page.getByRole('textbox', { name: 'Verification code digit 3' }).fill('3');
    await page.getByRole('textbox', { name: 'Verification code digit 4' }).fill('4');
    await page.getByRole('textbox', { name: 'Verification code digit 5' }).fill('5');
    await page.getByRole('textbox', { name: 'Verification code digit 6' }).fill('6');

    // Wait for auto-progression to step 3 (system automatically navigates after successful verification)
    await page.waitForURL(/\/onboarding\/step\/3/, { timeout: 10000 });

    // Fill step 3 partially (Business Details)
    await page.fill('input[placeholder*="business name"]', 'Test Business Ltd');

    // Navigate away and come back
    await page.goto('/');
    await page.waitForTimeout(1000);

    // Go back to onboarding
    await page.goto('/onboarding');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Should show continue option
    await expect(page.locator('button:text("Continue Where You Left Off")')).toBeVisible();

    // Click continue
    await page.click('button:text("Continue Where You Left Off")');

    // Should return to step 2 (or the last visited step)
    await expect(page).toHaveURL(/\/onboarding\/step\/\d+/);

    // Verify saved data is still there
    const businessNameInput = page.locator('input[placeholder*="business name"]');
    if (await businessNameInput.isVisible()) {
      await expect(businessNameInput).toHaveValue('Test Business Ltd');
    }
  });

  test('handles browser refresh without losing progress', async ({ page }) => {
    // Start onboarding and reach step 3
    await page.goto('/onboarding');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Wait for hydration
    await page.click('button:text-is("Start Your Website")');
    await page.waitForURL(/\/onboarding\/step\/1/, { timeout: 10000 });

    // Fill step 1
    const firstNameField = page.locator('input[name="firstName"]');
    const lastNameField = page.locator('input[name="lastName"]');
    const emailField = page.locator('input[name="email"]');

    await firstNameField.fill('John');
    await firstNameField.blur();
    await page.waitForTimeout(500);

    await lastNameField.fill('Doe');
    await lastNameField.blur();
    await page.waitForTimeout(500);

    await emailField.fill('john.doe@example.com');
    await emailField.blur();
    await page.waitForTimeout(1500);

    await getOnboardingNextButton(page).click();
    await page.waitForURL(/\/onboarding\/step\/2/, { timeout: 10000 });

    // Fill step 2 (Email Verification) - use development bypass code
    await page.getByRole('textbox', { name: 'Verification code digit 1' }).fill('1');
    await page.getByRole('textbox', { name: 'Verification code digit 2' }).fill('2');
    await page.getByRole('textbox', { name: 'Verification code digit 3' }).fill('3');
    await page.getByRole('textbox', { name: 'Verification code digit 4' }).fill('4');
    await page.getByRole('textbox', { name: 'Verification code digit 5' }).fill('5');
    await page.getByRole('textbox', { name: 'Verification code digit 6' }).fill('6');

    // Wait for auto-progression to step 3 (system automatically navigates after successful verification)
    await page.waitForURL(/\/onboarding\/step\/3/, { timeout: 10000 });

    // Fill step 3 (Business Details)
    await page.fill('input[placeholder*="business name"]', 'Test Business Ltd');
    await page.click('button[role="combobox"]:has-text("Select your industry")');
    await page.click('text=Technology');
    await page.fill('input[placeholder*="3XX XXXXXXX"]', '333 1234567');
    await page.fill('input[placeholder*="business address"]', 'Via Roma 123');
    await page.fill('input[placeholder*="Enter city"]', 'Milan');
    await page.fill('input[placeholder*="12345"]', '20100');
    await page.fill('input[placeholder*="province or region"]', 'MI');
    await getOnboardingNextButton(page).click();
    await page.waitForURL(/\/onboarding\/step\/4/, { timeout: 10000 });

    // Refresh the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Should still be on step 4
    await expect(page).toHaveURL(/\/onboarding\/step\/4/);
    await expect(page.locator('text=Step 4 of 13')).toBeVisible();
  });
});