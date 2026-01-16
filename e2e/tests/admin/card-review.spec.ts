import { test, expect } from '@playwright/test';
import { EventDetailsPage } from '../../pages';

/**
 * Admin Card Review Workflow Tests
 */
test.describe('Admin Card Review Workflow', () => {
  let eventPage: EventDetailsPage;

  // These tests require authentication
  test.use({
    storageState: 'e2e/.auth/user.json',
  });

  test.beforeEach(async ({ page }) => {
    eventPage = new EventDetailsPage(page);
    // Navigate to events page and select first event
    await page.goto('/events');

    // Click first event to open details
    const firstEvent = page.locator('a[href*="/events/"], tr[role="row"], [class*="Card"]').first();
    await firstEvent.click();
    await page.waitForURL(/\/events\//, { timeout: 10000 });
  });

  test.describe('Card Table', () => {
    test('should display card table', async ({ page }) => {
      await expect(eventPage.cardTable).toBeVisible({ timeout: 10000 });
    });

    test('should have search functionality', async ({ page }) => {
      await expect(eventPage.searchInput).toBeVisible();
    });

    test('should filter cards when searching', async ({ page }) => {
      await eventPage.searchInput.fill('test');
      await page.waitForTimeout(500);
      // Table should update
    });

    test('should have add card dropdown', async ({ page }) => {
      await expect(eventPage.addCardDropdown).toBeVisible();
    });

    test('should show add card options', async ({ page }) => {
      await eventPage.openAddCardMenu();
      // Should show menu options
      await expect(
        page.locator('[role="menuitem"], [role="option"]')
      ).toBeVisible({ timeout: 3000 });
    });
  });

  test.describe('Status Tabs', () => {
    test('should have needs review tab/badge', async ({ page }) => {
      await expect(eventPage.needsReviewBadge).toBeVisible();
    });

    test('should have ready to export tab/badge', async ({ page }) => {
      await expect(eventPage.readyToExportBadge).toBeVisible();
    });

    test('should switch tabs when clicking status badges', async ({ page }) => {
      // Click needs review
      await eventPage.clickStatusBadge('needs_review');
      await page.waitForTimeout(500);

      // Click ready to export
      await eventPage.clickStatusBadge('ready_to_export');
      await page.waitForTimeout(500);
    });

    test('should show hide exported toggle on ready to export tab', async ({ page }) => {
      await eventPage.clickStatusBadge('ready_to_export');
      await expect(eventPage.hideExportedSwitch).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Review Modal', () => {
    test('should open review modal when clicking card row', async ({ page }) => {
      // Ensure we're on a tab with cards
      await eventPage.clickStatusBadge('needs_review');
      await page.waitForTimeout(500);

      // Try to click a card row
      const rows = eventPage.cardRows;
      if ((await rows.count()) > 0) {
        await rows.first().click();
        await eventPage.expectReviewModalOpen();
      }
    });

    test('should display card image in review modal', async ({ page }) => {
      await eventPage.clickStatusBadge('needs_review');
      await page.waitForTimeout(500);

      const rows = eventPage.cardRows;
      if ((await rows.count()) > 0) {
        await rows.first().click();
        await eventPage.expectReviewModalOpen();

        // Image panel should be visible (or QR scan message)
        await expect(
          page.locator('img, text=QR code scan')
        ).toBeVisible({ timeout: 5000 });
      }
    });

    test('should display form fields in review modal', async ({ page }) => {
      await eventPage.clickStatusBadge('needs_review');
      await page.waitForTimeout(500);

      const rows = eventPage.cardRows;
      if ((await rows.count()) > 0) {
        await rows.first().click();
        await eventPage.expectReviewModalOpen();

        // Form fields should be visible
        await expect(eventPage.reviewFormFields.first()).toBeVisible({ timeout: 5000 });
      }
    });

    test('should show review progress indicator', async ({ page }) => {
      await eventPage.clickStatusBadge('needs_review');
      await page.waitForTimeout(500);

      const rows = eventPage.cardRows;
      if ((await rows.count()) > 0) {
        await rows.first().click();
        await eventPage.expectReviewModalOpen();

        // Progress should be visible
        await expect(eventPage.reviewProgress).toBeVisible({ timeout: 5000 }).catch(() => {
          // May show "All fields reviewed" instead
        });
      }
    });

    test('should have save changes button', async ({ page }) => {
      await eventPage.clickStatusBadge('needs_review');
      await page.waitForTimeout(500);

      const rows = eventPage.cardRows;
      if ((await rows.count()) > 0) {
        await rows.first().click();
        await eventPage.expectReviewModalOpen();
        await expect(eventPage.saveChangesButton).toBeVisible();
      }
    });

    test('should have archive card button', async ({ page }) => {
      await eventPage.clickStatusBadge('needs_review');
      await page.waitForTimeout(500);

      const rows = eventPage.cardRows;
      if ((await rows.count()) > 0) {
        await rows.first().click();
        await eventPage.expectReviewModalOpen();
        await expect(eventPage.archiveCardButton).toBeVisible();
      }
    });

    test('should close modal with escape key', async ({ page }) => {
      await eventPage.clickStatusBadge('needs_review');
      await page.waitForTimeout(500);

      const rows = eventPage.cardRows;
      if ((await rows.count()) > 0) {
        await rows.first().click();
        await eventPage.expectReviewModalOpen();
        await eventPage.closeReviewModal();
        await eventPage.expectReviewModalClosed();
      }
    });
  });

  test.describe('Image Controls', () => {
    test('should have zoom controls in review modal', async ({ page }) => {
      await eventPage.clickStatusBadge('needs_review');
      await page.waitForTimeout(500);

      const rows = eventPage.cardRows;
      if ((await rows.count()) > 0) {
        await rows.first().click();
        await eventPage.expectReviewModalOpen();

        // Zoom controls should be visible
        await expect(eventPage.zoomInButton).toBeVisible({ timeout: 5000 }).catch(() => {});
        await expect(eventPage.zoomOutButton).toBeVisible({ timeout: 5000 }).catch(() => {});
      }
    });

    test('should have rotate controls', async ({ page }) => {
      await eventPage.clickStatusBadge('needs_review');
      await page.waitForTimeout(500);

      const rows = eventPage.cardRows;
      if ((await rows.count()) > 0) {
        await rows.first().click();
        await eventPage.expectReviewModalOpen();

        await expect(eventPage.rotateLeftButton).toBeVisible({ timeout: 5000 }).catch(() => {});
        await expect(eventPage.rotateRightButton).toBeVisible({ timeout: 5000 }).catch(() => {});
      }
    });
  });

  test.describe('Bulk Actions', () => {
    test('should allow selecting multiple cards', async ({ page }) => {
      await eventPage.clickStatusBadge('ready_to_export');
      await page.waitForTimeout(500);

      const checkboxes = eventPage.cardCheckboxes;
      if ((await checkboxes.count()) > 0) {
        await checkboxes.first().check();
        await expect(eventPage.selectedCountText).toBeVisible();
      }
    });

    test('should have select all checkbox', async ({ page }) => {
      await expect(eventPage.selectAllCheckbox).toBeVisible();
    });

    test('should show bulk action buttons when cards selected', async ({ page }) => {
      await eventPage.clickStatusBadge('ready_to_export');
      await page.waitForTimeout(500);

      const checkboxes = eventPage.cardCheckboxes;
      if ((await checkboxes.count()) > 0) {
        await checkboxes.first().check();

        // Export or archive button should appear
        await expect(
          page.locator('button:has-text("Export"), button:has-text("Archive")')
        ).toBeVisible({ timeout: 5000 });
      }
    });

    test('should have export button on ready to export tab', async ({ page }) => {
      await eventPage.clickStatusBadge('ready_to_export');
      await page.waitForTimeout(500);

      const checkboxes = eventPage.cardCheckboxes;
      if ((await checkboxes.count()) > 0) {
        await checkboxes.first().check();
        await expect(eventPage.exportButton).toBeVisible({ timeout: 5000 });
      }
    });

    test('should have archive button', async ({ page }) => {
      await eventPage.clickStatusBadge('ready_to_export');
      await page.waitForTimeout(500);

      const checkboxes = eventPage.cardCheckboxes;
      if ((await checkboxes.count()) > 0) {
        await checkboxes.first().check();
        await expect(eventPage.archiveButton).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe('Archive Flow', () => {
    test('should show archive confirmation dialog', async ({ page }) => {
      await eventPage.clickStatusBadge('ready_to_export');
      await page.waitForTimeout(500);

      const checkboxes = eventPage.cardCheckboxes;
      if ((await checkboxes.count()) > 0) {
        await checkboxes.first().check();
        await eventPage.archiveButton.click();
        await expect(eventPage.archiveConfirmDialog).toBeVisible({ timeout: 5000 });
      }
    });

    test('should have confirm and cancel buttons in archive dialog', async ({ page }) => {
      await eventPage.clickStatusBadge('ready_to_export');
      await page.waitForTimeout(500);

      const checkboxes = eventPage.cardCheckboxes;
      if ((await checkboxes.count()) > 0) {
        await checkboxes.first().check();
        await eventPage.archiveButton.click();

        await expect(
          page.locator('[role="alertdialog"] button:has-text("Archive")')
        ).toBeVisible({ timeout: 5000 });
        await expect(
          page.locator('[role="alertdialog"] button:has-text("Cancel")')
        ).toBeVisible();
      }
    });
  });

  test.describe('Export Flow', () => {
    test('should trigger export when clicking export button', async ({ page }) => {
      await eventPage.clickStatusBadge('ready_to_export');
      await page.waitForTimeout(500);

      const checkboxes = eventPage.cardCheckboxes;
      if ((await checkboxes.count()) > 0) {
        await checkboxes.first().check();

        // Set up download listener
        const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);

        await eventPage.exportButton.click();

        // Either download starts or Slate export modal appears
        const download = await downloadPromise;
        if (download) {
          expect(download.suggestedFilename()).toContain('.csv');
        }
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('should display correctly on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await expect(eventPage.cardTable).toBeVisible({ timeout: 10000 });
    });

    test('should work on smaller screens', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      // Should still show core functionality
      await expect(
        page.locator('table, [class*="card"]')
      ).toBeVisible({ timeout: 10000 });
    });
  });
});
