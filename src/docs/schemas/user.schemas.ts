export const userSchemas = {
  UserMembership: {
    type: 'object',
    properties: {
      schoolId: {
        type: 'string',
        format: 'uuid',
        example: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      },
      schoolName: { type: 'string', example: 'TeacherHub Academy' },
      role: { type: 'string', enum: ['admin', 'teacher', 'student'] },
      isDefault: { type: 'boolean', example: true },
    },
    required: ['schoolId', 'schoolName', 'role', 'isDefault'],
  },
  UserMembershipInput: {
    type: 'object',
    properties: {
      schoolId: {
        type: 'string',
        format: 'uuid',
        example: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      },
      schoolName: { type: 'string', example: 'TeacherHub Academy' },
      role: { type: 'string', enum: ['admin', 'teacher', 'student'] },
      isDefault: { type: 'boolean', example: true },
    },
    required: ['schoolId', 'schoolName', 'role'],
  },
  UserProfileResponse: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      email: { type: 'string', format: 'email' },
      globalRole: { type: 'string', enum: ['owner', 'user'], example: 'user' },
      tenantId: {
        type: 'string',
        format: 'uuid',
        example: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      },
      role: { type: 'string', enum: ['admin', 'teacher', 'student'] },
      isActive: { type: 'boolean', example: true },
      memberships: {
        type: 'array',
        items: { $ref: '#/components/schemas/UserMembershipInput' },
      },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
    required: [
      'id',
      'email',
      'globalRole',
      'tenantId',
      'role',
      'isActive',
      'memberships',
      'createdAt',
      'updatedAt',
    ],
  },
  CreateUserRequest: {
    type: 'object',
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 4 },
      globalRole: { type: 'string', enum: ['owner', 'user'], default: 'user' },
      memberships: {
        type: 'array',
        items: { $ref: '#/components/schemas/UserMembershipInput' },
      },
    },
    required: ['email', 'password', 'memberships'],
  },
  UpdateUserRequest: {
    type: 'object',
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 4 },
      globalRole: { type: 'string', enum: ['owner', 'user'] },
      memberships: {
        type: 'array',
        items: { $ref: '#/components/schemas/UserMembership' },
      },
    },
  },
  UsersListResponse: {
    type: 'object',
    properties: {
      data: {
        type: 'array',
        items: { $ref: '#/components/schemas/UserProfileResponse' },
      },
      pagination: { $ref: '#/components/schemas/Pagination' },
    },
    required: ['data', 'pagination'],
  },
  UserStandardResponse: {
    allOf: [
      { $ref: '#/components/schemas/StandardResponseMeta' },
      {
        type: 'object',
        properties: {
          data: { $ref: '#/components/schemas/UserProfileResponse' },
        },
        required: ['data'],
      },
    ],
  },
  UsersListStandardResponse: {
    allOf: [
      { $ref: '#/components/schemas/StandardResponseMeta' },
      {
        type: 'object',
        properties: {
          data: { $ref: '#/components/schemas/UsersListResponse' },
        },
        required: ['data'],
      },
    ],
  },
  UserDeleteStandardResponse: {
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
