export const errorSchema = {
  type: 'object',
  required: ['error'],
  additionalProperties: false,
  properties: {
    error: {
      type: 'object',
      required: ['type', 'message'],
      additionalProperties: true,
      properties: {
        type: {
          type: 'string',
          enum: [
            'validation_error',
            'invalid_state',
            'invalid_request',
            'card_error',
            'not_found',
            'server_error',
          ],
        },
        message: {
          type: 'string',
          minLength: 1,
        },
        code: {
          type: 'string',
        },
        decline_code: {
          type: 'string',
        },
      },
    },
  },
} as const;
