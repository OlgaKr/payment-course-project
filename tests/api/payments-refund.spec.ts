import { test, expect } from '@playwright/test';
import { createPayment } from './helpers/payment.helper';
import { expectSuccessfulRefund } from './helpers/payment-assertions.helper';
import { NON_EXISTENT_PAYMENT_ID } from './helpers/test-data';

test('Full refund succeeded payment', async ({ request }) => {
  const payment = await createPayment(request);

  expect(payment.status).toBe('succeeded');

  const refundResponse = await request.post(
    `/api/payments/${payment.id}/refund`,
    {
      data: {
        amount: 5000,
        reason: 'Automated full refund test',
      },
    },
  );

  expect(refundResponse.status()).toBe(200);

  const refund = await refundResponse.json();

  expectSuccessfulRefund(refund, payment.id, 5000);
});

test('Reject refund before capture', async ({ request }) => {
  const payment = await createPayment(request, {
    capture_method: 'manual',
  });

  expect(payment.status).toBe('requires_capture');

  const refundResponse = await request.post(
    `/api/payments/${payment.id}/refund`,
    {
      data: {
        amount: 1000,
      },
    },
  );

  expect(refundResponse.status()).toBe(400);

  const body = await refundResponse.json();

  expect(body.error.type).toBe('invalid_state');
});

test('Refund full amount when amount is omitted', async ({ request }) => {
  const payment = await createPayment(request);

  const refundResponse = await request.post(
    `/api/payments/${payment.id}/refund`,
  );

  expect(refundResponse.status()).toBe(200);

  const refund = await refundResponse.json();

  expectSuccessfulRefund(refund, payment.id, 5000);
});

test('Store refund reason', async ({ request }) => {
  const payment = await createPayment(request);

  const refundResponse = await request.post(
    `/api/payments/${payment.id}/refund`,
    {
      data: {
        amount: 1000,
        reason: 'Customer requested',
      },
    },
  );

  expect(refundResponse.status()).toBe(200);

  const refund = await refundResponse.json();

  expectSuccessfulRefund(refund, payment.id, 1000);
  expect(refund.reason).toBe('Customer requested');
});

test('Reject refund with zero amount', async ({ request }) => {
  const payment = await createPayment(request);

  const refundResponse = await request.post(
    `/api/payments/${payment.id}/refund`,
    {
      data: {
        amount: 0,
      },
    },
  );

  expect(refundResponse.status()).toBe(400);

  const body = await refundResponse.json();

  expect(body.error.type).toBe('validation_error');
});

test('Reject second full refund', async ({ request }) => {
  const payment = await createPayment(request);

  const firstRefundResponse = await request.post(
    `/api/payments/${payment.id}/refund`,
  );

  expect(firstRefundResponse.status()).toBe(200);

  const secondRefundResponse = await request.post(
    `/api/payments/${payment.id}/refund`,
  );

  expect(secondRefundResponse.status()).toBe(400);

  const body = await secondRefundResponse.json();

  expect(body.error.type).toBe('invalid_state');
});

test('Reject refund with invalid payment id format', async ({ request }) => {
  const response = await request.post('/api/payments/not-a-uuid/refund', {
    data: {
      amount: 1000,
    },
  });

  expect(response.status()).toBe(400);

  const body = await response.json();

  expect(body.error.type).toBe('validation_error');
});

test('Return not found for refund of nonexistent payment', async ({
  request,
}) => {
  const response = await request.post(
    `/api/payments/${NON_EXISTENT_PAYMENT_ID}/refund`,
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
