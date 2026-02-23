import type { NextFunction, Request, Response } from 'express';
import { eventService } from '../services/event.service';

function shouldSkipTelemetry(path: string): boolean {
  return path === '/docs' || path.startsWith('/docs/') || path.startsWith('/favicon');
}

export function captureRequestTelemetry(req: Request, res: Response, next: NextFunction): void {
  if (!shouldSkipTelemetry(req.path)) {
    res.on('finish', () => {
      void eventService.recordRequest(req, res).catch((error) => {
        console.warn('Failed to persist request event:', error);
      });
    });
  }

  next();
}
