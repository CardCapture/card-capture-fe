import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object for the Card Scanning page
 */
export class ScanPage {
  readonly page: Page;

  // Page elements
  readonly pageTitle: Locator;
  readonly syncStatusBadge: Locator;
  readonly offlineBanner: Locator;

  // Event selection
  readonly eventSelector: Locator;
  readonly createEventOption: Locator;

  // Scan status
  readonly scanStatusCard: Locator;

  // Camera controls
  readonly openCameraButton: Locator;
  readonly fileInput: Locator;

  // Camera view elements
  readonly cameraContainer: Locator;
  readonly cameraBackButton: Locator;
  readonly qrReadyBadge: Locator;
  readonly cameraEventSelector: Locator;

  // Image preview elements
  readonly capturedImage: Locator;
  readonly retakeButton: Locator;
  readonly processingProgress: Locator;

  // Modal
  readonly createEventModal: Locator;

  constructor(page: Page) {
    this.page = page;

    // Page elements
    this.pageTitle = page.locator('h1:has-text("Scan Card"), h2:has-text("Scan Card")');
    this.syncStatusBadge = page.locator('[class*="SyncStatusBadge"]');
    this.offlineBanner = page.locator('[class*="OfflineBanner"]');

    // Event selection
    this.eventSelector = page.locator('[role="combobox"]').first();
    this.createEventOption = page.locator('[value="create-new"], [role="option"]:has-text("Create")');

    // Scan status
    this.scanStatusCard = page.locator('[class*="ScanStatusCard"]');

    // Camera controls
    this.openCameraButton = page.locator('button:has-text("Open Camera")');
    this.fileInput = page.locator('input[type="file"]');

    // Camera view elements
    this.cameraContainer = page.locator('.fixed.inset-0, [class*="camera-container"]');
    this.cameraBackButton = page.locator('[aria-label="Back"], button:has(svg[class*="arrow-left"])');
    this.qrReadyBadge = page.locator('text=QR Ready, .text-green-400');
    this.cameraEventSelector = page.locator('.fixed [role="combobox"]');

    // Image preview elements
    this.capturedImage = page.locator('img[src*="captured"], img[alt*="captured"]');
    this.retakeButton = page.locator('button:has-text("Retake")');
    this.processingProgress = page.locator('[role="progressbar"]');

    // Modal
    this.createEventModal = page.locator('[role="dialog"]:has-text("Create Event")');
  }

  async goto() {
    await this.page.goto('/scan');
  }

  async selectEvent(eventName: string) {
    await this.eventSelector.click();
    await this.page.locator(`[role="option"]:has-text("${eventName}")`).click();
  }

  async openCamera() {
    await expect(this.openCameraButton).toBeEnabled();
    await this.openCameraButton.click();
    await expect(this.cameraContainer).toBeVisible({ timeout: 5000 });
  }

  async closeCamera() {
    await this.cameraBackButton.click();
    await expect(this.cameraContainer).not.toBeVisible({ timeout: 5000 });
  }

  async uploadFile(filePath: string) {
    await this.fileInput.setInputFiles(filePath);
  }

  async retakePhoto() {
    await this.retakeButton.click();
  }

  async expectEventSelected() {
    await expect(this.openCameraButton).toBeEnabled();
  }

  async expectNoEventSelected() {
    await expect(this.openCameraButton).toBeDisabled();
  }

  async expectCameraOpen() {
    await expect(this.cameraContainer).toBeVisible();
  }

  async expectCameraClosed() {
    await expect(this.cameraContainer).not.toBeVisible();
  }

  async expectProcessing() {
    await expect(this.processingProgress).toBeVisible({ timeout: 5000 });
  }

  async expectCreateEventModal() {
    await expect(this.createEventModal).toBeVisible();
  }
}
