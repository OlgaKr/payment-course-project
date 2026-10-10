import { test, expect } from '@playwright/test';
import { createDbClient } from '../helpers/db.helper';

test('Duplicate webhook event must be processed idempotently', async ({
  request,
}) => {
  test.fail(
    true,
    'BUG-06: duplicate Stripe webhook event is processed and stored multiple times',
  );

  const eventId = `evt_test_${Date.now()}`;

  const eventPayload = {
    id: eventId,
    object: 'event',
    type: 'payment_intent.succeeded',
    data: {
      object: {
        id: 'pi_nonexistent_test',
        object: 'payment_intent',
        status: 'succeeded',
        amount: 5000,
      },
    },
  };

  const firstResponse = await request.post('/api/webhooks', {
    data: eventPayload,
  });

  expect(firstResponse.status()).toBe(200);

  const secondResponse = await request.post('/api/webhooks', {
    data: eventPayload,
  });

  expect(secondResponse.status()).toBe(200);

  const db = createDbClient();

  await db.connect();

  const result = await db.query(
    `
      SELECT COUNT(*)::int AS count
      FROM webhook_events
      WHERE stripe_event_id = $1
    `,
    [eventId],
  );

  await db.end();

  expect(result.rows[0].count).toBe(1);
});
