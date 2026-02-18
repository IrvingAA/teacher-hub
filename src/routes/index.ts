import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { AppDataSource } from '../config/database.pg';
import { getRedisStatus, RedisStatus } from '../config/redis';

const router = Router();

interface HealthResponse {
  status: 'ok';
  timestamp: string;
  services: {
    postgres: 'connected' | 'disconnected';
    mongo: 'connected' | 'disconnected';
    redis: RedisStatus;
  };
}

router.get('/health', (_req: Request, res: Response<HealthResponse>) => {
  const response: HealthResponse = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      postgres: AppDataSource.isInitialized ? 'connected' : 'disconnected',
      mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      redis: getRedisStatus(),
    },
  };

  res.status(200).json(response);
});

export default router;
