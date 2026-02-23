export const schoolSchemas = {
  School: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      name: { type: 'string', example: 'TeacherHub Academy' },
      isActive: { type: 'boolean', example: true },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
    required: ['id', 'name', 'isActive', 'createdAt', 'updatedAt'],
  },
  CreateSchoolRequest: {
    type: 'object',
    properties: {
      name: { type: 'string', minLength: 2, maxLength: 160 },
      isActive: { type: 'boolean', default: true },
      adminUserId: { type: 'string', format: 'uuid' },
      setAdminAsDefaultMembership: { type: 'boolean' },
    },
    required: ['name'],
  },
  UpdateSchoolRequest: {
    type: 'object',
    properties: {
      name: { type: 'string', minLength: 2, maxLength: 160 },
      isActive: { type: 'boolean' },
    },
  },
  SchoolsListResponse: {
    type: 'object',
    properties: {
      data: {
        type: 'array',
        items: { $ref: '#/components/schemas/School' },
      },
      pagination: { $ref: '#/components/schemas/Pagination' },
    },
    required: ['data', 'pagination'],
  },
  SchoolStandardResponse: {
    allOf: [
      { $ref: '#/components/schemas/StandardResponseMeta' },
      {
        type: 'object',
        properties: {
          data: { $ref: '#/components/schemas/School' },
        },
        required: ['data'],
      },
    ],
  },
  SchoolsListStandardResponse: {
    allOf: [
      { $ref: '#/components/schemas/StandardResponseMeta' },
      {
        type: 'object',
        properties: {
          data: { $ref: '#/components/schemas/SchoolsListResponse' },
        },
        required: ['data'],
      },
    ],
  },
  SchoolDeleteStandardResponse: {
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
};
