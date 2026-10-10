import { test, expect } from '@playwright/test';
import { paymentSchema } from './schemas/payment.schema';
import { paymentListSchema } from './schemas/payment-list.schema';
import { refundSchema } from './schemas/refund.schema';
import { errorSchema } from './schemas/error.schema';
import { capturedPaymentSchema } from './schemas/captured-payment.schema';
import { expectSchema } from './helpers/schema.helper';
import { createPayment } from '../api/helpers/payment.helper';

test('POST /api/payments response matches Payment schema', async ({
  request,
}) => {
  const response = await request.post('/api/payments', {
    data: {
      amount: 5000,
      payment_method: 'pm_card_visa',
      capture_method: 'automatic',
      customer_email: 'olga@example.com',
      description: 'Contract test payment',
    },
  });

  expect(response.status()).toBe(201);

  const body = await response.json();

  expectSchema(body, paymentSchema);
});

test('GET /api/payments/{id} response matches Payment schema', async ({
  request,
}) => {
  const createdPayment = await createPayment(request);

  const response = await request.get(`/api/payments/${createdPayment.id}`);

  expect(response.status()).toBe(200);

  const body = await response.json();

  expectSchema(body, paymentSchema);
});

test('GET /api/payments response matches Payment List schema', async ({
  request,
}) => {
  const response = await request.get('/api/payments?limit=20');

  expect(response.status()).toBe(200);

  const body = await response.json();

  expectSchema(body, paymentListSchema);
});

test('POST /api/payments/{id}/refund response matches Refund schema', async ({
  request,
}) => {
  const payment = await createPayment(request);

  const response = await request.post(`/api/payments/${payment.id}/refund`, {
    data: {
      amount: 1000,
      reason: 'Contract test refund',
    },
  });

  expect(response.status()).toBe(200);

  const body = await response.json();

  expectSchema(body, refundSchema);
});

test('Validation error response matches Error schema', async ({ request }) => {
  const response = await request.post('/api/payments', {
    data: {
      amount: 0,
      payment_method: 'pm_card_visa',
    },
  });

  expect(response.status()).toBe(400);

  const body = await response.json();

  expectSchema(body, errorSchema);

  expect(body.error.type).toBe('validation_error');
});

test('Card decline error response matches Error schema', async ({
  request,
}) => {
  const response = await request.post('/api/payments', {
    data: {
      amount: 5000,
      payment_method: 'pm_card_chargeDeclinedInsufficientFunds',
    },
  });

  expect(response.status()).toBe(402);

  const body = await response.json();

  expectSchema(body, errorSchema);

  expect(body.error.type).toBe('card_error');
  expect(body.error.code).toBe('card_declined');
  expect(body.error.decline_code).toBe('insufficient_funds');
});

test('POST /api/payments/{id}/capture response matches Captured Payment schema', async ({
  request,
}) => {
  const payment = await createPayment(request, {
    capture_method: 'manual',
  });

  const response = await request.post(`/api/payments/${payment.id}/capture`, {
    data: {
      amount: 5000,
    },
  });

  expect(response.status()).toBe(200);

  const body = await response.json();

  expectSchema(body, capturedPaymentSchema);
});
