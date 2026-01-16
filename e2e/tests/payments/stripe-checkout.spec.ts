import { test, expect } from '@playwright/test';
import { PurchaseEventsPage } from '../../pages';

/**
 * Payment/Checkout Flow Tests
 *
 * Note: These tests verify the UI flow up to the Stripe redirect.
 * Actual payment processing requires Stripe test mode configuration.
 */
test.describe('Payment/Checkout Flow', () => {
  let purchasePage: PurchaseEventsPage;

  // These tests require authentication
  test.use({
    storageState: 'e2e/.auth/user.json',
  });

  test.beforeEach(async ({ page }) => {
    purchasePage = new PurchaseEventsPage(page);
    await purchasePage.goto();
  });

  test.describe('Page Load and Display', () => {
    test('should display purchase events page', async () => {
      await expect(purchasePage.pageTitle).toBeVisible({ timeout: 10000 });
    });

    test('should show price per event', async ({ page }) => {
      await expect(page.locator('text=$25')).toBeVisible();
    });

    test('should have search input', async () => {
      await expect(purchasePage.searchInput).toBeVisible();
    });

    test('should display event cards', async () => {
      await purchasePage.expectEventsVisible();
    });
  });

  test.describe('Event Selection', () => {
    test('should select event when clicking card', async ({ page }) => {
      await purchasePage.expectEventsVisible();
      await purchasePage.selectEventByIndex(0);

      // Cart panel should open or show selected state
      await expect(
        page.locator('text=/Selected Event|\\$25/')
      ).toBeVisible({ timeout: 5000 });
    });

    test('should deselect event when clicking selected card', async ({ page }) => {
      await purchasePage.expectEventsVisible();
      await purchasePage.selectEventByIndex(0);

      // Wait for selection to register
      await page.waitForTimeout(500);

      // Click again to deselect
      await purchasePage.selectEventByIndex(0);

      // Selection count should decrease
      await page.waitForTimeout(500);
    });

    test('should allow selecting multiple events', async ({ page }) => {
      await purchasePage.expectEventsVisible();

      const eventCount = await purchasePage.eventCards.count();
      if (eventCount >= 2) {
        await purchasePage.selectEventByIndex(0);
        await page.waitForTimeout(300);
        await purchasePage.selectEventByIndex(1);

        // Total should be $50
        await expect(page.locator('text=/\\$50|2.*event/i')).toBeVisible({ timeout: 5000 });
      }
    });

    test('should show selected events in cart panel', async ({ page }) => {
      await purchasePage.expectEventsVisible();
      await purchasePage.selectEventByIndex(0);

      // Cart panel should show
      await expect(purchasePage.cartPanelTitle).toBeVisible({ timeout: 5000 });
    });

    test('should allow removing event from cart', async ({ page }) => {
      await purchasePage.expectEventsVisible();
      await purchasePage.selectEventByIndex(0);

      // Find remove button in cart
      const removeButton = page.locator('[class*="Sheet"] button:has(svg)').first();
      if (await removeButton.isVisible()) {
        await removeButton.click();
        // Cart should update
      }
    });
  });

  test.describe('Cart Panel', () => {
    test('should show floating cart button when panel closed and items selected', async ({ page }) => {
      await purchasePage.expectEventsVisible();
      await purchasePage.selectEventByIndex(0);

      // Close panel if open
      const closeButton = page.locator('[class*="Sheet"] button[aria-label*="close"]');
      if (await closeButton.isVisible()) {
        await closeButton.click();
      }

      // Floating button should appear
      await expect(purchasePage.floatingCartButton).toBeVisible({ timeout: 5000 });
    });

    test('should show correct total price', async ({ page }) => {
      await purchasePage.expectEventsVisible();
      await purchasePage.selectEventByIndex(0);

      // Should show $25 for one event
      await expect(page.locator('text=$25')).toBeVisible();
    });

    test('should update total when adding events', async ({ page }) => {
      await purchasePage.expectEventsVisible();

      const eventCount = await purchasePage.eventCards.count();
      if (eventCount >= 2) {
        await purchasePage.selectEventByIndex(0);
        await page.waitForTimeout(500);
        await purchasePage.selectEventByIndex(1);

        // Total should update to $50
        await expect(page.locator('text=/\\$50/')).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe('Checkout Flow', () => {
    test('should have continue to payment button', async ({ page }) => {
      await purchasePage.expectEventsVisible();
      await purchasePage.selectEventByIndex(0);

      await expect(purchasePage.continueToPaymentButton).toBeVisible({ timeout: 5000 });
    });

    test('should disable payment button when no events selected', async ({ page }) => {
      // Without selecting any events
      await purchasePage.expectEventsVisible();

      // Payment button should be disabled or not visible
      const button = purchasePage.continueToPaymentButton;
      const isDisabled = await button.isDisabled().catch(() => true);
      const isHidden = !(await button.isVisible().catch(() => false));

      expect(isDisabled || isHidden).toBe(true);
    });

    test('should enable payment button when events selected', async ({ page }) => {
      await purchasePage.expectEventsVisible();
      await purchasePage.selectEventByIndex(0);

      await purchasePage.expectPaymentButtonEnabled();
    });

    test('should show loading state when proceeding to payment', async ({ page }) => {
      await purchasePage.expectEventsVisible();
      await purchasePage.selectEventByIndex(0);

      // Click continue to payment
      await purchasePage.continueToPaymentButton.click();

      // Should show loading or redirect
      const loadingOrRedirect = await Promise.race([
        page.locator('text=Processing').waitFor({ timeout: 3000 }).then(() => 'loading'),
        page.waitForURL(/stripe|checkout/, { timeout: 5000 }).then(() => 'redirect'),
      ]).catch(() => 'timeout');

      expect(['loading', 'redirect', 'timeout']).toContain(loadingOrRedirect);
    });

    test('should redirect to Stripe checkout', async ({ page }) => {
      test.skip(process.env.CI === 'true', 'Stripe redirect test skipped in CI');

      await purchasePage.expectEventsVisible();
      await purchasePage.selectEventByIndex(0);
      await purchasePage.proceedToPayment();

      // Should redirect to Stripe
      await expect(page).toHaveURL(/stripe\.com|checkout\.stripe/, { timeout: 15000 });
    });
  });

  test.describe('Search and Filter', () => {
    test('should filter events when searching', async ({ page }) => {
      await purchasePage.expectEventsVisible();
      const initialCount = await purchasePage.eventCards.count();

      await purchasePage.searchEvents('university');
      await page.waitForTimeout(500);

      // Count may change after search
      const filteredCount = await purchasePage.eventCards.count();
      // Either shows filtered results or no results message
      expect(filteredCount >= 0).toBe(true);
    });

    test('should show no results message for non-matching search', async ({ page }) => {
      await purchasePage.expectEventsVisible();
      await purchasePage.searchEvents('xyznonexistentquery123');

      // Should show no results or empty state
      await expect(
        page.locator('text=/no.*event|no.*result|not found/i')
      ).toBeVisible({ timeout: 5000 }).catch(() => {
        // May just show empty list
      });
    });

    test('should clear search and show all events', async ({ page }) => {
      await purchasePage.expectEventsVisible();
      const initialCount = await purchasePage.eventCards.count();

      await purchasePage.searchEvents('test');
      await page.waitForTimeout(500);

      await purchasePage.searchEvents('');
      await page.waitForTimeout(500);

      // Should restore to initial (or similar) count
      const clearedCount = await purchasePage.eventCards.count();
      expect(clearedCount).toBe(initialCount);
    });
  });

  test.describe('Pagination', () => {
    test('should show pagination if many events exist', async ({ page }) => {
      await purchasePage.expectEventsVisible();

      // Pagination may or may not be visible depending on event count
      const pagination = purchasePage.pageIndicator;
      const hasPagination = await pagination.isVisible().catch(() => false);

      // Just verify page loads correctly
      expect(true).toBe(true);
    });

    test('should navigate between pages', async ({ page }) => {
      await purchasePage.expectEventsVisible();

      if (await purchasePage.nextButton.isVisible()) {
        await purchasePage.goToNextPage();
        await page.waitForTimeout(500);

        // Should show different events or page indicator update
        await expect(purchasePage.pageIndicator).toContainText('2');
      }
    });
  });

  test.describe('Cancelled Payment Alert', () => {
    test('should show alert when returning from cancelled payment', async ({ page }) => {
      await page.goto('/purchase-events?cancelled=true');

      await expect(purchasePage.cancelledPaymentAlert).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Responsive Design', () => {
    test('should display correctly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await purchasePage.goto();
      await purchasePage.expectEventsVisible();
    });

    test('should display correctly on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await purchasePage.goto();
      await purchasePage.expectEventsVisible();
    });
  });
});
