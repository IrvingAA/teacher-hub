import cors, { type CorsOptions } from 'cors';
import helmet from 'helmet';
import xss from 'xss';
import type { RequestHandler } from 'express';
import { env } from '../config/env';

function parseCorsOrigins(raw: string | undefined): string[] | null {
  if (!raw || raw.trim().length === 0 || raw.trim() === '*') {
    return null;
  }

  return raw
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function sanitizeValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return xss(value);
  }

  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeValue(entry));
  }

  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      out[key] = sanitizeValue(nested);
    }
    return out;
  }

  return value;
}

export function createCorsMiddleware(): RequestHandler {
  if (!env.CORS_ENABLED) {
    return (_req, _res, next) => next();
  }

  const origins = parseCorsOrigins(env.CORS_ORIGIN);
  const options: CorsOptions = {
    origin: origins ?? true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Api-Key', 'X-Request-Id', 'X-Tenant-Id'],
  };

  return cors(options);
}

export function createHelmetMiddleware(): RequestHandler {
  return helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.tailwindcss.com'],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        fontSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'https://api.iconify.design', 'https://api.simplesvg.com', 'https://api.unisvg.com'],
      },
    },
    referrerPolicy: { policy: 'same-origin' },
  });
}

export const sanitizeRequestPayload: RequestHandler = (req, _res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body);
  }

  if (req.query && typeof req.query === 'object') {
    const sanitizedQuery = sanitizeValue(req.query) as Record<string, unknown>;
    Object.assign(req.query as Record<string, unknown>, sanitizedQuery);
  }

  if (req.params && typeof req.params === 'object') {
    const sanitizedParams = sanitizeValue(req.params) as Record<string, unknown>;
    Object.assign(req.params as Record<string, unknown>, sanitizedParams);
  }

  next();
};
