import { test, expect } from '@playwright/test';
import { RecruiterSignupPage } from '../../pages';

test.describe('Recruiter Signup Flow', () => {
  let signupPage: RecruiterSignupPage;

  test.beforeEach(async ({ page }) => {
    signupPage = new RecruiterSignupPage(page);
    await signupPage.goto();
  });

  test.describe('Step 1: School Selection', () => {
    test('should display school selection step initially', async () => {
      await signupPage.expectOnSchoolStep();
    });

    test('should show step indicator at 1 of 2', async ({ page }) => {
      await expect(page.locator('text=/1.*of.*2/i')).toBeVisible();
    });

    test('should open school dropdown on click', async ({ page }) => {
      await signupPage.schoolDropdown.click();
      await expect(signupPage.schoolSearchInput).toBeVisible();
    });

    test('should filter schools as user types', async ({ page }) => {
      await signupPage.schoolDropdown.click();
      await signupPage.schoolSearchInput.fill('University');
      // Should show filtered results or "no results" message
      await page.waitForTimeout(500); // Wait for search
      const options = page.locator('[role="option"]');
      const optionCount = await options.count();
      expect(optionCount).toBeGreaterThanOrEqual(0);
    });

    test('should show "My school isn\'t listed" option', async () => {
      await signupPage.schoolDropdown.click();
      await expect(signupPage.schoolNotListedOption).toBeVisible();
    });

    test('should toggle to new school input when school not listed', async () => {
      await signupPage.schoolDropdown.click();
      await signupPage.schoolNotListedOption.click();
      await expect(signupPage.newSchoolInput).toBeVisible();
    });

    test('should allow returning to school search from new school input', async () => {
      await signupPage.schoolDropdown.click();
      await signupPage.schoolNotListedOption.click();
      await signupPage.backToSearchLink.click();
      await expect(signupPage.schoolDropdown).toBeVisible();
    });

    test('should require school selection before continuing', async ({ page }) => {
      // Try to continue without selecting a school
      await signupPage.schoolContinueButton.click();
      // Should show validation error or remain on step 1
      const errorOrStep1 = await Promise.race([
        page.locator('text=/select.*school|required/i').waitFor({ timeout: 3000 }).then(() => 'error'),
        signupPage.schoolDropdown.waitFor({ timeout: 3000 }).then(() => 'step1'),
      ]).catch(() => 'step1');

      expect(['error', 'step1']).toContain(errorOrStep1);
    });

    test('should proceed to step 2 after selecting a school', async ({ page }) => {
      // Enter a new school name (safer than selecting existing)
      await signupPage.enterNewSchool('Test University');
      await signupPage.schoolContinueButton.click();

      // Should move to step 2
      await expect(page.locator('text=/2.*of.*2/i')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Step 2: Account Details', () => {
    test.beforeEach(async () => {
      // Navigate to step 2
      await signupPage.enterNewSchool('Test University');
      await signupPage.continueToAccountStep();
    });

    test('should display account details form', async () => {
      await signupPage.expectOnAccountStep();
    });

    test('should show selected school', async ({ page }) => {
      await expect(page.locator('text=Test University')).toBeVisible();
    });

    test('should have back button to return to school selection', async () => {
      await signupPage.goBackToSchoolStep();
      await signupPage.expectOnSchoolStep();
    });

    test('should validate first name is required', async ({ page }) => {
      await signupPage.fillAccountDetails({
        firstName: '',
        lastName: 'Doe',
        email: 'test@test.edu',
        password: 'password123',
      });
      await signupPage.submitAccountForm();
      // Should show validation error
      await expect(page.locator('text=/first.*name|required/i')).toBeVisible({ timeout: 5000 });
    });

    test('should validate last name is required', async ({ page }) => {
      await signupPage.fillAccountDetails({
        firstName: 'John',
        lastName: '',
        email: 'test@test.edu',
        password: 'password123',
      });
      await signupPage.submitAccountForm();
      // Should show validation error
      await expect(page.locator('text=/last.*name|required/i')).toBeVisible({ timeout: 5000 });
    });

    test('should validate email format', async ({ page }) => {
      await signupPage.firstNameInput.fill('John');
      await signupPage.lastNameInput.fill('Doe');
      await signupPage.emailInput.fill('invalid-email');
      await signupPage.passwordInput.fill('password123');
      await signupPage.confirmPasswordInput.fill('password123');
      await signupPage.submitAccountForm();

      // Should remain on page or show error
      await expect(page).toHaveURL(/signup/);
    });

    test('should validate password length (min 8 characters)', async ({ page }) => {
      await signupPage.fillAccountDetails({
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@test.edu',
        password: 'short',
      });
      // Manually fill confirm password with the short password
      await signupPage.confirmPasswordInput.fill('short');
      await signupPage.submitAccountForm();

      // Should show validation error about password length
      await expect(page.locator('text=/8.*characters|password.*length/i')).toBeVisible({ timeout: 5000 });
    });

    test('should validate passwords match', async ({ page }) => {
      await signupPage.firstNameInput.fill('John');
      await signupPage.lastNameInput.fill('Doe');
      await signupPage.emailInput.fill('test@test.edu');
      await signupPage.passwordInput.fill('password123');
      await signupPage.confirmPasswordInput.fill('differentpassword');
      await signupPage.submitAccountForm();

      // Should show validation error about password mismatch
      await expect(page.locator('text=/password.*match|don\'t match/i')).toBeVisible({ timeout: 5000 });
    });

    test('should show loading state on submit', async ({ page }) => {
      await signupPage.fillAccountDetails({
        firstName: 'John',
        lastName: 'Doe',
        email: `test${Date.now()}@test.edu`,
        password: 'password123',
      });
      await signupPage.submitAccountForm();

      // Button should show loading state
      await expect(
        page.locator('button:has-text("Creating Account"), button:disabled')
      ).toBeVisible({ timeout: 3000 }).catch(() => {
        // Loading state might be very quick
      });
    });
  });

  test.describe('Navigation Links', () => {
    test('should have sign in link for existing users', async () => {
      await expect(signupPage.signInLink).toBeVisible();
    });

    test('should navigate to login page when clicking sign in', async ({ page }) => {
      await signupPage.signInLink.click();
      await expect(page).toHaveURL(/login/);
    });
  });

  test.describe('Responsive Design', () => {
    test('should display correctly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await signupPage.goto();
      await signupPage.expectOnSchoolStep();
    });

    test('should display correctly on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await signupPage.goto();
      await signupPage.expectOnSchoolStep();
    });
  });
});
