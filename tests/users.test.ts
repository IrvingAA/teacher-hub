import request from 'supertest';
import app from '../src/app';
import jwt from 'jsonwebtoken';

process.env.JWT_SECRET = 'supersecret';
process.env.API_KEY_ENABLED = 'false';

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

import { userService } from '../src/services/user.service';

function buildToken(globalRole: 'owner' | 'user'): string {
  return jwt.sign(
    { sub: 'u1', tenantId: 't1', role: 'admin', globalRole },
    'supersecret'
  );
}

describe('Users module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists users with owner token and parses query filters', async () => {
    const listSpy = jest.spyOn(userService, 'list').mockResolvedValue({
      data: [],
      pagination: { page: 2, limit: 5, total: 0, totalPages: 0 },
    });

    const response = await request(app)
      .get('/api/users?page=2&limit=5')
       .set('X-Api-Key', 'thk_b46213352108dedf.3fd6eca17ac4bbd523987c5f4fe649d52b68d8ec541b2e5d').set('Authorization', `Bearer ${buildToken('owner')}`);

    expect(response.status).toBe(200);
    expect(listSpy).toHaveBeenCalled();
  });

  it('creates, updates and deletes user as owner', async () => {
    const token = buildToken('owner');
    const userId = '550e8400-e29b-41d4-a716-446655440000';
    const schoolId = '550e8400-e29b-41d4-a716-446655440001';

    jest.spyOn(userService, 'create').mockResolvedValue({ user: { id: userId }, memberships: [] } as any);
    jest.spyOn(userService, 'getById').mockResolvedValue({ user: { id: userId, isActive: true }, memberships: [] } as any);
    jest.spyOn(userService, 'update').mockResolvedValue({ user: { id: userId }, memberships: [] } as any);
    jest.spyOn(userService, 'remove').mockResolvedValue(undefined);

    const createRes = await request(app)
      .post('/api/users')
       .set('X-Api-Key', 'thk_b46213352108dedf.3fd6eca17ac4bbd523987c5f4fe649d52b68d8ec541b2e5d').set('Authorization', `Bearer ${token}`)
      .send({ 
        email: 'n@n.com', 
        password: 'pass', 
        globalRole: 'user',
        memberships: [
          { schoolId, schoolName: 'Test School', role: 'student' }
        ] 
      });
    expect(createRes.status).toBe(201);

    const updateRes = await request(app)
      .put(`/api/users/${userId}`)
       .set('X-Api-Key', 'thk_b46213352108dedf.3fd6eca17ac4bbd523987c5f4fe649d52b68d8ec541b2e5d').set('Authorization', `Bearer ${token}`)
      .send({ email: 'u@u.com' });
    expect(updateRes.status).toBe(200);

    const deleteRes = await request(app)
      .delete(`/api/users/${userId}`)
       .set('X-Api-Key', 'thk_b46213352108dedf.3fd6eca17ac4bbd523987c5f4fe649d52b68d8ec541b2e5d').set('Authorization', `Bearer ${token}`);
    expect(deleteRes.status).toBe(200);
  });
});
