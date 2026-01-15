import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object for the Purchase Events page (payment/checkout flow)
 */
export class PurchaseEventsPage {
  readonly page: Page;

  // Header
  readonly pageTitle: Locator;
  readonly pageSubtitle: Locator;

  // Search
  readonly searchInput: Locator;

  // Event sections
  readonly todaysEventsSection: Locator;
  readonly upcomingEventsSection: Locator;

  // Event cards
  readonly eventCards: Locator;
  readonly selectedEventCards: Locator;
  readonly eventPrice: Locator;

  // Pagination
  readonly previousButton: Locator;
  readonly nextButton: Locator;
  readonly pageIndicator: Locator;

  // Shopping cart panel
  readonly cartPanel: Locator;
  readonly cartPanelTitle: Locator;
  readonly closeCartButton: Locator;
  readonly selectedEventsList: Locator;
  readonly removeEventButtons: Locator;
  readonly totalPrice: Locator;
  readonly continueToPaymentButton: Locator;

  // Floating cart button
  readonly floatingCartButton: Locator;
  readonly cartBadge: Locator;

  // Alerts
  readonly cancelledPaymentAlert: Locator;
  readonly errorAlert: Locator;

  constructor(page: Page) {
    this.page = page;

    // Header
    this.pageTitle = page.locator('h1:has-text("Purchase Events")');
    this.pageSubtitle = page.locator('text=$25 per event');

    // Search
    this.searchInput = page.locator('input[placeholder*="Search events"]');

    // Event sections
    this.todaysEventsSection = page.locator('text=Today\'s Events');
    this.upcomingEventsSection = page.locator('text=Upcoming Events');

    // Event cards
    this.eventCards = page.locator('[role="button"][class*="card"], .cursor-pointer:has(h3)');
    this.selectedEventCards = page.locator('[class*="ring-primary"], [class*="border-primary"]');
    this.eventPrice = page.locator('text=$25');

    // Pagination
    this.previousButton = page.locator('button:has-text("Previous")');
    this.nextButton = page.locator('button:has-text("Next")');
    this.pageIndicator = page.locator('text=/Page \\d+ of \\d+/');

    // Shopping cart panel
    this.cartPanel = page.locator('[class*="fixed right-0"], [class*="Sheet"]');
    this.cartPanelTitle = page.locator('text=/Selected Event\\(s\\)/');
    this.closeCartButton = page.locator('[class*="Sheet"] button[aria-label*="close"], [class*="Sheet"] button:has(svg[class*="x"])');
    this.selectedEventsList = page.locator('[class*="Sheet"] .space-y-3 > div');
    this.removeEventButtons = page.locator('[class*="Sheet"] button:has(svg[class*="x"])');
    this.totalPrice = page.locator('text=/\\$\\d+/').last();
    this.continueToPaymentButton = page.locator('button:has-text("Continue to Payment")');

    // Floating cart button
    this.floatingCartButton = page.locator('button.fixed.bottom-6');
    this.cartBadge = page.locator('.fixed.bottom-6 [class*="badge"], .fixed.bottom-6 .absolute');

    // Alerts
    this.cancelledPaymentAlert = page.locator('[class*="amber"], [role="alert"]:has-text("cancel")');
    this.errorAlert = page.locator('[class*="destructive"], [role="alert"]:has-text("error")');
  }

  async goto() {
    await this.page.goto('/purchase-events');
  }

  async searchEvents(query: string) {
    await this.searchInput.fill(query);
    // Wait for search debounce
    await this.page.waitForTimeout(400);
  }

  async selectEvent(eventName: string) {
    const eventCard = this.page.locator(`[role="button"]:has-text("${eventName}"), .cursor-pointer:has-text("${eventName}")`);
    await eventCard.click();
  }

  async selectEventByIndex(index: number) {
    await this.eventCards.nth(index).click();
  }

  async deselectEvent(eventName: string) {
    // Click the same event to deselect
    await this.selectEvent(eventName);
  }

  async removeEventFromCart(eventName: string) {
    const eventItem = this.page.locator(`[class*="Sheet"] div:has-text("${eventName}")`);
    await eventItem.locator('button:has(svg[class*="x"])').click();
  }

  async openCart() {
    if (await this.floatingCartButton.isVisible()) {
      await this.floatingCartButton.click();
    }
    await expect(this.cartPanel).toBeVisible();
  }

  async closeCart() {
    await this.closeCartButton.click();
    await expect(this.cartPanel).not.toBeVisible();
  }

  async proceedToPayment() {
    await this.continueToPaymentButton.click();
  }

  async goToNextPage() {
    await this.nextButton.click();
  }

  async goToPreviousPage() {
    await this.previousButton.click();
  }

  // Expectations
  async expectEventsVisible() {
    await expect(this.eventCards.first()).toBeVisible({ timeout: 10000 });
  }

  async expectCartOpen() {
    await expect(this.cartPanel).toBeVisible();
  }

  async expectCartClosed() {
    await expect(this.cartPanel).not.toBeVisible();
  }

  async expectSelectedCount(count: number) {
    if (count > 0) {
      await expect(this.cartPanelTitle).toContainText(`(${count})`);
    }
  }

  async expectTotalPrice(amount: number) {
    await expect(this.totalPrice).toContainText(`$${amount}`);
  }

  async expectPaymentButtonEnabled() {
    await expect(this.continueToPaymentButton).toBeEnabled();
  }

  async expectPaymentButtonDisabled() {
    await expect(this.continueToPaymentButton).toBeDisabled();
  }

  async expectCancelledAlert() {
    await expect(this.cancelledPaymentAlert).toBeVisible();
  }
}
