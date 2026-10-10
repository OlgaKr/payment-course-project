import { test, expect } from '@playwright/test';

test('Unsigned webhook must be rejected and must not change payment state', async ({
  request,
}) => {
  test.fail(true, 'BUG-05: webhook signature verification is missing');

  const declinedResponse = await request.post('/api/payments', {
    data: {
      amount: 5000,
      payment_method: 'pm_card_chargeDeclined',
      capture_method: 'automatic',
    },
  });

  expect(declinedResponse.status()).toBe(402);

  const listResponse = await request.get('/api/payments?status=failed&limit=1');

  expect(listResponse.status()).toBe(200);

  const listBody = await listResponse.json();
  const failedPayment = listBody.payments[0];

  expect(failedPayment.status).toBe('failed');

  const forgedEvent = {
    id: `evt_forged_${Date.now()}`,
    object: 'event',
    type: 'payment_intent.succeeded',
    data: {
      object: {
        id: failedPayment.stripe_pi_id,
        object: 'payment_intent',
        amount: failedPayment.amount,
        status: 'succeeded',
      },
    },
  };

  const webhookResponse = await request.post('/api/webhooks', {
    data: forgedEvent,
  });

  expect(webhookResponse.status()).toBe(400);

  const paymentResponse = await request.get(
    `/api/payments/${failedPayment.id}`,
  );

  expect(paymentResponse.status()).toBe(200);

  const paymentAfterForgedWebhook = await paymentResponse.json();

  expect(paymentAfterForgedWebhook.status).toBe('failed');
});
