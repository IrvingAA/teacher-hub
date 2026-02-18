import Redis from 'ioredis';
import { env } from './env';

export const redis = new Redis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  lazyConnect: true,
});

redis.on('error', (err: Error) => {
  console.error('Redis connection error:', err.message);
});

redis.on('connect', () => {
  console.log('Redis connected');
});

export type RedisStatus = 'connected' | 'disconnected';

export function getRedisStatus(): RedisStatus {
  return redis.status === 'ready' ? 'connected' : 'disconnected';
}
