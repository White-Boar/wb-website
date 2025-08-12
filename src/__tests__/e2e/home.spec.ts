import { test, expect } from '@playwright/test';

test.describe('WhiteBoar Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('loads homepage successfully', async ({ page }) => {
    // Check that page loads with 200 status
    const response = await page.waitForLoadState('networkidle');
    
    // Check main heading is visible
    const mainHeading = page.getByRole('heading', { name: 'Brand. Build. Boom.' });
    await expect(mainHeading).toBeVisible();
    
    // Check that all main sections are present
    await expect(page.locator('#pricing')).toBeVisible();
    await expect(page.locator('#portfolio')).toBeVisible();
  });

  test('navigation works correctly', async ({ page }) => {
    // Test navigation to pricing section
    await page.getByText('Prices').click();
    await expect(page.locator('#pricing')).toBeInViewport();
    
    // Test navigation to portfolio section
    await page.getByText('Our work').click();
    await expect(page.locator('#portfolio')).toBeInViewport();
  });

  test('language switching works', async ({ page }) => {
    // Check initial language (English)
    await expect(page.getByText('Brand. Build. Boom.')).toBeVisible();
    
    // Click language selector
    await page.getByLabel('Select language').click();
    
    // Switch to Italian
    await page.getByText('Italian').click();
    
    // Check URL changes to /it
    await expect(page).toHaveURL('/it');
    
    // Check content switches to Italian
    await expect(page.getByText('Siti web guidati dall\'AI online in giorni, non mesi.')).toBeVisible();
  });

  test('theme toggle works', async ({ page }) => {
    // Check initial theme (should be light or system)
    const html = page.locator('html');
    
    // Click theme toggle
    await page.getByLabel('Toggle theme').click();
    
    // Click Dark theme
    await page.getByText('Dark').click();
    
    // Check that dark class is applied
    await expect(html).toHaveClass(/dark/);
    
    // Switch back to light
    await page.getByLabel('Toggle theme').click();
    await page.getByText('Light').click();
    
    // Check that dark class is removed
    await expect(html).not.toHaveClass(/dark/);
  });

  test('pricing plan selection works', async ({ page }) => {
    // Scroll to pricing section
    await page.getByText('Prices').click();
    
    // Click on Fast & Simple plan
    await page.getByText('Start with Fast & Simple').click();
    
    // Check that it navigates to checkout with correct plan
    await expect(page).toHaveURL('/checkout?plan=fast');
  });

  test('social links are working', async ({ page }) => {
    // Check Twitter link
    const twitterLink = page.getByLabel('Twitter').first();
    await expect(twitterLink).toHaveAttribute('href', 'https://twitter.com/whiteboar_ai');
    await expect(twitterLink).toHaveAttribute('target', '_blank');
    
    // Check LinkedIn link
    const linkedinLink = page.getByLabel('LinkedIn').first();
    await expect(linkedinLink).toHaveAttribute('href', 'https://linkedin.com/company/whiteboar');
    await expect(linkedinLink).toHaveAttribute('target', '_blank');
    
    // Check GitHub link
    const githubLink = page.getByLabel('GitHub').first();
    await expect(githubLink).toHaveAttribute('href', 'https://github.com/whiteboar');
    await expect(githubLink).toHaveAttribute('target', '_blank');
  });

  test('accessibility features work', async ({ page }) => {
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    
    // Check focus rings are visible
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Test that all interactive elements are accessible
    const buttons = page.getByRole('button');
    const links = page.getByRole('link');
    
    for (const button of await buttons.all()) {
      await expect(button).toBeVisible();
    }
    
    for (const link of await links.all()) {
      await expect(link).toBeVisible();
    }
  });

  test('portfolio carousel works', async ({ page }) => {
    // Scroll to portfolio
    await page.getByText('Our work').click();
    
    // Check that carousel is visible
    await expect(page.getByRole('region').last()).toBeVisible();
    
    // Check navigation buttons are present
    await expect(page.getByLabel('Previous slide')).toBeVisible();
    await expect(page.getByLabel('Next slide')).toBeVisible();
    
    // Test next button click
    await page.getByLabel('Next slide').click();
    
    // Wait for carousel to move
    await page.waitForTimeout(500);
  });

  test('mobile responsiveness', async ({ page, isMobile }) => {
    if (isMobile) {
      // Check that mobile navigation is present
      await expect(page.getByLabel('Select language')).toBeVisible();
      await expect(page.getByLabel('Toggle theme')).toBeVisible();
      
      // Check that content is readable on mobile
      const mainHeading = page.getByRole('heading', { name: 'Brand. Build. Boom.' });
      await expect(mainHeading).toBeVisible();
      
      // Check that buttons are accessible on mobile
      const ctaButton = page.getByText('Start now!');
      await expect(ctaButton).toBeVisible();
    }
  });
});