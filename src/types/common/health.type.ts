import type { RedisStatus } from '../../config/redis';

export interface HealthResponse {
  status: 'ok' | 'error';
  timestamp: string;
  services: {
    postgres: 'connected' | 'disconnected';
    redis: RedisStatus;
  };
}
