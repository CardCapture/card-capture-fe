import { test as base, Page } from '@playwright/test';

/**
 * Auth fixtures for E2E tests
 * Provides helpers for authentication in tests
 */

export interface AuthFixtures {
  authenticatedPage: Page;
}

/**
 * Test fixture that provides an authenticated page
 * Uses stored auth state to skip login for each test
 */
export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ browser }, use) => {
    // Create a new context with stored auth state
    const context = await browser.newContext({
      storageState: 'e2e/.auth/user.json',
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

/**
 * Helper to perform login and save auth state
 * Run this once to generate the auth state file
 */
export async function loginAndSaveState(page: Page): Promise<void> {
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'TEST_USER_EMAIL and TEST_USER_PASSWORD environment variables are required'
    );
  }

  await page.goto('/login');
  await page.fill('[data-testid="email-input"], input[type="email"]', email);
  await page.fill(
    '[data-testid="password-input"], input[type="password"]',
    password
  );
  await page.click('[data-testid="login-submit"], button[type="submit"]');

  // Wait for successful login redirect
  await page.waitForURL(/\/(events|dashboard|home)/, { timeout: 30000 });

  // Save storage state
  await page.context().storageState({ path: 'e2e/.auth/user.json' });
}

/**
 * Helper to mock Supabase auth responses
 */
export async function mockSupabaseAuth(
  page: Page,
  mockUser: { id: string; email: string }
): Promise<void> {
  await page.route('**/auth/v1/**', async (route) => {
    const url = route.request().url();

    if (url.includes('token') || url.includes('session')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          user: mockUser,
        }),
      });
    }

    return route.continue();
  });
}

export { expect } from '@playwright/test';
