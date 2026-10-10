import { test, expect } from '@playwright/test';
import { createPayment } from './helpers/payment.helper';

test('Get existing payment by id', async ({ request }) => {
  const createdPayment = await createPayment(request);

  const getResponse = await request.get(`/api/payments/${createdPayment.id}`);

  expect(getResponse.status()).toBe(200);

  const payment = await getResponse.json();

  expect(payment.id).toBe(createdPayment.id);
  expect(payment.stripe_pi_id).toBe(createdPayment.stripe_pi_id);
  expect(payment.amount).toBe(5000);
  expect(payment.status).toBe('succeeded');
});

test('Reject invalid payment id format', async ({ request }) => {
  const response = await request.get('/api/payments/not-a-uuid');

  expect(response.status()).toBe(400);

  const body = await response.json();

  expect(body.error.type).toBe('validation_error');
});

test('Return 404 for nonexistent payment id', async ({ request }) => {
  const response = await request.get(
    '/api/payments/00000000-0000-0000-0000-000000000000',
  );

  expect(response.status()).toBe(404);

  const body = await response.json();

  expect(body.error.type).toBe('not_found');
});
