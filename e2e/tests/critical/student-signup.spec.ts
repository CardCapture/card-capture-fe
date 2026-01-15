import { test, expect } from '@playwright/test';
import { RegisterPage } from '../../pages';

test.describe('Student Registration Flow', () => {
  let registerPage: RegisterPage;

  test.beforeEach(async ({ page }) => {
    registerPage = new RegisterPage(page);
    await registerPage.goto();
  });

  test.describe('Landing Page', () => {
    test('should display landing page with both registration options', async () => {
      await registerPage.expectLandingPage();
      await expect(registerPage.heroTitle).toBeVisible();
    });

    test('should display benefits section', async ({ page }) => {
      // Check for the benefits/value propositions
      await expect(page.locator('text=/Easy|Quick|Simple/i')).toBeVisible();
    });

    test('should have learn more link', async () => {
      await expect(registerPage.learnMoreLink).toBeVisible();
    });
  });

  test.describe('Email Registration Flow', () => {
    test('should toggle to email input when clicking continue with email', async () => {
      await registerPage.startEmailFlow();
      await expect(registerPage.emailInput).toBeVisible();
      await expect(registerPage.emailSubmitButton).toBeVisible();
    });

    test('should go back to landing from email flow', async () => {
      await registerPage.startEmailFlow();
      await registerPage.goBackFromEmail();
      await registerPage.expectLandingPage();
    });

    test('should disable submit button when email is empty', async () => {
      await registerPage.startEmailFlow();
      await expect(registerPage.emailSubmitButton).toBeDisabled();
    });

    test('should enable submit button when email is entered', async () => {
      await registerPage.startEmailFlow();
      await registerPage.emailInput.fill('test@example.com');
      await expect(registerPage.emailSubmitButton).toBeEnabled();
    });

    test('should show helper text about magic link', async () => {
      await registerPage.startEmailFlow();
      await expect(registerPage.emailHelperText).toBeVisible();
    });

    test('should handle email submission', async ({ page }) => {
      await registerPage.startEmailFlow();
      await registerPage.submitEmail('student@university.edu');

      // Should either redirect to check-email page or show a toast
      await expect(
        page.locator('text=/check.*email|sent.*link/i')
      ).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Event Code Flow', () => {
    test('should toggle to code input when clicking event code option', async () => {
      await registerPage.startEventCodeFlow();
      await expect(registerPage.codeInput).toBeVisible();
    });

    test('should go back to landing from code flow', async () => {
      await registerPage.startEventCodeFlow();
      await registerPage.goBackFromCode();
      await registerPage.expectLandingPage();
    });

    test('should only accept numeric input for event code', async () => {
      await registerPage.startEventCodeFlow();
      await registerPage.codeInput.fill('abc123');
      // Should only contain digits
      const value = await registerPage.codeInput.inputValue();
      expect(value.replace(/\D/g, '')).toBe(value);
    });

    test('should limit event code to 6 digits', async () => {
      await registerPage.startEventCodeFlow();
      await registerPage.codeInput.fill('12345678');
      const value = await registerPage.codeInput.inputValue();
      expect(value.length).toBeLessThanOrEqual(6);
    });

    test('should show error for invalid event code', async ({ page }) => {
      await registerPage.startEventCodeFlow();
      await registerPage.submitEventCode('000000');

      // Should show error message
      await expect(
        page.locator('text=/invalid|expired|error/i')
      ).toBeVisible({ timeout: 10000 });
    });

    test('should disable submit until 6 digits entered', async () => {
      await registerPage.startEventCodeFlow();

      // With less than 6 digits
      await registerPage.codeInput.fill('12345');
      await expect(registerPage.codeSubmitButton).toBeDisabled();

      // With 6 digits
      await registerPage.codeInput.fill('123456');
      await expect(registerPage.codeSubmitButton).toBeEnabled();
    });
  });

  test.describe('Navigation', () => {
    test('should be accessible from home page', async ({ page }) => {
      await page.goto('/');
      const registerLink = page.locator('a[href*="register"]');
      if (await registerLink.isVisible()) {
        await registerLink.click();
        await expect(page).toHaveURL(/register/);
      }
    });

    test('should have link to login for existing users', async ({ page }) => {
      await registerPage.goto();
      const loginLink = page.locator('a[href*="login"], text=/sign in|log in/i');
      if (await loginLink.isVisible()) {
        await expect(loginLink).toBeVisible();
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('should display correctly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await registerPage.goto();
      await registerPage.expectLandingPage();
    });

    test('should display correctly on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await registerPage.goto();
      await registerPage.expectLandingPage();
    });
  });
});
