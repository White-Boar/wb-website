const { test, expect } = require('@playwright/test');

test('Debug onboarding navigation', async ({ page }) => {
  console.log('Starting debug test...');

  // Navigate to onboarding welcome page
  await page.goto('http://localhost:3000/onboarding');
  console.log('Navigated to /onboarding');

  // Take a screenshot
  await page.screenshot({ path: 'debug-onboarding.png', fullPage: true });
  console.log('Screenshot taken');

  // Check what's actually on the page
  const title = await page.title();
  console.log('Page title:', title);

  const url = page.url();
  console.log('Current URL:', url);

  // Look for any visible text
  const bodyText = await page.locator('body').textContent();
  console.log('Body text (first 500 chars):', bodyText.substring(0, 500));

  // Check for common selectors
  const stepText = await page.locator('text*=Step').count();
  console.log('Elements with "Step":', stepText);

  const welcomeText = await page.locator('text*=Welcome').count();
  console.log('Elements with "Welcome":', welcomeText);

  // Check for start button
  const startButton = await page.locator('button').filter({ hasText: /start/i }).count();
  console.log('Start buttons found:', startButton);

  if (startButton > 0) {
    console.log('Clicking start button...');
    await page.locator('button').filter({ hasText: /start/i }).first().click();
    await page.waitForTimeout(2000);

    console.log('After clicking start, URL:', page.url());
    await page.screenshot({ path: 'debug-after-start.png', fullPage: true });
  }
});