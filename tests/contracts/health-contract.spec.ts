import { test, expect } from '@playwright/test';
import { healthSchema } from './schemas/health.schema';
import { expectSchema } from './helpers/schema.helper';

test('GET /api/health matches JSON schema', async ({ request }) => {
  const response = await request.get('/api/health');

  expect(response.status()).toBe(200);

  const body = await response.json();

  expectSchema(body, healthSchema);
});
