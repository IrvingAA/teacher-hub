export const baseSchemas = {
  StandardResponseMeta: {
    type: 'object',
    properties: {
      dateTime: { type: 'string', example: '2026-02-18 19:22:58' },
      httpCode: { type: 'integer', example: 200 },
      responseTime: { type: 'string', example: '15.423ms' },
      alert: {
        type: 'string',
        enum: ['positive', 'negative', 'warning', 'info'],
        example: 'positive',
      },
      title: { type: 'string', example: 'Correcto' },
      message: { type: 'string', example: 'Consulta completada correctamente.' },
    },
    required: ['dateTime', 'httpCode', 'alert', 'title', 'message'],
  },
  Pagination: {
    type: 'object',
    properties: {
      page: { type: 'integer', example: 1 },
      limit: { type: 'integer', example: 10 },
      total: { type: 'integer', example: 42 },
      totalPages: { type: 'integer', example: 5 },
    },
    required: ['page', 'limit', 'total', 'totalPages'],
  },
  HealthResponse: {
    type: 'object',
    properties: {
      status: { type: 'string', example: 'ok' },
      timestamp: { type: 'string', format: 'date-time' },
      services: {
        type: 'object',
        properties: {
          postgres: { type: 'string', enum: ['connected', 'disconnected'] },
          redis: { type: 'string', enum: ['connected', 'disconnected'] },
        },
        required: ['postgres', 'redis'],
      },
    },
    required: ['status', 'timestamp', 'services'],
  },
  ErrorResponse: {
    type: 'object',
    properties: {
      error: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Validation failed' },
          code: { type: 'string', example: 'VALIDATION_ERROR' },
          statusCode: { type: 'integer', example: 400 },
        },
        required: ['message', 'code', 'statusCode'],
      },
    },
    required: ['error'],
  },
};
