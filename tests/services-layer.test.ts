import { createAppError } from '../src/middlewares/errorHandler';

jest.mock('../src/config/database.pg', () => ({
  AppDataSource: {
    manager: {
      transaction: jest.fn(),
    },
    getRepository: jest.fn().mockReturnValue({}),
  },
}));

jest.mock('../src/cache/cache.manager', () => ({
  cacheManager: {
    buildKey: jest.fn((prefix, payload) => `${prefix}:${JSON.stringify(payload ?? {})}`),
    getOrSet: jest.fn(async ({ loader }) => loader()),
    invalidateKeys: jest.fn().mockResolvedValue(undefined),
    invalidateTags: jest.fn().mockResolvedValue(undefined),
  },
  cachePolicies: {
    users: { list: { ttlSeconds: 1, tags: ['users:list'] }, byId: { ttlSeconds: 1, tags: ['users:by-id'] } },
    teachers: {
      list: { ttlSeconds: 1, tags: ['teachers:list'] },
      byId: { ttlSeconds: 1, tags: ['teachers:by-id'] },
    },
    schools: {
      list: { ttlSeconds: 1, tags: ['schools:list'] },
      byId: { ttlSeconds: 1, tags: ['schools:by-id'] },
    },
  },
}));

jest.mock('../src/use-cases/users/create-user-with-memberships.use-case', () => ({
  CreateUserWithMembershipsUseCase: jest.fn().mockImplementation(() => ({
    execute: jest.fn().mockResolvedValue({ id: 'u1' }),
  })),
}));

jest.mock('../src/use-cases/users/update-user-with-memberships.use-case', () => ({
  UpdateUserWithMembershipsUseCase: jest.fn().mockImplementation(() => ({
    execute: jest.fn().mockResolvedValue({ id: 'u1' }),
  })),
}));

jest.mock('../src/use-cases/teachers/create-teacher-profile.use-case', () => ({
  CreateTeacherProfileUseCase: jest.fn().mockImplementation(() => ({
    execute: jest.fn().mockResolvedValue('m1'),
  })),
}));

jest.mock('../src/use-cases/schools/create-school-with-admin.use-case', () => ({
  CreateSchoolWithAdminUseCase: jest.fn().mockImplementation(() => ({
    execute: jest.fn().mockResolvedValue({ id: 's1', name: 'School 1', isActive: true }),
  })),
}));

import { cacheManager } from '../src/cache/cache.manager';
import { AppDataSource } from '../src/config/database.pg';
import { EventReadService } from '../src/services/event-read.service';
import { SchoolService } from '../src/services/school.service';
import { TeacherService } from '../src/services/teacher.service';
import { UserService } from '../src/services/user.service';
import { CreateSchoolWithAdminUseCase } from '../src/use-cases/schools/create-school-with-admin.use-case';
import { CreateTeacherProfileUseCase } from '../src/use-cases/teachers/create-teacher-profile.use-case';
import { CreateUserWithMembershipsUseCase } from '../src/use-cases/users/create-user-with-memberships.use-case';
import { UpdateUserWithMembershipsUseCase } from '../src/use-cases/users/update-user-with-memberships.use-case';

