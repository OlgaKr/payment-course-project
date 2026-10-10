import { test, expect } from '@playwright/test';
import { createPayment } from '../helpers/payment.helper';

test('Capture with amount null must return validation error', async ({
  request,
}) => {
  test.fail(
    true,
    'BUG-08: amount null is treated as omitted and triggers full capture',
  );

  const payment = await createPayment(request, {
    capture_method: 'manual',
  });

  expect(payment.status).toBe('requires_capture');

  const captureResponse = await request.post(
    `/api/payments/${payment.id}/capture`,
    {
      data: {
        amount: null,
      },
    },
  );

  expect(captureResponse.status()).toBe(400);

  const body = await captureResponse.json();

  expect(body.error.type).toBe('validation_error');
});

test('Refund with amount null must return validation error', async ({
  request,
}) => {
  test.fail(
    true,
    'BUG-08: amount null is treated as omitted and triggers full refund',
  );

  const payment = await createPayment(request);

  const refundResponse = await request.post(
    `/api/payments/${payment.id}/refund`,
    {
      data: {
        amount: null,
      },
    },
  );

  expect(refundResponse.status()).toBe(400);

  const body = await refundResponse.json();

  expect(body.error.type).toBe('validation_error');
});
