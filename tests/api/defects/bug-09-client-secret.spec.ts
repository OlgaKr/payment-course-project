import { test, expect } from '@playwright/test';
import { createPayment } from '../helpers/payment.helper';

test('GET payment must not expose client_secret', async ({ request }) => {
  test.fail(true, 'BUG-09: client_secret is exposed by payment read endpoints');

  const createdPayment = await createPayment(request);

  expect(createdPayment.client_secret).toBeDefined();

  const getResponse = await request.get(`/api/payments/${createdPayment.id}`);

  expect(getResponse.status()).toBe(200);

  const payment = await getResponse.json();

  expect(payment).not.toHaveProperty('client_secret');
});

test('GET payments list must not expose client_secret', async ({ request }) => {
  test.fail(true, 'BUG-09: client_secret is exposed by payment read endpoints');

  const createdPayment = await createPayment(request);

  expect(createdPayment.client_secret).toBeDefined();

  const listResponse = await request.get('/api/payments?limit=100');

  expect(listResponse.status()).toBe(200);

  const body = await listResponse.json();

  const payment = body.payments.find(
    (item: { id: string }) => item.id === createdPayment.id,
  );

  expect(payment).toBeDefined();
  expect(payment).not.toHaveProperty('client_secret');
});
