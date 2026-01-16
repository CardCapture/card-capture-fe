import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object for the Recruiter Signup page
 */
export class RecruiterSignupPage {
  readonly page: Page;

  // Step indicators
  readonly stepIndicator: Locator;

  // Step 1: School selection
  readonly schoolDropdown: Locator;
  readonly schoolSearchInput: Locator;
  readonly schoolNotListedOption: Locator;
  readonly newSchoolInput: Locator;
  readonly backToSearchLink: Locator;
  readonly schoolContinueButton: Locator;

  // Step 2: Account details
  readonly selectedSchoolDisplay: Locator;
  readonly changeSchoolButton: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly accountBackButton: Locator;
  readonly accountSubmitButton: Locator;

  // Error messages
  readonly errorMessage: Locator;

  // Navigation
  readonly signInLink: Locator;

  constructor(page: Page) {
    this.page = page;

    // Step indicators
    this.stepIndicator = page.locator('text=/\\d of \\d/');

    // Step 1: School selection
    this.schoolDropdown = page.locator('[role="combobox"], button:has-text("Search for your school")');
    this.schoolSearchInput = page.locator('input[placeholder*="Search schools"]');
    this.schoolNotListedOption = page.locator('text="My school isn\'t listed"');
    this.newSchoolInput = page.locator('#newSchool, input[placeholder*="Enter your school name"]');
    this.backToSearchLink = page.locator('button:has-text("Back to school search")');
    this.schoolContinueButton = page.locator('button:has-text("Continue")').first();

    // Step 2: Account details
    this.selectedSchoolDisplay = page.locator('[class*="school-display"], .text-sm:has(svg)');
    this.changeSchoolButton = page.locator('button:has-text("Change")');
    this.firstNameInput = page.locator('#firstName, input[placeholder="John"]');
    this.lastNameInput = page.locator('#lastName, input[placeholder="Smith"]');
    this.emailInput = page.locator('#email, input[type="email"]');
    this.passwordInput = page.locator('#password, input[placeholder*="8 characters"]');
    this.confirmPasswordInput = page.locator('#confirmPassword, input[placeholder*="Confirm"]');
    this.accountBackButton = page.locator('button:has-text("Back")');
    this.accountSubmitButton = page.locator('button:has-text("Continue to Event Selection")');

    // Error messages
    this.errorMessage = page.locator('[role="alert"], .text-destructive, .text-red-500');

    // Navigation
    this.signInLink = page.locator('a[href*="login"], a:has-text("Sign in")');
  }

  async goto() {
    await this.page.goto('/signup');
  }

  async selectSchool(schoolName: string) {
    await this.schoolDropdown.click();
    await this.schoolSearchInput.fill(schoolName);
    await this.page.locator(`[role="option"]:has-text("${schoolName}")`).first().click();
  }

  async enterNewSchool(schoolName: string) {
    await this.schoolDropdown.click();
    await this.schoolNotListedOption.click();
    await expect(this.newSchoolInput).toBeVisible();
    await this.newSchoolInput.fill(schoolName);
  }

  async continueToAccountStep() {
    await this.schoolContinueButton.click();
    await expect(this.firstNameInput).toBeVisible({ timeout: 5000 });
  }

  async fillAccountDetails(details: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) {
    await this.firstNameInput.fill(details.firstName);
    await this.lastNameInput.fill(details.lastName);
    await this.emailInput.fill(details.email);
    await this.passwordInput.fill(details.password);
    await this.confirmPasswordInput.fill(details.password);
  }

  async submitAccountForm() {
    await this.accountSubmitButton.click();
  }

  async goBackToSchoolStep() {
    await this.accountBackButton.click();
    await expect(this.schoolDropdown).toBeVisible();
  }

  async expectOnSchoolStep() {
    await expect(this.schoolDropdown).toBeVisible();
  }

  async expectOnAccountStep() {
    await expect(this.firstNameInput).toBeVisible();
  }

  async expectRedirectToEventSelection() {
    await expect(this.page).toHaveURL(/select-event/, { timeout: 15000 });
  }

  async expectValidationError() {
    await expect(this.errorMessage).toBeVisible({ timeout: 5000 });
  }
}
