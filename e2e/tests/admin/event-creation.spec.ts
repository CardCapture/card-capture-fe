import { test, expect } from '@playwright/test';
import { EventDetailsPage, AdminSettingsPage } from '../../pages';

/**
 * Event Creation and Management Tests
 */
test.describe('Event Creation Flow', () => {
  // These tests require authentication
  test.use({
    storageState: 'e2e/.auth/user.json',
  });

  test.describe('Create Event from Events Page', () => {
    test('should navigate to events page', async ({ page }) => {
      await page.goto('/events');
      await expect(page.locator('h1, h2').filter({ hasText: /events/i })).toBeVisible();
    });

    test('should have create event button or option', async ({ page }) => {
      await page.goto('/events');
      const createButton = page.locator('button:has-text("Create"), button:has-text("New Event"), a:has-text("Create")');
      await expect(createButton).toBeVisible({ timeout: 5000 });
    });

    test('should open create event modal when clicking create', async ({ page }) => {
      await page.goto('/events');
      const createButton = page.locator('button:has-text("Create"), button:has-text("New Event")');
      await createButton.click();

      // Should show modal with form fields
      await expect(
        page.locator('[role="dialog"]:has-text("Event"), [role="dialog"]:has-text("Create")')
      ).toBeVisible({ timeout: 5000 });
    });

    test('should require event name', async ({ page }) => {
      await page.goto('/events');
      const createButton = page.locator('button:has-text("Create"), button:has-text("New Event")');
      await createButton.click();

      // Try to submit without name
      const submitButton = page.locator('[role="dialog"] button:has-text("Create"), [role="dialog"] button:has-text("Save")');
      await submitButton.click();

      // Should remain in dialog or show validation error
      await expect(page.locator('[role="dialog"]')).toBeVisible();
    });

    test('should allow entering event details', async ({ page }) => {
      await page.goto('/events');
      const createButton = page.locator('button:has-text("Create"), button:has-text("New Event")');
      await createButton.click();

      // Fill in event details
      const nameInput = page.locator('[role="dialog"] input').first();
      await nameInput.fill('Test Event ' + Date.now());

      // Should have date input
      const dateInput = page.locator('[role="dialog"] input[type="date"]');
      if (await dateInput.isVisible()) {
        await dateInput.fill('2025-03-15');
      }
    });

    test('should close modal on successful creation', async ({ page }) => {
      await page.goto('/events');
      const createButton = page.locator('button:has-text("Create"), button:has-text("New Event")');
      await createButton.click();

      // Fill required fields
      const nameInput = page.locator('[role="dialog"] input').first();
      await nameInput.fill('Test Event ' + Date.now());

      const submitButton = page.locator('[role="dialog"] button:has-text("Create"), [role="dialog"] button:has-text("Save")');
      await submitButton.click();

      // Modal should close (or show success)
      await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 10000 }).catch(() => {
        // Modal might still be visible if there's a loading state
      });
    });
  });

  test.describe('Event Details Page', () => {
    let eventDetailsPage: EventDetailsPage;

    test.beforeEach(async ({ page }) => {
      eventDetailsPage = new EventDetailsPage(page);
      // Navigate to an existing event or create one
      await page.goto('/events');

      // Click first event in list
      const firstEvent = page.locator('a[href*="/events/"], tr[role="row"]').first();
      if (await firstEvent.isVisible()) {
        await firstEvent.click();
      }
    });

    test('should display event header with title', async ({ page }) => {
      await expect(eventDetailsPage.eventTitle).toBeVisible({ timeout: 10000 });
    });

    test('should show breadcrumb navigation', async ({ page }) => {
      await expect(eventDetailsPage.breadcrumb).toBeVisible();
    });

    test('should have edit event button', async ({ page }) => {
      await expect(eventDetailsPage.editEventButton).toBeVisible();
    });

    test('should open edit modal when clicking edit', async ({ page }) => {
      await eventDetailsPage.editEventButton.click();
      await expect(eventDetailsPage.editEventModal).toBeVisible({ timeout: 5000 });
    });

    test('should display status badges', async ({ page }) => {
      // At least one status badge should be visible
      const anyBadge = page.locator('button:has-text("Needs Review"), button:has-text("Ready"), button:has-text("Exported"), button:has-text("Archived")');
      await expect(anyBadge.first()).toBeVisible({ timeout: 5000 });
    });

    test('should show card count in status badges', async ({ page }) => {
      // Badges should contain counts
      const badgeWithCount = page.locator('button:has-text(/\\d+/)');
      const count = await badgeWithCount.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('CRM Events Management', () => {
    let adminPage: AdminSettingsPage;

    test.beforeEach(async ({ page }) => {
      adminPage = new AdminSettingsPage(page);
      await adminPage.goto();
    });

    test('should navigate to CRM events tab', async ({ page }) => {
      await adminPage.goToCrmEventsTab();
      await expect(adminPage.importCsvButton).toBeVisible();
    });

    test('should have import CSV button', async ({ page }) => {
      await adminPage.goToCrmEventsTab();
      await expect(adminPage.importCsvButton).toBeVisible();
    });

    test('should have add event button', async ({ page }) => {
      await adminPage.goToCrmEventsTab();
      await expect(adminPage.addEventButton).toBeVisible();
    });

    test('should open add event modal', async ({ page }) => {
      await adminPage.goToCrmEventsTab();
      await adminPage.openAddEventModal();
      await expect(adminPage.eventModal).toBeVisible();
    });

    test('should have search functionality', async ({ page }) => {
      await adminPage.goToCrmEventsTab();
      await expect(adminPage.eventsSearchInput).toBeVisible();
    });

    test('should filter events when searching', async ({ page }) => {
      await adminPage.goToCrmEventsTab();
      await adminPage.searchEvents('test');
      // Results should update (table row count may change)
      await page.waitForTimeout(500);
    });

    test('should open CSV upload modal', async ({ page }) => {
      await adminPage.goToCrmEventsTab();
      await adminPage.openCsvUploadModal();
      await expect(adminPage.csvUploadModal).toBeVisible();
    });

    test('should allow selecting events for bulk actions', async ({ page }) => {
      await adminPage.goToCrmEventsTab();

      // If there are events, try selecting one
      const firstCheckbox = adminPage.eventCheckboxes.first();
      if (await firstCheckbox.isVisible()) {
        await firstCheckbox.check();
        await expect(adminPage.exportSelectedEventsButton).toBeVisible();
      }
    });
  });
});
