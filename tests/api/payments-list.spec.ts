import { test, expect } from '@playwright/test';
import { createPayment } from './helpers/payment.helper';

test('Limit values above 100 are capped at 100', async ({ request }) => {
  const response = await request.get('/api/payments?limit=101');

  expect(response.status()).toBe(200);

  const body = await response.json();

  expect(body.limit).toBe(100);
  expect(Array.isArray(body.payments)).toBe(true);
});

test('Page values below 1 are normalized to 1', async ({ request }) => {
  const response = await request.get('/api/payments?page=0');

  expect(response.status()).toBe(200);

  const body = await response.json();

  expect(body.page).toBe(1);
  expect(Array.isArray(body.payments)).toBe(true);
});

test('Filter payments by succeeded status', async ({ request }) => {
  const createdPayment = await createPayment(request);

  const response = await request.get(
    '/api/payments?status=succeeded&limit=100',
  );

  expect(response.status()).toBe(200);

  const body = await response.json();

  expect(body.payments.length).toBeGreaterThan(0);

  for (const payment of body.payments) {
    expect(payment.status).toBe('succeeded');
  }

  expect(
    body.payments.some(
      (payment: { id: string }) => payment.id === createdPayment.id,
    ),
  ).toBe(true);
});

test('Return empty payments array for page beyond available results', async ({
  request,
}) => {
  const response = await request.get('/api/payments?page=999999&limit=20');

  expect(response.status()).toBe(200);

  const body = await response.json();

  expect(body.payments).toEqual([]);
  expect(body.page).toBe(999999);
  expect(body.limit).toBe(20);
});

test('Return payments newest first', async ({ request }) => {
  const firstPayment = await createPayment(request);
  const secondPayment = await createPayment(request);

  const listResponse = await request.get('/api/payments?limit=100');

  expect(listResponse.status()).toBe(200);

  const body = await listResponse.json();

  const firstIndex = body.payments.findIndex(
    (payment: { id: string }) => payment.id === firstPayment.id,
  );

  const secondIndex = body.payments.findIndex(
    (payment: { id: string }) => payment.id === secondPayment.id,
  );

  expect(firstIndex).toBeGreaterThanOrEqual(0);
  expect(secondIndex).toBeGreaterThanOrEqual(0);
  expect(secondIndex).toBeLessThan(firstIndex);
});
