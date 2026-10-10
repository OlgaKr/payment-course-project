import { Page, Locator } from '@playwright/test';

export class PaymentsPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  paymentRowByEmail(email: string): Locator {
    return this.page.getByRole('row').filter({
      hasText: email,
    });
  }
}
