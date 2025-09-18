import { test, expect } from '@playwright/test';

test('Restart button clears localStorage properly', async ({ page }) => {
  // Navigate to onboarding welcome page
  await page.goto('http://localhost:3000/en/onboarding');
  await page.waitForLoadState('networkidle');

  // Verify no initial session
  let localStorageData = await page.evaluate(() => {
    const data = localStorage.getItem('wb-onboarding-store');
    return data ? JSON.parse(data).state?.sessionId : null;
  });
  expect(localStorageData).toBeNull();
  console.log('✓ No initial session');

  // Start onboarding to create a session
  await page.click('button:has-text("Start Your Website")');
  await page.waitForURL('**/onboarding/step/1');

  // Verify session was created
  const sessionBefore = await page.evaluate(() => {
    const data = localStorage.getItem('wb-onboarding-store');
    return data ? JSON.parse(data).state?.sessionId : null;
  });
  expect(sessionBefore).toBeTruthy();
  console.log('✓ Session created:', sessionBefore);

  // Click restart button
  await page.click('[data-testid="restart-onboarding"]');
  await page.waitForSelector('text=Start Over?');
  await page.click('[data-testid="confirm-restart"]');
  await page.waitForURL('**/en/onboarding');

  console.log('✓ Restarted and navigated back to welcome');

  // Wait a moment for any async operations
  await page.waitForTimeout(300);

  // Check localStorage after restart
  const sessionAfter = await page.evaluate(() => {
    const data = localStorage.getItem('wb-onboarding-store');
    return data ? JSON.parse(data).state?.sessionId : null;
  });

  console.log('Session after restart:', sessionAfter);
  console.log('Session before restart:', sessionBefore);

  // The key test: after restart, either no session or different session
  if (sessionAfter === null) {
    console.log('✓ PERFECT: No session after restart');
  } else if (sessionAfter !== sessionBefore) {
    console.log('✓ ACCEPTABLE: New session created after restart');
  } else {
    console.log('✗ PROBLEM: Same session persisted after restart');
    expect(sessionAfter).not.toBe(sessionBefore);
  }

  // Most important test: reload page and verify we stay on welcome
  await page.reload();
  await page.waitForLoadState('networkidle');

  const finalUrl = page.url();
  expect(finalUrl).toContain('/en/onboarding');
  expect(finalUrl).not.toContain('/step/');

  console.log('✓ CRITICAL: After reload, stayed on welcome page');
  console.log('✓ Restart button fix is working correctly!');
});