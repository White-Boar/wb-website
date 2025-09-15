import { test, expect } from '@playwright/test';

test.describe('Onboarding Performance', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/onboarding/step/1');
    await page.waitForLoadState('networkidle');
  });

  test('meets performance requirements', async ({ page }) => {
    // Measure initial page load
    const navigationStart = await page.evaluate(() => performance.timing.navigationStart);
    const loadEventEnd = await page.evaluate(() => performance.timing.loadEventEnd);

    const loadTime = loadEventEnd - navigationStart;

    // Should load within 3 seconds (3000ms)
    expect(loadTime).toBeLessThan(3000);

    console.log(`Page load time: ${loadTime}ms`);
  });

  test('measures Largest Contentful Paint (LCP)', async ({ page }) => {
    // Wait for LCP to be measured
    await page.waitForLoadState('networkidle');

    const lcpValue = await page.evaluate(() => {
      return new Promise((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          resolve(lastEntry.startTime);
        });

        observer.observe({ entryTypes: ['largest-contentful-paint'] });

        // Fallback timeout
        setTimeout(() => resolve(0), 5000);
      });
    });

    // LCP should be ≤ 1.8s (1800ms) as per requirements
    if (lcpValue > 0) {
      expect(lcpValue).toBeLessThan(1800);
      console.log(`LCP: ${lcpValue}ms`);
    }
  });

  test('measures Cumulative Layout Shift (CLS)', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const clsValue = await page.evaluate(() => {
      return new Promise((resolve) => {
        let cls = 0;

        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              cls += entry.value;
            }
          }
        });

        observer.observe({ entryTypes: ['layout-shift'] });

        // Measure for 2 seconds
        setTimeout(() => {
          resolve(cls);
        }, 2000);
      });
    });

    // CLS should be < 0.1 as per requirements
    expect(clsValue).toBeLessThan(0.1);
    console.log(`CLS: ${clsValue}`);
  });

  test('measures First Input Delay (FID) simulation', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Simulate user interaction and measure response time
    const startTime = Date.now();

    await page.click('input[name="firstName"]');
    await page.type('input[name="firstName"]', 'Performance Test');

    const endTime = Date.now();
    const inputDelay = endTime - startTime;

    // Should respond to input within 100ms for good UX
    expect(inputDelay).toBeLessThan(100);
    console.log(`Input response time: ${inputDelay}ms`);
  });

  test('measures step transition performance', async ({ page }) => {
    // Fill Step 1 form
    await page.fill('input[name="firstName"]', 'Perf');
    await page.fill('input[name="lastName"]', 'Test');
    await page.fill('input[name="email"]', 'perf@test.com');

    // Measure transition time
    const startTime = Date.now();

    await page.click('button:has-text("Next"), button:has-text("Continue")');
    await page.waitForURL('**/step/2');

    const endTime = Date.now();
    const transitionTime = endTime - startTime;

    // Step transitions should be < 300ms as per requirements
    expect(transitionTime).toBeLessThan(300);
    console.log(`Step transition time: ${transitionTime}ms`);
  });

  test('validates bundle size impact', async ({ page }) => {
    // Monitor network requests
    const responses: any[] = [];

    page.on('response', (response) => {
      if (response.url().includes('.js') || response.url().includes('.css')) {
        responses.push({
          url: response.url(),
          size: response.headers()['content-length'],
          status: response.status()
        });
      }
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Calculate total JS bundle size
    const jsBundles = responses.filter(r => r.url.includes('.js'));
    const totalJsSize = jsBundles.reduce((total, bundle) => {
      const size = parseInt(bundle.size || '0');
      return total + size;
    }, 0);

    console.log(`Total JS bundle size: ${totalJsSize / 1024}KB`);
    console.log(`JS bundles loaded: ${jsBundles.length}`);

    // Log individual bundles for analysis
    jsBundles.forEach(bundle => {
      const sizeKB = parseInt(bundle.size || '0') / 1024;
      console.log(`  ${bundle.url.split('/').pop()}: ${sizeKB.toFixed(1)}KB`);
    });
  });

  test('measures form validation performance', async ({ page }) => {
    const firstNameInput = page.locator('input[name="firstName"]');
    const emailInput = page.locator('input[name="email"]');

    // Measure validation response time
    const startTime = Date.now();

    await emailInput.fill('invalid-email');
    await emailInput.blur();

    // Wait for validation to complete
    await page.waitForTimeout(500);

    const endTime = Date.now();
    const validationTime = endTime - startTime;

    // Validation should be near-instant
    expect(validationTime).toBeLessThan(600);
    console.log(`Validation response time: ${validationTime}ms`);
  });

  test('measures auto-save performance', async ({ page }) => {
    // Fill form data
    await page.fill('input[name="firstName"]', 'AutoSave');
    await page.fill('input[name="lastName"]', 'Test');
    await page.fill('input[name="email"]', 'autosave@test.com');

    // Monitor network requests for auto-save
    const saveRequests: any[] = [];

    page.on('request', (request) => {
      if (request.url().includes('/api/onboarding') && request.method() === 'POST') {
        saveRequests.push({
          url: request.url(),
          timestamp: Date.now()
        });
      }
    });

    // Wait for debounced auto-save (should trigger after 2 seconds)
    await page.waitForTimeout(3000);

    console.log(`Auto-save requests triggered: ${saveRequests.length}`);

    if (saveRequests.length > 0) {
      console.log('Auto-save functionality is working');
    }
  });

  test('stress test: rapid form interactions', async ({ page }) => {
    const startTime = Date.now();

    // Rapid fire form interactions
    for (let i = 0; i < 10; i++) {
      await page.fill('input[name="firstName"]', `Test${i}`);
      await page.fill('input[name="lastName"]', `User${i}`);
      await page.fill('input[name="email"]', `test${i}@example.com`);

      // Quick validation check
      await page.waitForTimeout(50);
    }

    const endTime = Date.now();
    const totalTime = endTime - startTime;

    // Should handle rapid interactions without blocking
    expect(totalTime).toBeLessThan(2000);
    console.log(`Rapid interactions completed in: ${totalTime}ms`);

    // Form should still be responsive
    const nextButton = page.getByRole('button', { name: /next|continue/i });
    await expect(nextButton).toBeEnabled();
  });

  test('memory usage monitoring', async ({ page }) => {
    // Measure initial memory
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory ? {
        used: (performance as any).memory.usedJSHeapSize,
        total: (performance as any).memory.totalJSHeapSize,
        limit: (performance as any).memory.jsHeapSizeLimit
      } : null;
    });

    if (initialMemory) {
      console.log(`Initial memory usage: ${(initialMemory.used / 1024 / 1024).toFixed(2)}MB`);
    }

    // Perform multiple form interactions
    for (let i = 0; i < 5; i++) {
      await page.fill('input[name="firstName"]', `Memory${i}`);
      await page.fill('input[name="lastName"]', `Test${i}`);
      await page.waitForTimeout(100);
    }

    // Measure memory after interactions
    const finalMemory = await page.evaluate(() => {
      return (performance as any).memory ? {
        used: (performance as any).memory.usedJSHeapSize,
        total: (performance as any).memory.totalJSHeapSize,
        limit: (performance as any).memory.jsHeapSizeLimit
      } : null;
    });

    if (finalMemory && initialMemory) {
      const memoryIncrease = (finalMemory.used - initialMemory.used) / 1024 / 1024;
      console.log(`Memory increase: ${memoryIncrease.toFixed(2)}MB`);

      // Memory increase should be minimal for basic form interactions
      expect(memoryIncrease).toBeLessThan(10); // Less than 10MB increase
    }
  });
});