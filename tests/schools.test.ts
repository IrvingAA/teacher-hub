import request from 'supertest';
import app from '../src/app';
import jwt from 'jsonwebtoken';

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

jest.mock('../src/services/api-key.service', () => ({
  apiKeyService: { validate: jest.fn().mockResolvedValue(true) },
}));

import { schoolService } from '../src/services/school.service';

function buildToken(): string {
  return jwt.sign(
    { sub: 'u1', tenantId: 't1', role: 'admin', globalRole: 'owner' },
    'supersecret'
  );
}

describe('Schools module', () => {
  const apiKey = 'thk_valid.secret';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('supports schools CRUD and filters', async () => {
    const token = buildToken();
    const listSpy = jest.spyOn(schoolService, 'list').mockResolvedValue({
      data: [],
      pagination: { page: 2, limit: 5, total: 0, totalPages: 0 },
    });

    const listRes = await request(app)
      .get('/api/schools?page=2&limit=5')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Api-Key', apiKey);

    expect(listRes.status).toBe(200);
    expect(listSpy).toHaveBeenCalled();

    const schoolId = '550e8400-e29b-41d4-a716-446655440002';
    jest.spyOn(schoolService, 'create').mockResolvedValue({ id: schoolId } as any);
    jest.spyOn(schoolService, 'getById').mockResolvedValue({ id: schoolId, isActive: true } as any);
    jest.spyOn(schoolService, 'update').mockResolvedValue({ id: schoolId } as any);
    jest.spyOn(schoolService, 'remove').mockResolvedValue(undefined);

    const createRes = await request(app)
      .post('/api/schools')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Api-Key', apiKey)
      .send({ name: 'School A' });
    expect(createRes.status).toBe(201);

    const updateRes = await request(app)
      .put(`/api/schools/${schoolId}`)
      .set('Authorization', `Bearer ${token}`)
      .set('X-Api-Key', apiKey)
      .send({ name: 'School B' });
    expect(updateRes.status).toBe(200);

    const deleteRes = await request(app)
      .delete(`/api/schools/${schoolId}`)
      .set('Authorization', `Bearer ${token}`)
      .set('X-Api-Key', apiKey);
    expect(deleteRes.status).toBe(200);
  });
});
