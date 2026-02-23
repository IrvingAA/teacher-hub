import request from 'supertest';
import app from '../src/app';
import jwt from 'jsonwebtoken';
import { createAppError } from '../src/middlewares/errorHandler';

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
    connect: jest.fn().mockResolvedValue(undefined),
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

import { teacherService } from '../src/services/teacher.service';

function buildToken(): string {
  return jwt.sign(
    {
      sub: '33333333-3333-4333-8333-333333333333',
      tenantId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      role: 'admin',
      globalRole: 'owner',
      email: 'owner@teacherhub.mail',
    },
    'supersecret'
  );
}

describe('Teachers module', () => {
  const token = buildToken();
  const apiKey = 'thk_valid.secret';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('supports list filters and CRUD with token', async () => {
    const listSpy = jest.spyOn(teacherService, 'list').mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
    });

    const listRes = await request(app)
      .get('/api/teachers?page=1&limit=10&sortBy=firstName&sortOrder=asc')
       .set('X-Api-Key', 'thk_b46213352108dedf.3fd6eca17ac4bbd523987c5f4fe649d52b68d8ec541b2e5d').set('Authorization', `Bearer ${token}`)
      .set('X-Api-Key', apiKey);

    expect(listRes.status).toBe(200);
    expect(listSpy).toHaveBeenCalled();

    jest.spyOn(teacherService, 'create').mockResolvedValue({ id: 'm1' } as any);
    jest.spyOn(teacherService, 'getById').mockResolvedValue({ id: 'm1' } as any);

    const createRes = await request(app)
      .post('/api/teachers')
       .set('X-Api-Key', 'thk_b46213352108dedf.3fd6eca17ac4bbd523987c5f4fe649d52b68d8ec541b2e5d').set('Authorization', `Bearer ${token}`)
      .set('X-Api-Key', apiKey)
      .send({
        userId: '11111111-1111-4111-8111-111111111111',
        schoolId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        firstName: 'John',
        lastName: 'Doe',
        specialization: 'Math',
        hireDate: '2023-01-10',
      });
    expect(createRes.status).toBe(201);
  });

  it('returns conflict when service rejects invalid teacher membership', async () => {
    jest.spyOn(teacherService, 'create').mockRejectedValue(
      createAppError('User must have teacher role', 'USER_NOT_TEACHER_IN_SCHOOL', 409)
    );

    const response = await request(app)
      .post('/api/teachers')
       .set('X-Api-Key', 'thk_b46213352108dedf.3fd6eca17ac4bbd523987c5f4fe649d52b68d8ec541b2e5d').set('Authorization', `Bearer ${token}`)
      .set('X-Api-Key', apiKey)
      .send({
        userId: '11111111-1111-4111-8111-111111111111',
        schoolId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        firstName: 'John',
        lastName: 'Doe',
        specialization: 'Math',
        hireDate: '2023-01-10',
      });

    expect(response.status).toBe(409);
    expect(response.body.data.code).toBe('USER_NOT_TEACHER_IN_SCHOOL');
  });
});
