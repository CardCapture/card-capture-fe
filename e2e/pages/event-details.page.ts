import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object for the Event Details page
 */
export class EventDetailsPage {
  readonly page: Page;

  // Header elements
  readonly breadcrumb: Locator;
  readonly eventTitle: Locator;
  readonly editEventButton: Locator;
  readonly eventDate: Locator;
  readonly processingStatus: Locator;

  // Status badges
  readonly needsReviewBadge: Locator;
  readonly readyToExportBadge: Locator;
  readonly exportedBadge: Locator;
  readonly archivedBadge: Locator;

  // Toolbar
  readonly searchInput: Locator;
  readonly addCardDropdown: Locator;
  readonly captureCardOption: Locator;
  readonly importCardsOption: Locator;
  readonly scanQROption: Locator;
  readonly uploadSignupSheetOption: Locator;
  readonly enterManuallyOption: Locator;

  // Bulk actions
  readonly selectAllCheckbox: Locator;
  readonly selectedCountText: Locator;
  readonly exportButton: Locator;
  readonly archiveButton: Locator;
  readonly moveButton: Locator;
  readonly deleteButton: Locator;
  readonly retryAIButton: Locator;

  // Hide exported toggle
  readonly hideExportedSwitch: Locator;

  // Table elements
  readonly cardTable: Locator;
  readonly cardRows: Locator;
  readonly cardCheckboxes: Locator;

  // Review modal elements
  readonly reviewModal: Locator;
  readonly reviewModalTitle: Locator;
  readonly reviewProgress: Locator;
  readonly reviewFormFields: Locator;
  readonly archiveCardButton: Locator;
  readonly saveChangesButton: Locator;

  // Image panel
  readonly imagePanel: Locator;
  readonly zoomInButton: Locator;
  readonly zoomOutButton: Locator;
  readonly autoFitButton: Locator;
  readonly rotateLeftButton: Locator;
  readonly rotateRightButton: Locator;

  // Confirmation dialogs
  readonly archiveConfirmDialog: Locator;
  readonly deleteConfirmDialog: Locator;
  readonly moveConfirmDialog: Locator;

  // Other modals
  readonly manualEntryModal: Locator;
  readonly signupSheetModal: Locator;
  readonly cameraModal: Locator;
  readonly editEventModal: Locator;

