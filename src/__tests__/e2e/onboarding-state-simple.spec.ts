import { test, expect } from '@playwright/test';

test.describe('Onboarding State and Restart - Core Tests', () => {

  test('state persistence and restart functionality', async ({ page }) => {
    // Clear localStorage first
    await page.goto('http://localhost:3000/en/onboarding');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');

    console.log('=== Testing State Persistence ===');

    // Start onboarding
    await page.click('button:has-text("Start Your Website")');
    await page.waitForURL('**/onboarding/step/1', { timeout: 10000 });

    // Fill form
    await page.fill('input[placeholder="Enter your first name"]', 'TestUser');
    await page.waitForTimeout(1000); // Allow auto-save

    // Check localStorage has data
    const savedData = await page.evaluate(() => {
      const data = localStorage.getItem('wb-onboarding-store');
      return data ? JSON.parse(data) : null;
    });

    expect(savedData).toBeTruthy();
    expect(savedData.state.formData.firstName).toBe('TestUser');
    console.log('✓ State saved to localStorage');

    // Reload page - should preserve state
    await page.reload();
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/onboarding/step/1');
    await expect(page.locator('input[placeholder="Enter your first name"]')).toHaveValue('TestUser');
    console.log('✓ State persisted after reload');

    console.log('=== Testing Restart Functionality ===');

    // Test restart
    await page.click('[data-testid="restart-onboarding"]');
    await page.waitForSelector('text=Start Over?', { timeout: 5000 });
    await page.click('[data-testid="confirm-restart"]');
    await page.waitForURL('**/en/onboarding', { timeout: 10000 });

    console.log('✓ Restart navigation completed');

    // Wait for any state changes
    await page.waitForTimeout(500);

    // CRITICAL TEST: Reload and verify we stay on welcome page
    await page.reload();
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/en/onboarding');
    expect(page.url()).not.toContain('/step/');
    console.log('✓ CRITICAL: Stayed on welcome page after restart + reload');

    // Start fresh onboarding - should be clean
    await page.click('button:has-text("Start Your Website")');
    await page.waitForURL('**/onboarding/step/1', { timeout: 10000 });

    // Form should be empty
    await expect(page.locator('input[placeholder="Enter your first name"]')).toHaveValue('');
    console.log('✓ Fresh start confirmed - form is empty');

    console.log('=== All Tests Passed ===');
  });

  test('localStorage state structure validation', async ({ page }) => {
    await page.goto('http://localhost:3000/en/onboarding');
    await page.evaluate(() => localStorage.clear());

    // Start onboarding
    await page.click('button:has-text("Start Your Website")');
    await page.waitForURL('**/onboarding/step/1');

    // Fill minimal data
    await page.fill('input[placeholder="Enter your first name"]', 'John');
    await page.waitForTimeout(500);

    // Validate localStorage structure
    const stateStructure = await page.evaluate(() => {
      const data = localStorage.getItem('wb-onboarding-store');
      if (!data) return null;

      const parsed = JSON.parse(data);
      return {
        hasState: !!parsed.state,
        hasSessionId: !!parsed.state?.sessionId,
        hasCurrentStep: typeof parsed.state?.currentStep === 'number',
        hasFormData: !!parsed.state?.formData,
        hasExpiration: !!parsed.state?.sessionExpiresAt,
        firstName: parsed.state?.formData?.firstName
      };
    });

    expect(stateStructure.hasState).toBe(true);
    expect(stateStructure.hasSessionId).toBe(true);
    expect(stateStructure.hasCurrentStep).toBe(true);
    expect(stateStructure.hasFormData).toBe(true);
    expect(stateStructure.firstName).toBe('John');

    console.log('✓ localStorage structure is valid');
  });
});