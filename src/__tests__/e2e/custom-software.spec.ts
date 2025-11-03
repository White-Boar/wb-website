import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Custom Software Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/custom-software');
  });

  test('loads page successfully with correct content', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Custom Software Development.*WhiteBoar/i);

    // Check hero section
    await expect(page.getByRole('heading', { name: /Custom Software Development/i })).toBeVisible();
    await expect(page.getByText(/From concept to launch/i)).toBeVisible();

    // Check services are displayed (use heading role to avoid strict mode violations)
    await expect(page.getByRole('heading', { name: /Web Applications/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Mobile Apps/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /SaaS Platforms/i })).toBeVisible();

    // Check form is visible
    await expect(page.getByRole('heading', { name: /Tell Us About Your Project/i })).toBeVisible();

    // Check portfolio section is visible - use aria-roledescription
    await expect(page.locator('[role="region"][aria-roledescription="carousel"]')).toBeVisible();
  });

  test('navigation from homepage pricing section works', async ({ page }) => {
    // Go to homepage
    await page.goto('/');

    // Scroll to pricing section
    await page.getByRole('heading', { name: 'Services' }).scrollIntoViewIfNeeded();

    // Click on Custom Made button and wait for navigation
    await Promise.all([
      page.waitForURL(/\/custom-software$/),
      page.getByRole('link', { name: 'Start with Custom Made' }).click()
    ]);

    // Check that we navigated to custom-software page
    await expect(page).toHaveURL(/\/custom-software$/);
    await expect(page.getByRole('heading', { name: /Custom Software Development/i })).toBeVisible();
  });

  test('form submission with valid data works', async ({ page }) => {
    // Fill out form
    await page.getByLabel(/^Name/i).fill('John Doe');
    await page.getByLabel(/^Email/i).fill('john.doe.test@example.com');
    await page.getByLabel(/^Phone/i).fill('+39 123 456 7890');
    await page.getByLabel(/Describe what you would like us to build/i).fill(
      'I need a custom SaaS platform for managing customer relationships and sales pipeline with integration to our existing CRM system.'
    );

    // Submit form
    await page.getByRole('button', { name: /Send/i }).click();

    // Check for success message
    await expect(page.getByText(/Thank you!/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/We will be in touch within 2 business days/i)).toBeVisible();
  });

  test('form validation shows errors for empty fields', async ({ page }) => {
    // Disable HTML5 validation to test custom validation
    await page.evaluate(() => {
      document.querySelectorAll('input[required], textarea[required]').forEach(el => {
        el.removeAttribute('required');
      });
    });

    // Click submit without filling form
    await page.getByRole('button', { name: /Send/i }).click();

    // Check for validation errors
    await expect(page.getByText(/Name is required/i)).toBeVisible();
    await expect(page.getByText(/Email is required/i)).toBeVisible();
    await expect(page.getByText(/Phone is required/i)).toBeVisible();
    await expect(page.getByText(/Project description is required/i)).toBeVisible();
  });

  test('form validation shows error for invalid email', async ({ page }) => {
    await page.getByLabel(/^Name/i).fill('John Doe');
    await page.getByLabel(/^Email/i).fill('invalid-email');
    await page.getByLabel(/^Phone/i).fill('+39 123 456 7890');
    await page.getByLabel(/Describe what you would like us to build/i).fill(
      'I need a custom web application with at least 20 characters to pass description validation'
    );

    // Disable HTML5 validation to test custom validation
    await page.evaluate(() => {
      document.querySelectorAll('input[type="email"]').forEach(el => {
        el.removeAttribute('type');
        el.setAttribute('type', 'text');
      });
    });

    await page.getByRole('button', { name: /Send/i }).click();

    await expect(page.getByText(/Please enter a valid email address/i)).toBeVisible();
  });

  test('form validation shows error for short description', async ({ page }) => {
    await page.getByLabel(/^Name/i).fill('John Doe');
    await page.getByLabel(/^Email/i).fill('john@example.com');
    await page.getByLabel(/^Phone/i).fill('+39 123 456 7890');
    await page.getByLabel(/Describe what you would like us to build/i).fill('Too short');

    await page.getByRole('button', { name: /Send/i }).click();

    await expect(page.getByText(/Please provide more details.*at least 20 characters/i)).toBeVisible();
  });

  test('navigation component works on custom software page', async ({ page, isMobile }) => {
    // Check that navigation is present
    const nav = page.getByLabel('Main navigation');
    await expect(nav).toBeVisible();

    // On mobile, open the mobile menu first
    if (isMobile) {
      await page.getByLabel('Toggle mobile menu').click();
    }

    // Check language selector
    await expect(page.getByRole('button').filter({ has: page.locator('span:has-text("Select language")') })).toBeVisible();

    // Check theme toggle
    await expect(page.getByRole('button').filter({ has: page.locator('span:has-text("Toggle theme")') })).toBeVisible();
  });

  test('footer is displayed on custom software page', async ({ page }) => {
    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Check footer content
    await expect(page.getByText(/AI-driven digital agency/i)).toBeVisible();
    await expect(page.getByText(/Quick Links/i)).toBeVisible();
    await expect(page.getByText(/Follow Us/i)).toBeVisible();
  });

  test('language switching works (EN ↔ IT)', async ({ page, isMobile }) => {
    // Check initial language (English) - use heading role to avoid strict mode violation
    await expect(page.getByRole('heading', { name: 'Custom Software Development' })).toBeVisible();

    // On mobile, open the mobile menu first
    if (isMobile) {
      await page.getByLabel('Toggle mobile menu').click();
    }

    // Click language selector
    const languageSelector = page.getByRole('button').filter({ has: page.locator('span:has-text("Select language")') });
    await languageSelector.click();

    // Switch to Italian
    await page.getByRole('button').filter({ hasText: /italian/i }).click();

    // Check URL changed to /it/custom-software
    await expect(page).toHaveURL('/it/custom-software');

    // Check content is in Italian - use heading role to avoid strict mode violation
    await expect(page.getByRole('heading', { name: 'Sviluppo Software Personalizzato' })).toBeVisible();
    await expect(page.getByText(/Dal concetto al lancio/i)).toBeVisible();
  });

  test('theme toggle works', async ({ page, isMobile }) => {
    const html = page.locator('html');

    // On mobile, open the mobile menu first
    if (isMobile) {
      await page.getByLabel('Toggle mobile menu').click();
    }

    // Click theme toggle
    let themeToggle = page.getByRole('button').filter({ has: page.locator('span:has-text("Toggle theme")') });
    await themeToggle.click();

    // Click Dark theme
    await page.getByRole('menuitem').filter({ hasText: /dark/i }).click();

    // Check that dark class is applied
    await expect(html).toHaveClass(/dark/);

    // On mobile, the menu stays open, so we can directly access theme toggle again
    // On desktop, we need to click theme toggle button again
    themeToggle = page.getByRole('button').filter({ has: page.locator('span:has-text("Toggle theme")') });
    await themeToggle.click();
    await page.getByRole('menuitem').filter({ hasText: /light/i }).click();

    // Check that dark class is removed
    await expect(html).not.toHaveClass(/dark/);
  });

  test('portfolio carousel renders correctly', async ({ page, isMobile }) => {
    // Scroll to portfolio section (heading is "Clients" not "Our Work")
    await page.getByRole('heading', { name: /Clients/i }).scrollIntoViewIfNeeded();

    // Check carousel is visible
    await expect(page.locator('[role="region"][aria-roledescription="carousel"]')).toBeVisible();

    // Check that at least one slide is visible
    await expect(page.locator('[role="group"][aria-roledescription="slide"]').first()).toBeVisible();

    // Navigation buttons are only visible on desktop
    if (!isMobile) {
      const prevButton = page.locator('button').filter({ has: page.locator('span:has-text("Previous slide")') });
      const nextButton = page.locator('button').filter({ has: page.locator('span:has-text("Next slide")') });

      await expect(prevButton).toBeVisible();
      await expect(nextButton).toBeVisible();
    }
  });

  test('mobile responsiveness', async ({ page, isMobile }) => {
    if (isMobile) {
      // Check that mobile menu toggle is present
      await expect(page.getByLabel('Toggle mobile menu')).toBeVisible();

      // Open mobile menu
      await page.getByLabel('Toggle mobile menu').click();

      // Check that mobile navigation controls are present
      await expect(page.getByRole('button').filter({ has: page.locator('span:has-text("Select language")') })).toBeVisible();
      await expect(page.getByRole('button').filter({ has: page.locator('span:has-text("Toggle theme")') })).toBeVisible();

      // Close mobile menu
      await page.getByLabel('Toggle mobile menu').click();

      // Check that content is readable on mobile
      const heading = page.getByRole('heading', { name: /Custom Software Development/i });
      await expect(heading).toBeVisible();

      // Check that form is accessible on mobile
      await expect(page.getByLabel(/^Name/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /Send/i })).toBeVisible();
    }
  });

  test('accessibility validation with axe-core', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('keyboard navigation works', async ({ page }) => {
    // Tab through the form
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Check that an element has focus
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('form fields have proper ARIA attributes', async ({ page }) => {
    const nameInput = page.getByLabel(/^Name/i);
    const emailInput = page.getByLabel(/^Email/i);
    const phoneInput = page.getByLabel(/^Phone/i);
    const descriptionInput = page.getByLabel(/Describe what you would like us to build/i);

    // Check required attributes
    await expect(nameInput).toHaveAttribute('required');
    await expect(emailInput).toHaveAttribute('required');
    await expect(phoneInput).toHaveAttribute('required');
    await expect(descriptionInput).toHaveAttribute('required');

    // Check input types
    await expect(nameInput).toHaveAttribute('type', 'text');
    await expect(emailInput).toHaveAttribute('type', 'email');
    await expect(phoneInput).toHaveAttribute('type', 'tel');
  });

  test('services grid displays all services', async ({ page }) => {
    const services = [
      'Web Applications',
      'Mobile Apps',
      'SaaS Platforms',
      'Custom Dashboards',
      'API Integrations',
      'E-commerce Solutions'
    ];

    // Use heading role to avoid strict mode violations
    for (const service of services) {
      await expect(page.getByRole('heading', { name: service })).toBeVisible();
    }
  });

  test('page has proper section structure', async ({ page }) => {
    // Check that page has proper section ID for accessibility
    await expect(page.locator('section').first()).toBeVisible();

    // Check main heading hierarchy
    const mainHeading = page.getByRole('heading', { level: 1, name: /Custom Software Development/i });
    await expect(mainHeading).toBeVisible();
  });
});
