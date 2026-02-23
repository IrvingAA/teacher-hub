import { Request, Response, NextFunction } from 'express';
import { throttleService } from '../cache/throttle.service';
import { sendApiResponse } from '../routes/_shared/response.utils';

export interface ThrottleOptions {
  keyPrefix: string;
  useIP?: boolean;
  usePath?: boolean;
}

export const throttle = (options: ThrottleOptions) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const identifier = options.useIP ? ip : 'global';
    const pathPart = options.usePath ? `:${req.path}` : '';
    const key = `${options.keyPrefix}:${identifier}${pathPart}`;

    const status = await throttleService.getStatus(key);

    if (status.isBlocked) {
      return sendApiResponse(res, {
        statusCode: 429,
        alert: 'negative',
        title: 'Acceso restringido',
        message: `Has superado el límite. Por favor, espera ${status.waitTimeSeconds} segundos antes de intentar de nuevo.`,
        data: {
          retryAfterSeconds: status.waitTimeSeconds,
          attempts: status.attempts,
        },
      });
    }

    await throttleService.recordAttempt(key);

    next();
  };
};
