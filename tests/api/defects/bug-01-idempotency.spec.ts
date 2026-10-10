import { test, expect } from '@playwright/test';
import { createPayment } from '../helpers/payment.helper';

test('Same idempotency key must not create duplicate payment', async ({
  request,
}) => {
  test.fail(
    true,
    'BUG-01: idempotency_key is ignored and duplicate payments are created',
  );

  const idempotencyKey = `order-${Date.now()}`;

  const firstPayment = await createPayment(request, {
    idempotency_key: idempotencyKey,
  });

  const secondPayment = await createPayment(request, {
    idempotency_key: idempotencyKey,
  });

  expect(secondPayment.id).toBe(firstPayment.id);
  expect(secondPayment.stripe_pi_id).toBe(firstPayment.stripe_pi_id);
});
