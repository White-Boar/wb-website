import { test, expect } from '@playwright/test';

test.describe('Restart Button Functionality', () => {
  test('should clear session and stay on welcome page after reload', async ({ page }) => {
    // Navigate to onboarding welcome page
    await page.goto('http://localhost:3001/en/onboarding');
    await page.waitForLoadState('networkidle');

    console.log('Step 1: On welcome page');

    // Click "Start Your Website" to go to step 1
    await page.click('button:has-text("Start Your Website")');
    await page.waitForURL('**/onboarding/step/1');

    // Verify we're on step 1
    const step1Url = page.url();
    expect(step1Url).toContain('/onboarding/step/1');
    console.log('Step 2: Navigated to step 1');

    // Click the restart button
    await page.click('[data-testid="restart-onboarding"]');
    await page.waitForSelector('text=Start Over?');
    console.log('Step 3: Restart dialog opened');

    // Check localStorage BEFORE confirming restart
    const beforeRestart = await page.evaluate(() => {
      const data = localStorage.getItem('wb-onboarding-store');
      return data ? JSON.parse(data).state?.sessionId : null;
    });
    console.log('SessionId BEFORE restart:', beforeRestart);

    // Confirm restart
    await page.click('[data-testid="confirm-restart"]');

    // Wait for navigation but don't wait for full load yet
    await page.waitForTimeout(100);

    // Check localStorage IMMEDIATELY after clicking restart
    const afterClick = await page.evaluate(() => {
      const data = localStorage.getItem('wb-onboarding-store');
      return data ? JSON.parse(data).state?.sessionId : null;
    });
    console.log('SessionId IMMEDIATELY after restart click:', afterClick);

    await page.waitForURL('**/en/onboarding');

    // Verify we're back on welcome page
    const welcomeUrl = page.url();
    expect(welcomeUrl).toContain('/en/onboarding');
    expect(welcomeUrl).not.toContain('/step/');
    console.log('Step 4: Back on welcome page after restart');

    // Wait a moment for async localStorage operations to complete
    await page.waitForTimeout(200);

    // Check localStorage - should either be cleared or have null sessionId
    const localStorageData = await page.evaluate(() => {
      const data = localStorage.getItem('wb-onboarding-store');
      console.log('Full localStorage data:', data);
      if (!data) return null;
      const parsed = JSON.parse(data);
      return parsed.state?.sessionId;
    });
    console.log('SessionId AFTER navigation:', localStorageData);
    expect(localStorageData).toBeNull();
    console.log('Step 5: sessionId in localStorage is null');

    // Reload the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify we're still on welcome page (not redirected to step 1)
    const reloadedUrl = page.url();
    expect(reloadedUrl).toContain('/en/onboarding');
    expect(reloadedUrl).not.toContain('/step/');
    console.log('Step 6: Still on welcome page after reload - SUCCESS!');

    // Verify welcome page elements are present
    await expect(page.locator('text=Welcome to WhiteBoar')).toBeVisible();
    await expect(page.locator('button:has-text("Start Your Website")')).toBeVisible();
    console.log('Step 7: Welcome page elements verified');
  });

  test('should work with dark theme', async ({ page }) => {
    // Navigate to onboarding welcome page
    await page.goto('http://localhost:3001/en/onboarding');
    await page.waitForLoadState('networkidle');

    // Switch to dark theme
    await page.click('[data-testid="theme-toggle"]');
    await page.waitForTimeout(500); // Wait for theme transition

    // Take screenshot of dark theme welcome page
    await page.screenshot({
      path: 'restart-test-dark-welcome.png',
      fullPage: true
    });

    // Navigate to step 1
    await page.click('button:has-text("Start Your Website")');
    await page.waitForURL('**/onboarding/step/1');

    // Take screenshot of dark theme step 1
    await page.screenshot({
      path: 'restart-test-dark-step1.png',
      fullPage: true
    });

    // Test restart in dark mode
    await page.click('[data-testid="restart-onboarding"]');
    await page.waitForSelector('text=Start Over?');

    // Take screenshot of restart dialog in dark theme
    await page.screenshot({
      path: 'restart-test-dark-dialog.png',
      fullPage: true
    });

    await page.click('[data-testid="confirm-restart"]');
    await page.waitForURL('**/en/onboarding');

    // Verify dark theme is preserved after restart
    const htmlClass = await page.getAttribute('html', 'class');
    expect(htmlClass).toContain('dark');

    // Take final screenshot
    await page.screenshot({
      path: 'restart-test-dark-after-restart.png',
      fullPage: true
    });

    console.log('Dark theme test completed successfully!');
  });
});