  constructor(page: Page) {
    this.page = page;

    // Header elements
    this.breadcrumb = page.locator('nav[aria-label="Breadcrumb"]');
    this.eventTitle = page.locator('h1');
    this.editEventButton = page.locator('button[aria-label*="Edit"], button:has(svg[class*="pencil"])');
    this.eventDate = page.locator('text=Date:');
    this.processingStatus = page.locator('[class*="ProcessingStatus"]');

    // Status badges
    this.needsReviewBadge = page.locator('button:has-text("Needs Review")');
    this.readyToExportBadge = page.locator('button:has-text("Ready to Export")');
    this.exportedBadge = page.locator('button:has-text("Exported")');
    this.archivedBadge = page.locator('button:has-text("Archived")');

    // Toolbar
    this.searchInput = page.locator('input[type="search"], input[placeholder*="Search cards"]');
    this.addCardDropdown = page.locator('button:has(svg[class*="plus-circle"]), button:has-text("Add")');
    this.captureCardOption = page.locator('[role="menuitem"]:has-text("Capture Card")');
    this.importCardsOption = page.locator('[role="menuitem"]:has-text("Import")');
    this.scanQROption = page.locator('[role="menuitem"]:has-text("QR")');
    this.uploadSignupSheetOption = page.locator('[role="menuitem"]:has-text("Sign-up Sheet")');
    this.enterManuallyOption = page.locator('[role="menuitem"]:has-text("Manually")');

    // Bulk actions
    this.selectAllCheckbox = page.locator('thead input[type="checkbox"]');
    this.selectedCountText = page.locator('text=/\\d+ Card(s)? Selected/');
    this.exportButton = page.locator('button:has-text("Export")');
    this.archiveButton = page.locator('button:has-text("Archive")');
    this.moveButton = page.locator('button:has-text("Move")');
    this.deleteButton = page.locator('button:has-text("Delete")');
    this.retryAIButton = page.locator('button:has-text("Retry AI")');

    // Hide exported toggle
    this.hideExportedSwitch = page.locator('#hide-exported');

    // Table elements
    this.cardTable = page.locator('table');
    this.cardRows = page.locator('tbody tr');
    this.cardCheckboxes = page.locator('tbody input[type="checkbox"]');

    // Review modal elements
    this.reviewModal = page.locator('[role="dialog"]:has-text("Review Card Data")');
    this.reviewModalTitle = page.locator('[role="dialog"] h2:has-text("Review")');
    this.reviewProgress = page.locator('text=/\\d+ \\/ \\d+ fields reviewed/');
    this.reviewFormFields = page.locator('[role="dialog"] input, [role="dialog"] select');
    this.archiveCardButton = page.locator('[role="dialog"] button:has-text("Archive")');
    this.saveChangesButton = page.locator('[role="dialog"] button:has-text("Save")');

    // Image panel
    this.imagePanel = page.locator('[class*="ReviewImagePanel"]');
    this.zoomInButton = page.locator('button:has(svg[class*="zoom-in"])');
    this.zoomOutButton = page.locator('button:has(svg[class*="zoom-out"])');
    this.autoFitButton = page.locator('button[title="Auto-fit"]');
    this.rotateLeftButton = page.locator('button[title="Rotate left"]');
    this.rotateRightButton = page.locator('button[title="Rotate right"]');

    // Confirmation dialogs
    this.archiveConfirmDialog = page.locator('[role="alertdialog"]:has-text("Archive")');
    this.deleteConfirmDialog = page.locator('[role="alertdialog"]:has-text("Delete")');
    this.moveConfirmDialog = page.locator('[role="alertdialog"]:has-text("Move")');

    // Other modals
    this.manualEntryModal = page.locator('[role="dialog"]:has-text("Manual Entry")');
    this.signupSheetModal = page.locator('[role="dialog"]:has-text("Sign-up Sheet")');
    this.cameraModal = page.locator('[role="dialog"]:has(video)');
    this.editEventModal = page.locator('[role="dialog"]:has-text("Edit Event")');
  }

  async goto(eventId: string) {
    await this.page.goto(`/events/${eventId}`);
  }

  async searchCards(query: string) {
    await this.searchInput.fill(query);
  }

  async clickStatusBadge(status: 'needs_review' | 'ready_to_export' | 'exported' | 'archived') {
    switch (status) {
      case 'needs_review':
        await this.needsReviewBadge.click();
        break;
      case 'ready_to_export':
        await this.readyToExportBadge.click();
        break;
      case 'exported':
        await this.exportedBadge.click();
        break;
      case 'archived':
        await this.archivedBadge.click();
        break;
    }
  }

  async openAddCardMenu() {
    await this.addCardDropdown.click();
  }

  async selectCard(index: number) {
    await this.cardCheckboxes.nth(index).check();
  }

  async selectAllCards() {
    await this.selectAllCheckbox.check();
  }

  async clickCardRow(index: number) {
    await this.cardRows.nth(index).click();
  }

  async openReviewModal(cardIndex: number = 0) {
    await this.clickCardRow(cardIndex);
    await expect(this.reviewModal).toBeVisible({ timeout: 5000 });
  }

  async closeReviewModal() {
    await this.page.keyboard.press('Escape');
    await expect(this.reviewModal).not.toBeVisible({ timeout: 5000 });
  }

  async saveReview() {
    await this.saveChangesButton.click();
  }

  async archiveCard() {
    await this.archiveCardButton.click();
  }

  async confirmArchive() {
    await this.archiveConfirmDialog.locator('button:has-text("Archive")').click();
  }

  async confirmDelete() {
    await this.deleteConfirmDialog.locator('button:has-text("Delete")').click();
  }

  async exportSelected() {
    await this.exportButton.click();
  }

  async expectCardsVisible(count?: number) {
    if (count !== undefined) {
      await expect(this.cardRows).toHaveCount(count);
    } else {
      await expect(this.cardRows.first()).toBeVisible();
    }
  }

  async expectNoCards() {
    await expect(this.cardRows).toHaveCount(0);
  }

  async expectReviewModalOpen() {
    await expect(this.reviewModal).toBeVisible();
  }

  async expectReviewModalClosed() {
    await expect(this.reviewModal).not.toBeVisible();
  }
}
