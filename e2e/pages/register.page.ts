import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object for the Student Registration page
 */
export class RegisterPage {
  readonly page: Page;

  // Landing elements
  readonly heroTitle: Locator;
  readonly continueWithEmailButton: Locator;
  readonly haveEventCodeButton: Locator;
  readonly learnMoreLink: Locator;

  // Email flow elements
  readonly emailInput: Locator;
  readonly emailSubmitButton: Locator;
  readonly emailBackButton: Locator;
  readonly emailHelperText: Locator;

  // Event code flow elements
  readonly codeInput: Locator;
  readonly codeSubmitButton: Locator;
  readonly codeBackButton: Locator;
  readonly codeError: Locator;

  constructor(page: Page) {
    this.page = page;

    // Landing elements
    this.heroTitle = page.locator('h1:has-text("Your Info")');
    this.continueWithEmailButton = page.locator('button:has-text("Continue with Email")');
    this.haveEventCodeButton = page.locator('button:has-text("Event Code")');
    this.learnMoreLink = page.locator('button:has-text("Learn more")');

    // Email flow elements
    this.emailInput = page.locator('#email-input, input[type="email"]');
    this.emailSubmitButton = page.locator('button[aria-label*="magic link"], button:has-text("Continue"):not(:has-text("Email"))');
    this.emailBackButton = page.locator('button[aria-label*="back to main"], button:has-text("Back")').first();
    this.emailHelperText = page.locator('#email-help, text=secure link');

    // Event code flow elements
    this.codeInput = page.locator('#code-input, input[placeholder="123456"]');
    this.codeSubmitButton = page.locator('button[aria-label*="Verify event code"]');
    this.codeBackButton = page.locator('button:has-text("Back")').first();
    this.codeError = page.locator('#code-error, [role="alert"]');
  }

  async goto() {
    await this.page.goto('/register');
  }

  async startEmailFlow() {
    await this.continueWithEmailButton.click();
    await expect(this.emailInput).toBeVisible();
  }

  async startEventCodeFlow() {
    await this.haveEventCodeButton.click();
    await expect(this.codeInput).toBeVisible();
  }

  async submitEmail(email: string) {
    await this.emailInput.fill(email);
    await this.emailSubmitButton.click();
  }

  async submitEventCode(code: string) {
    await this.codeInput.fill(code);
    await this.codeSubmitButton.click();
  }

  async goBackFromEmail() {
    await this.emailBackButton.click();
    await expect(this.continueWithEmailButton).toBeVisible();
  }

  async goBackFromCode() {
    await this.codeBackButton.click();
    await expect(this.haveEventCodeButton).toBeVisible();
  }

  async expectEmailSentPage() {
    await expect(this.page).toHaveURL(/check-email/, { timeout: 10000 });
  }

  async expectCodeError() {
    await expect(this.codeError).toBeVisible();
  }

  async expectLandingPage() {
    await expect(this.continueWithEmailButton).toBeVisible();
    await expect(this.haveEventCodeButton).toBeVisible();
  }
}
