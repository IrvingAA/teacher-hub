process.env.PORT = '3000';
process.env.NODE_ENV = 'test';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_USER = 'admin';
process.env.DB_PASSWORD = 'secret';
process.env.DB_NAME = 'assessment_db';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';

jest.mock('../src/config/env', () => ({
  env: {
    PORT: 3000,
    NODE_ENV: 'test',
    DB_HOST: 'localhost',
    DB_PORT: 5432,
    DB_USER: 'admin',
    DB_PASSWORD: 'secret',
    DB_NAME: 'assessment_db',
    REDIS_HOST: 'localhost',
    REDIS_PORT: 6379,
    JWT_SECRET: 'supersecret',
    JWT_ISSUER: undefined,
    JWT_AUDIENCE: undefined,
  },
}));

jest.mock('../src/config/database.pg', () => ({
  AppDataSource: {
    isInitialized: true,
    initialize: jest.fn().mockResolvedValue(undefined),
    getRepository: jest.fn().mockReturnValue({}),
  },
  connectPostgres: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../src/config/redis', () => ({
  redis: {
    status: 'ready',
    connect: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
    disconnect: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    incr: jest.fn().mockResolvedValue(1),
    keys: jest.fn().mockResolvedValue([]),
    sadd: jest.fn().mockResolvedValue(1),
    smembers: jest.fn().mockResolvedValue([]),
    expire: jest.fn().mockResolvedValue(1),
  },
  getRedisStatus: () => 'connected',
}));

import request from 'supertest';
import app from '../src/app';

describe('GET /health', () => {
  it('should return 200 with status ok', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });

  it('should return timestamp field', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body.timestamp).toBeDefined();
    expect(typeof response.body.timestamp).toBe('string');
    expect(() => new Date(response.body.timestamp)).not.toThrow();
  });

  it('should return services field', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body.services).toBeDefined();
    expect(response.body.services).toHaveProperty('postgres');
    expect(response.body.services).toHaveProperty('redis');
  });
});
