import { test, expect, Page } from '@playwright/test';
import { ensureFreshOnboardingState, getOnboardingNextButton } from './helpers/test-utils';

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

    // Wait for auto-submission or verification to complete
    await page.waitForTimeout(3000);

    // Check if Verify Code button appeared and click it
    const verifyButton = page.locator('button:has-text("Verify Code")');
    if (await verifyButton.isVisible()) {
      await verifyButton.click();
      await page.waitForTimeout(2000); // Wait for verification to complete
    }

    // Now click Next button to proceed to step 3
    await getOnboardingNextButton(page).click();
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

    // Step 4: Target Audience
    await expect(page.locator('text=Step 4 of 13')).toBeVisible();
    await expect(page.locator('h1:text("Target Audience")')).toBeVisible();

    // Fill target audience information
    await page.fill('textarea[placeholder*="ideal customers"]', 'Small to medium businesses looking for technology solutions');
    // Select age ranges
    await page.click('input[type="checkbox"][value="25-34"]');
    await page.click('input[type="checkbox"][value="35-44"]');
    // Select locations
    await page.click('input[type="checkbox"][value="local"]');
    await page.click('input[type="checkbox"][value="national"]');

    // Click Next button
    await getOnboardingNextButton(page).click();
    await page.waitForURL(/\/onboarding\/step\/5/, { timeout: 10000 });

    // Step 5: Goals & Objectives
    await expect(page.locator('text=Step 5 of 13')).toBeVisible();
    await expect(page.locator('h1:text("Goals & Objectives")')).toBeVisible();

    // Select primary goals
    await page.click('input[type="checkbox"][value="increase-sales"]');
    await page.click('input[type="checkbox"][value="generate-leads"]');
    await page.click('input[type="checkbox"][value="build-brand"]');

    // Fill success metrics
    await page.fill('textarea[placeholder*="measure success"]', 'Increased leads by 50%, higher conversion rates, improved brand recognition');

    // Click Next button
    await getOnboardingNextButton(page).click();
    await page.waitForURL(/\/onboarding\/step\/6/, { timeout: 10000 });

    // Step 6: Customer Needs
    await expect(page.locator('text=Step 6 of 13')).toBeVisible();
    await expect(page.locator('h1:text("Customer Needs")')).toBeVisible();

    // Fill customer problems
    await page.fill('textarea[placeholder*="problems do your customers face"]', 'Customers struggle with outdated systems and lack of technical expertise');
    // Fill solutions
    await page.fill('textarea[placeholder*="solve these problems"]', 'We provide modern, user-friendly solutions with comprehensive support');

    // Click Next button
    await getOnboardingNextButton(page).click();
    await page.waitForURL(/\/onboarding\/step\/7/, { timeout: 10000 });

    // Step 7: Visual Inspiration
    await expect(page.locator('text=Step 7 of 13')).toBeVisible();
    await expect(page.locator('h1:text("Visual Inspiration")')).toBeVisible();

    // Add inspiration URLs (optional, so we can skip)
    // Just fill visual preferences
    await page.fill('textarea[placeholder*="look and feel"]', 'Modern, clean design with professional appearance');

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

    // Step 10: Color Preferences
    await expect(page.locator('text=Step 10 of 13')).toBeVisible();
    await expect(page.locator('h1:text("Color Preferences")')).toBeVisible();

    // Select a color palette (assuming there's a selectable option)
    await page.click('.color-palette-option:first-of-type');

    // Click Next button
    await getOnboardingNextButton(page).click();
    await page.waitForURL(/\/onboarding\/step\/11/, { timeout: 10000 });

    // Step 11: Website Structure
    await expect(page.locator('text=Step 11 of 13')).toBeVisible();
    await expect(page.locator('h1:text("Website Structure")')).toBeVisible();

    // Select primary goal
    await page.click('button[role="combobox"]:has-text("Select your primary objective")');
    await page.click('text=Generate leads and inquiries');

    // Select website sections
    await page.click('input[type="checkbox"][id*="hero"]');
    await page.click('input[type="checkbox"][id*="about"]');
    await page.click('input[type="checkbox"][id*="services"]');
    await page.click('input[type="checkbox"][id*="contact"]');

    // Click Next button
    await getOnboardingNextButton(page).click();
    await page.waitForURL(/\/onboarding\/step\/12/, { timeout: 10000 });

    // Step 12: Content Collection
    await expect(page.locator('text=Step 12 of 13')).toBeVisible();
    await expect(page.locator('h1:text("Content Collection")')).toBeVisible();

    // Fill content fields
    await page.fill('textarea[placeholder*="headline"]', 'Innovative Technology Solutions for Your Business');
    await page.fill('textarea[placeholder*="subheadline"]', 'Transform your business with cutting-edge technology');
    await page.fill('textarea[placeholder*="about your business"]', 'We are a leading technology provider with over 10 years of experience');

    // Click Next button
    await getOnboardingNextButton(page).click();
    await page.waitForURL(/\/onboarding\/step\/13/, { timeout: 10000 });

    // Step 13: Review & Confirm
    await expect(page.locator('text=Step 13 of 13')).toBeVisible();
    await expect(page.locator('h1:text("Review & Confirm")')).toBeVisible();

    // Verify we've reached the final step
    await expect(page.locator('text=100%')).toBeVisible();

    // Check that review sections are visible
    await expect(page.locator('text=Personal Information')).toBeVisible();
    await expect(page.locator('text=Business Details')).toBeVisible();
    await expect(page.locator('text=Design Preferences')).toBeVisible();

    // Verify the submit button is present
    await expect(page.locator('button:text("Complete Onboarding")')).toBeVisible();
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
    await page.waitForTimeout(3000);

    // Check if Verify Code button appeared and click it
    const verifyButton = page.locator('button:has-text("Verify Code")');
    if (await verifyButton.isVisible()) {
      await verifyButton.click();
      await page.waitForTimeout(2000);
    }

    // Click Next button to proceed to step 3
    await getOnboardingNextButton(page).click();
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
    await page.waitForTimeout(3000);

    // Check if Verify Code button appeared and click it
    const verifyButton = page.locator('button:has-text("Verify Code")');
    if (await verifyButton.isVisible()) {
      await verifyButton.click();
      await page.waitForTimeout(2000);
    }

    // Click Next button to proceed to step 3
    await getOnboardingNextButton(page).click();
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