import { test, expect } from '@playwright/test';
import { createPayment } from '../helpers/payment.helper';
import { createDbClient } from '../helpers/db.helper';

test('Failed Stripe refund must not be stored as successful', async ({
  request,
}) => {
  test.fail(
    true,
    'BUG-07: failed Stripe refund is stored locally as succeeded',
  );

  const payment = await createPayment(request);

  expect(payment.status).toBe('succeeded');

  const refundResponse = await request.post(
    `/api/payments/${payment.id}/refund`,
    {
      data: {
        amount: 6000,
        reason: 'Failed refund defect test',
      },
    },
  );

  expect(refundResponse.status()).toBe(400);

  const db = createDbClient();

  await db.connect();

  const refundResult = await db.query(
    `
      SELECT status, stripe_refund_id, amount
      FROM refunds
      WHERE payment_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `,
    [payment.id],
  );

  const paymentResult = await db.query(
    `
      SELECT status
      FROM payments
      WHERE id = $1
    `,
    [payment.id],
  );

  await db.end();

  expect(refundResult.rowCount).toBe(0);
  expect(paymentResult.rows[0].status).toBe('succeeded');
});
