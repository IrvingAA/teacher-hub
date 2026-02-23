export const authSchemas = {
  LoginRequest: {
    type: 'object',
    properties: {
      email: { type: 'string', format: 'email', example: 'owner@teacherhub.mail' },
      password: { type: 'string', example: 'your-password' },
    },
    required: ['email', 'password'],
  },
  LoginResponse: {
    type: 'object',
    properties: {
      accessToken: { type: 'string' },
      tokenType: { type: 'string', example: 'Bearer' },
      expiresIn: { type: 'string', example: '1h' },
      user: {
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
          memberships: {
            type: 'array',
            items: {
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
          },
        },
        required: ['id', 'email', 'globalRole', 'tenantId', 'role', 'memberships'],
      },
    },
    required: ['accessToken', 'tokenType', 'expiresIn', 'user'],
  },
  LoginStandardResponse: {
    allOf: [
      { $ref: '#/components/schemas/StandardResponseMeta' },
      {
        type: 'object',
        properties: {
          data: { $ref: '#/components/schemas/LoginResponse' },
        },
        required: ['data'],
      },
    ],
  },
};
