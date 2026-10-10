import { test, expect } from '@playwright/test';

test('Negative limit must fall back to default value 20', async ({
  request,
}) => {
  test.fail(
    true,
    'BUG-10: negative limit is normalized to 1 instead of default 20',
  );

  const response = await request.get('/api/payments?limit=-5');

  expect(response.status()).toBe(200);

  const body = await response.json();

  expect(body.limit).toBe(20);
});
