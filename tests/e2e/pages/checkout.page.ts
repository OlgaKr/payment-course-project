import { Page, Locator, FrameLocator } from '@playwright/test';

export class CheckoutPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly amountInput: Locator;
  readonly payButton: Locator;
  readonly stripeFrame: FrameLocator;
  readonly cardNumberInput: Locator;
  readonly expiryInput: Locator;
  readonly cvcInput: Locator;
  readonly errorMessage: Locator;
  readonly confirmation: Locator;

  constructor(page: Page) {
    this.page = page;

    this.emailInput = page.getByTestId('email');
    this.amountInput = page.getByTestId('amount');
    this.payButton = page.getByTestId('pay-button');

    this.stripeFrame = page.frameLocator('iframe').first();

    this.cardNumberInput = this.stripeFrame.getByRole('textbox', {
      name: 'Credit or debit card number',
    });

    this.expiryInput = this.stripeFrame.getByRole('textbox', {
      name: 'Credit or debit card expiration date',
    });

    this.cvcInput = this.stripeFrame.getByRole('textbox', {
      name: 'Credit or debit card CVC/CVV',
    });

    this.errorMessage = page.getByTestId('error-message');
    this.confirmation = page.getByTestId('confirmation');
  }

  async goto() {
    await this.page.goto('/checkout');
  }

  async fillCustomer(email: string, amount: string) {
    await this.emailInput.fill(email);
    await this.amountInput.fill(amount);
  }

  async fillCard(cardNumber: string, expiry: string, cvc: string) {
    await this.cardNumberInput.fill(cardNumber);
    await this.expiryInput.fill(expiry);
    await this.cvcInput.fill(cvc);
  }

  async submitPayment() {
    await this.payButton.click();
  }

  async openPayments() {
    await this.page.getByRole('link', { name: 'Payments' }).click();
  }
}
