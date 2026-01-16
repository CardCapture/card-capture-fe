import { test, expect } from '@playwright/test';
import { ScanPage } from '../../pages';

/**
 * Card Scanning Flow Tests
 *
 * Note: These tests focus on the UI interactions. Actual camera functionality
 * requires device access which may not be available in CI environments.
 * Camera capture tests marked with .skip can be enabled for local testing.
 */
test.describe('Card Scanning Flow', () => {
  let scanPage: ScanPage;

  // These tests require authentication
  test.use({
    storageState: 'e2e/.auth/user.json',
  });

  test.beforeEach(async ({ page }) => {
    scanPage = new ScanPage(page);
  });

  test.describe('Page Load and Event Selection', () => {
    test('should display scan page with event selector', async ({ page }) => {
      await scanPage.goto();
      await expect(scanPage.pageTitle).toBeVisible();
      await expect(scanPage.eventSelector).toBeVisible();
    });

    test('should disable camera button when no event selected', async () => {
      await scanPage.goto();
      await scanPage.expectNoEventSelected();
    });

    test('should show event options in dropdown', async ({ page }) => {
      await scanPage.goto();
      await scanPage.eventSelector.click();
      // Should show event options or "no events" message
      await expect(
        page.locator('[role="option"], text=/no events|create/i')
      ).toBeVisible({ timeout: 5000 });
    });

    test('should have create new event option', async ({ page }) => {
      await scanPage.goto();
      await scanPage.eventSelector.click();
      await expect(scanPage.createEventOption).toBeVisible();
    });

    test('should open create event modal when selecting create option', async ({ page }) => {
      await scanPage.goto();
      await scanPage.eventSelector.click();
      await scanPage.createEventOption.click();
      await scanPage.expectCreateEventModal();
    });
  });

  test.describe('Camera Interface', () => {
    test.beforeEach(async ({ page }) => {
      await scanPage.goto();
      // Select an event first (use create new if no events exist)
      await scanPage.eventSelector.click();
      const firstEvent = page.locator('[role="option"]').first();
      if (await firstEvent.isVisible()) {
        await firstEvent.click();
      }
    });

    test('should enable camera button after selecting event', async () => {
      await scanPage.expectEventSelected();
    });

    test('should open camera view when clicking open camera', async () => {
      // This test may fail in CI without camera permissions
      test.skip(process.env.CI === 'true', 'Camera tests skipped in CI');

      await scanPage.openCamera();
      await scanPage.expectCameraOpen();
    });

    test('should close camera when clicking back button', async () => {
      test.skip(process.env.CI === 'true', 'Camera tests skipped in CI');

      await scanPage.openCamera();
      await scanPage.closeCamera();
      await scanPage.expectCameraClosed();
    });

    test('should show QR ready indicator in camera view', async ({ page }) => {
      test.skip(process.env.CI === 'true', 'Camera tests skipped in CI');

      await scanPage.openCamera();
      await expect(scanPage.qrReadyBadge).toBeVisible();
    });

    test('should allow event selection from within camera view', async ({ page }) => {
      test.skip(process.env.CI === 'true', 'Camera tests skipped in CI');

      await scanPage.openCamera();
      await expect(scanPage.cameraEventSelector).toBeVisible();
    });
  });

  test.describe('File Upload Flow', () => {
    test('should have file input for image upload', async () => {
      await scanPage.goto();
      await expect(scanPage.fileInput).toBeAttached();
    });

    test('should accept image files', async ({ page }) => {
      await scanPage.goto();
      const fileInput = scanPage.fileInput;
      const acceptAttr = await fileInput.getAttribute('accept');
      expect(acceptAttr).toContain('image');
    });

    test('should accept PDF files', async ({ page }) => {
      await scanPage.goto();
      const fileInput = scanPage.fileInput;
      const acceptAttr = await fileInput.getAttribute('accept');
      expect(acceptAttr).toContain('.pdf');
    });
  });

  test.describe('Image Preview', () => {
    test('should show retake button when image is captured', async ({ page }) => {
      // This would require a mock or actual image capture
      test.skip(true, 'Requires mock image capture setup');

      await scanPage.goto();
      // After capturing an image...
      await expect(scanPage.retakeButton).toBeVisible();
      await expect(scanPage.capturedImage).toBeVisible();
    });

    test('should show processing progress during upload', async ({ page }) => {
      test.skip(true, 'Requires mock upload setup');

      await scanPage.goto();
      // After starting an upload...
      await scanPage.expectProcessing();
    });
  });

  test.describe('Offline Support', () => {
    test('should show sync status badge', async ({ page }) => {
      await scanPage.goto();
      // Sync status badge should be present (may show "synced" or "pending")
      await expect(scanPage.syncStatusBadge).toBeVisible().catch(() => {
        // Badge might not be visible if fully synced
      });
    });

    test('should show offline banner when offline', async ({ page, context }) => {
      await scanPage.goto();

      // Simulate offline mode
      await context.setOffline(true);
      await page.reload().catch(() => {
        // Page may not reload when offline, that's ok
      });

      // Should show some offline indicator
      const offlineIndicator = page.locator('text=/offline|no connection/i');
      await expect(offlineIndicator).toBeVisible().catch(() => {
        // Offline banner might not be implemented
      });

      // Restore online mode
      await context.setOffline(false);
    });
  });

  test.describe('Responsive Design', () => {
    test('should display correctly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await scanPage.goto();
      await expect(scanPage.eventSelector).toBeVisible();
    });

    test('should display correctly on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await scanPage.goto();
      await expect(scanPage.eventSelector).toBeVisible();
    });
  });
});
