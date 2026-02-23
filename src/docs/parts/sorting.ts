export function sortOpenApiPaths(document: Record<string, unknown>): void {
  const paths = document.paths as Record<string, unknown> | undefined;
  if (!paths) {
    return;
  }

  const priorities: Array<{ prefix: string; weight: number }> = [
    { prefix: '/api/auth', weight: 10 },
    { prefix: '/api/security/api-keys', weight: 20 },
    { prefix: '/api/users', weight: 30 },
    { prefix: '/api/schools', weight: 40 },
    { prefix: '/api/teachers', weight: 50 },
    { prefix: '/api/students', weight: 60 },
    { prefix: '/api/groups', weight: 70 },
    { prefix: '/api/events', weight: 80 },
    { prefix: '/health', weight: 90 },
    { prefix: '/', weight: 100 },
  ];

  const sortedEntries = Object.entries(paths).sort(([a], [b]) => {
    const weightA = priorities.find((entry) => a.startsWith(entry.prefix))?.weight ?? 999;
    const weightB = priorities.find((entry) => b.startsWith(entry.prefix))?.weight ?? 999;

    if (weightA !== weightB) {
      return weightA - weightB;
    }

    return a.localeCompare(b);
  });

  document.paths = Object.fromEntries(sortedEntries);
}

export function applyOperationMetadata(document: Record<string, unknown>): void {
  const paths = document.paths as Record<string, Record<string, Record<string, unknown>>> | undefined;
  if (!paths) {
    return;
  }

  for (const [pathKey, methods] of Object.entries(paths)) {
    for (const [methodKey, operation] of Object.entries(methods)) {
      if (!operation || typeof operation !== 'object') {
        continue;
      }

      if (!operation.summary || typeof operation.summary !== 'string') {
        operation.summary = `${methodKey.toUpperCase()} ${pathKey}`;
      }

      if (!operation.operationId || typeof operation.operationId !== 'string') {
        operation.operationId = buildOperationId(methodKey, pathKey);
      }
    }
  }
}

function buildOperationId(method: string, pathKey: string): string {
  const normalized = pathKey
    .replace(/^\/+/, '')
    .replace(/[{}]/g, '')
    .split('/')
    .filter((segment) => segment.length > 0)
    .map((segment) => segment.replace(/[^a-zA-Z0-9]/g, '_'))
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join('');

  return `${method.toLowerCase()}${normalized || 'Root'}`;
}
