export const healthSchema = {
  type: 'object',
  required: ['status', 'db', 'timestamp'],
  additionalProperties: false,
  properties: {
    status: {
      type: 'string',
      const: 'ok',
    },
    db: {
      type: 'string',
      const: 'connected',
    },
    timestamp: {
      type: 'string',
      format: 'date-time',
    },
  },
} as const;
