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

    // Should show error message (rendered in a destructive div, not role="alert")
    await expect(
      page.locator('[role="alert"], .text-destructive, [data-testid="error-message"]')
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
  test('should display registration page with signup options', async ({ page }) => {
    await page.goto('/register');

    // Student registration has a primary "Continue with Phone" button
    await expect(
      page.getByRole('button', { name: /continue with phone/i })
    ).toBeVisible({ timeout: 10000 });

    // And an email alternative
    await expect(
      page.getByRole('button', { name: /email/i })
    ).toBeVisible();
  });

  test('should show email input after selecting email flow', async ({ page }) => {
    await page.goto('/register');

    // Click the email option to enter the email registration flow
    const emailOption = page.getByRole('button', { name: /email/i });
    await emailOption.click();

    // Now an email input should be visible
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 5000 });
  });
});
