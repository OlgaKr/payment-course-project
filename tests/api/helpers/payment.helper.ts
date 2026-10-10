import { APIRequestContext, expect } from '@playwright/test';

type PaymentData = {
  amount?: number;
  currency?: string;
  payment_method?: string;
  capture_method?: 'automatic' | 'manual';
  customer_email?: string;
  description?: string;
  idempotency_key?: string;
};

export async function createPayment(
  request: APIRequestContext,
  overrides: PaymentData = {},
) {
  const response = await request.post('/api/payments', {
    data: {
      amount: 5000,
      payment_method: 'pm_card_visa',
      capture_method: 'automatic',
      ...overrides,
    },
  });

  expect(response.status()).toBe(201);

  return response.json();
}
