import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodIssue } from 'zod';

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

interface ErrorResponse {
  error: {
    message: string;
    code: string;
    statusCode: number;
  };
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response<ErrorResponse>,
  _next: NextFunction
): void {
  if (err instanceof ZodError) {
    const message = err.issues.map((e: ZodIssue) => `${e.path.join('.')}: ${e.message}`).join(', ');
    res.status(400).json({
      error: {
        message,
        code: 'VALIDATION_ERROR',
        statusCode: 400,
      },
    });
    return;
  }

  if (isAppError(err)) {
    res.status(err.statusCode).json({
      error: {
        message: err.message,
        code: err.code,
        statusCode: err.statusCode,
      },
    });
    return;
  }

  console.error('Unhandled error:', err);
  res.status(500).json({
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
      statusCode: 500,
    },
  });
}