describe('Services layer', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (cacheManager.buildKey as jest.Mock).mockImplementation(
      (prefix: string, payload?: unknown) => `${prefix}:${JSON.stringify(payload ?? {})}`
    );
    (cacheManager.getOrSet as jest.Mock).mockImplementation(async ({ loader }) => loader());
    (cacheManager.invalidateKeys as jest.Mock).mockResolvedValue(undefined);
    (cacheManager.invalidateTags as jest.Mock).mockResolvedValue(undefined);

    (AppDataSource.manager.transaction as jest.Mock).mockImplementation(async (callback) => callback({}));

    (CreateUserWithMembershipsUseCase as unknown as jest.Mock).mockImplementation(() => ({
      execute: jest.fn().mockResolvedValue({ id: 'u1' }),
    }));
    (UpdateUserWithMembershipsUseCase as unknown as jest.Mock).mockImplementation(() => ({
      execute: jest.fn().mockResolvedValue({ id: 'u1' }),
    }));
    (CreateTeacherProfileUseCase as unknown as jest.Mock).mockImplementation(() => ({
      execute: jest.fn().mockResolvedValue('m1'),
    }));
    (CreateSchoolWithAdminUseCase as unknown as jest.Mock).mockImplementation(() => ({
      execute: jest.fn().mockResolvedValue({ id: 's1', name: 'School 1', isActive: true }),
    }));
  });

  it('UserService covers list/get/update/remove branches', async () => {
    const service = new UserService({} as never, {
      delete: jest.fn().mockResolvedValue(undefined),
    } as never);

    const repo = {
      list: jest.fn().mockResolvedValue({
        data: [{ id: 'u1', email: 'x@x.com' }],
        total: 1,
      }),
      findById: jest.fn().mockImplementation((id: string) => {
        if (id === 'missing') {
          return Promise.resolve(null);
        }
        return Promise.resolve({ id: 'u1', email: 'x@x.com' });
      }),
      deleteById: jest.fn().mockResolvedValueOnce(true).mockResolvedValueOnce(false),
    };

    (service as any).userRepository = repo;
    (service as any).getMembershipsForUserIds = jest.fn().mockResolvedValue(
      new Map([['u1', [{ schoolId: 's1', schoolName: 'S1', role: 'admin', isDefault: true }]]])
    );

    const list = await service.list({ page: 1, limit: 10, sortBy: 'createdAt', sortOrder: 'desc' } as never);
    expect(list.pagination.total).toBe(1);

    const getById = await service.getById('u1');
    expect(getById.user.id).toBe('u1');

    const updated = await service.update('u1', {} as never);
    expect(updated.user.id).toBe('u1');

    await service.remove('u1');
    await expect(service.remove('missing')).rejects.toMatchObject(
      createAppError('User not found', 'USER_NOT_FOUND', 404)
    );
  });

  it('TeacherService covers create/list/get/update/status/remove branches', async () => {
    const service = new TeacherService({} as never);
    const repo = {
      list: jest.fn().mockResolvedValue({ data: [{ id: 'm1' }], total: 1 }),
      findById: jest.fn().mockImplementation((id: string) => {
        if (id === 'missing') {
          return Promise.resolve(null);
        }
        return Promise.resolve({ id: 'm1' });
      }),
      updateProfile: jest.fn().mockResolvedValueOnce({ id: 'm1' }).mockResolvedValueOnce(null),
      updateStatus: jest.fn().mockResolvedValueOnce({ id: 'm1' }).mockResolvedValueOnce(null),
      softDeleteByMembershipId: jest.fn().mockResolvedValueOnce(true).mockResolvedValueOnce(false),
    };
    (service as any).teacherRepository = repo;

    expect((await service.create({} as never)).id).toBe('m1');
    expect((await service.list({ page: 1, limit: 10, sortBy: 'createdAt', sortOrder: 'desc' } as never)).pagination.total).toBe(1);
    expect((await service.getById('m1')).id).toBe('m1');
    expect((await service.update('m1', {} as never)).id).toBe('m1');
    await expect(service.update('x', {} as never)).rejects.toMatchObject(
      createAppError('Teacher not found', 'TEACHER_NOT_FOUND', 404)
    );
    await service.remove('m1');
    await expect(service.remove('missing')).rejects.toMatchObject(
      createAppError('Teacher not found', 'TEACHER_NOT_FOUND', 404)
    );
  });

  it('SchoolService covers create/list/get/update/remove branches', async () => {
    const service = new SchoolService({} as never);
    const repo = {
      list: jest.fn().mockResolvedValue({ data: [{ id: 's1', name: 'School 1' }], total: 1 }),
      findById: jest.fn().mockImplementation((id: string) => {
        if (id === 'missing') {
          return Promise.resolve(null);
        }
        return Promise.resolve({ id: 's1', name: 'School 1' });
      }),
      findByName: jest.fn().mockResolvedValue({ id: 's2' }),
      updateSchool: jest.fn().mockResolvedValueOnce({ id: 's1', name: 'School 1' }).mockResolvedValueOnce(null),
      deleteById: jest.fn().mockResolvedValueOnce(true).mockResolvedValueOnce(false),
    };
    (service as any).schoolRepository = repo;

    expect((await service.create({ name: 'S1' } as never)).id).toBe('s1');
    expect((await service.list({ page: 1, limit: 10, sortBy: 'createdAt', sortOrder: 'desc' } as never)).pagination.total).toBe(1);
    expect((await service.getById('s1')).id).toBe('s1');
    expect((await service.update('s1', { name: 'School 1' } as never)).id).toBe('s1');
    await expect(service.update('s1', { name: 'Taken' } as never)).rejects.toMatchObject(
      createAppError('A school with this name already exists', 'SCHOOL_NAME_ALREADY_EXISTS', 409)
    );
    await service.remove('s1');
    await expect(service.remove('missing')).rejects.toMatchObject(
      createAppError('School not found', 'SCHOOL_NOT_FOUND', 404)
    );
  });

  it('EventReadService covers list and getById branches', async () => {
    const service = new EventReadService({} as never);
    const repo = {
      list: jest.fn().mockResolvedValue({ data: [{ id: 'e1' }], total: 1 }),
      findById: jest.fn().mockResolvedValueOnce({ id: 'e1' }).mockResolvedValueOnce(null),
    };
    (service as any).eventRepository = repo;

    const list = await service.list({ page: 1, limit: 10, sortBy: 'createdAt', sortOrder: 'desc' } as never);
    expect(list.pagination.total).toBe(1);
    expect((await service.getById('e1')).id).toBe('e1');
    await expect(service.getById('missing')).rejects.toMatchObject(
      createAppError('Event not found', 'EVENT_NOT_FOUND', 404)
    );
  });
});
