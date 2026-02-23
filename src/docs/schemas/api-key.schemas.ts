export const apiKeySchemas = {
  ApiKeyRecord: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      name: { type: 'string', example: 'frontend-dev' },
      publicKey: { type: 'string', example: '4fa9b73ac2f1a5f0' },
      isActive: { type: 'boolean', example: true },
      scopes: {
        type: 'array',
        nullable: true,
        items: { type: 'string' },
        example: ['teachers:read', 'teachers:write'],
      },
      expiresAt: { type: 'string', format: 'date-time', nullable: true },
      lastUsedAt: { type: 'string', format: 'date-time', nullable: true },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
    required: ['id', 'name', 'publicKey', 'isActive', 'createdAt', 'updatedAt'],
  },
  CreateApiKeyRequest: {
    type: 'object',
    properties: {
      name: { type: 'string', minLength: 2, maxLength: 120 },
      scopes: {
        type: 'array',
        items: { type: 'string', minLength: 1, maxLength: 60 },
        maxItems: 20,
      },
      expiresAt: { type: 'string', format: 'date-time' },
    },
    required: ['name'],
  },
  ApiKeyCreatePayload: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      name: { type: 'string' },
      publicKey: { type: 'string' },
      key: {
        type: 'string',
        example: 'thk_4fa9b73ac2f1a5f0.e7f4f515f7d7bb4fc2c0ff7f4dd020fc7c0f3b8ca8aa9a4f',
      },
      scopes: {
        type: 'array',
        nullable: true,
        items: { type: 'string' },
      },
      expiresAt: { type: 'string', format: 'date-time', nullable: true },
      isActive: { type: 'boolean' },
      createdAt: { type: 'string', format: 'date-time' },
    },
    required: ['id', 'name', 'publicKey', 'key', 'isActive', 'createdAt'],
  },
  ApiKeyCreateStandardResponse: {
    allOf: [
      { $ref: '#/components/schemas/StandardResponseMeta' },
      {
        type: 'object',
        properties: {
          data: { $ref: '#/components/schemas/ApiKeyCreatePayload' },
        },
        required: ['data'],
      },
    ],
  },
  ApiKeyListStandardResponse: {
    allOf: [
      { $ref: '#/components/schemas/StandardResponseMeta' },
      {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: { $ref: '#/components/schemas/ApiKeyRecord' },
          },
        },
        required: ['data'],
      },
    ],
  },
  ApiKeyRevokeStandardResponse: {
    allOf: [
      { $ref: '#/components/schemas/StandardResponseMeta' },
      {
        type: 'object',
        properties: {
          data: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
            },
            required: ['id'],
          },
        },
        required: ['data'],
      },
    ],
  },
  UnauthorizedStandardResponse: {
    allOf: [
      { $ref: '#/components/schemas/StandardResponseMeta' },
      {
        type: 'object',
        properties: {
          data: { nullable: true, type: 'object' },
        },
        required: ['data'],
      },
    ],
  },
};
