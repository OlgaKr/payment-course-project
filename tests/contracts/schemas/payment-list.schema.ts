import { paymentSchema } from './payment.schema';

export const paymentListSchema = {
  type: 'object',
  required: ['payments', 'total', 'page', 'limit'],
  additionalProperties: false,
  properties: {
    payments: {
      type: 'array',
      items: paymentSchema,
    },
    total: {
      type: 'integer',
      minimum: 0,
    },
    page: {
      type: 'integer',
      minimum: 1,
    },
    limit: {
      type: 'integer',
      minimum: 1,
      maximum: 100,
    },
  },
} as const;
