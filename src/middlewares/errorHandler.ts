import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { sendApiResponse } from '../routes/_shared/response.utils';

import { env } from '../config/env';

export interface AppError extends Error {
  message: string;
  code: string;
  statusCode: number;
}

export function createAppError(message: string, code: string, statusCode: number): AppError {
  const error = new Error(message) as AppError;
  error.code = code;
  error.statusCode = statusCode;
  return error;
}

export function isAppError(error: unknown): error is AppError {
  return (
    error instanceof Error &&
    'code' in error &&
    'statusCode' in error &&
    typeof (error as AppError).code === 'string' &&
    typeof (error as AppError).statusCode === 'number'
  );
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ZodError) {
    sendApiResponse(res, {
      statusCode: 400,
      alert: 'negative',
      title: 'Error de validación',
      message: 'Los datos enviados son invalidos.',
      data: {
        errors: err.issues.map((issue) => ({
          field: issue.path.join('.') || 'root',
          message: issue.message,
        })),
      },
    });
    return;
  }

  if (isAppError(err)) {
    sendApiResponse(res, {
      statusCode: err.statusCode,
      alert: err.statusCode >= 500 ? 'negative' : 'warning',
      title: 'Error de aplicación',
      message: err.message,
      data: { code: err.code },
    });
    return;
  }

  console.error('Unhandled error:', err);
  sendApiResponse(res, {
    statusCode: 500,
    alert: 'negative',
    title: 'Error interno',
    message: 'Ha ocurrido un error inesperado en el servidor.',
    data: env.NODE_ENV === 'development' ? { stack: err.stack, originalError: err.message } : null,
  });
}
