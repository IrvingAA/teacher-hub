import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { ValidationSchemas } from '../types/middleware/middleware.type';

function replaceObjectValues(target: Record<string, unknown>, source: Record<string, unknown>): void {
  for (const key of Object.keys(target)) {
    delete target[key];
  }

  Object.assign(target, source);
}

export function validate(schemas: ValidationSchemas): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }

      if (schemas.query) {
        const parsed = schemas.query.parse(req.query) as Record<string, unknown>;
        replaceObjectValues(req.query as Record<string, unknown>, parsed);
      }

      if (schemas.params) {
        const parsed = schemas.params.parse(req.params) as Record<string, unknown>;
        replaceObjectValues(req.params as unknown as Record<string, unknown>, parsed);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
