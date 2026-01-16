import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object for the Admin Settings page
 */
export class AdminSettingsPage {
  readonly page: Page;

  // Navigation tabs
  readonly generalTab: Locator;
  readonly usersTab: Locator;
  readonly crmEventsTab: Locator;
  readonly subscriptionTab: Locator;

  // User Management Section
  readonly inviteUserButton: Locator;
  readonly userSearchInput: Locator;
  readonly userTable: Locator;
  readonly userRows: Locator;
  readonly userCheckboxes: Locator;
  readonly deleteSelectedUsersButton: Locator;
  readonly clearSelectionButton: Locator;
  readonly activeUsersCount: Locator;
  readonly pendingInvitesCount: Locator;

  // Invite User Modal
  readonly inviteModal: Locator;
  readonly inviteEmailInput: Locator;
  readonly inviteFirstNameInput: Locator;
  readonly inviteLastNameInput: Locator;
  readonly inviteRoleSelect: Locator;
  readonly inviteSubmitButton: Locator;

  // CRM Events Section
  readonly importCsvButton: Locator;
  readonly addEventButton: Locator;
  readonly eventsSearchInput: Locator;
  readonly eventsTable: Locator;
  readonly eventRows: Locator;
  readonly eventCheckboxes: Locator;
  readonly exportSelectedEventsButton: Locator;
  readonly deleteSelectedEventsButton: Locator;

  // CSV Upload Modal
  readonly csvUploadModal: Locator;
  readonly csvDropzone: Locator;
  readonly csvFileInput: Locator;
  readonly csvMappingStep: Locator;
  readonly csvPreviewStep: Locator;
  readonly csvImportButton: Locator;
  readonly csvContinueButton: Locator;
  readonly csvBackButton: Locator;

  // Add/Edit Event Modal
  readonly eventModal: Locator;
  readonly eventNameInput: Locator;
  readonly eventDateInput: Locator;
  readonly eventIdInput: Locator;
  readonly eventSaveButton: Locator;

  // Subscription Section
  readonly manageSubscriptionButton: Locator;
  readonly planName: Locator;

  // Delete Confirmation Dialogs
  readonly deleteUserDialog: Locator;
  readonly deleteEventDialog: Locator;
  readonly bulkDeleteDialog: Locator;

  constructor(page: Page) {
    this.page = page;

    // Navigation tabs
    this.generalTab = page.locator('[role="tab"]:has-text("General")');
    this.usersTab = page.locator('[role="tab"]:has-text("Users")');
    this.crmEventsTab = page.locator('[role="tab"]:has-text("CRM Events"), [role="tab"]:has-text("Events")');
    this.subscriptionTab = page.locator('[role="tab"]:has-text("Subscription")');

    // User Management Section
    this.inviteUserButton = page.locator('button:has-text("Invite User")');
    this.userSearchInput = page.locator('input[placeholder*="Search users"]');
    this.userTable = page.locator('table').first();
    this.userRows = page.locator('tbody tr');
    this.userCheckboxes = page.locator('tbody input[type="checkbox"]');
    this.deleteSelectedUsersButton = page.locator('button:has-text("Delete Selected")');
    this.clearSelectionButton = page.locator('button:has-text("Clear"), button[aria-label*="Clear"]');
    this.activeUsersCount = page.locator('text=/Active.*\\d+/');
    this.pendingInvitesCount = page.locator('text=/Pending.*\\d+/');

    // Invite User Modal
    this.inviteModal = page.locator('[role="dialog"]:has-text("Invite")');
    this.inviteEmailInput = page.locator('[role="dialog"] input[type="email"]');
    this.inviteFirstNameInput = page.locator('[role="dialog"] #firstName, [role="dialog"] input[placeholder*="First"]');
    this.inviteLastNameInput = page.locator('[role="dialog"] #lastName, [role="dialog"] input[placeholder*="Last"]');
    this.inviteRoleSelect = page.locator('[role="dialog"] [role="combobox"]');
    this.inviteSubmitButton = page.locator('[role="dialog"] button:has-text("Invite"), [role="dialog"] button:has-text("Send")');

    // CRM Events Section
    this.importCsvButton = page.locator('button:has-text("Import CSV")');
    this.addEventButton = page.locator('button:has-text("Add Event")');
    this.eventsSearchInput = page.locator('input[placeholder*="Search events"]');
    this.eventsTable = page.locator('table');
    this.eventRows = page.locator('tbody tr');
    this.eventCheckboxes = page.locator('tbody input[type="checkbox"]');
    this.exportSelectedEventsButton = page.locator('button:has-text("Export Selected")');
    this.deleteSelectedEventsButton = page.locator('button:has-text("Delete Selected")');

    // CSV Upload Modal
    this.csvUploadModal = page.locator('[role="dialog"]:has-text("Import Events")');
    this.csvDropzone = page.locator('[role="dialog"] [class*="dropzone"], [role="dialog"] .border-dashed');
    this.csvFileInput = page.locator('#csv-file-input, input[accept*=".csv"]');
    this.csvMappingStep = page.locator('[role="dialog"]:has-text("Map your CSV")');
    this.csvPreviewStep = page.locator('[role="dialog"]:has-text("Review the first")');
    this.csvImportButton = page.locator('[role="dialog"] button:has-text("Import")');
    this.csvContinueButton = page.locator('[role="dialog"] button:has-text("Continue")');
    this.csvBackButton = page.locator('[role="dialog"] button:has-text("Back")');

    // Add/Edit Event Modal
    this.eventModal = page.locator('[role="dialog"]:has-text("Event")');
    this.eventNameInput = page.locator('[role="dialog"] #name, [role="dialog"] input[placeholder*="Fall College Fair"]');
    this.eventDateInput = page.locator('[role="dialog"] #date, [role="dialog"] input[type="date"]');
    this.eventIdInput = page.locator('[role="dialog"] #crm_id, [role="dialog"] input[placeholder*="550e8400"]');
    this.eventSaveButton = page.locator('[role="dialog"] button:has-text("Save"), [role="dialog"] button:has-text("Add")');

    // Subscription Section
    this.manageSubscriptionButton = page.locator('button:has-text("Manage Subscription")');
    this.planName = page.locator('text=/Pro|Basic|Enterprise|Free/i');

    // Delete Confirmation Dialogs
    this.deleteUserDialog = page.locator('[role="alertdialog"]:has-text("Delete User")');
    this.deleteEventDialog = page.locator('[role="alertdialog"]:has-text("Delete")');
    this.bulkDeleteDialog = page.locator('[role="alertdialog"]:has-text("Delete")');
  }

