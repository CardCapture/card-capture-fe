import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object for the Login page
 */
export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;
  readonly errorMessage: Locator;
  readonly signUpLink: Locator;
  readonly forgotPasswordLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('input[type="email"]');
    this.passwordInput = page.locator('input[type="password"]');
    this.signInButton = page.locator('button[type="submit"]');
    this.errorMessage = page.locator('[role="alert"], .text-destructive');
    this.signUpLink = page.locator('a[href*="signup"], a:has-text("Create an account")');
    this.forgotPasswordLink = page.locator('a[href*="forgot"], a[href*="reset"]');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.signInButton.click();
  }

  async expectErrorVisible() {
    await expect(this.errorMessage).toBeVisible({ timeout: 10000 });
  }

  async expectRedirectAfterLogin(urlPattern: RegExp = /\/(events|dashboard|home)/) {
    await expect(this.page).toHaveURL(urlPattern, { timeout: 15000 });
  }

  async expectOnLoginPage() {
    await expect(this.page).toHaveURL(/login/);
  }
}
