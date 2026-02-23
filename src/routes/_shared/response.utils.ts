import type { Response } from 'express';

export type ResponseAlert = 'positive' | 'negative' | 'warning' | 'info';

export interface ApiResponse<T = unknown> {
  dateTime: string;
  httpCode: number;
  responseTime: string;
  alert: ResponseAlert;
  title: string;
  message: string;
  data: T;
}

export interface SendApiResponseInput<T> {
  statusCode: number;
  title: string;
  message: string;
  data?: T;
  alert?: ResponseAlert;
}

export function inferAlert(statusCode: number): ResponseAlert {
  if (statusCode >= 200 && statusCode < 300) {
    return 'positive';
  }

  if (statusCode >= 400 && statusCode < 500) {
    return 'warning';
  }

  if (statusCode >= 500) {
    return 'negative';
  }

  return 'info';
}

export function sendApiResponse<T = unknown>(
  res: Response,
  input: SendApiResponseInput<T>
): Response<ApiResponse<T | null>> {
  const payload: ApiResponse<T | null> = {
    dateTime: new Date().toISOString().replace('T', ' ').split('.')[0],
    httpCode: input.statusCode,
    responseTime: (res.get('X-Response-Time') as string) || '0ms',
    alert: input.alert ?? inferAlert(input.statusCode),
    title: input.title,
    message: input.message,
    data: input.data ?? null,
  };

  return res.status(input.statusCode).json(payload);
}
