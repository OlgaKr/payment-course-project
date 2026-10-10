import { expect } from '@playwright/test';

export function expectCapturedPayment(payment: any, amount: number) {
  expect(payment.status).toBe('succeeded');
  expect(payment.captured_amount).toBe(amount);
  expect(payment.amount).toBe(amount);
}

export function expectSuccessfulRefund(
  refund: any,
  paymentId: string,
  amount: number,
) {
  expect(refund.payment_id).toBe(paymentId);
  expect(refund.amount).toBe(amount);
  expect(refund.status).toBe('succeeded');
  expect(refund.stripe_refund_id).toMatch(/^re_/);
}
