import { Page, expect } from '@playwright/test';

/**
 * Common test utilities for onboarding E2E tests
 */

export interface OnboardingUserData {
  firstName: string;
  lastName: string;
  email: string;
  businessName?: string;
  businessEmail?: string;
  businessPhone?: string;
}

export const DEFAULT_USER_DATA: OnboardingUserData = {
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com',
  businessName: 'Test Company Ltd',
  businessEmail: 'business@test.com',
  businessPhone: '+39 123 456 7890'
};

export const BYPASS_CODES = ['DEV123', '123456'];

/**
 * Fill Step 1 form with user data
 */
export async function fillStep1Form(page: Page, userData: Partial<OnboardingUserData> = {}) {
  const data = { ...DEFAULT_USER_DATA, ...userData };

  await page.fill('input[name="firstName"]', data.firstName);
  await page.fill('input[name="lastName"]', data.lastName);
  await page.fill('input[name="email"]', data.email);

  // Wait for validation to complete and next button to be enabled
  await waitForValidation(page);
  const nextButton = getOnboardingNextButton(page);
  await expect(nextButton).toBeEnabled({ timeout: 5000 });
}

/**
 * Complete email verification with bypass code
 * Now supports automatic progression to next step
 */
export async function completeEmailVerification(page: Page, code: string = BYPASS_CODES[0]) {
  const otpInput = page.locator('input[maxlength="6"]').first();
  await expect(otpInput).toBeVisible();

  await otpInput.fill(code);

  // Wait for auto-progression to next step (implemented with 1s delay)
  // The system should automatically navigate to step 3 after successful verification
  await page.waitForURL(/\/step\/3/, { timeout: 5000 });
  await page.waitForLoadState('networkidle');
}

/**
 * Fill Step 3 business details form
 */
export async function fillStep3BusinessDetails(page: Page, businessData: Partial<OnboardingUserData> = {}) {
  const data = { ...DEFAULT_USER_DATA, ...businessData };

  await page.fill('input[name="businessName"]', data.businessName!);
  await page.fill('input[name="businessEmail"]', data.businessEmail!);
  await page.fill('input[name="businessPhone"]', data.businessPhone!);

  // Handle industry selection if present
  const industrySelect = page.locator('select, [role="combobox"]').first();
  if (await industrySelect.isVisible()) {
    await industrySelect.click();
    await page.locator('option, [role="option"]').first().click();
  }

  await page.waitForTimeout(1000);
}

/**
 * Start onboarding from welcome screen (natural user flow)
 */
export async function startOnboardingFromWelcome(page: Page) {
  // Go to welcome page
  await page.goto('/onboarding');
  await page.waitForLoadState('networkidle');

  // Check if we're already on a step page, if so, go back to welcome
  if (page.url().includes('/step/')) {
    await page.goto('/onboarding');
    await page.waitForLoadState('networkidle');
  }

  // Click "Start Your Website" button
  const startButton = page.getByRole('button', { name: /Start Your Website/i });
  await expect(startButton).toBeVisible();
  await startButton.click();

  // Wait for navigation to step 1
  await page.waitForURL(/\/onboarding\/step\/1/);
  await page.waitForLoadState('networkidle');

  // Verify we're on step 1
  await expect(page).toHaveURL(/\/step\/1/);
}

/**
 * Navigate to a specific step with proper verification
 * Note: This should only be used for testing specific steps in isolation
 */
export async function navigateToStep(page: Page, stepNumber: number) {
  // First ensure we have a session by starting from welcome
  if (stepNumber === 1) {
    await startOnboardingFromWelcome(page);
  } else {
    // For other steps, we need to have completed prior steps
    // This direct navigation may not work without proper session state
    await page.goto(`/onboarding/step/${stepNumber}`);
    await page.waitForLoadState('networkidle');
  }

  // Verify we're on the correct step
  await expect(page).toHaveURL(new RegExp(`/step/${stepNumber}`));

  // Wait for step content to be visible
  await expect(page.locator('main').first()).toBeVisible();
}

/**
 * Complete the basic flow (Steps 1-3) quickly
 */
export async function completeBasicFlow(page: Page, userData: Partial<OnboardingUserData> = {}) {
  // Step 1: Welcome
  await navigateToStep(page, 1);
  await fillStep1Form(page, userData);

  const step1NextButton = getOnboardingNextButton(page);
  await expect(step1NextButton).toBeEnabled();
  await step1NextButton.click();

  // Step 2: Email Verification (with auto-progression)
  await expect(page).toHaveURL(/\/step\/2/);
  await completeEmailVerification(page);
  // Note: completeEmailVerification now waits for auto-progression to step 3

  // Step 3: Business Details (automatically reached via auto-progression)
  await expect(page).toHaveURL(/\/step\/3/);
  await fillStep3BusinessDetails(page, userData);

  const step3NextButton = getOnboardingNextButton(page);
  if (await step3NextButton.isEnabled()) {
    await step3NextButton.click();
  }

  return page.url().includes('/step/4');
}

/**
 * Check if an element is visible with timeout
 */
