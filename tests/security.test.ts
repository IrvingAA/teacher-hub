import request from 'supertest';
import app from '../src/app';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env';
import { apiKeyService } from '../src/services/api-key.service';

process.env.JWT_SECRET = 'supersecret';

jest.mock('../src/config/database.pg', () => {
  const createMockRepository = () => ({
    createQueryBuilder: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getRawOne: jest.fn().mockResolvedValue(null),
    getRawMany: jest.fn().mockResolvedValue([]),
    getOne: jest.fn().mockResolvedValue(null),
    getMany: jest.fn().mockResolvedValue([]),
    getCount: jest.fn().mockResolvedValue(0),
    clone: jest.fn().mockReturnThis(),
    findOne: jest.fn().mockResolvedValue(null),
    find: jest.fn().mockResolvedValue([]),
    save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
    create: jest.fn().mockImplementation((data) => data),
    update: jest.fn().mockResolvedValue({ affected: 1 }),
    delete: jest.fn().mockResolvedValue({ affected: 1 }),
    softDelete: jest.fn().mockResolvedValue({ affected: 1 }),
    count: jest.fn().mockResolvedValue(0),
  });

  return {
    AppDataSource: {
      isInitialized: true,
      initialize: jest.fn().mockResolvedValue(undefined),
      getRepository: jest.fn().mockReturnValue(createMockRepository()),
      manager: {
        transaction: jest.fn(async (cb) =>
          cb({
            getRepository: jest.fn().mockReturnValue(createMockRepository()),
            save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
          })
        ),
      },
    },
    connectPostgres: jest.fn().mockResolvedValue(undefined),
  };
});

jest.mock('../src/config/redis', () => ({
  redis: {
    status: 'ready',
    on: jest.fn(),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    incr: jest.fn().mockResolvedValue(1),
    sadd: jest.fn().mockResolvedValue(1),
    smembers: jest.fn().mockResolvedValue([]),
    keys: jest.fn().mockResolvedValue([]),
    expire: jest.fn().mockResolvedValue(1),
  },
  getRedisStatus: () => 'connected',
}));

jest.mock('../src/middlewares/throttle', () => ({
  throttle: () => (req: any, res: any, next: any) => next(),
}));

function buildToken(globalRole: 'owner' | 'user' = 'user'): string {
  return jwt.sign(
    {
      sub: '550e8400-e29b-41d4-a716-446655440003',
      tenantId: '550e8400-e29b-41d4-a716-446655440004',
      role: 'admin',
      globalRole,
    },
    'supersecret'
  );
}

describe('Security middleware + API keys', () => {
  const token = buildToken('owner');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requires x-api-key for protected modules when enabled', async () => {
    const originalEnabled = env.API_KEY_ENABLED;
    (env as any).API_KEY_ENABLED = true;

    const mockValidate = jest.spyOn(apiKeyService, 'validate').mockResolvedValue(true);

    const ok = await request(app)
      .get('/api/health')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Api-Key', 'thk_valid.secret');

    const teachers = await request(app)
      .get('/api/teachers')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Api-Key', 'thk_valid.secret');

    expect(teachers.status).not.toBe(401);

    (env as any).API_KEY_ENABLED = originalEnabled;
  });

  it('allows owner to manage API keys and rejects non-owner', async () => {
    const ownerToken = buildToken('owner');

    jest.spyOn(apiKeyService, 'list').mockResolvedValue([]);
    const listRes = await request(app)
      .get('/api/security/api-keys')
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(listRes.status).toBe(200);

    const userToken = buildToken('user');
    const failRes = await request(app)
      .get('/api/security/api-keys')
      .set('Authorization', `Bearer ${userToken}`);
    expect(failRes.status).toBe(403);
  });
});
