import { test, expect } from '@playwright/test';

const validPaymentData = {
  amount: 5000,
  payment_method: 'pm_card_visa',
};

const amountErrorMessage = 'amount must be a positive integer (in cents)';

test.describe('Declined payment scenarios', () => {
  const declineCases = [
    {
      paymentMethod: 'pm_card_chargeDeclined',
      code: 'card_declined',
      declineCode: 'generic_decline',
    },
    {
      paymentMethod: 'pm_card_chargeDeclinedInsufficientFunds',
      code: 'card_declined',
      declineCode: 'insufficient_funds',
    },
    {
      paymentMethod: 'pm_card_chargeDeclinedLostCard',
      code: 'card_declined',
      declineCode: 'lost_card',
    },
    {
      paymentMethod: 'pm_card_chargeDeclinedExpiredCard',
      code: 'expired_card',
      declineCode: 'expired_card',
    },
    {
      paymentMethod: 'pm_card_chargeDeclinedIncorrectCvc',
      code: 'incorrect_cvc',
      declineCode: 'incorrect_cvc',
    },
  ];

  for (const { paymentMethod, code, declineCode } of declineCases) {
    test(`Return ${declineCode} for declined payment`, async ({ request }) => {
      const response = await request.post('/api/payments', {
        data: {
          ...validPaymentData,
          payment_method: paymentMethod,
        },
      });

      expect(response.status()).toBe(402);

      const body = await response.json();

      expect(body.error.type).toBe('card_error');
      expect(body.error.code).toBe(code);
      expect(body.error.decline_code).toBe(declineCode);
    });
  }
});

test.describe('Amount validation', () => {
  const invalidAmountCases = [
    {
      name: 'zero amount',
      amount: 0,
    },
    {
      name: 'string amount',
      amount: '5000',
    },
    {
      name: 'decimal amount',
      amount: 10.5,
    },
    {
      name: 'negative amount',
      amount: -100,
    },
  ];

  for (const { name, amount } of invalidAmountCases) {
    test(`Reject payment with ${name}`, async ({ request }) => {
      const response = await request.post('/api/payments', {
        data: {
          ...validPaymentData,
          amount,
        },
      });

      expect(response.status()).toBe(400);

      const body = await response.json();

      expect(body.error.type).toBe('validation_error');
      expect(body.error.message).toBe(amountErrorMessage);
    });
  }
});

test('Reject payment below Stripe minimum amount', async ({ request }) => {
  const response = await request.post('/api/payments', {
    data: {
      ...validPaymentData,
      amount: 50,
      capture_method: 'automatic',
    },
  });

  expect(response.status()).toBe(400);

  const body = await response.json();

  expect(body.error.type).toBe('invalid_request');
  expect(body.error.message).toContain('Amount must convert to at least');
});

test('Reject payment without payment_method', async ({ request }) => {
  const response = await request.post('/api/payments', {
    data: {
      amount: 5000,
    },
  });

  expect(response.status()).toBe(400);

  const body = await response.json();

  expect(body.error.type).toBe('validation_error');
  expect(body.error.message).toBe('payment_method is required');
});

test('Reject unsupported currency', async ({ request }) => {
  const response = await request.post('/api/payments', {
    data: {
      ...validPaymentData,
      currency: 'eur',
    },
  });

  expect(response.status()).toBe(400);

  const body = await response.json();

  expect(body.error.type).toBe('validation_error');
  expect(body.error.message).toBe('Only usd is supported');
});

test('Reject invalid capture_method', async ({ request }) => {
  const response = await request.post('/api/payments', {
    data: {
      ...validPaymentData,
      capture_method: 'later',
    },
  });

  expect(response.status()).toBe(400);

  const body = await response.json();

  expect(body.error.type).toBe('validation_error');
  expect(body.error.message).toBe(
    'capture_method must be "automatic" or "manual"',
  );
});

test('Reject invalid customer email', async ({ request }) => {
  const response = await request.post('/api/payments', {
    data: {
      ...validPaymentData,
      customer_email: 'not-an-email',
    },
  });

  expect(response.status()).toBe(400);

  const body = await response.json();

  expect(body.error.type).toBe('invalid_request');
  expect(body.error.message).toBe('Invalid email address: not-an-email');
});

test('Reject malformed JSON body', async ({ request }) => {
  const response = await request.post('/api/payments', {
    headers: {
      'Content-Type': 'application/json',
    },
    data: '{bad',
  });

  expect(response.status()).toBe(400);

  const body = await response.json();

  expect(body.error.type).toBe('invalid_request');
  expect(body.error.message).toBe('Invalid JSON body');
});
