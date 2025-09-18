const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: false // Set to true to run headless
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Navigate to onboarding welcome page
  await page.goto('http://localhost:3001/en/onboarding');
  await page.waitForLoadState('networkidle');

  // Switch to dark theme
  await page.click('[data-testid="theme-toggle"]');
  await page.waitForTimeout(1000); // Wait for theme transition

  // Take screenshot of welcome page dark theme
  await page.screenshot({
    path: 'welcome-dark-theme.png',
    fullPage: true
  });

  console.log('✓ Screenshot saved: welcome-dark-theme.png');

  // Navigate to step 1
  await page.click('text=Get Started');
  await page.waitForLoadState('networkidle');

  // Take screenshot of step 1 dark theme
  await page.screenshot({
    path: 'step-1-dark-theme.png',
    fullPage: true
  });

  console.log('✓ Screenshot saved: step-1-dark-theme.png');

  // Navigate to step 6 (Customer Needs)
  await page.goto('http://localhost:3001/en/onboarding/step/6');
  await page.waitForLoadState('networkidle');

  // Take screenshot of step 6 dark theme
  await page.screenshot({
    path: 'step-6-dark-theme.png',
    fullPage: true
  });

  console.log('✓ Screenshot saved: step-6-dark-theme.png');

  // Test restart button functionality
  await page.click('[data-testid="restart-onboarding"]');
  await page.waitForTimeout(500); // Wait for dialog to appear

  // Take screenshot of restart dialog
  await page.screenshot({
    path: 'restart-dialog-dark-theme.png',
    fullPage: true
  });

  console.log('✓ Screenshot saved: restart-dialog-dark-theme.png');

  // Confirm restart
  await page.click('[data-testid="confirm-restart"]');
  await page.waitForLoadState('networkidle');

  // Verify we're back at welcome page
  const currentUrl = page.url();
  console.log('Current URL after restart:', currentUrl);

  if (currentUrl.includes('/en/onboarding') && !currentUrl.includes('/step/')) {
    console.log('✓ Restart button works correctly - navigated back to welcome page');
  } else {
    console.log('✗ Restart button issue - unexpected URL:', currentUrl);
  }

  // Take final screenshot to verify restart
  await page.screenshot({
    path: 'after-restart-dark-theme.png',
    fullPage: true
  });

  console.log('✓ Screenshot saved: after-restart-dark-theme.png');

  await browser.close();
  console.log('All tests completed!');
})().catch(console.error);