import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start fresh for each test
    await page.goto('/');
  });

  test('should display login page', async ({ page }) => {
    await page.goto('/login');

    // Verify login page elements are present
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    // Enter invalid credentials
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(
      page.locator('[role="alert"], .error, [data-testid="error-message"]')
    ).toBeVisible({ timeout: 10000 });
  });

  test('should validate email format', async ({ page }) => {
    await page.goto('/login');

    // Enter invalid email format
    await page.fill('input[type="email"]', 'notanemail');
    await page.fill('input[type="password"]', 'somepassword');
    await page.click('button[type="submit"]');

    // Should remain on login page or show validation error
    await expect(page).toHaveURL(/login/);
  });

  test('should redirect unauthenticated users to login', async ({ page }) => {
    // Try to access protected route
    await page.goto('/events');

    // Should redirect to login
    await expect(page).toHaveURL(/login|signin/, { timeout: 10000 });
  });

  test('should have link to registration', async ({ page }) => {
    await page.goto('/login');

    // Look for sign up / register link
    const signUpLink = page.locator('a[href*="register"], a[href*="signup"]');
    await expect(signUpLink).toBeVisible();
  });

  test('should have forgot password link', async ({ page }) => {
    await page.goto('/login');

    // Look for forgot password link
    const forgotLink = page.locator(
      'a[href*="forgot"], a[href*="reset"], a:has-text("Forgot")'
    );
    await expect(forgotLink).toBeVisible();
  });
});

test.describe('Registration Flow', () => {
  test('should display registration page', async ({ page }) => {
    await page.goto('/register');

    // Should have email input at minimum
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/register');

    // Try to submit empty form
    const submitButton = page.locator('button[type="submit"]');
    if (await submitButton.isVisible()) {
      await submitButton.click();

      // Should show validation errors or stay on page
      await expect(page).toHaveURL(/register/);
    }
  });
});
