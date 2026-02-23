import path from 'path';
import swaggerJsdoc from 'swagger-jsdoc';
import { allSchemas } from './schemas';
import { securitySchemes, applySecurityPolicies } from './parts/security';
import { applyOperationExamples } from './parts/examples';
import { applyOperationMetadata, sortOpenApiPaths } from './parts/sorting';

const pkg = require('../../package.json') as {
  name?: string;
  version?: string;
  description?: string;
};

function createDefinition() {
  const quickstart = [
    '### Quickstart',
    '1. Login using `POST /api/auth/login` to get a JWT.',
    '2. Create an API key using `POST /api/security/api-keys` (owner token required).',
    '3. Click **Authorize** in Swagger UI and set:',
    '   - `bearerAuth`: `Bearer <jwt>`',
    '   - `apiKeyAuth`: `<full_api_key>`',
    '4. Test protected endpoints (`/api/users`, `/api/schools`, `/api/teachers`, `/api/events`).',
    '',
    'Security model:',
    '- `POST /api/auth/login`: public',
    '- `/api/security/api-keys`: `bearerAuth`',
    '- Other `/api/*`: `bearerAuth + apiKeyAuth`',
  ].join('\n');

  return {
    openapi: '3.0.3',
    info: {
      title: 'TeacherHub Backend API',
      version: pkg.version ?? '1.0.0',
      description: `${pkg.description ?? 'REST API for multi-tenant school management.'}\n\n${quickstart}`,
    },
    servers: [{ url: '/', description: 'Current server' }],
    security: [{ apiKeyAuth: [] }],
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Security', description: 'API key management endpoints' },
      { name: 'Users', description: 'User and tenant membership management endpoints' },
      { name: 'Schools', description: 'Tenant school management endpoints' },
      { name: 'Teachers', description: 'Teacher management endpoints' },
      { name: 'Students', description: 'Student management endpoints' },
      { name: 'Groups', description: 'Group management endpoints' },
      { name: 'Events', description: 'Telemetry and audit event endpoints' },
      { name: 'System', description: 'Operational endpoints' },
    ],
    components: {
      securitySchemes,
      schemas: allSchemas,
    },
  };
}

import { env } from '../config/env';

export function getOpenApiDocument() {
  const apis = [
    path.join(process.cwd(), 'src/routes/**/*.{ts,js}'),
    path.join(process.cwd(), 'dist/routes/**/*.js'),
  ];

  const options: swaggerJsdoc.Options = {
    definition: createDefinition(),
    apis,
    failOnErrors: false,
  };

  const document = swaggerJsdoc(options) as Record<string, unknown>;
  applySecurityPolicies(document);
  applyOperationMetadata(document);
  applyOperationExamples(document);
  sortOpenApiPaths(document);
  return document;
}
