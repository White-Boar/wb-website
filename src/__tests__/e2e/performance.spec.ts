import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test('measures Core Web Vitals', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    
    // Inject web-vitals script
    await page.addScriptTag({
      url: 'https://unpkg.com/web-vitals@3/dist/web-vitals.iife.js'
    });
    
    // Measure Core Web Vitals
    const vitals = await page.evaluate(() => {
      return new Promise((resolve) => {
        const vitals = {};
        let metricsCount = 0;
        const expectedMetrics = 3; // LCP, FID, CLS
        
        const handleVital = (metric) => {
          vitals[metric.name] = metric.value;
          metricsCount++;
          
          if (metricsCount >= expectedMetrics) {
            resolve(vitals);
          }
        };
        
        // Measure vitals
        window.webVitals.onLCP(handleVital);
        window.webVitals.onFID(handleVital);
        window.webVitals.onCLS(handleVital);
        
        // Fallback timeout
        setTimeout(() => resolve(vitals), 5000);
      });
    });
    
    console.log('Core Web Vitals:', vitals);
    
    // Assert performance requirements from context/CONTEXT.md
    // LCP should be ≤ 1.8s (1800ms)
    if (vitals.LCP) {
      expect(vitals.LCP).toBeLessThanOrEqual(1800);
    }
    
    // CLS should be < 0.1
    if (vitals.CLS) {
      expect(vitals.CLS).toBeLessThan(0.1);
    }
  });
  
  test('checks for performance issues', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check for large unused JavaScript bundles
    const performanceEntries = await page.evaluate(() => {
      return performance.getEntriesByType('navigation')[0];
    });
    
    console.log('Performance timing:', performanceEntries);
    
    // Check that page loads within reasonable time
    expect(performanceEntries.loadEventEnd - performanceEntries.fetchStart).toBeLessThan(3000);
  });
  
  test('validates image optimization', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check that images are properly optimized
    const images = await page.locator('img').all();
    
    for (const img of images) {
      const src = await img.getAttribute('src');
      const alt = await img.getAttribute('alt');
      
      // Ensure all images have alt text
      expect(alt).toBeTruthy();
      
      // Check that Next.js Image component is being used (has _next/image or _next/static)
      if (src && !src.startsWith('data:')) {
        expect(src).toMatch(/\/_next\/(image|static)|\.webp$|\.avif$/);
      }
    }
  });
  
  test('checks font loading performance', async ({ page }) => {
    await page.goto('/');
    
    // Check that fonts are loaded efficiently
    const fontFaces = await page.evaluate(() => {
      return Array.from(document.fonts).map(font => ({
        family: font.family,
        status: font.status,
        display: font.display
      }));
    });
    
    console.log('Font loading status:', fontFaces);
    
    // Ensure fonts are loaded
    const loadedFonts = fontFaces.filter(font => font.status === 'loaded');
    expect(loadedFonts.length).toBeGreaterThan(0);
  });
  
  test('validates no console errors', async ({ page }) => {
    const consoleErrors = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check that there are no console errors
    expect(consoleErrors).toHaveLength(0);
  });
});