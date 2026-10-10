import { test, expect } from '@playwright/test';

const basePaymentData = {
  amount: 5000,
  payment_method: 'pm_card_visa',
};

test('Create automatic Visa payment', async ({ request }) => {
  const response = await request.post('/api/payments', {
    data: {
      ...basePaymentData,
      currency: 'usd',
      capture_method: 'automatic',
      customer_email: 'test@example.com',
      description: 'Automated test payment',
    },
  });

  expect(response.status()).toBe(201);

  const body = await response.json();

  expect(body.amount).toBe(5000);
  expect(body.currency).toBe('usd');
  expect(body.status).toBe('succeeded');
  expect(body.capture_method).toBe('automatic');
  expect(body.stripe_pi_id).toMatch(/^pi_/);
  expect(body.client_secret).toMatch(/^pi_.*_secret_/);
});

test('Create manual-capture payment', async ({ request }) => {
  const response = await request.post('/api/payments', {
    data: {
      ...basePaymentData,
      currency: 'usd',
      capture_method: 'manual',
      customer_email: 'test@example.com',
      description: 'Manual capture test payment',
    },
  });

  expect(response.status()).toBe(201);

  const body = await response.json();

  expect(body.amount).toBe(5000);
  expect(body.currency).toBe('usd');
  expect(body.status).toBe('requires_capture');
  expect(body.capture_method).toBe('manual');
  expect(body.stripe_pi_id).toMatch(/^pi_/);
  expect(body.client_secret).toMatch(/^pi_.*_secret_/);
});

test('Create automatic Mastercard payment', async ({ request }) => {
  const response = await request.post('/api/payments', {
    data: {
      ...basePaymentData,
      payment_method: 'pm_card_mastercard',
      capture_method: 'automatic',
    },
  });

  expect(response.status()).toBe(201);

  const body = await response.json();

  expect(body.amount).toBe(5000);
  expect(body.currency).toBe('usd');
  expect(body.status).toBe('succeeded');
  expect(body.capture_method).toBe('automatic');
  expect(body.stripe_pi_id).toMatch(/^pi_/);
});

test('Use usd as default currency when currency is omitted', async ({
  request,
}) => {
  const response = await request.post('/api/payments', {
    data: {
      ...basePaymentData,
      capture_method: 'automatic',
    },
  });

  expect(response.status()).toBe(201);

  const body = await response.json();

  expect(body.currency).toBe('usd');
  expect(body.status).toBe('succeeded');
});

test('Use automatic capture method by default', async ({ request }) => {
  const response = await request.post('/api/payments', {
    data: {
      ...basePaymentData,
    },
  });

  expect(response.status()).toBe(201);

  const body = await response.json();

  expect(body.capture_method).toBe('automatic');
  expect(body.status).toBe('succeeded');
});

test('Create 3DS payment with requires_action status', async ({ request }) => {
  const response = await request.post('/api/payments', {
    data: {
      ...basePaymentData,
      payment_method: 'pm_card_threeDSecure2Required',
      capture_method: 'automatic',
    },
  });

  expect(response.status()).toBe(201);

  const body = await response.json();

  expect(body.status).toBe('requires_action');
  expect(body.capture_method).toBe('automatic');
  expect(body.client_secret).toBeDefined();
  expect(body.stripe_pi_id).toMatch(/^pi_/);
});

test('Store customer email and description', async ({ request }) => {
  const response = await request.post('/api/payments', {
    data: {
      ...basePaymentData,
      customer_email: 'olga@example.com',
      description: 'Course project payment',
    },
  });

  expect(response.status()).toBe(201);

  const createdPayment = await response.json();

  expect(createdPayment.customer_email).toBe('olga@example.com');
  expect(createdPayment.description).toBe('Course project payment');

  const getResponse = await request.get(`/api/payments/${createdPayment.id}`);

  expect(getResponse.status()).toBe(200);

  const payment = await getResponse.json();

  expect(payment.customer_email).toBe('olga@example.com');
  expect(payment.description).toBe('Course project payment');
});
