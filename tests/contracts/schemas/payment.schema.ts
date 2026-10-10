export const paymentSchema = {
  type: 'object',
  required: [
    'id',
    'stripe_pi_id',
    'amount',
    'currency',
    'status',
    'capture_method',
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
      enum: [
        'succeeded',
        'requires_capture',
        'requires_action',
        'failed',
        'canceled',
        'refunded',
      ],
    },
    capture_method: {
      type: 'string',
      enum: ['automatic', 'manual'],
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
