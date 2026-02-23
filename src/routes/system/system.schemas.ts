import { Request } from 'express';
import { AppDataSource } from '../../config/database.pg';
import { getRedisStatus } from '../../config/redis';
import type { HealthResponse } from '../../types/common/health.type';

export function buildHealthResponse(): HealthResponse {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      postgres: AppDataSource.isInitialized ? 'connected' : 'disconnected',
      redis: getRedisStatus(),
    },
  };
}

export function getRequestedFormat(req: Request): string {
  const raw = req.query.format;
  return typeof raw === 'string' ? raw.toLowerCase() : '';
}
