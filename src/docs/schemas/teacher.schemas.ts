export const teacherSchemas = {
  Teacher: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      userId: { type: 'string', format: 'uuid' },
      schoolId: { type: 'string', format: 'uuid' },
      email: { type: 'string', format: 'email' },
      firstName: { type: 'string' },
      lastName: { type: 'string' },
      specialization: { type: 'string' },
      phoneNumber: { type: 'string', nullable: true },
      hireDate: { type: 'string', format: 'date' },
      status: { type: 'string', enum: ['active', 'inactive', 'on_leave'] },
      isActive: { type: 'boolean', example: true },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
    required: [
      'id',
      'userId',
      'schoolId',
      'email',
      'firstName',
      'lastName',
      'specialization',
      'hireDate',
      'status',
      'isActive',
      'createdAt',
      'updatedAt',
    ],
  },
  CreateTeacherRequest: {
    type: 'object',
    properties: {
      userId: { type: 'string', format: 'uuid' },
      schoolId: { type: 'string', format: 'uuid' },
      firstName: { type: 'string', minLength: 2 },
      lastName: { type: 'string', minLength: 2 },
      specialization: { type: 'string', minLength: 2 },
      phoneNumber: { type: 'string', example: '+1 555 123 4567' },
      hireDate: { type: 'string', format: 'date', example: '2024-08-15' },
    },
    required: ['userId', 'schoolId', 'firstName', 'lastName', 'specialization', 'hireDate'],
  },
  UpdateTeacherRequest: {
    type: 'object',
    properties: {
      firstName: { type: 'string', minLength: 2 },
      lastName: { type: 'string', minLength: 2 },
      specialization: { type: 'string', minLength: 2 },
      phoneNumber: { type: 'string' },
      hireDate: { type: 'string', format: 'date' },
    },
  },
  UpdateTeacherStatusRequest: {
    type: 'object',
    properties: {
      status: { type: 'string', enum: ['active', 'inactive', 'on_leave'] },
    },
    required: ['status'],
  },
  TeachersListResponse: {
    type: 'object',
    properties: {
      data: {
        type: 'array',
        items: { $ref: '#/components/schemas/Teacher' },
      },
      pagination: { $ref: '#/components/schemas/Pagination' },
    },
    required: ['data', 'pagination'],
  },
  TeacherStandardResponse: {
    allOf: [
      { $ref: '#/components/schemas/StandardResponseMeta' },
      {
        type: 'object',
        properties: {
          data: { $ref: '#/components/schemas/Teacher' },
        },
        required: ['data'],
      },
    ],
  },
  TeachersListStandardResponse: {
    allOf: [
      { $ref: '#/components/schemas/StandardResponseMeta' },
      {
        type: 'object',
        properties: {
          data: { $ref: '#/components/schemas/TeachersListResponse' },
        },
        required: ['data'],
      },
    ],
  },
  TeacherDeleteStandardResponse: {
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
