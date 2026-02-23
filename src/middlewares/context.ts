import { randomUUID } from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import { UAParser } from 'ua-parser-js';

function resolveClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
}

export function attachRequestContext(req: Request, _res: Response, next: NextFunction) {
  const parser = new UAParser(req.get('user-agent') ?? '');
  const result = parser.getResult();
  const requestId = req.get('x-request-id') ?? randomUUID();
  const tenantId = req.get('x-tenant-id') ?? 'public';

  _res.setHeader('x-request-id', requestId);

  req.context = {
    requestId,
    tenantId,
    userId: 'anonymous',
    startedAt: new Date().toISOString(),
    client: {
      ip: resolveClientIp(req),
      userAgent: req.get('user-agent') ?? 'unknown',
      browser: result.browser.name ?? 'unknown',
      os: result.os.name ?? 'unknown',
    },
  };
  next();
}
