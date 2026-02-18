export const redis = {
  status: 'ready',
  connect: jest.fn().mockResolvedValue(undefined),
  on: jest.fn(),
  disconnect: jest.fn().mockResolvedValue(undefined),
};

export type RedisStatus = 'connected' | 'disconnected';

export function getRedisStatus(): RedisStatus {
  return 'connected';
}
