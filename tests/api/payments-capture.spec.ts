import { test, expect } from '@playwright/test';
import { createPayment } from './helpers/payment.helper';
import { expectCapturedPayment } from './helpers/payment-assertions.helper';
import { NON_EXISTENT_PAYMENT_ID } from './helpers/test-data';

test('Capture manual payment successfully', async ({ request }) => {
  const payment = await createPayment(request, {
    capture_method: 'manual',
  });

  expect(payment.status).toBe('requires_capture');

  const captureResponse = await request.post(
    `/api/payments/${payment.id}/capture`,
    {
      data: {
        amount: 5000,
      },
    },
  );

  expect(captureResponse.status()).toBe(200);

  const capturedPayment = await captureResponse.json();

  expectCapturedPayment(capturedPayment, 5000);
});

test('Reject capture of already captured payment', async ({ request }) => {
  const payment = await createPayment(request, {
    capture_method: 'manual',
  });

  const firstCaptureResponse = await request.post(
    `/api/payments/${payment.id}/capture`,
    {
      data: {
        amount: 5000,
      },
    },
  );

  expect(firstCaptureResponse.status()).toBe(200);

  const secondCaptureResponse = await request.post(
    `/api/payments/${payment.id}/capture`,
    {
      data: {
        amount: 5000,
      },
    },
  );

  expect(secondCaptureResponse.status()).toBe(400);

  const body = await secondCaptureResponse.json();

  expect(body.error.type).toBe('invalid_state');
});

test('Capture full authorized amount when amount is omitted', async ({
  request,
}) => {
  const payment = await createPayment(request, {
    capture_method: 'manual',
  });

  expect(payment.status).toBe('requires_capture');

  const captureResponse = await request.post(
    `/api/payments/${payment.id}/capture`,
  );

  expect(captureResponse.status()).toBe(200);

  const capturedPayment = await captureResponse.json();

  expectCapturedPayment(capturedPayment, 5000);
});

test('Capture partial authorized amount', async ({ request }) => {
  const payment = await createPayment(request, {
    capture_method: 'manual',
  });

  const captureResponse = await request.post(
    `/api/payments/${payment.id}/capture`,
    {
      data: {
        amount: 3000,
      },
    },
  );

  expect(captureResponse.status()).toBe(200);

  const capturedPayment = await captureResponse.json();

  expectCapturedPayment(capturedPayment, 3000);
});

test('Reject capture with zero amount', async ({ request }) => {
  const payment = await createPayment(request, {
    capture_method: 'manual',
  });

  const captureResponse = await request.post(
    `/api/payments/${payment.id}/capture`,
    {
      data: {
        amount: 0,
      },
    },
  );

  expect(captureResponse.status()).toBe(400);

  const body = await captureResponse.json();

  expect(body.error.type).toBe('validation_error');
});

test('Reject capture for automatic succeeded payment', async ({ request }) => {
  const payment = await createPayment(request);

  expect(payment.status).toBe('succeeded');

  const captureResponse = await request.post(
    `/api/payments/${payment.id}/capture`,
    {
      data: {
        amount: 5000,
      },
    },
  );

  expect(captureResponse.status()).toBe(400);

  const body = await captureResponse.json();

  expect(body.error.type).toBe('invalid_state');
});

test('Reject capture with invalid payment id format', async ({ request }) => {
  const response = await request.post('/api/payments/not-a-uuid/capture', {
    data: {
      amount: 1000,
    },
  });

  expect(response.status()).toBe(400);

  const body = await response.json();

  expect(body.error.type).toBe('validation_error');
});

test('Return not found for capture of nonexistent payment', async ({
  request,
}) => {
  const response = await request.post(
    `/api/payments/${NON_EXISTENT_PAYMENT_ID}/capture`,
    {
      data: {
        amount: 1000,
      },
    },
  );

  expect(response.status()).toBe(404);

  const body = await response.json();

  expect(body.error.type).toBe('not_found');
});
