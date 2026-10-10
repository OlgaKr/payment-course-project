import { test, expect } from '@playwright/test';
import { CheckoutPage } from './pages/checkout.page';
import { PaymentsPage } from './pages/payments.page';

test('Complete successful payment through checkout UI', async ({ page }) => {
  const checkoutPage = new CheckoutPage(page);
  const paymentsPage = new PaymentsPage(page);

  const email = `test-${Date.now()}@test.com`;

  await checkoutPage.goto();

  await checkoutPage.fillCustomer(email, '45.00');

  await checkoutPage.fillCard('4242 4242 4242 4242', '12 / 34', '123');

  await checkoutPage.submitPayment();

  await expect(checkoutPage.confirmation).toBeVisible();

  await checkoutPage.openPayments();

  const paymentRow = paymentsPage.paymentRowByEmail(email);

  await expect(paymentRow).toContainText('$45.00');
});

test('Show error for declined card payment', async ({ page }) => {
  const checkoutPage = new CheckoutPage(page);

  await checkoutPage.goto();

  await checkoutPage.fillCustomer('declined@test.com', '45.00');

  await checkoutPage.fillCard('4000 0000 0000 0002', '12 / 34', '123');

  await checkoutPage.submitPayment();

  await expect(checkoutPage.errorMessage).toBeVisible();
});
