import { test, expect } from '@playwright/test';
import { createPayment } from '../helpers/payment.helper';

test('Partial refund must keep payment eligible for remaining refund', async ({
  request,
}) => {
  test.fail(
    true,
    'BUG-04: partial refund immediately marks the payment as fully refunded',
  );

  const payment = await createPayment(request);

  const firstRefundResponse = await request.post(
    `/api/payments/${payment.id}/refund`,
    {
      data: {
        amount: 1000,
        reason: 'Partial refund defect test',
      },
    },
  );

  expect(firstRefundResponse.status()).toBe(200);

  const paymentAfterPartialRefundResponse = await request.get(
    `/api/payments/${payment.id}`,
  );

  expect(paymentAfterPartialRefundResponse.status()).toBe(200);

  const paymentAfterPartialRefund =
    await paymentAfterPartialRefundResponse.json();

  expect(paymentAfterPartialRefund.status).toBe('succeeded');

  const secondRefundResponse = await request.post(
    `/api/payments/${payment.id}/refund`,
    {
      data: {
        amount: 4000,
        reason: 'Refund remaining balance',
      },
    },
  );

  expect(secondRefundResponse.status()).toBe(200);
});
