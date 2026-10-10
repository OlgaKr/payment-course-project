export const refundSchema = {
  type: 'object',
  required: [
    'id',
    'payment_id',
    'stripe_refund_id',
    'amount',
    'status',
    'reason',
    'created_at',
  ],
  additionalProperties: false,
  properties: {
    id: {
      type: 'string',
      format: 'uuid',
    },
    payment_id: {
      type: 'string',
      format: 'uuid',
    },
    stripe_refund_id: {
      type: 'string',
      pattern: '^re_',
    },
    amount: {
      type: 'integer',
      minimum: 1,
    },
    status: {
      type: 'string',
      const: 'succeeded',
    },
    reason: {
      type: ['string', 'null'],
    },
    created_at: {
      type: 'string',
      format: 'date-time',
    },
  },
} as const;
