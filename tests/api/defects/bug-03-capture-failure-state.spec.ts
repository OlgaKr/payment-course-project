import { test, expect } from '@playwright/test';
import { createPayment } from '../helpers/payment.helper';

test('Failed Stripe capture must not mark payment as succeeded', async ({
  request,
}) => {
  test.fail(
    true,
    'BUG-03: Stripe capture failure is treated locally as a successful capture',
  );

  const payment = await createPayment(request, {
    capture_method: 'manual',
  });

  expect(payment.status).toBe('requires_capture');

  const captureResponse = await request.post(
    `/api/payments/${payment.id}/capture`,
    {
      data: {
        amount: 6000,
      },
    },
  );

  expect(captureResponse.status()).toBe(400);

  const paymentResponse = await request.get(`/api/payments/${payment.id}`);

  expect(paymentResponse.status()).toBe(200);

  const paymentAfterFailedCapture = await paymentResponse.json();

  expect(paymentAfterFailedCapture.status).toBe('requires_capture');
  expect(paymentAfterFailedCapture.captured_amount).toBeUndefined();
});
