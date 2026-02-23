import jwt from 'jsonwebtoken';

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
    APP_NAME: 'TeacherHub API',
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
    DB_SYNCHRONIZE: false,
    DB_RUN_MIGRATIONS: false,
  },
}));

jest.mock('../src/config/database.pg', () => ({
  AppDataSource: {
    isInitialized: true,
    initialize: jest.fn().mockResolvedValue(undefined),
    runMigrations: jest.fn().mockResolvedValue([]),
    getRepository: jest.fn().mockReturnValue({}),
    manager: { transaction: jest.fn() },
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

const now = new Date('2026-02-23T10:00:00.000Z');
const mockEvent = {
  id: '99999999-9999-4999-8999-999999999999',
  requestId: 'req-1',
  tenantId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  actorUserId: '33333333-3333-4333-8333-333333333333',
  category: 'audit',
  action: 'teacher.updated',
  method: 'PUT',
  path: '/api/teachers/abc',
  statusCode: 200,
  resourceType: 'teacher',
  resourceId: 'abc',
  ip: '127.0.0.1',
  userAgent: 'jest',
  browser: 'unknown',
  os: 'unknown',
  before: null,
  after: null,
  changes: null,
  metadata: null,
  createdAt: now,
};

const mockEventReadService = {
  list: jest.fn(),
  getById: jest.fn(),
};

jest.mock('../src/services/event-read.service', () => ({
  EventReadService: jest.fn().mockImplementation(() => mockEventReadService),
}));

import request from 'supertest';
import app from '../src/app';

function buildToken(globalRole: 'owner' | 'user'): string {
  return jwt.sign(
    {
      sub: '33333333-3333-4333-8333-333333333333',
      tenantId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      role: 'admin',
      globalRole,
      email: 'owner@teacherhub.mail',
    },
    'supersecret'
  );
}

describe('Events module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEventReadService.list.mockImplementation(async (query) => ({
      data: [mockEvent],
      pagination: {
        page: query.page,
        limit: query.limit,
        total: 1,
        totalPages: 1,
      },
    }));
    mockEventReadService.getById.mockResolvedValue(mockEvent);
  });

  it('is owner-only (401/403)', async () => {
    const noToken = await request(app).get('/api/events');
    expect(noToken.status).toBe(401);

    const nonOwner = await request(app)
      .get('/api/events')
      .set('Authorization', `Bearer ${buildToken('user')}`);
    expect(nonOwner.status).toBe(403);
  });

  it('lists events with filters and can read by id', async () => {
    const token = buildToken('owner');

    const listRes = await request(app)
      .get('/api/events?page=1&limit=10&category=audit&search=teacher&sortBy=createdAt&sortOrder=desc')
      .set('Authorization', `Bearer ${token}`);

    expect(listRes.status).toBe(200);
    expect(mockEventReadService.list).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        limit: 10,
        category: 'audit',
        search: 'teacher',
      })
    );

    const getRes = await request(app)
      .get('/api/events/99999999-9999-4999-8999-999999999999')
      .set('Authorization', `Bearer ${token}`);

    expect(getRes.status).toBe(200);
  });
});