export async function waitForVisible(page: Page, selector: string, timeout: number = 5000) {
  try {
    await page.waitForSelector(selector, { state: 'visible', timeout });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get current step number from URL
 */
export async function getCurrentStepNumber(page: Page): Promise<number> {
  const url = page.url();
  const match = url.match(/\/step\/(\d+)/);
  return match ? parseInt(match[1]) : 0;
}

/**
 * Get the onboarding next/continue button (excludes Next.js Dev Tools button)
 */
export function getOnboardingNextButton(page: Page) {
  return page.getByRole('button', { name: /next|continue|submit|finish/i })
    .and(page.locator(':not([data-nextjs-dev-tools-button])'));
}

/**
 * Check if next button is enabled
 */
export async function isNextButtonEnabled(page: Page): Promise<boolean> {
  const nextButton = getOnboardingNextButton(page);

  if (await nextButton.isVisible()) {
    return await nextButton.isEnabled();
  }

  return false;
}

/**
 * Wait for form validation to complete
 */
export async function waitForValidation(page: Page, timeout: number = 2000) {
  await page.waitForTimeout(timeout);

  // Wait for any loading states to finish
  const loadingElements = page.locator('[aria-busy="true"], .loading, [class*="loading"]');
  if (await loadingElements.count() > 0) {
    await expect(loadingElements.first()).not.toBeVisible();
  }
}

/**
 * Take screenshot with meaningful name
 */
export async function takeStepScreenshot(page: Page, testName: string, stepNumber?: number) {
  const currentStep = stepNumber || await getCurrentStepNumber(page);
  const filename = `${testName}-step${currentStep}-${Date.now()}.png`;

  await page.screenshot({
    path: `.playwright-mcp/${filename}`,
    fullPage: true
  });

  console.log(`Screenshot saved: ${filename}`);
  return filename;
}

/**
 * Check for console errors during test
 */
export function setupErrorTracking(page: Page) {
  const errors: string[] = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  page.on('pageerror', err => {
    errors.push(err.toString());
  });

  return {
    getErrors: () => errors,
    hasErrors: () => errors.length > 0,
    clearErrors: () => errors.length = 0
  };
}

/**
 * Test data generators
 */
export const TestDataGenerator = {
  randomEmail: () => `test-${Date.now()}@example.com`,
  randomBusinessName: () => `Test Company ${Date.now()}`,
  randomName: () => `Test${Date.now()}`,

  businessData: (suffix: string = '') => ({
    firstName: `Business${suffix}`,
    lastName: `User${suffix}`,
    email: `business${suffix}@test.com`,
    businessName: `Business Corp ${suffix}`,
    businessEmail: `business${suffix}@corp.com`,
    businessPhone: '+39 123 456 7890'
  }),

  personalData: (suffix: string = '') => ({
    firstName: `Personal${suffix}`,
    lastName: `User${suffix}`,
    email: `personal${suffix}@test.com`
  })
};

/**
 * Wait for auto-save to complete
 */
export async function waitForAutoSave(page: Page, timeout: number = 3000) {
  // Auto-save typically has a 2-second debounce
  await page.waitForTimeout(timeout);

  // Look for save indicators
  const saveIndicators = page.locator('[class*="saving"], [class*="saved"], text*="saving", text*="saved"');

  if (await saveIndicators.count() > 0) {
    // Wait for saving to complete
    await expect(saveIndicators.first()).not.toContainText(/saving/i);
  }
}

/**
 * Simulate network conditions
 */
export async function simulateSlowNetwork(page: Page) {
  await page.route('**/*', route => {
    setTimeout(() => route.continue(), 1000); // Add 1s delay
  });
}

export async function simulateNetworkFailure(page: Page, patterns: string[] = ['**/api/**']) {
  for (const pattern of patterns) {
    await page.route(pattern, route => route.abort());
  }
}

/**
 * Accessibility testing helpers
 */
export async function checkFocusManagement(page: Page) {
  // Check that focus is visible
  const focusedElement = page.locator(':focus');
  if (await focusedElement.count() > 0) {
    await expect(focusedElement).toBeVisible();
    return true;
  }
  return false;
}

export async function testKeyboardNavigation(page: Page, expectedFocusableElements: number = 3) {
  const focusedElements: string[] = [];

  for (let i = 0; i < expectedFocusableElements; i++) {
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);

    const focusedElement = page.locator(':focus');
    if (await focusedElement.count() > 0) {
      const tagName = await focusedElement.evaluate(el => el.tagName);
      focusedElements.push(tagName);
    }
  }

  return focusedElements;
}

/**
 * Performance measurement helpers
 */
export async function measurePageLoadTime(page: Page): Promise<number> {
  const startTime = Date.now();
  await page.waitForLoadState('networkidle');
  return Date.now() - startTime;
}

export async function measureFormInteractionTime(page: Page, interactions: () => Promise<void>): Promise<number> {
  const startTime = Date.now();
  await interactions();
  return Date.now() - startTime;
}

/**
 * Restart onboarding using the UI restart button
 * This clears all session state and returns to step 1
 */
export async function restartOnboarding(page: Page) {
  // Find and click the restart button
  const restartButton = page.getByTestId('restart-onboarding');
  await expect(restartButton).toBeVisible();
  await restartButton.click();

  // Handle the confirmation dialog
  const confirmButton = page.getByTestId('confirm-restart');
  await expect(confirmButton).toBeVisible();
  await confirmButton.click();

  // Wait for navigation to step 1
  await page.waitForURL(/\/onboarding\/step\/1/);
  await page.waitForLoadState('networkidle');

  // Verify we're on step 1 with clean state
  await expect(page).toHaveURL(/\/step\/1/);
  await expect(page.locator('main').first()).toBeVisible();
}

/**
 * Ensure fresh onboarding state for tests
 * This should be called at the beginning of each test to guarantee clean state
 */
export async function ensureFreshOnboardingState(page: Page) {
  // Navigate to onboarding if not already there
  if (!page.url().includes('/onboarding')) {
    await page.goto('/onboarding');
    await page.waitForLoadState('networkidle');
  }

  // If we're already on a step, restart the flow
  if (page.url().includes('/step/')) {
    await restartOnboarding(page);
  } else {
    // If we're on the welcome page, we already have fresh state
    await page.waitForLoadState('networkidle');
  }
}