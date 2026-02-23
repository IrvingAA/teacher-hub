import request from 'supertest';
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
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    incr: jest.fn().mockResolvedValue(1),
    sadd: jest.fn().mockResolvedValue(1),
    smembers: jest.fn().mockResolvedValue([]),
    keys: jest.fn().mockResolvedValue([]),
    on: jest.fn(),
    expire: jest.fn().mockResolvedValue(1),
  },
  getRedisStatus: () => 'connected',
}));

jest.mock('../src/middlewares/apiKey', () => ({
  requireApiKey: (req: any, res: any, next: any) => next(),
}));

jest.mock('../src/middlewares/throttle', () => ({
  throttle: () => (req: any, res: any, next: any) => next(),
}));

import app from '../src/app';
import { studentService } from '../src/services/student.service';
import { groupService } from '../src/services/group.service';

function buildToken(role: string = 'admin'): string {
  return jwt.sign({ sub: 'u1', tenantId: 't1', role, globalRole: 'user' }, 'supersecret');
}

describe('Students and Groups E2E', () => {
  const token = buildToken();
  const studentId = '550e8400-e29b-41d4-a716-446655440005';
  const schoolId = '550e8400-e29b-41d4-a716-446655440006';
  const groupId = '550e8400-e29b-41d4-a716-446655440007';
  const teacherId = '550e8400-e29b-41d4-a716-446655440008';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Students API', () => {
    it('creates a student', async () => {
      jest
        .spyOn(studentService, 'create')
        .mockResolvedValue({ id: studentId, email: 's@s.com', isActive: true } as any);

      const res = await request(app)
        .post('/api/students')
         .set('X-Api-Key', 'thk_b46213352108dedf.3fd6eca17ac4bbd523987c5f4fe649d52b68d8ec541b2e5d').set('Authorization', `Bearer ${token}`)
        .send({
          email: 's@s.com',
          password: 'pass',
          memberships: [{ schoolId, schoolName: 'School', role: 'student' }],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBe(studentId);
    });

    it('lists students', async () => {
      jest.spyOn(studentService, 'list').mockResolvedValue({
        data: [{ id: studentId, isActive: true } as any],
        pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
      });

      const res = await request(app).get('/api/students') .set('X-Api-Key', 'thk_b46213352108dedf.3fd6eca17ac4bbd523987c5f4fe649d52b68d8ec541b2e5d').set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.data).toHaveLength(1);
    });

    it('updates a student', async () => {
      jest.spyOn(studentService, 'getById').mockResolvedValue({
        id: studentId,
        user: { id: studentId, isActive: true },
        memberships: [],
      } as any);
      jest
        .spyOn(studentService, 'update')
        .mockResolvedValue({ id: studentId, firstName: 'New' } as any);

      const res = await request(app)
        .put(`/api/students/${studentId}`)
         .set('X-Api-Key', 'thk_b46213352108dedf.3fd6eca17ac4bbd523987c5f4fe649d52b68d8ec541b2e5d').set('Authorization', `Bearer ${token}`)
        .send({ firstName: 'New' });

      expect(res.status).toBe(200);
      expect(res.body.data.firstName).toBe('New');
    });
  });

  describe('Groups API', () => {
    it('creates a group', async () => {
      jest.spyOn(groupService, 'create').mockResolvedValue({ id: groupId, name: 'Group A' } as any);

      const res = await request(app)
        .post('/api/groups')
         .set('X-Api-Key', 'thk_b46213352108dedf.3fd6eca17ac4bbd523987c5f4fe649d52b68d8ec541b2e5d').set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Group A',
          schoolId,
          teacherMembershipId: teacherId,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Group A');
    });
  });
});
