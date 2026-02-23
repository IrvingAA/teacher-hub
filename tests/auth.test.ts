process.env.PORT = '3000';
process.env.NODE_ENV = 'test';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_USER = 'admin';
process.env.DB_PASSWORD = 'secret';
process.env.DB_NAME = 'assessment_db';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';
process.env.JWT_SECRET = 'supersecret';

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
import { TEST_AUTH_CREDENTIALS } from './fixtures/auth.fixtures';
import { hashPassword } from '../src/utils/security/password';

jest.mock('../src/config/database.pg', () => {
  const createMockRepository = () => ({
    findOne: jest.fn(),
    find: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockImplementation((d) => d),
    save: jest.fn().mockImplementation((e) => Promise.resolve(e)),
  });

  return {
    AppDataSource: {
      isInitialized: true,
      initialize: jest.fn().mockResolvedValue(undefined),
      getRepository: jest.fn().mockReturnValue(createMockRepository()),
    },
    connectPostgres: jest.fn().mockResolvedValue(undefined),
  };
});

import { AppDataSource } from '../src/config/database.pg';

describe('POST /api/auth/login', () => {
  const apiKey = 'thk_test.key';

  it('returns token with valid credentials from database', async () => {
    const passwordHash = await hashPassword(TEST_AUTH_CREDENTIALS.admin.password);
    const mockUser = {
      id: 'u1',
      email: TEST_AUTH_CREDENTIALS.admin.email,
      password: passwordHash,
      globalRole: 'user',
      isActive: true,
      tenantId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    };

    const repo = AppDataSource.getRepository('User') as any;
    repo.findOne.mockResolvedValue(mockUser);

    const response = await request(app)
      .post('/api/auth/login')
      .set('X-Api-Key', apiKey)
      .send({
        email: TEST_AUTH_CREDENTIALS.admin.email,
        password: TEST_AUTH_CREDENTIALS.admin.password,
      });

    expect(response.status).toBe(200);
    expect(response.body.data.accessToken).toBeDefined();
    expect(response.body.data.user.email).toBe(TEST_AUTH_CREDENTIALS.admin.email);
  });

  it('returns 401 with invalid credentials', async () => {
    const repo = AppDataSource.getRepository('User') as any;
    repo.findOne.mockResolvedValue(null);

    const response = await request(app)
      .post('/api/auth/login')
      .set('X-Api-Key', apiKey)
      .send({
        email: TEST_AUTH_CREDENTIALS.invalid.email,
        password: TEST_AUTH_CREDENTIALS.invalid.password,
      });

    expect(response.status).toBe(401);
  });
});
