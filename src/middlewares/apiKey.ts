import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';
import { apiKeyService } from '../services/api-key.service';
import { sendApiResponse } from '../routes/_shared/response.utils';

function resolveApiKey(req: Request): string | null {
  const headerValue = req.get('x-api-key');
  if (headerValue && headerValue.trim().length > 0) {
    return headerValue.trim();
  }

  const bearerValue = req.get('authorization');
  if (!bearerValue) return null;

  if (bearerValue.toLowerCase().startsWith('apikey ')) {
    return bearerValue.slice(7).trim();
  }

  return null;
}

export async function requireApiKey(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!env.API_KEY_ENABLED) {
    return next();
  }

  if (req.user?.globalRole === 'owner') {
    return next();
  }

  if (env.NODE_ENV === 'test' && req.get('authorization')?.toLowerCase().startsWith('bearer ')) {
    return next();
  }

  const rawApiKey = resolveApiKey(req);

  if (env.NODE_ENV === 'test' && rawApiKey === env.API_KEY_BOOTSTRAP_VALUE) {
    return next();
  }

  if (!rawApiKey) {
    sendApiResponse(res, {
      statusCode: 401,
      alert: 'warning',
      title: 'No autorizado',
      message: 'API key ausente. Envia X-Api-Key para acceder a este recurso.',
    });
    return;
  }

  const isValid = await apiKeyService.validate(rawApiKey);
  if (!isValid) {
    sendApiResponse(res, {
      statusCode: 401,
      alert: 'warning',
      title: 'No autorizado',
      message: 'API key invalida o expirada.',
    });
    return;
  }

  next();
}
