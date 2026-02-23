export const securitySchemes = {
  bearerAuth: {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
  },
  apiKeyAuth: {
    type: 'apiKey',
    in: 'header',
    name: 'X-Api-Key',
  },
};

export function applySecurityPolicies(document: Record<string, unknown>): void {
  const paths = document.paths as
    | Record<string, Record<string, Record<string, unknown>>>
    | undefined;
  if (!paths) {
    return;
  }

  for (const [pathKey, methods] of Object.entries(paths)) {
    for (const operation of Object.values(methods)) {
      if (!operation || typeof operation !== 'object') {
        continue;
      }

      if (pathKey === '/' || pathKey === '/health' || pathKey === '/openapi.json') {
        operation.security = [];
        continue;
      }

      if (pathKey.startsWith('/api/')) {
        if (pathKey === '/api/auth/login') {
          operation.security = [{ apiKeyAuth: [] }];
        } else if (pathKey.startsWith('/api/security/api-keys')) {
          operation.security = [{ bearerAuth: [], apiKeyAuth: [] }];
        } else {
          operation.security = [{ bearerAuth: [], apiKeyAuth: [] }];
        }
      }
    }
  }
}
