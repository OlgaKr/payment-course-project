export const capturedPaymentSchema = {
  type: 'object',
  required: [
    'id',
    'stripe_pi_id',
    'amount',
    'currency',
    'status',
    'capture_method',
    'captured_amount',
    'created_at',
    'updated_at',
  ],
  additionalProperties: true,
  properties: {
    id: {
      type: 'string',
      format: 'uuid',
    },
    stripe_pi_id: {
      type: 'string',
      pattern: '^pi_',
    },
    amount: {
      type: 'integer',
      minimum: 1,
    },
    currency: {
      type: 'string',
      const: 'usd',
    },
    status: {
      type: 'string',
      const: 'succeeded',
    },
    capture_method: {
      type: 'string',
      const: 'manual',
    },
    captured_amount: {
      type: 'integer',
      minimum: 1,
    },
    customer_email: {
      type: ['string', 'null'],
    },
    description: {
      type: ['string', 'null'],
    },
    created_at: {
      type: 'string',
      format: 'date-time',
    },
    updated_at: {
      type: 'string',
      format: 'date-time',
    },
  },
} as const;
