import { test, expect } from '@playwright/test';

test('GET /api/config returns Stripe publishable key', async ({ request }) => {
  const response = await request.get('/api/config');

  expect(response.status()).toBe(200);

  const body = await response.json();

  expect(body.publishableKey).toBeDefined();
  expect(body.publishableKey).toMatch(/^pk_test_/);
});

test('Return 404 for unknown route', async ({ request }) => {
  const response = await request.get('/api/unknown-route');

  expect(response.status()).toBe(404);

  const body = await response.json();

  expect(body.error.type).toBe('not_found');
});

test('Reject unsupported HTTP method', async ({ request }) => {
  const response = await request.post('/api/health');

  expect(response.status()).toBe(404);

  const body = await response.json();

  expect(body.error.type).toBe('not_found');
});
