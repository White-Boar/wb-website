import { test, expect } from '@playwright/test';

test.describe('Onboarding State Management and Restart Functionality', () => {

  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test to ensure clean state
    await page.goto('http://localhost:3000/en/onboarding');
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('should save onboarding state during progression and persist on reload', async ({ page }) => {
    // Start onboarding
    await page.click('button:has-text("Start Your Website")');
    await page.waitForURL('**/onboarding/step/1');

    // Fill out step 1 form
    await page.fill('input[placeholder="Enter your first name"]', 'John');
    await page.fill('input[placeholder="Enter your last name"]', 'Doe');
    await page.fill('input[placeholder="Enter your email address"]', 'john.doe@example.com');

    // Wait for auto-save (form watches for changes)
    await page.waitForTimeout(500);

    // Verify state is saved in localStorage
    const savedState = await page.evaluate(() => {
      const data = localStorage.getItem('wb-onboarding-store');
      return data ? JSON.parse(data) : null;
    });

    expect(savedState).toBeTruthy();
    expect(savedState.state.formData.firstName).toBe('John');
    expect(savedState.state.formData.lastName).toBe('Doe');
    expect(savedState.state.formData.email).toBe('john.doe@example.com');
    expect(savedState.state.currentStep).toBe(1);
    expect(savedState.state.sessionId).toBeTruthy();

    console.log('✓ Step 1 form data saved correctly');

    // Reload page to test persistence
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Should still be on step 1 with form data intact
    expect(page.url()).toContain('/onboarding/step/1');

    // Verify form data persisted
    await expect(page.locator('input[placeholder="Enter your first name"]')).toHaveValue('John');
    await expect(page.locator('input[placeholder="Enter your last name"]')).toHaveValue('Doe');
    await expect(page.locator('input[placeholder="Enter your email address"]')).toHaveValue('john.doe@example.com');

    console.log('✓ Form data persisted after reload');

    // Proceed to step 2
    await page.click('button:has-text("Next")');
    await page.waitForURL('**/onboarding/step/2');

    // Verify step progression is saved
    const step2State = await page.evaluate(() => {
      const data = localStorage.getItem('wb-onboarding-store');
      return data ? JSON.parse(data).state.currentStep : null;
    });

    expect(step2State).toBe(2);
    console.log('✓ Step progression saved correctly');

    // Reload again to verify we stay on step 2
    await page.reload();
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/onboarding/step/2');

    console.log('✓ Step 2 persistence verified');
  });

  test('should handle restart functionality correctly', async ({ page }) => {
    // Start onboarding and fill some data
    await page.click('button:has-text("Start Your Website")');
    await page.waitForURL('**/onboarding/step/1');

    // Fill out form data
    await page.fill('input[placeholder="Enter your first name"]', 'Jane');
    await page.fill('input[placeholder="Enter your last name"]', 'Smith');
    await page.fill('input[placeholder="Enter your email address"]', 'jane.smith@example.com');

    // Wait for auto-save
    await page.waitForTimeout(500);

    // Progress to step 2
    await page.click('button:has-text("Next")');
    await page.waitForURL('**/onboarding/step/2');

    // Verify we're on step 2 with data
    const beforeRestartState = await page.evaluate(() => {
      const data = localStorage.getItem('wb-onboarding-store');
      return data ? JSON.parse(data).state : null;
    });

    expect(beforeRestartState.currentStep).toBe(2);
    expect(beforeRestartState.formData.firstName).toBe('Jane');
    expect(beforeRestartState.sessionId).toBeTruthy();

    console.log('✓ Setup complete: On step 2 with saved data');

    // Click restart button
    await page.click('[data-testid="restart-onboarding"]');
    await page.waitForSelector('text=Start Over?');

    // Confirm restart
    await page.click('[data-testid="confirm-restart"]');
    await page.waitForURL('**/en/onboarding');

    console.log('✓ Restart completed, back on welcome page');

    // Verify we're back on welcome page
    expect(page.url()).toContain('/en/onboarding');
    expect(page.url()).not.toContain('/step/');

    // Wait for any state changes to settle
    await page.waitForTimeout(300);

    // Check localStorage state after restart
    const afterRestartState = await page.evaluate(() => {
      const data = localStorage.getItem('wb-onboarding-store');
      return data ? JSON.parse(data).state : null;
    });

    // After restart, either no session or a completely new session
    if (afterRestartState) {
      // If session exists, it should be different from before
      expect(afterRestartState.sessionId).not.toBe(beforeRestartState.sessionId);
      expect(afterRestartState.currentStep).toBe(1);
      // Form data should be reset to defaults
      expect(afterRestartState.formData.firstName).toBe('');
      expect(afterRestartState.formData.lastName).toBe('');
      expect(afterRestartState.formData.email).toBe('');
      console.log('✓ New session created with fresh data');
    } else {
      console.log('✓ No session found (completely cleared)');
    }

    // CRITICAL TEST: Reload page and verify we stay on welcome page
    await page.reload();
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/en/onboarding');
    expect(page.url()).not.toContain('/step/');

    console.log('✓ CRITICAL: After restart and reload, stayed on welcome page');

    // Verify we can start fresh onboarding
    await page.click('button:has-text("Start Your Website")');
    await page.waitForURL('**/onboarding/step/1');

    // Form should be empty (fresh start)
    await expect(page.locator('input[placeholder="Enter your first name"]')).toHaveValue('');
    await expect(page.locator('input[placeholder="Enter your last name"]')).toHaveValue('');
    await expect(page.locator('input[placeholder="Enter your email address"]')).toHaveValue('');

    console.log('✓ Fresh onboarding start confirmed');
  });

  test('should handle session expiration gracefully', async ({ page }) => {
    // Start onboarding
    await page.click('button:has-text("Start Your Website")');
    await page.waitForURL('**/onboarding/step/1');

    // Manually expire the session by modifying localStorage
    await page.evaluate(() => {
      const data = localStorage.getItem('wb-onboarding-store');
      if (data) {
        const parsed = JSON.parse(data);
        // Set expiration to past date
        parsed.state.sessionExpiresAt = new Date(Date.now() - 1000 * 60 * 60).toISOString();
        parsed.state.isSessionExpired = true;
        localStorage.setItem('wb-onboarding-store', JSON.stringify(parsed));
      }
    });

    // Reload to trigger session expiration check
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Should redirect back to welcome page
    expect(page.url()).toContain('/en/onboarding');
    expect(page.url()).not.toContain('/step/');

    console.log('✓ Session expiration handled correctly');
  });

  test('should preserve state across browser navigation', async ({ page }) => {
    // Start onboarding and fill data
    await page.click('button:has-text("Start Your Website")');
    await page.waitForURL('**/onboarding/step/1');

    await page.fill('input[placeholder="Enter your first name"]', 'Test');
    await page.fill('input[placeholder="Enter your last name"]', 'User');
    await page.fill('input[placeholder="Enter your email address"]', 'test@example.com');

    await page.waitForTimeout(500); // Auto-save

    // Navigate away to homepage
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Navigate back to onboarding
    await page.goto('http://localhost:3000/en/onboarding');
    await page.waitForLoadState('networkidle');

    // Should redirect to step 1 (where we left off)
    expect(page.url()).toContain('/onboarding/step/1');

    // Data should still be there
    await expect(page.locator('input[placeholder="Enter your first name"]')).toHaveValue('Test');
    await expect(page.locator('input[placeholder="Enter your last name"]')).toHaveValue('User');
    await expect(page.locator('input[placeholder="Enter your email address"]')).toHaveValue('test@example.com');

    console.log('✓ State preserved across navigation');
  });

  test('should handle multiple restart cycles', async ({ page }) => {
    // First cycle
    await page.click('button:has-text("Start Your Website")');
    await page.waitForURL('**/onboarding/step/1');
    await page.fill('input[placeholder="Enter your first name"]', 'First');
    await page.waitForTimeout(300);

    // First restart
    await page.click('[data-testid="restart-onboarding"]');
    await page.waitForSelector('text=Start Over?');
    await page.click('[data-testid="confirm-restart"]');
    await page.waitForURL('**/en/onboarding');

    // Second cycle
    await page.click('button:has-text("Start Your Website")');
    await page.waitForURL('**/onboarding/step/1');
    await page.fill('input[placeholder="Enter your first name"]', 'Second');
    await page.waitForTimeout(300);

    // Second restart
    await page.click('[data-testid="restart-onboarding"]');
    await page.waitForSelector('text=Start Over?');
    await page.click('[data-testid="confirm-restart"]');
    await page.waitForURL('**/en/onboarding');

    // Third cycle - verify fresh start
    await page.click('button:has-text("Start Your Website")');
    await page.waitForURL('**/onboarding/step/1');

    // Should be clean
    await expect(page.locator('input[placeholder="Enter your first name"]')).toHaveValue('');

    console.log('✓ Multiple restart cycles work correctly');
  });
});