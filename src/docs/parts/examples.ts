export function applyOperationExamples(document: Record<string, unknown>): void {
  const paths = document.paths as Record<string, Record<string, Record<string, unknown>>> | undefined;
  if (!paths) {
    return;
  }

  const loginPost = paths['/api/auth/login']?.post;
  if (loginPost) {
    const loginRequestBody = loginPost.requestBody as
      | { content?: Record<string, Record<string, unknown>> }
      | undefined;
    const bodyContent = loginRequestBody?.content;
    if (bodyContent?.['application/json']) {
      bodyContent['application/json'].example = {
        email: 'owner@teacherhub.mail',
        password: 'your-password',
      };
    }

    const responses = loginPost.responses as Record<string, Record<string, unknown>> | undefined;
    const okContent = responses?.['200']?.content as Record<string, Record<string, unknown>> | undefined;
    if (okContent?.['application/json']) {
      okContent['application/json'].example = {
        dateTime: '2026-02-23 11:40:00',
        httpCode: 200,
        responseTime: '12.540ms',
        alert: 'positive',
        title: 'Correcto',
        message: 'Autenticacion completada correctamente.',
        data: {
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          tokenType: 'Bearer',
          expiresIn: '1h',
        },
      };
    }
  }

  const apiKeysPost = paths['/api/security/api-keys']?.post;
  if (apiKeysPost) {
    const apiKeysRequestBody = apiKeysPost.requestBody as
      | { content?: Record<string, Record<string, unknown>> }
      | undefined;
    const bodyContent = apiKeysRequestBody?.content;
    if (bodyContent?.['application/json']) {
      bodyContent['application/json'].example = {
        name: 'frontend-dev',
        scopes: ['teachers:read', 'teachers:write'],
      };
    }
  }

  const teachersGet = paths['/api/teachers']?.get;
  if (teachersGet) {
    const responses = teachersGet.responses as Record<string, Record<string, unknown>> | undefined;
    const okContent = responses?.['200']?.content as Record<string, Record<string, unknown>> | undefined;
    if (okContent?.['application/json']) {
      okContent['application/json'].example = {
        dateTime: '2026-02-23 11:40:00',
        httpCode: 200,
        responseTime: '12.540ms',
        alert: 'positive',
        title: 'Correcto',
        message: 'Consulta completada correctamente.',
        data: {
          data: [
            {
              id: '55555555-5555-4555-8555-555555555555',
              userId: '11111111-1111-4111-8111-111111111111',
              schoolId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
              email: 'teacher@teacherhub.local',
              firstName: 'Demo',
              lastName: 'Teacher',
              specialization: 'Mathematics',
              phoneNumber: '+1 555 100 2000',
              hireDate: '2023-01-10',
              status: 'active',
              createdAt: '2026-02-23T10:00:00.000Z',
              updatedAt: '2026-02-23T10:00:00.000Z',
            },
          ],
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
        },
      };
    }
  }
}
