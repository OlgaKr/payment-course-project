import { test, expect } from '@playwright/test';
import { createPayment } from '../helpers/payment.helper';

test('Overcapture must be rejected by local validation before calling Stripe', async ({
  request,
}) => {
  test.fail(
    true,
    'BUG-02: capture amount greater than authorized amount is sent to Stripe instead of being rejected locally',
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

  const body = await captureResponse.json();

  expect(body.error.type).toBe('validation_error');
});