  async goto() {
    await this.page.goto('/admin/settings');
  }

  async goToUsersTab() {
    await this.usersTab.click();
    await expect(this.inviteUserButton).toBeVisible({ timeout: 5000 });
  }

  async goToCrmEventsTab() {
    await this.crmEventsTab.click();
    await expect(this.importCsvButton).toBeVisible({ timeout: 5000 });
  }

  async goToSubscriptionTab() {
    await this.subscriptionTab.click();
    await expect(this.manageSubscriptionButton).toBeVisible({ timeout: 5000 });
  }

  // User Management methods
  async searchUsers(query: string) {
    await this.userSearchInput.fill(query);
  }

  async openInviteUserModal() {
    await this.inviteUserButton.click();
    await expect(this.inviteModal).toBeVisible();
  }

  async inviteUser(email: string, firstName: string, lastName: string) {
    await this.openInviteUserModal();
    await this.inviteEmailInput.fill(email);
    await this.inviteFirstNameInput.fill(firstName);
    await this.inviteLastNameInput.fill(lastName);
    await this.inviteSubmitButton.click();
  }

  async selectUser(index: number) {
    await this.userCheckboxes.nth(index).check();
  }

  async deleteSelectedUsers() {
    await this.deleteSelectedUsersButton.click();
    await this.bulkDeleteDialog.locator('button:has-text("Delete")').click();
  }

  // CRM Events methods
  async searchEvents(query: string) {
    await this.eventsSearchInput.fill(query);
  }

  async openAddEventModal() {
    await this.addEventButton.click();
    await expect(this.eventModal).toBeVisible();
  }

  async addEvent(name: string, date: string, eventId: string) {
    await this.openAddEventModal();
    await this.eventNameInput.fill(name);
    await this.eventDateInput.fill(date);
    await this.eventIdInput.fill(eventId);
    await this.eventSaveButton.click();
  }

  async openCsvUploadModal() {
    await this.importCsvButton.click();
    await expect(this.csvUploadModal).toBeVisible();
  }

  async uploadCsvFile(filePath: string) {
    await this.csvFileInput.setInputFiles(filePath);
  }

  async selectEvent(index: number) {
    await this.eventCheckboxes.nth(index).check();
  }

  async exportSelectedEvents() {
    await this.exportSelectedEventsButton.click();
  }

  async deleteSelectedEvents() {
    await this.deleteSelectedEventsButton.click();
    await this.bulkDeleteDialog.locator('button:has-text("Delete")').click();
  }

  // Expectations
  async expectUsersVisible(count?: number) {
    if (count !== undefined) {
      await expect(this.userRows).toHaveCount(count);
    } else {
      await expect(this.userRows.first()).toBeVisible();
    }
  }

  async expectEventsVisible(count?: number) {
    if (count !== undefined) {
      await expect(this.eventRows).toHaveCount(count);
    } else {
      await expect(this.eventRows.first()).toBeVisible();
    }
  }
}
