export const eventSchemas = {
  Event: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      requestId: { type: 'string', nullable: true },
      tenantId: { type: 'string', nullable: true },
      actorUserId: { type: 'string', format: 'uuid', nullable: true },
      category: { type: 'string', enum: ['request', 'audit'] },
      action: { type: 'string' },
      method: { type: 'string', nullable: true },
      path: { type: 'string', nullable: true },
      statusCode: { type: 'integer', nullable: true },
      resourceType: { type: 'string', nullable: true },
      resourceId: { type: 'string', nullable: true },
      ip: { type: 'string', nullable: true },
      userAgent: { type: 'string', nullable: true },
      browser: { type: 'string', nullable: true },
      os: { type: 'string', nullable: true },
      before: { type: 'object', nullable: true, additionalProperties: true },
      after: { type: 'object', nullable: true, additionalProperties: true },
      changes: { type: 'object', nullable: true, additionalProperties: true },
      metadata: { type: 'object', nullable: true, additionalProperties: true },
      createdAt: { type: 'string', format: 'date-time' },
    },
    required: ['id', 'category', 'action', 'createdAt'],
  },
  EventsListResponse: {
    type: 'object',
    properties: {
      data: {
        type: 'array',
        items: { $ref: '#/components/schemas/Event' },
      },
      pagination: { $ref: '#/components/schemas/Pagination' },
    },
    required: ['data', 'pagination'],
  },
  EventStandardResponse: {
    allOf: [
      { $ref: '#/components/schemas/StandardResponseMeta' },
      {
        type: 'object',
        properties: {
          data: { $ref: '#/components/schemas/Event' },
        },
        required: ['data'],
      },
    ],
  },
  EventsListStandardResponse: {
    allOf: [
      { $ref: '#/components/schemas/StandardResponseMeta' },
      {
        type: 'object',
        properties: {
          data: { $ref: '#/components/schemas/EventsListResponse' },
        },
        required: ['data'],
      },
    ],
  },
};
